import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import ClientLayout from '@/ui/components/layout/ClientLayout';

import { Toaster } from 'sonner';
import CookieBanner from '@/ui/components/consent/CookieBanner';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://prop-ia.com'),
  title: {
    default: 'PROP-IA | Plataforma de Gestión Inmobiliaria en Argentina',
    template: '%s | PROP-IA Argentina'
  },
  description: 'Revoluciona tu inmobiliaria en Argentina con PROP-IA. Tasaciones automáticas con IA y CRM inteligente diseñado para el mercado argentino. Gestión de alquileres, ventas y clientes en un solo lugar.',
  keywords: [
    'inmobiliaria',
    'tasación inmobiliaria',
    'inteligencia artificial',
    'CRM inmobiliario',
    'gestión de propiedades',
    'Argentina',
    'Buenos Aires',
    'software inmobiliario',
    'valuación de propiedades',
    'automatización inmobiliaria',
    'real estate crm',
    'proptech argentina'
  ],
  authors: [{ name: 'PROP-IA Team', url: 'https://prop-ia.com' }],
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
    title: 'PROP-IA | Gestión Inmobiliaria Inteligente',
    description: 'Potencia tu inmobiliaria con Inteligencia Artificial. Tasaciones precisas en segundos, gestión de clientes y propiedades centralizada.',
    siteName: 'PROP-IA',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PROP-IA Dashboard y Herramientas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PROP-IA | Gestión Inmobiliaria con IA',
    description: 'Revoluciona tu inmobiliaria con IA. Tasaciones automáticas, CRM completo y más.',
    images: ['/og-image.png'],
    creator: '@propia',
    site: '@propia',
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
  alternates: {
    canonical: 'https://prop-ia.com',
  },
  category: 'business',

  verification: {
    google: 'verification_token', // Placeholder
  },
};

export const viewport = {
  themeColor: '#4F46E5',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />

        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
      >
        <Toaster position="top-right" richColors />
        <ClientLayout>
          {children}
        </ClientLayout>
        <CookieBanner />

        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'PROP-IA',
              url: 'https://prop-ia.com',
              logo: 'https://prop-ia.com/assets/img/favincon.png',
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
