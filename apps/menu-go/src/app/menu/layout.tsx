'use client';
// import 'focus-visible';
import '../../styles/globals.css';

import Analytics from '../../components/Analytics';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Analytics />
      <body>{children}</body>
    </html>
  );
}
