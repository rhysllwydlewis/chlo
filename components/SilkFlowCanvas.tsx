'use client';

import { useEffect, useRef } from 'react';

interface Shape {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  sides: number; // 0 = circle, 3 = triangle, 4 = diamond, 6 = hexagon
  alpha: number;
  pulsePhase: number;
  pulseSpeed: number;
}

// Warm, very subtle palette
const COLORS = [
  '201,169,131', // #C9A983 tan
  '231,216,198', // #E7D8C6 beige
  '220,200,175', // mid beige
  '189,155,120', // deeper tan
];

function createShapes(w: number, h: number): Shape[] {
  const shapes: Shape[] = [];
  const count = 14;
  const sideOptions = [0, 3, 4, 6]; // circle, triangle, diamond, hexagon
  for (let i = 0; i < count; i++) {
    shapes.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      size: 30 + Math.random() * 80,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      sides: sideOptions[Math.floor(Math.random() * sideOptions.length)],
      alpha: 0.06 + Math.random() * 0.07,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.3 + Math.random() * 0.5,
    });
  }
  return shapes;
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  sides: number,
  radius: number,
  rotation: number,
) {
  if (sides === 0) {
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    return;
  }
  const step = (Math.PI * 2) / sides;
  ctx.moveTo(x + radius * Math.cos(rotation), y + radius * Math.sin(rotation));
  for (let i = 1; i <= sides; i++) {
    ctx.lineTo(
      x + radius * Math.cos(rotation + step * i),
      y + radius * Math.sin(rotation + step * i),
    );
  }
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  shapes: Shape[],
  w: number,
  h: number,
  time: number,
) {
  ctx.fillStyle = '#F7F1E7';
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < shapes.length; i++) {
    const s = shapes[i];
    const color = COLORS[i % COLORS.length];
    // Gentle pulse on alpha
    const pulse = 0.6 + 0.4 * Math.sin(time * s.pulseSpeed + s.pulsePhase);
    const alpha = s.alpha * pulse;

    ctx.save();
    ctx.strokeStyle = `rgba(${color},${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    drawPolygon(ctx, s.x, s.y, s.sides, s.size, s.rotation);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

export default function SilkFlowCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const shapesRef = useRef<Shape[]>([]);
  const sizeRef = useRef({ w: 0, h: 0 });
  const startTimeRef = useRef<number | null>(null);
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
      for (const shape of shapesRef.current) {
        shape.x += shape.vx * dt;
        shape.y += shape.vy * dt;
        shape.rotation += shape.rotationSpeed * dt;
        // Wrap at edges
        if (shape.x < -shape.size * 2) shape.x = w + shape.size * 2;
        if (shape.x > w + shape.size * 2) shape.x = -shape.size * 2;
        if (shape.y < -shape.size * 2) shape.y = h + shape.size * 2;
        if (shape.y > h + shape.size * 2) shape.y = -shape.size * 2;
      }
    }

    function startLoop() {
      if (animRef.current !== null) return;
      lastTimeRef.current = null;
      startTimeRef.current = null;
      animRef.current = requestAnimationFrame(loop);
    }

    function stopLoop() {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    }

    function loop(time: number) {
      if (startTimeRef.current === null) startTimeRef.current = time;
      const elapsed = (time - startTimeRef.current) / 1000;
      const dt =
        lastTimeRef.current == null
          ? 16
          : Math.min(time - lastTimeRef.current, 50);
      lastTimeRef.current = time;
      update(dt / 1000);
      drawFrame(ctx!, shapesRef.current, sizeRef.current.w, sizeRef.current.h, elapsed);
      animRef.current = requestAnimationFrame(loop);
    }

    setSize();
    shapesRef.current = createShapes(sizeRef.current.w, sizeRef.current.h);

    if (prefersReducedMotion) {
      // Draw a single static frame only
      drawFrame(ctx, shapesRef.current, sizeRef.current.w, sizeRef.current.h, 0);
    } else {
      startLoop();
    }

    const resizeObserver = new ResizeObserver(() => {
      setSize();
      shapesRef.current = createShapes(sizeRef.current.w, sizeRef.current.h);
      if (prefersReducedMotion) {
        drawFrame(ctx!, shapesRef.current, sizeRef.current.w, sizeRef.current.h, 0);
      }
    });
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (!prefersReducedMotion) startLoop();
      } else {
        stopLoop();
      }
    });
    intersectionObserver.observe(container);

    const handleVisibility = () => {
      if (document.hidden) {
        stopLoop();
      } else if (!prefersReducedMotion) {
        startLoop();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopLoop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {/* Vignette overlay — softens edges to keep hero text readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, transparent 45%, rgba(59,47,42,0.08) 100%)',
        }}
      />
    </div>
  );
}
