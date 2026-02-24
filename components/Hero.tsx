'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useContact } from '@/components/ContactWidget';

// R3F canvas uses WebGL — must be loaded client-side only
const KintsugiGlassCanvas = dynamic(() => import('./KintsugiGlassCanvas'), {
  ssr: false,
});

export default function Hero() {
  const { openContact } = useContact();
  const sectionRef = useRef<HTMLElement>(null);

  // Ref updated by framer-motion scroll subscriber — no re-renders on scroll
  const scrollYRef = useRef(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    scrollYRef.current = v;
  });

  const handleExploreClick = () => {
    const target = document.querySelector('#collections');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#F7F1E7' }}
    >
      <KintsugiGlassCanvas scrollYRef={scrollYRef} />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl mx-auto">
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.25 }}
          className="text-7xl sm:text-8xl md:text-[10rem] font-bold tracking-[-0.02em] text-chlo-brown leading-none"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          Chlo
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.55 }}
          className="text-xl md:text-2xl text-chlo-muted font-light mt-8 tracking-wide"
          style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}
        >
          Curated experiences, crafted with care.
        </motion.p>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.75 }}
          className="text-base text-chlo-muted mt-5 max-w-lg leading-relaxed"
        >
          Chlo brings together a growing collection of thoughtfully designed
          products and digital experiences.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.95 }}
          className="flex flex-col sm:flex-row gap-4 mt-12"
        >
          <button
            type="button"
            onClick={openContact}
            className="px-8 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-200 hover:opacity-80"
            style={{ backgroundColor: '#3B2F2A', color: '#FFFCF7' }}
          >
            Contact
          </button>
          <button
            type="button"
            onClick={handleExploreClick}
            className="px-8 py-3.5 rounded-full text-sm font-medium tracking-wide border transition-all duration-200 hover:bg-chlo-beige"
            style={{ borderColor: '#3B2F2A', color: '#3B2F2A' }}
          >
            Explore
          </button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1, delay: 1.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-chlo-muted"
        aria-hidden="true"
      >
        <div className="animate-bounce-slow motion-reduce:animate-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </motion.div>
    </section>
  );
}
