'use client';

import {
  useRef,
  useMemo,
  useEffect,
  Suspense,
  useState,
  type RefObject,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Delaunay } from 'd3-delaunay';

// ── Constants ─────────────────────────────────────────────────────────────────
const SEED = 0xb3ef7a1c;
const IMPACT_X = 0.52;   // slightly off-centre impact point (normalised 0..1)
const IMPACT_Y = 0.46;
const NUM_SITES = 60;     // Voronoi seed points
const MAX_SHARD_DRIFT = 0.018; // maximum Z-drift for shard separation
const SMOOTH_FACTOR = 0.06;   // EMA smoothing for pointer tracking

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

// ── Shard data ────────────────────────────────────────────────────────────────
interface ShardInfo {
  polygon: [number, number][];   // clipped Voronoi cell vertices
  centroid: [number, number];
  /** Unit outward direction from fracture impact point */
  outwardDx: number;
  outwardDy: number;
  /** 0..1 – distance fraction from impact point */
  distFrac: number;
}

// ── Build Voronoi shards ──────────────────────────────────────────────────────
function buildShards(w: number, h: number): ShardInfo[] {
  const rand = mulberry32(SEED);

  // Radial fracture: dense near impact point, sparser at edges
  const impX = IMPACT_X * w;
  const impY = IMPACT_Y * h;
  const points: [number, number][] = [];

  // Pack sites in a radial distribution: closer to impact = denser
  for (let i = 0; i < NUM_SITES; i++) {
    const angle = rand() * Math.PI * 2;
    // Use sqrt to bias towards centre; 0.58 caps the radius at ~58% of the canvas
    // diagonal so all seeds land well within the Voronoi clipping bounds.
    const r = Math.sqrt(rand()) * Math.hypot(w, h) * 0.58;
    const jx = impX + Math.cos(angle) * r;
    const jy = impY + Math.sin(angle) * r;
    // Clamp inside canvas with margin
    points.push([
      Math.max(5, Math.min(w - 5, jx + (rand() - 0.5) * 40)),
      Math.max(5, Math.min(h - 5, jy + (rand() - 0.5) * 40)),
    ]);
  }

  // Voronoi tessellation clipped to [0,0,w,h]
  const delaunay = Delaunay.from(points);
  const voronoi = delaunay.voronoi([0, 0, w, h]);

  const halfDiag = Math.hypot(w, h) / 2;

  const shards: ShardInfo[] = [];
  for (let i = 0; i < NUM_SITES; i++) {
    const polygon = Array.from(voronoi.cellPolygon(i) ?? []) as [number, number][];
    if (polygon.length < 3) continue;

    // Compute centroid
    let cx = 0, cy = 0;
    for (const [px, py] of polygon) { cx += px; cy += py; }
    cx /= polygon.length;
    cy /= polygon.length;

    const dx = cx - impX;
    const dy = cy - impY;
    const d = Math.hypot(dx, dy) || 0.001;

    shards.push({
      polygon,
      centroid: [cx, cy],
      outwardDx: dx / d,
      outwardDy: dy / d,
      distFrac: Math.min(1, d / halfDiag),
    });
  }

  return shards;
}

// ── Convert canvas (px) coords to NDC-like Three.js units ────────────────────
// We map the full canvas to a [-aspect, aspect] × [-1, 1] plane at Z=0.
function toThree(
  x: number, y: number,
  w: number, h: number,
  aspect: number,
): [number, number] {
  return [
    ((x / w) - 0.5) * 2 * aspect,
    ((1 - y / h) - 0.5) * 2,
  ];
}

// ── Build shard mesh geometry (ShapeGeometry) ─────────────────────────────────
function buildShardGeometry(
  polygon: [number, number][],
  w: number,
  h: number,
  aspect: number,
): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  const [x0, y0] = toThree(polygon[0][0], polygon[0][1], w, h, aspect);
  shape.moveTo(x0, y0);
  for (let i = 1; i < polygon.length; i++) {
    const [xi, yi] = toThree(polygon[i][0], polygon[i][1], w, h, aspect);
    shape.lineTo(xi, yi);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape, 1);
}

// ── Build gold seam EdgesGeometry for a shard ─────────────────────────────────
function buildSeamGeometry(
  polygon: [number, number][],
  w: number,
  h: number,
  aspect: number,
): THREE.BufferGeometry {
  const pts3: number[] = [];
  for (let i = 0; i < polygon.length - 1; i++) {
    const [ax, ay] = toThree(polygon[i][0], polygon[i][1], w, h, aspect);
    const [bx, by] = toThree(polygon[i + 1][0], polygon[i + 1][1], w, h, aspect);
    pts3.push(ax, ay, 0.001, bx, by, 0.001);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts3, 3));
  return geo;
}

// ── Pointer tracker (world-space) ─────────────────────────────────────────────
interface PointerState {
  raw: THREE.Vector2;
  smooth: THREE.Vector2;
}

