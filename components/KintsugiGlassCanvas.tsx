'use client';

import { Canvas } from '@react-three/fiber';
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
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: '#F7F1E7' }}
      >
        <KintsugiGlassCanvasInner scrollY={scrollYRef} />
      </Canvas>
    </div>
  );
}
