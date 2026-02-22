'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useContact } from '@/components/ContactWidget';

const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Collections', href: '#collections' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { openContact } = useContact();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7 }}
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-5 transition-all duration-500 ${
        scrolled
          ? 'shadow-sm'
          : ''
      }`}
      style={scrolled ? { backgroundColor: 'rgba(255,252,247,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E7D8C6' } : {}}
    >
      <a
        href="#"
        className="text-xl font-bold tracking-[0.15em] text-chlo-brown"
        style={{ fontFamily: 'var(--font-playfair)' }}
        onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
      >
        CHLO
      </a>

      <div className="flex items-center gap-8">
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            onClick={(e) => handleNavClick(e, link.href)}
            className="text-sm text-chlo-muted hover:text-chlo-brown transition-colors duration-200 tracking-wide"
          >
            {link.label}
          </a>
        ))}
        <button
          type="button"
          onClick={openContact}
          className="text-sm text-chlo-brown border border-chlo-brown rounded-full px-5 py-2 hover:bg-chlo-brown hover:text-chlo-surface transition-all duration-200 tracking-wide"
        >
          Contact
        </button>
      </div>
    </motion.nav>
  );
}
