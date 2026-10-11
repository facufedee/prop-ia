import { blogService, type BlogPost } from "@/infrastructure/services/blogService";
import { Metadata } from "next";
import { buildBlogLayout, formatPostDate, getReadingMinutes, toPostDate } from "@/lib/blog/blogLayout";
import { FeaturedPost, LatestPostItem, type BlogCardData } from "./components/BlogCards";
import { CategoryCarousel } from "./components/CategoryCarousel";
import { AllPostsGrid } from "./components/AllPostsGrid";

export const metadata: Metadata = {
    alternates: { canonical: "https://zetaprop.com.ar/blog" },
    title: "Blog | CRM Inmobiliario | Gestión de Propiedades | Alquileres | Compra y Venta | Zeta Prop",
    description: "Noticias y tutoriales de Zeta Prop. Descubre las últimas tendencias en tecnología inmobiliaria, gestión de alquileres y automatización para tu inmobiliaria.",
    keywords: "blog inmobiliario, crm inmobiliario, gestión propiedades, alquileres argentina, software inmobiliario, zeta prop, real estate crm",
};

export const revalidate = 60; // Revalidate every minute

function toCardData(post: BlogPost): BlogCardData {
    const date = toPostDate(post.publishedAt) ?? toPostDate(post.createdAt);
    return {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        imageUrl: post.imageUrl,
        category: post.category,
        authorName: post.author?.name || "Equipo Zeta Prop",
        dateLabel: date ? formatPostDate(date) : null,
        readingMinutes: getReadingMinutes(post.content),
    };
}

export default async function BlogPage() {
    const posts = (await blogService.getPublishedPosts()).map(toCardData);
    const { featured, latest, rest, carousels, categories } = buildBlogLayout(posts);

    return (
        <main className="min-h-screen bg-gray-50 pb-24">
            <div className="mx-auto max-w-7xl space-y-12 px-5 pt-28 sm:px-6 md:pt-32">
                <header className="max-w-2xl">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-indigo-600">Blog & novedades</p>
                    <h1 className="text-3xl font-bold leading-tight text-gray-900 md:text-5xl">Insights del mercado inmobiliario</h1>
                    <p className="mt-4 text-lg text-gray-600">
                        Tendencias, tutoriales de la plataforma y noticias del sector.
                    </p>
                </header>

                {!featured ? (
                    <p className="py-20 text-center text-lg text-gray-500">No hay artículos publicados aún.</p>
                ) : (
                    <>
                        <section aria-label="Artículos recientes" className="grid gap-8 lg:grid-cols-3">
                            <div className="lg:col-span-2">
                                <FeaturedPost post={featured} />
                            </div>
                            {latest.length > 0 && (
                                <div>
                                    <h2 className="mb-5 text-xl font-semibold text-gray-900">Últimos artículos</h2>
                                    <ul className="space-y-5">
                                        {latest.map((post) => (
                                            <li key={post.slug}>
                                                <LatestPostItem post={post} />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </section>

                        {carousels.map(({ category, posts: categoryPosts }) => (
                            <CategoryCarousel key={category} title={category} posts={categoryPosts} />
                        ))}

                        <AllPostsGrid rest={rest} all={posts} categories={categories} />
                    </>
                )}
            </div>
        </main>
    );
}
