import { blogService } from "@/infrastructure/services/blogService";
import { Metadata } from "next";
import { buildBlogLayout } from "@/lib/blog/blogLayout";
import { FeaturedPost, LatestPostItem } from "./components/BlogCards";
import { toCardData } from "./toCardData";
import { CategoryCarousel } from "./components/CategoryCarousel";
import { AllPostsGrid } from "./components/AllPostsGrid";
import JsonLd, { breadcrumbList, ORGANIZATION_ID, SITE_ORIGIN, WEBSITE_ID } from "@/ui/seo/JsonLd";

export const metadata: Metadata = {
    alternates: { canonical: "https://zetaprop.com.ar/blog" },
    title: "Blog de gestión inmobiliaria",
    description: "Blog de Zeta Prop sobre gestión inmobiliaria: guías y novedades sobre alquileres, administración de propiedades y tecnología para inmobiliarias.",
    keywords: "blog inmobiliario, crm inmobiliario, gestión propiedades, alquileres argentina, software inmobiliario, zeta prop, real estate crm",
};

export const revalidate = 60; // Revalidate every minute

const blogJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Blog",
            name: "Blog de Zeta Prop",
            url: `${SITE_ORIGIN}/blog`,
            inLanguage: "es-AR",
            publisher: { "@id": ORGANIZATION_ID },
            isPartOf: { "@id": WEBSITE_ID },
        },
        breadcrumbList([{ name: "Blog", path: "/blog" }]),
    ],
};

export default async function BlogPage() {
    const posts = (await blogService.getPublishedPosts()).map(toCardData);
    const { featured, latest, rest, carousels, categories } = buildBlogLayout(posts);

    return (
        <main className="flex-1">
            <JsonLd data={blogJsonLd} />
            <section className="l-section s-page-head" aria-labelledby="blog-title">
                <div className="l-container">
                    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10">
                        <div className="s-page-head__inner">
                            <p className="l-eyebrow">Blog & novedades</p>
                            <h1 id="blog-title" className="s-page-title s-page-title--flush">Insights del mercado inmobiliario</h1>
                        </div>
                        <p className="s-page-lede s-blog-head__lede">
                            Tendencias, tutoriales de la plataforma y noticias del sector.
                        </p>
                    </header>
                </div>
            </section>

            <div className="l-section s-flush-top">
                <div className="l-container space-y-14">
                    {!featured ? (
                        <p className="py-20 text-center text-lg text-[var(--color-ink-2)]">No hay artículos publicados aún.</p>
                    ) : (
                        <>
                            <section aria-label="Artículos recientes" className="grid gap-8 lg:grid-cols-3">
                                <div className="lg:col-span-2">
                                    <FeaturedPost post={featured} />
                                </div>
                                {latest.length > 0 && (
                                    <div>
                                        <h2 className="s-blog-h2 mb-5">Últimos artículos</h2>
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
            </div>
        </main>
    );
}
