'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, DepthOfField, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

// ── Constants ─────────────────────────────────────────────────────────────────
const SEED = 0xb3ef7a1c;
const SHARD_INSET = 0.96;   // scale each cell inward to reveal gold seam
const SHARD_DEPTH = 0.09;   // extrusion thickness (world units)
const BEVEL_SIZE = 0.006;   // bevel amount to catch light
const BEVEL_SEGS = 2;
const SPRING_K = 180;       // spring stiffness
const SPRING_D = 22;        // spring damping
const ASSEMBLY_DELAY = 0.6; // seconds before assembly starts
const ASSEMBLY_DURATION = 2.2;

// ── Seeded PRNG (mulberry32) ──────────────────────────────────────────────────
function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Sutherland-Hodgman half-plane clip ────────────────────────────────────────
function clipByHalfPlane(
  poly: [number, number][],
  mx: number, my: number,
  nx: number, ny: number,
): [number, number][] {
  if (poly.length === 0) return [];
  const out: [number, number][] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const da = (a[0] - mx) * nx + (a[1] - my) * ny;
    const db = (b[0] - mx) * nx + (b[1] - my) * ny;
    if (da >= 0) out.push(a);
    if ((da >= 0) !== (db >= 0)) {
      const t = da / (da - db);
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  return out;
}

// ── Voronoi cell polygons ─────────────────────────────────────────────────────
// Returns polygons in normalised [0..1]² coords, plus site positions.
function buildVoronoi(aspect: number): {
  polys: [number, number][][];
  siteX: Float32Array;
  siteY: Float32Array;
} {
  const rand = mulberry32(SEED);
  const N = 56; // fixed count for deterministic layout
  const cols = Math.max(6, Math.round(Math.sqrt(N * aspect)));
  const rows = Math.max(4, Math.round(cols / aspect));
  const actual = cols * rows;
  const cellW = 1 / cols;
  const cellH = 1 / rows;

  const siteX = new Float32Array(actual);
  const siteY = new Float32Array(actual);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      siteX[i] = (c + 0.15 + rand() * 0.7) * cellW;
      siteY[i] = (r + 0.15 + rand() * 0.7) * cellH;
    }
  }

  const polys: [number, number][][] = [];
  for (let i = 0; i < actual; i++) {
    let poly: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
    for (let j = 0; j < actual; j++) {
      if (i === j || poly.length < 3) continue;
      const mx = (siteX[i] + siteX[j]) / 2;
      const my = (siteY[i] + siteY[j]) / 2;
      poly = clipByHalfPlane(poly, mx, my, siteX[i] - siteX[j], siteY[i] - siteY[j]);
    }
    polys.push(poly.length >= 3 ? poly : []);
  }

  return { polys, siteX, siteY };
}

// ── Inset a polygon toward its centroid ──────────────────────────────────────
function insetPoly(poly: [number, number][], f: number): [number, number][] {
  if (poly.length < 3) return poly;
  const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
  const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
  return poly.map(([x, y]) => [cx + (x - cx) * f, cy + (y - cy) * f]);
}

