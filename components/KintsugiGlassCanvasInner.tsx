'use client';

import {
  useRef,
  useMemo,
  useEffect,
  Suspense,
  useState,
  type RefObject,
} from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, Line } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Delaunay } from 'd3-delaunay';

// ── Constants ─────────────────────────────────────────────────────────────────
const SEED = 0xb3ef7a1c;
const IMPACT_X = 0.52;        // off-centre fracture impact point (0..1)
const IMPACT_Y = 0.46;
const NUM_SITES = 60;          // Voronoi seed count
const MAX_SHARD_DRIFT = 0.018; // max Z separation on cursor hover
const SMOOTH_FACTOR = 0.06;    // EMA smoothing coefficient for cursor tracking

// Pre-computed gold colour endpoints (used for shimmer interpolation)
const GOLD_BASE = new THREE.Color(0.79, 0.62, 0.29); // warm champagne
const GOLD_HIGH = new THREE.Color(0.97, 0.92, 0.80); // near-white peak

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

// ── Types ─────────────────────────────────────────────────────────────────────
interface ShardInfo {
  polygon:    [number, number][];
  centroid:   [number, number];
  outwardDx:  number;
  outwardDy:  number;
  distFrac:   number;
}

// ── Build radial Voronoi fracture ─────────────────────────────────────────────
function buildShards(w: number, h: number): ShardInfo[] {
  const rand = mulberry32(SEED);
  const impX = IMPACT_X * w;
  const impY = IMPACT_Y * h;
  const points: [number, number][] = [];

  for (let i = 0; i < NUM_SITES; i++) {
    const angle = rand() * Math.PI * 2;
    // sqrt-bias → denser near impact; 0.58 keeps seeds well inside clip bounds
    const r = Math.sqrt(rand()) * Math.hypot(w, h) * 0.58;
    points.push([
      Math.max(5, Math.min(w - 5, impX + Math.cos(angle) * r + (rand() - 0.5) * 40)),
      Math.max(5, Math.min(h - 5, impY + Math.sin(angle) * r + (rand() - 0.5) * 40)),
    ]);
  }

  const voronoi  = Delaunay.from(points).voronoi([0, 0, w, h]);
  const halfDiag = Math.hypot(w, h) / 2;
  const shards: ShardInfo[] = [];

  for (let i = 0; i < NUM_SITES; i++) {
    const polygon = Array.from(voronoi.cellPolygon(i) ?? []) as [number, number][];
    if (polygon.length < 3) continue;

    let cx = 0, cy = 0;
    for (const [px, py] of polygon) { cx += px; cy += py; }
    cx /= polygon.length;
    cy /= polygon.length;

    const dx = cx - impX;
    const dy = cy - impY;
    const d  = Math.hypot(dx, dy) || 0.001;

    shards.push({
      polygon,
      centroid: [cx, cy],
      outwardDx: dx / d,
      outwardDy: dy / d,
      distFrac:  Math.min(1, d / halfDiag),
    });
  }
  return shards;
}

// ── Coordinate conversion: canvas px → Three.js world units ──────────────────
// Full canvas maps to [−aspect, aspect] × [−1, 1].
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

// ── Per-shard geometry data ───────────────────────────────────────────────────
interface ShardGeom {
  shardGeo:   THREE.ShapeGeometry;
  /** Voronoi polygon as 3-D points (Z = 0.002, above shard surface) for Line rendering */
  seamPoints: [number, number, number][];
  outwardDx:  number;
  outwardDy:  number;
  distFrac:   number;
}

function buildShardGeometries(
  shards: ShardInfo[],
  w: number, h: number,
  aspect: number,
): ShardGeom[] {
  return shards.map((s) => {
    // Ceramic mesh shape
    const shape = new THREE.Shape();
    const [x0, y0] = toThree(s.polygon[0][0], s.polygon[0][1], w, h, aspect);
    shape.moveTo(x0, y0);
    for (let i = 1; i < s.polygon.length; i++) {
      const [xi, yi] = toThree(s.polygon[i][0], s.polygon[i][1], w, h, aspect);
      shape.lineTo(xi, yi);
    }
    shape.closePath();

    // Seam outline: unique polygon vertices (d3-delaunay closes with first=last so slice(0,-1)).
    // Append the first vertex again to manually close the Line polyline.
    const uniqueVerts = s.polygon.slice(0, -1);
    const seamPoints: [number, number, number][] = uniqueVerts.map(([px, py]) => {
      const [tx, ty] = toThree(px, py, w, h, aspect);
      return [tx, ty, 0.002]; // slightly above shard surface
    });
    if (seamPoints.length > 0) seamPoints.push(seamPoints[0]); // close loop

    return {
      shardGeo:  new THREE.ShapeGeometry(shape, 1),
      seamPoints,
      outwardDx: s.outwardDx,
      outwardDy: s.outwardDy,
      distFrac:  s.distFrac,
    };
  });
}

