import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/dashboard/',
                '/admin/',
                '/api/',
                '/print/',
                '/_next/',
                '/private/'
            ],
        },
        sitemap: 'https://zetaprop.com.ar/sitemap.xml',
    };
}
