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
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-chlo-muted">© 2026 Chlo. All rights reserved.</p>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/legal" className="text-chlo-muted hover:text-chlo-brown transition-colors duration-200">
            Legal Hub
          </Link>
          <button
            type="button"
            onClick={openContact}
            className="text-chlo-muted hover:text-chlo-brown transition-colors duration-200 cursor-pointer"
          >
            Contact
          </button>
        </div>
      </div>
    </motion.footer>
  );
}
