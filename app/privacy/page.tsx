import type { Metadata } from 'next';
import PrivacyContent from './PrivacyContent';

export const metadata: Metadata = {
  title: 'Privacy Policy | Chlo',
  description: 'Privacy Policy for Chlo.',
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}