// ── Procedural bump-map texture (value noise, 128×128) ───────────────────────
function buildBumpTexture(): THREE.DataTexture {
  const sz = 128;
  const data = new Uint8Array(sz * sz);
  for (let y = 0; y < sz; y++) {
    for (let x = 0; x < sz; x++) {
      // 3-octave value noise
      const f1 = 4, f2 = 12, f3 = 32;
      const n =
        0.5 * Math.sin(x / f1) * Math.cos(y / f1) +
        0.3 * Math.sin(x / f2 + 1.3) * Math.cos(y / f2 + 0.7) +
        0.2 * Math.sin(x / f3 + 2.1) * Math.cos(y / f3 + 1.9);
      data[y * sz + x] = ((n + 1) * 0.5 * 255) | 0;
    }
  }
  const tex = new THREE.DataTexture(data, sz, sz, THREE.RedFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.needsUpdate = true;
  return tex;
}

// ── GLSL Simplex-noise snippet ────────────────────────────────────────────────
const GLSL_SIMPLEX = /* glsl */ `
vec3 mod289_3(vec3 x){return x-floor(x*(1./289.))*289.;}
vec2 mod289_2(vec2 x){return x-floor(x*(1./289.))*289.;}
vec3 permute3(vec3 x){return mod289_3(((x*34.)+1.)*x);}
float snoise(vec2 v){
  const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));
  vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
  vec4 x12=x0.xyxy+C.xxzz;
  x12.xy-=i1;
  i=mod289_2(i);
  vec3 p=permute3(permute3(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
  vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);
  m=m*m; m=m*m;
  vec3 x=2.*fract(p*C.www)-1.;
  vec3 h=abs(x)-.5;
  vec3 ox=floor(x+.5);
  vec3 a0=x-ox;
  m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
  vec3 g;
  g.x=a0.x*x0.x+h.x*x0.y;
  g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.*dot(m,g);
}
`;

// ── Gold seam shader ──────────────────────────────────────────────────────────
const goldVert = /* glsl */ `
varying vec3 vNormal;
varying vec3 vWorldPos;
void main(){
  vNormal = normalize(normalMatrix * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}
`;

const goldFrag = /* glsl */ `
${GLSL_SIMPLEX}
varying vec3 vNormal;
varying vec3 vWorldPos;
uniform float uTime;
uniform vec3 uCamPos;

void main(){
  // Animated noise for molten-gold texture
  float n1 = snoise(vWorldPos.xy * 4.0 + vec2(uTime * 0.28, uTime * 0.11));
  float n2 = snoise(vWorldPos.xy * 11.0 - vec2(uTime * 0.17, uTime * 0.31));
  float noise = n1 * 0.65 + n2 * 0.35;

  // Fresnel
  vec3 viewDir = normalize(uCamPos - vWorldPos);
  float NdotV  = max(dot(normalize(vNormal), viewDir), 0.0);
  float fresnel = pow(1.0 - NdotV, 3.0);

  // Warm gold palette
  vec3 cDark  = vec3(0.64, 0.49, 0.29);
  vec3 cMid   = vec3(0.82, 0.68, 0.45);
  vec3 cLight = vec3(0.96, 0.91, 0.80);
  float t = clamp((noise + 1.0) * 0.5, 0.0, 1.0);
  vec3 color  = (t < 0.5) ? mix(cDark, cMid, t*2.0) : mix(cMid, cLight, (t-0.5)*2.0);

  // Fresnel rim brightens to near-white
  color = mix(color, vec3(1.0, 0.96, 0.82), fresnel * 0.72);

  // Subtle self-emission to simulate inner glow
  color *= 1.15 + noise * 0.22;

  gl_FragColor = vec4(color, 1.0);
}
`;

// ── Spring physics (simple 1-D) ───────────────────────────────────────────────
function stepSpring(
  pos: number, vel: number, target: number,
  k: number, d: number, dt: number,
): [number, number] {
  const f = k * (target - pos) - d * vel;
  const nv = vel + f * dt;
  const np = pos + nv * dt;
  return [np, nv];
}

// ── CeramicShards ─────────────────────────────────────────────────────────────
function CeramicShards({
  scrollY,
  assembledRef,
}: {
  scrollY: React.MutableRefObject<number>;
  assembledRef: React.MutableRefObject<boolean>;
}) {
  const { viewport } = useThree();
  const vw = viewport.width;
  const vh = viewport.height;
  const aspect = vw / vh;

  const bumpTex = useMemo(() => buildBumpTexture(), []);

  // Build Voronoi + geometries once
  const { shardData, meshRefs } = useMemo(() => {
    const { polys, siteX, siteY } = buildVoronoi(aspect);
    const n = polys.length;

    // Outward direction of each shard (for scatter/assembly animation)
    const cx0 = 0.5, cy0 = 0.45;
    const halfDiag = Math.hypot(1, 1 / aspect) * 0.5;
    const outX = new Float32Array(n);
    const outY = new Float32Array(n);
    const distFrac = new Float32Array(n);
    const assembledX = new Float32Array(n);
    const assembledY = new Float32Array(n);
    const geometries: (THREE.BufferGeometry | null)[] = [];
    const rand2 = mulberry32(SEED ^ 0xdeadbeef);

    for (let i = 0; i < n; i++) {
      const poly = polys[i];
      if (poly.length < 3) { geometries.push(null); continue; }

      const inset = insetPoly(poly, SHARD_INSET);
      const shape = new THREE.Shape();
      // Map normalised [0..1]² → world coords centred at 0
      const toWorldX = (u: number) => (u - 0.5) * vw;
      const toWorldY = (u: number) => (0.5 - u) * vh; // flip Y

      shape.moveTo(toWorldX(inset[0][0]), toWorldY(inset[0][1]));
      for (let j = 1; j < inset.length; j++) {
        shape.lineTo(toWorldX(inset[j][0]), toWorldY(inset[j][1]));
      }
      shape.closePath();

      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: SHARD_DEPTH,
        bevelEnabled: true,
        bevelSize: BEVEL_SIZE * vw,
        bevelThickness: BEVEL_SIZE * 0.5 * vw,
        bevelSegments: BEVEL_SEGS,
      });
      // Centre depth so front face is at z=0
      geo.translate(0, 0, -SHARD_DEPTH * 0.5);
      geometries.push(geo);

      // Assembled position = (0,0,0) — each mesh is offset by its site coords
      // actually the shape is already in world coords, so assembled pos is (0,0,0)
      assembledX[i] = 0;
      assembledY[i] = 0;

      const sx = siteX[i] - cx0;
      const sy = siteY[i] - cy0;
      const d = Math.hypot(sx, sy) || 0.001;
      outX[i] = sx / d;
      outY[i] = sy / d;
      distFrac[i] = Math.min(1, d / halfDiag);
    }

    const meshRefs: { current: THREE.Mesh | null }[] = Array.from({ length: n }, () => ({ current: null }));

    return { shardData: { n, outX, outY, distFrac, assembledX, assembledY, geometries, rand2 }, meshRefs };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vw, vh]);

  // Spring states (x offset, y offset, z offset per shard)
  const spPos = useRef<Float32Array | null>(null);
  const spVel = useRef<Float32Array | null>(null);
  const startedRef = useRef(false);
  const clockRef = useRef(0);

  // Initialise spring positions to scattered state on first mount
  useEffect(() => {
    const n = shardData.n;
    const pos = new Float32Array(n * 3);
    const vel = new Float32Array(n * 3);
    const rng = mulberry32(SEED ^ 0x1a2b3c4d);
    const scatterRadius = Math.max(vw, vh) * 0.8;
    for (let i = 0; i < n; i++) {
      // Random scattered position
      pos[i * 3 + 0] = (rng() - 0.5) * scatterRadius * 1.6;
      pos[i * 3 + 1] = (rng() - 0.5) * scatterRadius;
      pos[i * 3 + 2] = (rng() - 0.5) * scatterRadius * 0.4;
    }
    spPos.current = pos;
    spVel.current = vel;
    startedRef.current = false;
    clockRef.current = 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shardData]);

  useFrame(({ camera: cam }, delta) => {
    const dt = Math.min(delta, 0.05);
    clockRef.current += dt;

    // Begin assembly after delay
    const assembling = clockRef.current > ASSEMBLY_DELAY;
    const assemblyT = Math.min(1, (clockRef.current - ASSEMBLY_DELAY) / ASSEMBLY_DURATION);
    if (assembling && !assembledRef.current && assemblyT >= 0.98) {
      assembledRef.current = true;
    }

    const pos = spPos.current;
    const vel = spVel.current;
    if (!pos || !vel) return;

    const scroll = scrollY.current;
    // Scroll: rotate whole group + separate shards
    const scrollSeparate = scroll * 0.18;

    // Mouse interaction: accessed through camera.userData (set by parent)
    const mouseX: number = (cam as THREE.PerspectiveCamera & { userData: { mx?: number; my?: number } }).userData.mx ?? 0;
    const mouseY: number = (cam as THREE.PerspectiveCamera & { userData: { mx?: number; my?: number } }).userData.my ?? 0;

    const { n, outX, outY, distFrac } = shardData;

    for (let i = 0; i < n; i++) {
      const mesh = meshRefs[i]?.current;
      if (!mesh) continue;

      // Mouse parallax: shards near pointer push apart slightly
      const parallaxAmt = distFrac[i] * (assembledRef.current ? 0.04 : 0) + scrollSeparate * distFrac[i];
      const targetX = outX[i] * parallaxAmt * vw - mouseX * distFrac[i] * 0.03 * vw;
      const targetY = outY[i] * parallaxAmt * vh + mouseY * distFrac[i] * 0.03 * vh;
      const targetZ = 0;

      // Only spring toward assembled position after delay
      const springTarget = assembling
        ? targetX
        : (pos[i * 3 + 0]); // hold scatter during delay
      const springTargetY = assembling ? targetY : pos[i * 3 + 1];

      const k = assembling ? SPRING_K : 0;
      const damp = SPRING_D;

      let [np, nv] = stepSpring(pos[i * 3 + 0], vel[i * 3 + 0], springTarget, k, damp, dt);
      pos[i * 3 + 0] = np; vel[i * 3 + 0] = nv;

      [np, nv] = stepSpring(pos[i * 3 + 1], vel[i * 3 + 1], springTargetY, k, damp, dt);
      pos[i * 3 + 1] = np; vel[i * 3 + 1] = nv;

      [np, nv] = stepSpring(pos[i * 3 + 2], vel[i * 3 + 2], targetZ, k * 0.5, damp, dt);
      pos[i * 3 + 2] = np; vel[i * 3 + 2] = nv;

      mesh.position.set(pos[i * 3 + 0], pos[i * 3 + 1], pos[i * 3 + 2]);

      // Scroll: tilt + fade
      mesh.rotation.y = scroll * 0.4;
      const op = Math.max(0, 1 - scroll * 1.6);
      if ((mesh.material as THREE.MeshPhysicalMaterial).opacity !== op) {
        (mesh.material as THREE.MeshPhysicalMaterial).opacity = op;
        (mesh.material as THREE.MeshPhysicalMaterial).transparent = op < 1;
      }
    }
  });

  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#F5EDDF'),
        roughness: 0.35,
        metalness: 0.0,
        clearcoat: 0.85,
        clearcoatRoughness: 0.12,
        bumpMap: bumpTex,
        bumpScale: 0.004,
        envMapIntensity: 0.7,
      }),
    [bumpTex],
  );

  return (
    <group>
      {shardData.geometries.map((geo, i) =>
        geo ? (
          <mesh
            key={i}
            ref={(el: THREE.Mesh | null) => { if (meshRefs[i]) meshRefs[i].current = el; }}
            geometry={geo}
            material={material}
            castShadow
            receiveShadow
          />
        ) : null,
      )}
    </group>
  );
}

