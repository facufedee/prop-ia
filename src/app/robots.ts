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
                '/private/',
                // Agency sites are public on their own (sub)domains; on the main domain this
                // path is only the internal rewrite target and would duplicate their content.
                '/sites/',
                '/social/',
            ],
        },
        sitemap: 'https://zetaprop.com.ar/sitemap.xml',
    };
}
