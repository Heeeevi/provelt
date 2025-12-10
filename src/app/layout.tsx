import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

// Logo URL for Open Graph
const LOGO_URL = 'https://res.cloudinary.com/dtgqtofh6/image/upload/v1765375868/Refine_to_hd_202512102109_ef1imb.jpg';

export const metadata: Metadata = {
  title: 'PROVELT - Prove Your Skills, Earn Your Badges',
  description: 'A Web3 social skill-challenge platform where you complete daily challenges, mint NFT badges, and build your on-chain reputation.',
  keywords: ['Web3', 'NFT', 'Solana', 'Skills', 'Challenges', 'Social'],
  authors: [{ name: 'PROVELT Team' }],
  icons: {
    icon: LOGO_URL,
    apple: LOGO_URL,
  },
  openGraph: {
    title: 'PROVELT - Prove Your Skills, Earn Your Badges',
    description: 'Complete daily skill challenges and mint NFT badges on Solana',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: LOGO_URL,
        width: 512,
        height: 512,
        alt: 'PROVELT Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PROVELT',
    description: 'Prove Your Skills, Earn Your Badges',
    images: [LOGO_URL],
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#18181b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" style={{ backgroundColor: '#09090b' }}>
      <body 
        className={`${inter.variable} font-sans min-h-screen bg-surface-950 text-surface-50 antialiased`}
        style={{ backgroundColor: '#09090b', color: '#fafafa', minHeight: '100vh' }}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