function usePointer(containerRef: RefObject<HTMLDivElement | null>): PointerState {
  const state = useRef<PointerState>({
    raw: new THREE.Vector2(0, 0),
    smooth: new THREE.Vector2(0, 0),
  });

  useEffect(() => {
    function onMove(e: Event) {
      const pe = e as PointerEvent;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      state.current.raw.set(
        (pe.clientX - rect.left) / rect.width * 2 - 1,
        -((pe.clientY - rect.top) / rect.height * 2 - 1),
      );
    }
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [containerRef]);

  return state.current;
}

// ── Gold shader material ──────────────────────────────────────────────────────
const GOLD_VERT = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const GOLD_FRAG = /* glsl */`
  uniform vec3 uLightPos;
  uniform vec3 uCameraPos;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3 lightDir = normalize(uLightPos - vWorldPos);
    vec3 viewDir = normalize(uCameraPos - vWorldPos);
    float diff = max(dot(vNormal, lightDir), 0.0);
    float spec = pow(max(dot(reflect(-lightDir, vNormal), viewDir), 0.0), 32.0);

    // Warm champagne gold palette
    vec3 baseGold = vec3(0.79, 0.62, 0.29);
    vec3 highlight = vec3(0.95, 0.90, 0.78);
    vec3 col = mix(baseGold, highlight, spec * 0.8 + diff * 0.3);

    // Subtle animated shimmer along the seam
    float shimmer = sin(vWorldPos.x * 18.0 + uTime * 1.4) * 0.5 + 0.5;
    col = mix(col, highlight, shimmer * 0.18);

    gl_FragColor = vec4(col, 1.0);
  }
`;

// ── Ceramic shard material ─────────────────────────────────────────────────────
const CERAMIC_VERT = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CERAMIC_FRAG = /* glsl */`
  uniform vec3 uLightPos;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    // Warm cream base with subtle SSS feel
    vec3 base = vec3(0.969, 0.945, 0.906);
    vec3 shadow = vec3(0.84, 0.80, 0.75);

    vec3 lightDir = normalize(uLightPos - vWorldPos);
    float ndl = max(dot(vNormal, lightDir), 0.0);
    // Wrap-around diffuse for SSS-like softness
    float wrap = (ndl + 0.4) / 1.4;

    float grain = noise(vWorldPos.xy * 200.0) * 0.03;
    vec3 col = mix(shadow, base, wrap) + grain;
    gl_FragColor = vec4(col, 1.0);
  }
`;

// ── Scene: shards + seams + lighting + particles ──────────────────────────────
interface SceneProps {
  shards: ShardInfo[];
  w: number;
  h: number;
  aspect: number;
  reducedMotion: boolean;
  pointer: PointerState;
}

function KintsugiScene({ shards, w, h, aspect, reducedMotion, pointer }: SceneProps) {
  const { camera } = useThree();
  const lightRef = useRef<THREE.PointLight>(null);
  const lightPosRef = useRef(new THREE.Vector3(0, 0, 1.5));
  const shardGroupRef = useRef<THREE.Group>(null);

  // Build per-shard geometry + refs
  const shardMeshes = useMemo(() => {
    return shards.map((s) => ({
      geo: buildShardGeometry(s.polygon, w, h, aspect),
      seamGeo: buildSeamGeometry(s.polygon, w, h, aspect),
      outwardDx: s.outwardDx,
      outwardDy: s.outwardDy,
      distFrac: s.distFrac,
    }));
  }, [shards, w, h, aspect]);

  // Shared shader uniforms
  const goldUniforms = useRef({
    uLightPos: { value: new THREE.Vector3(0, 0, 1.5) },
    uCameraPos: { value: new THREE.Vector3(0, 0, 2) },
    uTime: { value: 0 },
  });
  const ceramicUniforms = useRef({
    uLightPos: { value: new THREE.Vector3(0, 0, 1.5) },
  });

  // Shard mesh refs for per-frame Z animation
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Place camera
  useEffect(() => {
    camera.position.set(0, 0, 2);
    (camera as THREE.PerspectiveCamera).fov = 60;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  }, [camera]);

  useFrame((_, delta) => {
    const dt = Math.min(delta * 1000, 50); // ms, capped
    const alpha = 1 - Math.pow(1 - SMOOTH_FACTOR, dt / 16.67);

    // Smooth light tracking
    const targetX = pointer.raw.x * aspect * 0.9;
    const targetY = pointer.raw.y * 0.9;
    lightPosRef.current.x += (targetX - lightPosRef.current.x) * alpha;
    lightPosRef.current.y += (targetY - lightPosRef.current.y) * alpha;

    pointer.smooth.set(lightPosRef.current.x, lightPosRef.current.y);

    if (lightRef.current) {
      lightRef.current.position.set(
        lightPosRef.current.x,
        lightPosRef.current.y,
        1.5,
      );
    }

    // Update shader uniforms
    goldUniforms.current.uLightPos.value.set(
      lightPosRef.current.x,
      lightPosRef.current.y,
      1.5,
    );
    goldUniforms.current.uCameraPos.value.copy(camera.position);
    goldUniforms.current.uTime.value += delta;
    ceramicUniforms.current.uLightPos.value.set(
      lightPosRef.current.x,
      lightPosRef.current.y,
      1.5,
    );

    // Magnetic shard separation (Z-axis drift towards cursor)
    if (!reducedMotion) {
      meshRefs.current.forEach((mesh, i) => {
        if (!mesh || !shardMeshes[i]) return;
        const { outwardDx, outwardDy, distFrac } = shardMeshes[i];
        // Distance from pointer to shard outward direction
        const dot = outwardDx * lightPosRef.current.x / (aspect || 1)
          + outwardDy * lightPosRef.current.y;
        const drift = Math.max(0, dot) * distFrac * MAX_SHARD_DRIFT;
        const targetZ = drift;
        mesh.position.z += (targetZ - mesh.position.z) * alpha * 0.5;
      });
    }
  });

  return (
    <group ref={shardGroupRef}>
      {/* Ambient + Directional base lights */}
      <ambientLight intensity={0.45} color="#FFF8F0" />
      <directionalLight position={[0.5, 0.8, 1]} intensity={0.35} color="#FFF5E0" />

      {/* Dynamic cursor point light — drives specular gleam */}
      <pointLight
        ref={lightRef}
        position={[0, 0, 1.5]}
        intensity={reducedMotion ? 0.6 : 1.4}
        color="#FFE8B0"
        distance={4}
        decay={2}
      />

      {/* Ceramic shards */}
      {shardMeshes.map((sm, i) => (
        <mesh
          key={`shard-${i}`}
          ref={(el) => { meshRefs.current[i] = el; }}
          geometry={sm.geo}
        >
          <shaderMaterial
            vertexShader={CERAMIC_VERT}
            fragmentShader={CERAMIC_FRAG}
            uniforms={{
              uLightPos: ceramicUniforms.current.uLightPos,
            }}
          />
        </mesh>
      ))}

      {/* Gold seam lines */}
      {shardMeshes.map((sm, i) => (
        <lineSegments
          key={`seam-${i}`}
          geometry={sm.seamGeo}
          renderOrder={1}
        >
          <shaderMaterial
            vertexShader={GOLD_VERT}
            fragmentShader={GOLD_FRAG}
            uniforms={{
              uLightPos: goldUniforms.current.uLightPos,
              uCameraPos: goldUniforms.current.uCameraPos,
              uTime: goldUniforms.current.uTime,
            }}
            depthWrite={false}
          />
        </lineSegments>
      ))}

      {/* Floating gold dust particles */}
      {!reducedMotion && (
        <Sparkles
          count={120}
          scale={[aspect * 2, 2, 0.6]}
          size={0.9}
          speed={0.18}
          color="#D9A85C"
          opacity={0.55}
          noise={0.5}
        />
      )}
    </group>
  );
}

// ── Post-processing pipeline ──────────────────────────────────────────────────
function PostFX({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <EffectComposer>
      {/* Selective bloom – makes gold seams & particles glow */}
      <Bloom
        intensity={reducedMotion ? 0.2 : 0.65}
        luminanceThreshold={0.55}
        luminanceSmoothing={0.4}
        mipmapBlur
      />
      {/* Film grain – GPU-based, always mounted; opacity zero when reduced motion */}
      <Noise opacity={reducedMotion ? 0 : 0.032} />
      {/* Vignette */}
      <Vignette
        offset={0.38}
        darkness={0.48}
        eskil={false}
      />
    </EffectComposer>
  );
}

// ── Outer component ───────────────────────────────────────────────────────────
export default function KintsugiGlassCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(containerRef);

  // Reactively track prefers-reduced-motion so changes while the page is open
  // are respected immediately.
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Measure container to drive shard layout
  const [size, setSize] = useState({ w: 1440, h: 900 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize({
        w: entry.contentRect.width || 1440,
        h: entry.contentRect.height || 900,
      });
    });
    ro.observe(el);
    setSize({ w: el.offsetWidth || 1440, h: el.offsetHeight || 900 });
    return () => ro.disconnect();
  }, []);

  const aspect = size.w / size.h;

  // Build Voronoi shards — recalculated only when size changes
  const shards = useMemo(() => buildShards(size.w, size.h), [size.w, size.h]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#F7F1E7' }}
        camera={{ position: [0, 0, 2], fov: 60 }}
      >
        <Suspense fallback={null}>
          <KintsugiScene
            shards={shards}
            w={size.w}
            h={size.h}
            aspect={aspect}
            reducedMotion={reducedMotion}
            pointer={pointer}
          />
          <PostFX reducedMotion={reducedMotion} />
        </Suspense>
      </Canvas>
    </div>
  );
}
