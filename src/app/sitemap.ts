import { MetadataRoute } from 'next';
import { publicService } from '@/infrastructure/services/publicService';
import { blogService } from '@/infrastructure/services/blogService';
import { toPostDate } from '@/lib/blog/blogLayout';
import { absolutePropertyUrl } from '@/lib/seo/propertyUrl';

// Listings in these states are not worth crawling (hidden or no longer available).
const NON_INDEXABLE_PROPERTY_STATUSES = new Set(['inactive', 'sold']);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://zetaprop.com.ar';

    // 1. Static Routes — indexable pages only (no auth/funnel/search pages).
    // No lastModified: a request-time date would claim every page changed on each crawl.
    const staticRoutes: MetadataRoute.Sitemap = [
        { url: baseUrl,                          priority: 1.0, changeFrequency: 'daily'   as const },
        { url: `${baseUrl}/propiedades`,         priority: 0.9, changeFrequency: 'daily'   as const },
        { url: `${baseUrl}/alquileres`,          priority: 0.9, changeFrequency: 'monthly' as const },
        { url: `${baseUrl}/pagina-web`,          priority: 0.9, changeFrequency: 'monthly' as const },
        { url: `${baseUrl}/propiedades-gestion`, priority: 0.9, changeFrequency: 'monthly' as const },
        { url: `${baseUrl}/precios`,             priority: 0.8, changeFrequency: 'weekly'  as const },
        { url: `${baseUrl}/blog`,                priority: 0.8, changeFrequency: 'daily'   as const },
        { url: `${baseUrl}/nosotros`,            priority: 0.7, changeFrequency: 'monthly' as const },
        { url: `${baseUrl}/servicios`,           priority: 0.7, changeFrequency: 'monthly' as const },
        { url: `${baseUrl}/faqs`,                priority: 0.6, changeFrequency: 'monthly' as const },
        { url: `${baseUrl}/modelo`,              priority: 0.5, changeFrequency: 'monthly' as const },
        { url: `${baseUrl}/contacto`,            priority: 0.6, changeFrequency: 'monthly' as const },
        { url: `${baseUrl}/terminos`,            priority: 0.3, changeFrequency: 'yearly'  as const },
        { url: `${baseUrl}/privacidad`,          priority: 0.3, changeFrequency: 'yearly'  as const },
        { url: `${baseUrl}/cookies`,             priority: 0.3, changeFrequency: 'yearly'  as const },
    ];

    // 2. Dynamic Property Routes (Friendly URLs)
    // getAllProperties already applies the portal filter (publishToPortal == true).
    let propertiesSitemap: MetadataRoute.Sitemap = [];
    try {
        const properties = await publicService.getAllProperties();
        propertiesSitemap = properties
            .filter((property) => !NON_INDEXABLE_PROPERTY_STATUSES.has(property.status ?? 'active'))
            .map((property) => {
                // Same canonical URL the detail page declares and every internal link uses.
                const friendlyUrl = absolutePropertyUrl(property);
                const updatedAt = (property as { updatedAt?: unknown }).updatedAt;
                const lastModified = toPostDate(updatedAt) ?? toPostDate(property.createdAt) ?? undefined;

                return {
                    url: friendlyUrl,
                    ...(lastModified ? { lastModified } : {}),
                    changeFrequency: 'weekly' as const,
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
        blogSitemap = posts.map((post) => {
            const lastModified = toPostDate(post.updatedAt) ?? toPostDate(post.publishedAt) ?? undefined;
            return {
                url: `${baseUrl}/blog/${post.slug}`,
                ...(lastModified ? { lastModified } : {}),
                changeFrequency: 'monthly' as const,
                priority: 0.7,
            };
        });
    } catch (error) {
        console.error('Error generating sitemap for blog:', error);
    }

    return [...staticRoutes, ...propertiesSitemap, ...blogSitemap];
}
