'use client';

import dynamic from 'next/dynamic';

// Dynamically import the R3F scene with SSR disabled — Three.js requires
// a browser environment and crashes during Next.js server-side rendering.
const KintsugiGlassCanvasInner = dynamic(
  () => import('./KintsugiGlassCanvasInner'),
  { ssr: false },
);

export default function KintsugiGlassCanvas() {
  return <KintsugiGlassCanvasInner />;
}
