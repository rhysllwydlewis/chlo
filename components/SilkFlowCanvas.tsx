'use client';

import { useEffect, useRef } from 'react';

interface Blob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  alpha: number;
}

// Warm palette (no brown – used for text only)
const PALETTE = [
  { r: 231, g: 216, b: 198 }, // #E7D8C6 beige
  { r: 201, g: 169, b: 131 }, // #C9A983 tan
  { r: 247, g: 241, b: 231 }, // #F7F1E7 cream
  { r: 255, g: 252, b: 247 }, // #FFFCF7 warm white
  { r: 220, g: 200, b: 175 }, // mid beige
  { r: 235, g: 225, b: 210 }, // light beige
];

function createBlobs(w: number, h: number): Blob[] {
  const blobs: Blob[] = [];
  const count = 6;
  for (let i = 0; i < count; i++) {
    const c = PALETTE[i % PALETTE.length];
    blobs.push({
      x: Math.random() * w,
      y: Math.random() * h,
      // Very slow drift — max ~18 px/s (velocity in px/s)
      vx: (Math.random() - 0.5) * 18,
      vy: (Math.random() - 0.5) * 18,
      r: Math.min(w, h) * (0.3 + Math.random() * 0.35),
      color: `${c.r},${c.g},${c.b}`,
      alpha: 0.06 + Math.random() * 0.12,
    });
  }
  return blobs;
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  blobs: Blob[],
  w: number,
  h: number,
) {
  ctx.fillStyle = '#F7F1E7';
  ctx.fillRect(0, 0, w, h);

  for (const blob of blobs) {
    const grad = ctx.createRadialGradient(
      blob.x, blob.y, 0,
      blob.x, blob.y, blob.r,
    );
    grad.addColorStop(0, `rgba(${blob.color},${blob.alpha})`);
    grad.addColorStop(1, `rgba(${blob.color},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default function SilkFlowCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const blobsRef = useRef<Blob[]>([]);
  const sizeRef = useRef({ w: 0, h: 0 });
  const visibleRef = useRef(true);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function setSize() {
      const w = container!.offsetWidth;
      const h = container!.offsetHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w, h };
    }

    function update(dt: number) {
      const { w, h } = sizeRef.current;
      for (const blob of blobsRef.current) {
        blob.x += blob.vx * dt;
        blob.y += blob.vy * dt;
        // Wrap gently at edges
        if (blob.x < -blob.r) blob.x = w + blob.r;
        if (blob.x > w + blob.r) blob.x = -blob.r;
        if (blob.y < -blob.r) blob.y = h + blob.r;
        if (blob.y > h + blob.r) blob.y = -blob.r;
      }
    }

    function loop(time: number) {
      if (visibleRef.current) {
        const dt =
          lastTimeRef.current == null
            ? 16
            : Math.min(time - lastTimeRef.current, 50);
        lastTimeRef.current = time;
        update(dt / 1000);
        drawFrame(ctx!, blobsRef.current, sizeRef.current.w, sizeRef.current.h);
      }
      animRef.current = requestAnimationFrame(loop);
    }

    setSize();
    blobsRef.current = createBlobs(sizeRef.current.w, sizeRef.current.h);
    drawFrame(ctx, blobsRef.current, sizeRef.current.w, sizeRef.current.h);

    if (!prefersReducedMotion) {
      animRef.current = requestAnimationFrame(loop);
    }

    const resizeObserver = new ResizeObserver(() => {
      setSize();
      blobsRef.current = createBlobs(sizeRef.current.w, sizeRef.current.h);
      drawFrame(ctx!, blobsRef.current, sizeRef.current.w, sizeRef.current.h);
    });
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver((entries) => {
      if (entries.length > 0) {
        visibleRef.current = entries[0].isIntersecting;
      }
    });
    intersectionObserver.observe(container);

    return () => {
      if (animRef.current != null) cancelAnimationFrame(animRef.current);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {/* Vignette overlay — darkens edges to keep hero text readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, transparent 45%, rgba(59,47,42,0.12) 100%)',
        }}
      />
    </div>
  );
}
