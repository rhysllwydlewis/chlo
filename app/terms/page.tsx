import type { Metadata } from 'next';
import TermsContent from './TermsContent';

export const metadata: Metadata = {
  title: 'Terms of Use | Chlo',
  description: 'Terms of Use for Chlo.',
};

export default function TermsPage() {
  return <TermsContent />;
}

