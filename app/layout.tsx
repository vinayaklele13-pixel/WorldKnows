import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'WorldKnows — Understand Anything.',
  description: 'Search, explore, compare, and discover reliable information from across the web.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="antialiased font-sans bg-[#09090B] text-[#FAFAFA] min-h-screen">
        {children}
      </body>
    </html>
  );
}
