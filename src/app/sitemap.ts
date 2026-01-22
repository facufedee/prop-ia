import { MetadataRoute } from 'next';
import { publicService } from '@/infrastructure/services/publicService';
import { blogService } from '@/infrastructure/services/blogService';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://zetaprop.com.ar';

    // 1. Static Routes
    const staticRoutes = [
        '',
        '/propiedades',
        '/contacto',
        '/login',
        '/blog',
        '/nosotros',
        '/servicios',
        '/precios',
        '/terminos',
        '/privacidad'
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // 2. Dynamic Property Routes (Friendly URLs)
    let propertiesSitemap: MetadataRoute.Sitemap = [];
    try {
        const properties = await publicService.getAllProperties();
        propertiesSitemap = properties.map((property) => {
            // Generate friendly slug: operation/slugified-title-ID
            const operation = property.operation_type.toLowerCase() === 'venta' ? 'venta' :
                property.operation_type.toLowerCase() === 'alquiler' ? 'alquiler' :
                    property.operation_type.toLowerCase().includes('temporal') ? 'temporal' : 'propiedad';

            const slugTitle = publicService.slugify(property.title);
            const friendlyUrl = `${baseUrl}/${operation}/${slugTitle}-${property.id}`;

            return {
                url: friendlyUrl,
                lastModified: new Date(), // Ideal: property.updatedAt if available
                changeFrequency: 'weekly',
                priority: 0.9,
            };
        });
    } catch (error) {
        console.error('Error generating sitemap for properties:', error);
    }

    // 3. Dynamic Blog Routes
    let blogSitemap: MetadataRoute.Sitemap = [];
    try {
        // Use getPublishedPosts to only index efficient content
        const posts = await blogService.getPublishedPosts();
        blogSitemap = posts.map((post) => ({
            url: `${baseUrl}/blog/${post.slug}`,
            lastModified: post.updatedAt ? (post.updatedAt instanceof Date ? post.updatedAt : (post.updatedAt as any).toDate()) : new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        }));
    } catch (error) {
        console.error('Error generating sitemap for blog:', error);
    }

    return [...staticRoutes, ...propertiesSitemap, ...blogSitemap];
}