// ── Pointer tracker ────────────────────────────────────────────────────────────
interface PointerState {
  /** Normalised device pointer position: x/y in −1..1. Updated each pointermove. */
  pos: THREE.Vector2;
}

function usePointer(containerRef: RefObject<HTMLDivElement | null>): PointerState {
  const state = useRef<PointerState>({ pos: new THREE.Vector2(0, 0) });

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      state.current.pos.set(
        (e.clientX - rect.left) / rect.width  * 2 - 1,
        -((e.clientY - rect.top)  / rect.height * 2 - 1),
      );
    }
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [containerRef]);

  return state.current;
}

// ── Ceramic shard GLSL ─────────────────────────────────────────────────────────
// Note: no vUv varying — unused, removed to keep the shader lean.
const CERAMIC_VERT = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vNormal   = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CERAMIC_FRAG = /* glsl */`
  uniform vec3 uLightPos;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec3 base   = vec3(0.969, 0.945, 0.906); // warm cream #F7F1E7
    vec3 shadow = vec3(0.82,  0.78,  0.73);  // shadow trough

    vec3  lightDir = normalize(uLightPos - vWorldPos);
    float ndl      = max(dot(vNormal, lightDir), 0.0);
    // Wrap-around diffuse — SSS-like softness (no hard terminator)
    float wrap = (ndl + 0.4) / 1.4;
    float grain = noise(vWorldPos.xy * 220.0) * 0.028; // subtle ceramic grain

    gl_FragColor = vec4(mix(shadow, base, wrap) + grain, 1.0);
  }
`;

// ── KintsugiScene ──────────────────────────────────────────────────────────────
interface SceneProps {
  shards:        ShardInfo[];
  w:             number;
  h:             number;
  aspect:        number;
  reducedMotion: boolean;
  pointer:       PointerState;
}

function KintsugiScene({ shards, w, h, aspect, reducedMotion, pointer }: SceneProps) {
  const lightRef   = useRef<THREE.PointLight>(null);
  const lightPos   = useRef(new THREE.Vector3(0, 0, 1.5));

  // Build per-shard geometries — rebuilds only on resize
  const geoms = useMemo(
    () => buildShardGeometries(shards, w, h, aspect),
    [shards, w, h, aspect],
  );

  // ── Dispose old ShapeGeometry objects to prevent GPU memory leaks ────────────
  const prevGeomsRef = useRef<ShardGeom[] | null>(null);
  useEffect(() => {
    const prev = prevGeomsRef.current;
    prevGeomsRef.current = geoms;
    // Dispose previous geometries (not the first mount)
    if (prev !== null && prev !== geoms) {
      prev.forEach((g) => g.shardGeo.dispose());
    }
    // Dispose on unmount
    return () => {
      geoms.forEach((g) => g.shardGeo.dispose());
    };
  }, [geoms]);

  // Ceramic shader uniforms — single object shared across all shard materials
  const ceramicUniforms = useRef({
    uLightPos: { value: new THREE.Vector3(0, 0, 1.5) },
  });

  // Refs to Line2 objects for direct material colour mutation (no re-renders)
  const seamRefs = useRef<(THREE.Object3D | null)[]>([]);
  // Refs to ceramic mesh objects for Z-drift animation
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Reset ref arrays when shard count changes (e.g. on resize)
  useEffect(() => {
    meshRefs.current = new Array(geoms.length).fill(null);
    seamRefs.current = new Array(geoms.length).fill(null);
  }, [geoms.length]);

  // ── Per-frame animation loop ─────────────────────────────────────────────────
  useFrame(({ clock }, delta) => {
    const dt    = Math.min(delta * 1000, 50); // cap at 50 ms (handles tab-switch jank)
    const alpha = 1 - Math.pow(1 - SMOOTH_FACTOR, dt / 16.67); // frame-rate-independent EMA
    const elapsed = clock.elapsedTime;

    // Smooth cursor-following for the point light
    lightPos.current.x += (pointer.pos.x * aspect * 0.9 - lightPos.current.x) * alpha;
    lightPos.current.y += (pointer.pos.y * 0.9          - lightPos.current.y) * alpha;

    if (lightRef.current) {
      lightRef.current.position.set(lightPos.current.x, lightPos.current.y, 1.5);
    }
    ceramicUniforms.current.uLightPos.value.set(
      lightPos.current.x, lightPos.current.y, 1.5,
    );

    // Animate seam line colours — direct LineMaterial mutation (zero React overhead)
    const cursorGleam =
      Math.max(0, lightPos.current.x * 0.4 + lightPos.current.y * 0.3 + 0.6); // 0..~1.3
    seamRefs.current.forEach((obj, i) => {
      if (!obj) return;
      // Stagger the shimmer phase so lines don't pulse in unison
      const phase   = ((i * 0.137 + i * 0.073) % 1) * Math.PI * 2;
      const shimmer = Math.sin(elapsed * 1.4 + phase) * 0.5 + 0.5;         // 0..1
      const gleam   = Math.min(1, shimmer * 0.65 + cursorGleam * 0.35);    // 0..1

      const mat = (obj as { material?: { color?: THREE.Color } }).material;
      if (mat?.color instanceof THREE.Color) {
        mat.color.setRGB(
          GOLD_BASE.r + (GOLD_HIGH.r - GOLD_BASE.r) * gleam,
          GOLD_BASE.g + (GOLD_HIGH.g - GOLD_BASE.g) * gleam,
          GOLD_BASE.b + (GOLD_HIGH.b - GOLD_BASE.b) * gleam,
        );
      }
    });

    // Magnetic Z-drift — shards subtly repulse from the cursor
    if (!reducedMotion) {
      meshRefs.current.forEach((mesh, i) => {
        if (!mesh || !geoms[i]) return;
        const { outwardDx, outwardDy, distFrac } = geoms[i];
        const dot  = outwardDx * lightPos.current.x / (aspect || 1)
                   + outwardDy * lightPos.current.y;
        const targetZ = Math.max(0, dot) * distFrac * MAX_SHARD_DRIFT;
        mesh.position.z += (targetZ - mesh.position.z) * alpha * 0.5;
      });
    }
  });

  return (
    <>
      {/* Base lighting rig */}
      <ambientLight intensity={0.5} color="#FFF8F0" />
      <directionalLight position={[0.5, 0.8, 1]} intensity={0.3} color="#FFF5E0" />

      {/* Cursor-tracking specular point light */}
      <pointLight
        ref={lightRef}
        position={[0, 0, 1.5]}
        intensity={reducedMotion ? 0.5 : 1.2}
        color="#FFE8B0"
        distance={4.5}
        decay={2}
      />

      {/* ── Ceramic shards ─────────────────────────────────────────────────── */}
      {geoms.map((g, i) => (
        <mesh
          key={`shard-${i}`}
          ref={(el) => { meshRefs.current[i] = el; }}
          geometry={g.shardGeo}
        >
          <shaderMaterial
            vertexShader={CERAMIC_VERT}
            fragmentShader={CERAMIC_FRAG}
            uniforms={{ uLightPos: ceramicUniforms.current.uLightPos }}
          />
        </mesh>
      ))}

      {/* ── Gold kintsugi seams ────────────────────────────────────────────── */}
      {/* Line from @react-three/drei uses LineSegments2 / LineMaterial under    */}
      {/* the hood, which supports sub-pixel → multi-pixel widths on all GPUs.  */}
      {geoms.map((g, i) => (
        <Line
          key={`seam-${i}`}
          ref={(el: THREE.Object3D | null) => { seamRefs.current[i] = el; }}
          points={g.seamPoints}
          lineWidth={2.5}
          color={new THREE.Color(GOLD_BASE.r, GOLD_BASE.g, GOLD_BASE.b)}
          renderOrder={1}
          depthWrite={false}
        />
      ))}

      {/* ── Floating gold dust particles ───────────────────────────────────── */}
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
    </>
  );
}

