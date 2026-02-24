'use client';

import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import KintsugiGlassCanvasInner from './KintsugiGlassCanvasInner';

interface KintsugiGlassCanvasProps {
  /** Ref updated by the parent scroll listener — avoids re-renders on scroll */
  scrollYRef: React.MutableRefObject<number>;
}

export default function KintsugiGlassCanvas({ scrollYRef }: KintsugiGlassCanvasProps) {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 3], fov: 60, near: 0.1, far: 50 }}
        // Cap DPR at 1.75 — good quality without over-sampling on high-DPI screens
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: '#F7F1E7' }}
        onCreated={({ gl }) => {
          // ACESFilmic tone mapping for cinematic, controlled highlights
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          // Exposure slightly below 1 prevents blown-out gold highlights
          gl.toneMappingExposure = 0.82;
        }}
      >
        <KintsugiGlassCanvasInner scrollY={scrollYRef} />
      </Canvas>
    </div>
  );
}
