import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import "../globals.css";
import ClientLayout from '@/ui/components/layout/ClientLayout';

import { Toaster } from 'sonner';
import CookieBanner from '@/ui/components/consent/CookieBanner';
// import BubbleChat from '@/ui/components/chat/BubbleChat';

import FloatingChatWidget from '@/ui/components/FloatingChatWidget';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://zetaprop.com.ar'),
  title: {
    default: 'Zeta Prop | Tu CRM Inmobiliario Integral',
    template: '%s | Zeta Prop Argentina'
  },
  description: 'Control total de tu inmobiliaria: Administración de propiedades, clientes, alquileres y emprendimientos. El sistema más completo de Argentina para potenciar tu negocio.',
  keywords: [
    'CRM inmobiliario',
    'gestión de propiedades',
    'administración de alquileres',
    'clientes inmobiliaria',
    'emprendimientos inmobiliarios',
    'software inmobiliario argentina',
    'gestión inmobiliaria',
    'agenda inteligente',
    'multisucursal'
  ],
  authors: [{ name: 'Zeta Prop Team', url: 'https://zetaprop.com.ar' }],
  creator: 'Zeta Prop',
  publisher: 'Zeta Prop',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: 'https://zetaprop.com.ar',
    title: 'Zeta Prop | Tu Red Inmobiliaria de Confianza en Argentina',
    description: 'Encontrá tu próximo hogar o inversión con Zeta Prop. Miles de propiedades en venta y alquiler en Buenos Aires y todo el país. Tasaciones profesionales y gestión integral.',
    siteName: 'Zeta Prop',
    images: [
      {
        url: '/assets/img/Logo ZetaProp Fondo Blanco 2.png',
        width: 1200,
        height: 630,
        alt: 'Zeta Prop - Fondo Blanco',
      },
      {
        url: '/assets/img/Logo%20ZetaProp%20Fondo%20Negro.png',
        width: 1200,
        height: 630,
        alt: 'Zeta Prop - Fondo Negro',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zeta Prop | El CRM de las Inmobiliarias Modernas',
    description: 'Gestioná propiedades, alquileres y clientes de forma eficiente.',
    images: ['/assets/img/Logo%20ZetaProp%20Fondo%20Blanco.png'],
    creator: '@zetaprop',
    site: '@zetaprop',
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
    canonical: 'https://zetaprop.com.ar',
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
          <CookieBanner />
          <FloatingChatWidget />
        </ClientLayout>

        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Zeta Prop',
              url: 'https://zetaprop.com.ar',
              logo: 'https://zetaprop.com.ar/assets/img/Logo%20ZetaProp%20Fondo%20Blanco.png',
              description: 'CRM Inmobiliario moderno adaptado a Argentina con IA y Automatización',
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'AR',
                addressLocality: 'Buenos Aires',
              },
              sameAs: [
                'https://twitter.com/zetaprop',
                'https://linkedin.com/company/zetaprop',
                'https://facebook.com/zetaprop',
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
              name: 'Zeta Prop',
              url: 'https://zetaprop.com.ar',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://zetaprop.com.ar/buscar?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </body>
    </html>
  );
}
