import type { Metadata } from 'next';
import ClientLayout from '@/ui/components/layout/ClientLayout';

import { Toaster } from 'sonner';
import CookieBanner from '@/ui/components/consent/CookieBanner';
// import BubbleChat from '@/ui/components/chat/BubbleChat';

import Script from 'next/script';
import WhatsappButton from '@/ui/components/ui/WhatsappButton';
import JsonLd, { ORGANIZATION_ID, SITE_ORIGIN, WEBSITE_ID } from '@/ui/seo/JsonLd';

const SITE_DESCRIPTION = 'Zeta Prop es un software para inmobiliarias: gestión de alquileres, administración de propiedades, consultas y página web propia en un solo lugar.';

// No SearchAction: the only search URL (/busqueda) is noindex.
const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': ORGANIZATION_ID,
      name: 'Zeta Prop',
      url: SITE_ORIGIN,
      logo: `${SITE_ORIGIN}/assets/img/Logo%20ZetaProp%20Fondo%20Blanco.png`,
      description: SITE_DESCRIPTION,
      email: 'zetaprop.com.ar@gmail.com',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+54 9 11 2388-9745',
        contactType: 'customer service',
        areaServed: 'AR',
        availableLanguage: 'Spanish',
      },
      address: { '@type': 'PostalAddress', addressCountry: 'AR' },
      // Only the profiles linked from the site footer.
      sameAs: ['https://www.instagram.com/zeta_prop', 'https://www.linkedin.com/company/zetaprop'],
    },
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      name: 'Zeta Prop',
      url: SITE_ORIGIN,
      inLanguage: 'es-AR',
      publisher: { '@id': ORGANIZATION_ID },
    },
  ],
};

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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zeta Prop: software para inmobiliarias',
    description: 'Zeta Prop es un software para inmobiliarias: gestión de alquileres, administración de propiedades, consultas y página web propia en un solo lugar.',
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
  manifest: '/manifest.json',

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

        {/* Site-wide entities only; pages reference them by @id. OG images come from opengraph-image.tsx. */}
        <JsonLd data={siteJsonLd} />
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
