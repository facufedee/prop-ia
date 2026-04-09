import type { Metadata } from 'next';
import ClientLayout from '@/ui/components/layout/ClientLayout';

import { Toaster } from 'sonner';
import CookieBanner from '@/ui/components/consent/CookieBanner';
// import BubbleChat from '@/ui/components/chat/BubbleChat';

import Script from 'next/script';
import WhatsappButton from '@/ui/components/ui/WhatsappButton';

export const metadata: Metadata = {
  metadataBase: new URL('https://zetaprop.com.ar'),
  title: {
    default: 'Zeta Prop | Tu CRM Inmobiliario Integral',
    template: '%s | Zeta Prop Argentina'
  },
  description: 'Zeta Prop: el CRM inmobiliario más completo de Argentina. Administra propiedades, alquileres y clientes desde un ecosistema diseñado para tu éxito.',
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
        url: '/assets/img/Logo%20ZetaProp%20Fondo%20Blanco%202.png',
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
    images: ['/assets/img/Logo%20ZetaProp%20Fondo%20Blanco%202.png'],
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

  // verification: {
  //   google: 'PEGAR_AQUI_EL_TOKEN_DE_GOOGLE_SEARCH_CONSOLE',
  // },
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
    <>
        <Toaster position="top-right" richColors />
        <ClientLayout>
          {children}
          <CookieBanner />
          {/* <FloatingChatWidget /> */}
          <WhatsappButton />
        </ClientLayout>

        {/* Structured Data - Organization & SoftwareApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'Zeta Prop',
                url: 'https://zetaprop.com.ar',
                logo: 'https://zetaprop.com.ar/assets/img/Logo%20ZetaProp%20Fondo%20Blanco.png',
                description: 'CRM Inmobiliario moderno adaptado a Argentina con IA y Automatización',
                contactPoint: {
                  '@type': 'ContactPoint',
                  telephone: '+54 9 11 2388-9745',
                  contactType: 'customer service',
                  areaServed: 'AR',
                  availableLanguage: 'Spanish'
                },
                address: {
                  '@type': 'PostalAddress',
                  addressCountry: 'AR',
                  addressLocality: 'Buenos Aires',
                },
                sameAs: [
                  'https://twitter.com/zetaprop',
                  'https://linkedin.com/company/zetaprop',
                  'https://facebook.com/zetaprop',
                  'https://instagram.com/zetaprop'
                ],
              },
              {
                '@context': 'https://schema.org',
                '@type': 'SoftwareApplication',
                name: 'Zeta Prop',
                url: 'https://zetaprop.com.ar',
                operatingSystem: 'Web',
                applicationCategory: 'BusinessApplication',
                offers: {
                  '@type': 'Offer',
                  price: '0',
                  priceCurrency: 'ARS',
                  description: '14 días de prueba gratis, sin tarjeta de crédito.'
                }
              },
              {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'Zeta Prop',
                url: 'https://zetaprop.com.ar',
                potentialAction: {
                  '@type': 'SearchAction',
                  target: {
                    '@type': 'EntryPoint',
                    urlTemplate: 'https://zetaprop.com.ar/busqueda?loc={search_term_string}',
                  },
                  'query-input': 'required name=search_term_string',
                },
              }
            ]),
          }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17943485669"
          strategy="lazyOnload"
        />
        <Script id="google-ads-tag" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'AW-17943485669', {
              cookie_domain: 'zetaprop.com.ar',
              cookie_flags: 'SameSite=None;Secure'
            });
          `}
        </Script>
    </>
  );
}
