
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Propiedades en Venta y Alquiler en Argentina | Zeta Prop',
    description: 'Encontrá casas, departamentos, PH, terrenos y locales en venta y alquiler en Buenos Aires y todo Argentina. Buscá entre miles de propiedades con Zeta Prop.',
    keywords: [
        'propiedades en venta argentina',
        'propiedades en alquiler argentina',
        'casas en venta buenos aires',
        'departamentos en alquiler',
        'inmuebles argentina',
        'alquiler temporario',
        'terrenos en venta',
        'locales comerciales',
        'PH en venta',
        'quintas vacaciones',
        'inmobiliaria argentina',
        'portal inmobiliario',
        'propiedades GBA',
        'alquiler zona oeste',
    ],
    alternates: {
        canonical: 'https://zetaprop.com.ar/propiedades',
    },
    openGraph: {
        type: 'website',
        locale: 'es_AR',
        url: 'https://zetaprop.com.ar/propiedades',
        title: 'Propiedades en Venta y Alquiler en Argentina | Zeta Prop',
        description: 'Encontrá casas, departamentos, PH, terrenos y locales en venta y alquiler en Buenos Aires y toda Argentina. Miles de propiedades con Zeta Prop.',
        siteName: 'Zeta Prop',
        images: [
            {
                url: '/hero-propiedades.png',
                width: 1200,
                height: 630,
                alt: 'Propiedades en venta y alquiler en Argentina - Zeta Prop',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Propiedades en Venta y Alquiler en Argentina | Zeta Prop',
        description: 'Encontrá tu próximo hogar en Zeta Prop. Casas, departamentos y más en toda Argentina.',
        images: ['/hero-propiedades.png'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'WebSite',
            '@id': 'https://zetaprop.com.ar/#website',
            url: 'https://zetaprop.com.ar',
            name: 'Zeta Prop',
            description: 'Portal inmobiliario de Argentina',
            inLanguage: 'es-AR',
            potentialAction: {
                '@type': 'SearchAction',
                target: {
                    '@type': 'EntryPoint',
                    urlTemplate: 'https://zetaprop.com.ar/busqueda?loc={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
            },
        },
        {
            '@type': 'RealEstateAgent',
            '@id': 'https://zetaprop.com.ar/#organization',
            name: 'Zeta Prop',
            url: 'https://zetaprop.com.ar',
            logo: {
                '@type': 'ImageObject',
                url: 'https://zetaprop.com.ar/assets/img/Logo%20ZetaProp%20Fondo%20Blanco.png',
            },
            description: 'Portal inmobiliario líder en Argentina. Miles de propiedades en venta y alquiler.',
            areaServed: {
                '@type': 'Country',
                name: 'Argentina',
            },
            address: {
                '@type': 'PostalAddress',
                addressCountry: 'AR',
            },
            sameAs: [],
        },
        {
            '@type': 'WebPage',
            '@id': 'https://zetaprop.com.ar/propiedades#webpage',
            url: 'https://zetaprop.com.ar/propiedades',
            name: 'Propiedades en Venta y Alquiler en Argentina',
            isPartOf: { '@id': 'https://zetaprop.com.ar/#website' },
            about: { '@id': 'https://zetaprop.com.ar/#organization' },
            description: 'Buscá propiedades en venta y alquiler en Argentina. Casas, departamentos, PH, terrenos y más.',
            inLanguage: 'es-AR',
            breadcrumb: {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    {
                        '@type': 'ListItem',
                        position: 1,
                        name: 'Inicio',
                        item: 'https://zetaprop.com.ar',
                    },
                    {
                        '@type': 'ListItem',
                        position: 2,
                        name: 'Propiedades',
                        item: 'https://zetaprop.com.ar/propiedades',
                    },
                ],
            },
        },
    ],
};

export default function PropertiesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {children}
        </>
    );
}
