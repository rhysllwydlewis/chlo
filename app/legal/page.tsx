import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Legal Hub | Chlo',
  description: 'Legal information for Chlo, including our Privacy Policy and Terms of Use.',
};

export default function LegalPage() {
  return (
    <main
      className="min-h-screen py-20 px-6"
      style={{ backgroundColor: '#FFFCF7' }}
    >
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="text-sm text-chlo-muted hover:text-chlo-brown transition-colors duration-200 mb-10 inline-block"
        >
          ← Back to Home
        </Link>

        <h1
          className="text-4xl font-serif mb-4"
          style={{ color: '#3B2F2A' }}
        >
          Legal Hub
        </h1>
        <p className="text-chlo-muted mb-12 leading-relaxed">
          This page brings together the legal documents that govern your use of Chlo. We&apos;re
          committed to being transparent about how we operate and handle your information.
        </p>

        <div className="flex flex-col gap-6 mb-16">
          <Link
            href="/privacy"
            className="group block p-6 rounded-lg border transition-colors duration-200"
            style={{ borderColor: '#E7D8C6', backgroundColor: '#F7F1E7' }}
          >
            <h2 className="text-lg font-semibold mb-1" style={{ color: '#3B2F2A' }}>
              Privacy Policy
            </h2>
            <p className="text-sm text-chlo-muted">
              How we collect, use, and protect your personal information.
            </p>
          </Link>

          <Link
            href="/terms"
            className="group block p-6 rounded-lg border transition-colors duration-200"
            style={{ borderColor: '#E7D8C6', backgroundColor: '#F7F1E7' }}
          >
            <h2 className="text-lg font-semibold mb-1" style={{ color: '#3B2F2A' }}>
              Terms of Use
            </h2>
            <p className="text-sm text-chlo-muted">
              The terms and conditions that apply when you use this site.
            </p>
          </Link>
        </div>

        <section
          className="p-6 rounded-lg border mb-12"
          style={{ borderColor: '#E7D8C6', backgroundColor: '#F7F1E7' }}
        >
          <h2 className="text-base font-semibold mb-2" style={{ color: '#3B2F2A' }}>
            Cookies
          </h2>
          <p className="text-sm text-chlo-muted leading-relaxed">
            This site uses only essential cookies required for basic functionality. We do not use
            tracking or advertising cookies. No cookie consent banner is needed as we do not set
            non-essential cookies.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: '#3B2F2A' }}>
            Questions?
          </h2>
          <p className="text-sm text-chlo-muted leading-relaxed">
            If you have any questions about these documents or how we handle your data, please{' '}
            <a
              href="mailto:hello@chlo.co.uk"
              className="underline hover:text-chlo-brown transition-colors duration-200"
            >
              get in touch
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
