import { MetadataRoute } from 'next';
import { publicService } from '@/infrastructure/services/publicService';
import { blogService } from '@/infrastructure/services/blogService';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://zetaprop.com.ar';

    // 1. Static Routes
    const staticRoutes: MetadataRoute.Sitemap = [
        { url: baseUrl,                         priority: 1.0, changeFrequency: 'daily'   as const },
        { url: `${baseUrl}/propiedades`,        priority: 0.9, changeFrequency: 'daily'   as const },
        { url: `${baseUrl}/busqueda`,           priority: 0.9, changeFrequency: 'daily'   as const },
        { url: `${baseUrl}/precios`,            priority: 0.8, changeFrequency: 'weekly'  as const },
        { url: `${baseUrl}/blog`,               priority: 0.8, changeFrequency: 'daily'   as const },
        { url: `${baseUrl}/nosotros`,           priority: 0.7, changeFrequency: 'monthly' as const },
        { url: `${baseUrl}/servicios`,          priority: 0.7, changeFrequency: 'monthly' as const },
        { url: `${baseUrl}/contacto`,           priority: 0.6, changeFrequency: 'monthly' as const },
        { url: `${baseUrl}/terminos`,           priority: 0.3, changeFrequency: 'yearly'  as const },
        { url: `${baseUrl}/privacidad`,         priority: 0.3, changeFrequency: 'yearly'  as const },
    ].map((route) => ({ ...route, lastModified: new Date() }));

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
