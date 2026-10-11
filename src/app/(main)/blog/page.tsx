import { blogService } from "@/infrastructure/services/blogService";
import { Metadata } from "next";
import { buildBlogLayout } from "@/lib/blog/blogLayout";
import { FeaturedPost, LatestPostItem } from "./components/BlogCards";
import { toCardData } from "./toCardData";
import { CategoryCarousel } from "./components/CategoryCarousel";
import { AllPostsGrid } from "./components/AllPostsGrid";

export const metadata: Metadata = {
    alternates: { canonical: "https://zetaprop.com.ar/blog" },
    title: "Blog | CRM Inmobiliario | Gestión de Propiedades | Alquileres | Compra y Venta | Zeta Prop",
    description: "Noticias y tutoriales de Zeta Prop. Descubre las últimas tendencias en tecnología inmobiliaria, gestión de alquileres y automatización para tu inmobiliaria.",
    keywords: "blog inmobiliario, crm inmobiliario, gestión propiedades, alquileres argentina, software inmobiliario, zeta prop, real estate crm",
};

export const revalidate = 60; // Revalidate every minute

export default async function BlogPage() {
    const posts = (await blogService.getPublishedPosts()).map(toCardData);
    const { featured, latest, rest, carousels, categories } = buildBlogLayout(posts);

    return (
        <main className="min-h-screen bg-gray-50 pb-24">
            <div className="mx-auto max-w-7xl space-y-10 px-5 pt-24 sm:px-6 md:pt-28">
                <header className="flex flex-col gap-3 border-b border-gray-200 pb-6 md:flex-row md:items-end md:justify-between md:gap-10">
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">Blog & novedades</p>
                        <h1 className="text-3xl font-bold leading-tight text-gray-900 md:text-4xl">Insights del mercado inmobiliario</h1>
                    </div>
                    <p className="max-w-sm text-base text-gray-600 md:text-right">
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
