'use client';

import { motion } from 'framer-motion';
import { useContact } from '@/components/ContactWidget';

export default function ContactBand() {
  const { openContact } = useContact();

  return (
    <section
      className="py-24 px-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #E7D8C6 0%, #D4C0A8 50%, #E7D8C6 100%)',
      }}
    >
      {/* Subtle decorative shape */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 70% 50%, rgba(201,169,131,0.3) 0%, transparent 70%)',
        }}
      />
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-xs uppercase tracking-[0.3em] text-chlo-muted/70 mb-5">Let&apos;s talk</p>
          <h2
            className="text-3xl md:text-4xl font-bold text-chlo-brown"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Interested in partnering with Chlo?
          </h2>
          <p className="text-chlo-muted mt-4 max-w-xl mx-auto leading-relaxed">
            Whether you have a brand concept, a product, or simply an idea —
            we&apos;d love to hear from you.
          </p>
          <button
            type="button"
            onClick={openContact}
            className="mt-10 inline-flex items-center gap-2 px-10 py-4 rounded-full text-sm font-medium tracking-wide transition-all duration-200 hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chlo-brown focus-visible:ring-offset-2"
            style={{ backgroundColor: '#3B2F2A', color: '#FFFCF7' }}
          >
            Get in touch
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </motion.div>
      </div>
    </section>
  );
}
