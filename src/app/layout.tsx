import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pranay & Vaishnavi — Wedding Gallery',
  description: 'Find your wedding photos instantly with AI face search',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const R2_URL  = process.env.NEXT_PUBLIC_R2_URL;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Only render preconnect if URL is actually set */}
        {API_URL ? <link rel="preconnect" href={API_URL} /> : null}
        {R2_URL  ? <link rel="dns-prefetch" href={R2_URL} /> : null}
      </head>
      <body>{children}</body>
    </html>
  );
}
