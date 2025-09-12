import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { UserProvider } from '@/components/providers/UserProvider';
import { AgentsProvider } from '@/components/providers/AgentsProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AGENLY - Créez vos agents IA personnalisés',
  description: 'Plateforme SaaS complète pour créer et gérer des agents IA personnalisés avec intégrations Google, OpenAI et déploiement facile.',
  keywords: 'IA, agents, chatbot, OpenAI, Google, intégrations, SaaS',
  authors: [{ name: 'AGENLY Team' }],
  creator: 'AGENLY',
  publisher: 'AGENLY',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://app.agenly.fr'),
  openGraph: {
    title: 'AGENLY - Créez vos agents IA personnalisés',
    description: 'Plateforme SaaS complète pour créer et gérer des agents IA personnalisés',
    url: 'https://app.agenly.fr',
    siteName: 'AGENLY',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AGENLY - Agents IA personnalisés',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AGENLY - Créez vos agents IA personnalisés',
    description: 'Plateforme SaaS complète pour créer et gérer des agents IA personnalisés',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.openai.com" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className={inter.className}>
        <UserProvider>
          <AgentsProvider>
            <div className="min-h-screen bg-black text-white">
              {children}
            </div>
          </AgentsProvider>
        </UserProvider>
      </body>
    </html>
  );
}
