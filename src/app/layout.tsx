import type {Metadata} from 'next';
import {Inter} from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'College Complaint Management System',
  description: 'Report • Prioritize • Resolve - A college complaint management system for students and administrators.',
  icons: {
    icon: ['/favicon.svg'],
  },
};

// Single global background image used by the entire application.
// Place one image into the project root `/public` folder and reference it here.
// The CSS variable is set on the document element once, so every glass layer on
// every route sees the same image.
const GLOBAL_BG_IMAGE_URL = '/bg.png';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen glass-page text-gray-900`}
      >
        {/* Full-width background that fills the entire browser width */}
        {/* The image is stretched horizontally to 100% width while maintaining aspect ratio */}
        {/* This eliminates grey areas while keeping the image visible */}
        <div
          className="pointer-events-none fixed inset-0 z-[-2]"
          style={{
            backgroundImage: `url('/bg.png')`,
            backgroundSize: '100% auto',
            backgroundPosition: 'center center',
            backgroundAttachment: 'fixed',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Subtle dark overlay to improve text readability */}
        <div
          className="pointer-events-none fixed inset-0 z-[-1]"
          style={{
            background: `linear-gradient(
              180deg,
              rgba(15, 23, 42, 0.25) 0%,
              rgba(15, 23, 42, 0.15) 40%,
              rgba(15, 23, 42, 0.30) 100%
            )`,
          }}
        />

        {children}
      </body>
    </html>
  );
}