// ── Post-processing pipeline ──────────────────────────────────────────────────
function PostFX({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <EffectComposer>
      {/*
        Bloom — threshold 0.62 sits just above the ceramic surface luminance
        peak (≈0.58 in lit areas with ACES roll-off) but below GOLD_HIGH (≈0.91).
        This ensures only the gold seams glow; the cream ceramic stays crisp.
        Intensity 0.75 gives a warm gold halo without blowing out the scene.
      */}
      <Bloom
        intensity={reducedMotion ? 0.25 : 0.75}
        luminanceThreshold={0.62}
        luminanceSmoothing={0.5}
        mipmapBlur
      />
      {/* Film grain — GPU-based; opacity driven to zero when motion is reduced */}
      <Noise opacity={reducedMotion ? 0 : 0.032} />
      {/* Vignette — darkens edges for editorial depth */}
      <Vignette offset={0.38} darkness={0.48} eskil={false} />
    </EffectComposer>
  );
}

// ── Shell component (SSR boundary) ────────────────────────────────────────────
export default function KintsugiGlassCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointer      = usePointer(containerRef);

  // Reactively track prefers-reduced-motion; updates immediately if user changes it
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq      = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Measure container so shard layout matches true viewport size
  const [size, setSize] = useState({ w: 1440, h: 900 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize({
        w: entry.contentRect.width  || 1440,
        h: entry.contentRect.height || 900,
      });
    });
    ro.observe(el);
    setSize({ w: el.offsetWidth || 1440, h: el.offsetHeight || 900 });
    return () => ro.disconnect();
  }, []);

  const aspect = size.w / size.h;

  // Build Voronoi fracture — recalculated only when viewport dimensions change
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
        frameloop={reducedMotion ? 'demand' : 'always'}
        onCreated={({ gl }) => {
          // Ensure the canvas element itself never captures pointer events
          // (the outer div has pointer-events:none but that does not auto-apply to children)
          gl.domElement.style.pointerEvents = 'none';
        }}
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
