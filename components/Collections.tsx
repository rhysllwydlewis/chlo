'use client';

import { motion } from 'framer-motion';

const collections = [
  {
    name: 'Chlo.co.uk',
    tag: 'Now',
    tagStyle: { backgroundColor: '#E7D8C6', color: '#3B2F2A' },
    description:
      'The flagship home of the Chlo brand — a curated digital destination bringing together thoughtfully designed products and experiences.',
    href: 'https://chlo.co.uk',
    delay: 0,
  },
  {
    name: 'New Collection',
    tag: 'Soon',
    tagStyle: { backgroundColor: '#F7F1E7', color: '#6E5B52', border: '1px solid #E7D8C6' },
    description:
      "We're cultivating something new. A carefully considered addition to the Chlo family, coming soon.",
    href: null,
    delay: 0.15,
  },
  {
    name: 'New Collection',
    tag: 'Soon',
    tagStyle: { backgroundColor: '#F7F1E7', color: '#6E5B52', border: '1px solid #E7D8C6' },
    description:
      'Another thoughtful addition in development — crafted with the same care and intention as everything we do.',
    href: null,
    delay: 0.3,
  },
];

export default function Collections() {
  return (
    <section
      id="collections"
      className="py-28 px-6"
      style={{ backgroundColor: '#F7F1E7' }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-chlo-tan mb-4">Portfolio</p>
          <h2
            className="text-4xl md:text-5xl font-bold text-chlo-brown leading-tight"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Collections
          </h2>
          <p className="text-base text-chlo-muted mt-6 leading-relaxed">
            A growing family of brands, each built with purpose.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {collections.map((item, i) => (
            <motion.div
              key={`${item.name}-${i}`}
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.7, delay: item.delay, ease: [0.25, 0.46, 0.45, 0.94] }}
              whileHover={{ y: -4, transition: { duration: 0.22 } }}
              className="rounded-2xl p-8 flex flex-col transition-shadow duration-300 hover:shadow-lg"
              style={{
                backgroundColor: '#FFFCF7',
                border: '1px solid #E7D8C6',
              }}
            >
              <span
                className="inline-block self-start text-xs px-3 py-1 rounded-full font-medium tracking-wide"
                style={item.tagStyle}
              >
                {item.tag}
              </span>
              <h3
                className="text-xl font-semibold text-chlo-brown mt-5"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                {item.name}
              </h3>
              <div className="w-8 h-px mt-3 mb-3" style={{ backgroundColor: '#E7D8C6' }} />
              <p className="text-sm text-chlo-muted leading-relaxed flex-1">
                {item.description}
              </p>
              {item.href && (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 self-start inline-flex items-center gap-1.5 text-xs font-medium tracking-wide px-4 py-2 rounded-full transition-all duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chlo-tan focus-visible:ring-offset-2"
                  style={{ backgroundColor: '#E7D8C6', color: '#3B2F2A' }}
                >
                  Visit
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
