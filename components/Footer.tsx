'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useContact } from '@/components/ContactWidget';

export default function Footer() {
  const { openContact } = useContact();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="py-12 px-6"
      style={{ backgroundColor: '#FFFCF7', borderTop: '1px solid #E7D8C6' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <span
            className="text-xl font-bold tracking-[0.15em] text-chlo-brown/60 select-none"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Chlo
          </span>
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/legal"
              className="text-chlo-muted hover:text-chlo-brown transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chlo-tan focus-visible:ring-offset-1 rounded"
            >
              Legal
            </Link>
            <button
              type="button"
              onClick={openContact}
              className="text-chlo-muted hover:text-chlo-brown transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chlo-tan focus-visible:ring-offset-1 rounded"
            >
              Contact
            </button>
          </div>
        </div>
        <p className="text-xs text-chlo-muted/60 mt-6 text-center md:text-left">
          © 2026 Chlo. All rights reserved.
        </p>
      </div>
    </motion.footer>
  );
}
