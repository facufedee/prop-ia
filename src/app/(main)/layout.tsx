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
    default: 'Zeta Prop: software para inmobiliarias',
    // Page titles must not repeat the brand; this template appends it once.
    template: '%s | Zeta Prop'
  },
  description: 'Zeta Prop es un software para inmobiliarias: gestión de alquileres, administración de propiedades, consultas y página web propia en un solo lugar.',
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
    // No `url` here: pages without their own openGraph would otherwise inherit og:url = home.
    title: 'Zeta Prop: software para inmobiliarias',
    description: 'Zeta Prop es un software para inmobiliarias: gestión de alquileres, administración de propiedades, consultas y página web propia en un solo lugar.',
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
    title: 'Zeta Prop: software para inmobiliarias',
    description: 'Zeta Prop es un software para inmobiliarias: gestión de alquileres, administración de propiedades, consultas y página web propia en un solo lugar.',
    images: ['/assets/img/Logo%20ZetaProp%20Fondo%20Blanco%202.png'],
    creator: '@zetaprop',
    site: '@zetaprop',
  },
  // Indexing is the default; stating index/follow here would leak into 404 pages,
  // which inherit layout metadata next to Next's own noindex.
  robots: {
    googleBot: {
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // No `alternates.canonical` here: it would be inherited by every page without its own,
  // canonicalizing them all to the home. Each indexable page declares a self-canonical.
  category: 'business',

  // verification: {
  //   google: 'PEGAR_AQUI_EL_TOKEN_DE_GOOGLE_SEARCH_CONSOLE',
  // },
};

export const viewport = {
  // Approximates --color-paper (oklch(17% 0.006 70)) from landing-theme.css.
  themeColor: '#110f0d',
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
          src="https://www.googletagmanager.com/gtag/js?id=G-W7RMLDXWYQ"
          strategy="lazyOnload"
        />
        <Script id="google-analytics-tag" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-W7RMLDXWYQ');
            gtag('config', 'AW-17943485669', {
              cookie_domain: 'zetaprop.com.ar',
              cookie_flags: 'SameSite=None;Secure'
            });
          `}
        </Script>
    </>
  );
}
