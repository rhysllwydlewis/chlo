import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Chlo',
  description: 'Privacy Policy for Chlo.',
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-sm text-chlo-muted mb-12">Last updated: February 2026</p>

        <div className="prose prose-sm max-w-none text-chlo-muted space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#3B2F2A' }}>
              Who we are
            </h2>
            <p className="leading-relaxed">
              This site is operated by Chlo (sole trader trading as &apos;Chlo&apos;). When we refer
              to &quot;we&quot;, &quot;us&quot;, or &quot;our&quot; in this policy, we mean Chlo.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#3B2F2A' }}>
              Information we collect
            </h2>
            <p className="leading-relaxed">
              We may collect information you provide directly, such as your name and email address
              when you use our contact form. We do not collect any information automatically beyond
              what is strictly necessary for the site to function.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#3B2F2A' }}>
              How we use your information
            </h2>
            <p className="leading-relaxed">
              Information you provide via the contact form is used solely to respond to your
              enquiry. We do not use your data for marketing purposes or share it with third parties
              without your consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#3B2F2A' }}>
              How long we keep your data
            </h2>
            <p className="leading-relaxed">
              We retain your personal data only as long as necessary for the purpose it was
              collected, after which it is securely deleted.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#3B2F2A' }}>
              Cookies
            </h2>
            <p className="leading-relaxed">
              This site uses only essential cookies required for basic functionality. We do not use
              tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#3B2F2A' }}>
              Your rights
            </h2>
            <p className="leading-relaxed">
              You have the right to access, correct, or request deletion of any personal data we
              hold about you. To exercise these rights, please contact us using the details below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#3B2F2A' }}>
              Contact
            </h2>
            <p className="leading-relaxed">
              For any privacy-related enquiries, please email us at{' '}
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
