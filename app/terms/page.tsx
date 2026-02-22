import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use | Chlo',
  description: 'Terms of Use for Chlo.',
};

export default function TermsPage() {
  return (
    <main
      className="min-h-screen py-20 px-6"
      style={{ backgroundColor: '#FFFCF7' }}
    >
      <div className="max-w-2xl mx-auto">
        <Link
          href="/legal"
          className="text-sm text-chlo-muted hover:text-chlo-brown transition-colors duration-200 mb-10 inline-block"
        >
          ← Back to Legal Hub
        </Link>

        <h1
          className="text-4xl font-serif mb-4"
          style={{ color: '#3B2F2A' }}
        >
          Terms of Use
        </h1>
        <p className="text-sm text-chlo-muted mb-12">Last updated: February 2026</p>

        <div className="prose prose-sm max-w-none text-chlo-muted space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#3B2F2A' }}>
              Who we are
            </h2>
            <p className="leading-relaxed">
              This site is operated by Chlo (sole trader trading as &apos;Chlo&apos;). By using
              this site, you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#3B2F2A' }}>
              Use of this site
            </h2>
            <p className="leading-relaxed">
              This site is provided for informational purposes. You may browse and use the site for
              personal, non-commercial purposes. You must not misuse this site or attempt to gain
              unauthorised access to any part of it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#3B2F2A' }}>
              Intellectual property
            </h2>
            <p className="leading-relaxed">
              All content on this site, including text, images, and design, is owned by or licensed
              to Chlo. You may not reproduce or distribute any content without prior written
              permission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#3B2F2A' }}>
              Limitation of liability
            </h2>
            <p className="leading-relaxed">
              We make no warranties about the accuracy or completeness of the content on this site.
              To the fullest extent permitted by law, Chlo shall not be liable for any losses
              arising from your use of this site.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#3B2F2A' }}>
              Changes to these terms
            </h2>
            <p className="leading-relaxed">
              We may update these terms from time to time. Continued use of the site after any
              changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#3B2F2A' }}>
              Governing law
            </h2>
            <p className="leading-relaxed">
              These terms are governed by the laws of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#3B2F2A' }}>
              Contact
            </h2>
            <p className="leading-relaxed">
              For any questions about these terms, please email us at{' '}
              <a
                href="mailto:hello@chlo.co.uk"
                className="underline hover:text-chlo-brown transition-colors duration-200"
              >
                hello@chlo.co.uk
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
