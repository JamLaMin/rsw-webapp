import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RSW Kassa',
  description: 'Kassa webapp'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
