import { MetadataRoute } from 'next';
import { publicService } from '@/infrastructure/services/publicService';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://zetaprop.com.ar';

    // Static routes
    const routes = [
        '',
        '/propiedades',
        '/contacto',
        '/login',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Dynamic Property routes
    let propertiesSitemap: MetadataRoute.Sitemap = [];
    try {
        const properties = await publicService.getAllProperties();
        propertiesSitemap = properties.map((property) => ({
            url: `${baseUrl}/propiedades/p/${property.id}`,
            lastModified: new Date(), // Ideally this requires an 'updatedAt' field from the DB
            changeFrequency: 'weekly',
            priority: 0.9,
        }));
    } catch (error) {
        console.error('Error generating sitemap for properties:', error);
    }

    return [...routes, ...propertiesSitemap];
}
