import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from '@/ui/components/layout/ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://prop-ia.com'),
  title: {
    default: 'PROP-IA | Plataforma de Gestión Inmobiliaria con IA en Argentina',
    template: '%s | PROP-IA'
  },
  description: 'Plataforma de gestión inmobiliaria con Inteligencia Artificial. Tasaciones automáticas, CRM, publicación multiplataforma y más. Optimiza tu inmobiliaria en Argentina.',
  keywords: [
    'inmobiliaria',
    'tasación',
    'inteligencia artificial',
    'CRM inmobiliario',
    'gestión de propiedades',
    'Argentina',
    'Buenos Aires',
    'software inmobiliario',
    'valuación de propiedades',
    'automatización inmobiliaria'
  ],
  authors: [{ name: 'PROP-IA Team' }],
  creator: 'PROP-IA',
  publisher: 'PROP-IA',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: 'https://prop-ia.com',
    title: 'PROP-IA | Plataforma de Gestión Inmobiliaria con IA',
    description: 'Revoluciona tu inmobiliaria con IA. Tasaciones automáticas, CRM completo y publicación multiplataforma.',
    siteName: 'PROP-IA',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PROP-IA - Gestión Inmobiliaria Inteligente',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PROP-IA | Plataforma de Gestión Inmobiliaria con IA',
    description: 'Revoluciona tu inmobiliaria con IA. Tasaciones automáticas, CRM completo y publicación multiplataforma.',
    images: ['/og-image.png'],
    creator: '@propia',
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
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  alternates: {
    canonical: 'https://prop-ia.com',
    languages: {
      'es-AR': 'https://prop-ia.com',
    },
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4F46E5" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PROP-IA" />

        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />

        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className={inter.className}>
        <ClientLayout>
          {children}
        </ClientLayout>

        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'PROP-IA',
              url: 'https://prop-ia.com',
              logo: 'https://prop-ia.com/logo.png',
              description: 'Plataforma de gestión inmobiliaria con Inteligencia Artificial para Argentina',
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'AR',
                addressLocality: 'Buenos Aires',
              },
              sameAs: [
                'https://twitter.com/propia',
                'https://linkedin.com/company/propia',
                'https://facebook.com/propia',
              ],
            }),
          }}
        />

        {/* Structured Data - WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'PROP-IA',
              url: 'https://prop-ia.com',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://prop-ia.com/buscar?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </body>
    </html>
  );
}