// ── GoldSeamPlane ─────────────────────────────────────────────────────────────
function GoldSeamPlane({ scrollY }: { scrollY: React.MutableRefObject<number> }) {
  const { viewport } = useThree();
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ camera }, dt) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += dt;
      matRef.current.uniforms.uCamPos.value.copy(camera.position);
    }
      if (meshRef.current) {
        meshRef.current.rotation.y = scrollY.current * 0.4;
        const mat = meshRef.current.material as THREE.ShaderMaterial;
        mat.opacity = Math.max(0, 1 - scrollY.current * 1.6);
      }
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCamPos: { value: new THREE.Vector3() },
    }),
    [],
  );

  return (
    <mesh ref={meshRef} position={[0, 0, -SHARD_DEPTH * 0.52]}>
      <planeGeometry args={[viewport.width * 1.02, viewport.height * 1.02]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={goldVert}
        fragmentShader={goldFrag}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}

// ── Mouse tracker ─────────────────────────────────────────────────────────────
function MouseTracker() {
  const { camera } = useThree();
  const smoothMx = useRef(0);
  const smoothMy = useRef(0);
  const rawMx = useRef(0);
  const rawMy = useRef(0);

  useEffect(() => {
    function onMove(e: PointerEvent) {
      rawMx.current = (e.clientX / window.innerWidth - 0.5) * 2;
      rawMy.current = -(e.clientY / window.innerHeight - 0.5) * 2;
    }
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame((_, dt) => {
    const alpha = 1 - Math.pow(0.92, dt / 0.016);
    smoothMx.current += (rawMx.current - smoothMx.current) * alpha;
    smoothMy.current += (rawMy.current - smoothMy.current) * alpha;
    const cam = camera as THREE.PerspectiveCamera & { userData: { mx?: number; my?: number } };
    cam.userData.mx = smoothMx.current;
    cam.userData.my = smoothMy.current;
  });

  return null;
}

// ── Inline environment map (warm sunset gradient, no network required) ────────
function InlineEnvironment() {
  const { gl, scene } = useThree();

  useEffect(() => {
    // Build a simple 2x1 pixel CubeTexture from warm/cool colour pairs
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();

    // Create a small gradient DataTexture as the equirectangular map
    const W = 64, H = 32;
    const data = new Uint8Array(W * H * 4);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const t = y / (H - 1); // 0 = sky top, 1 = ground bottom
        // Sky: soft warm gold; horizon: cream; ground: muted brown
        const r = Math.round(lerp(lerp(240, 247, t), lerp(120, 80, t), Math.max(0, t * 2 - 1)));
        const g = Math.round(lerp(lerp(200, 235, t), lerp(100, 60, t), Math.max(0, t * 2 - 1)));
        const b = Math.round(lerp(lerp(120, 210, t), lerp(70, 40, t), Math.max(0, t * 2 - 1)));
        const idx = (y * W + x) * 4;
        data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 255;
      }
    }
    const eqTex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
    eqTex.needsUpdate = true;
    const envMap = pmrem.fromEquirectangular(eqTex).texture;

    scene.environment = envMap;

    return () => {
      eqTex.dispose();
      envMap.dispose();
      pmrem.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }


function PostProcessing() {
  return (
    <EffectComposer>
      <DepthOfField
        focusDistance={0.01}
        focalLength={0.04}
        bokehScale={2.5}
        height={600}
      />
      <Bloom
        intensity={0.55}
        luminanceThreshold={0.62}
        luminanceSmoothing={0.08}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.3} darkness={0.6} />
    </EffectComposer>
  );
}

// ── Main inner scene ──────────────────────────────────────────────────────────
export default function KintsugiGlassCanvasInner({
  scrollY,
}: {
  scrollY: React.MutableRefObject<number>;
}) {
  const assembledRef = useRef(false);

  return (
    <>
      <MouseTracker />

      {/* Lighting */}
      <ambientLight intensity={0.45} color="#FFF8EF" />
      <directionalLight
        position={[3, 5, 4]}
        intensity={1.1}
        color="#FFF6E8"
        castShadow
      />
      <directionalLight
        position={[-4, -2, 2]}
        intensity={0.3}
        color="#C8D4E8"
      />
      <pointLight position={[0, 0, 2.5]} intensity={0.5} color="#FFE8C0" />

      {/* Inline HDRI-style environment (warm sunset, no network fetch) */}
      <InlineEnvironment />

      {/* Gold seam base layer */}
      <GoldSeamPlane scrollY={scrollY} />

      {/* Extruded ceramic shards */}
      <CeramicShards scrollY={scrollY} assembledRef={assembledRef} />

      {/* Post-processing */}
      <PostProcessing />
    </>
  );
}
