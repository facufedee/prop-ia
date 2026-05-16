import { blogService } from "@/infrastructure/services/blogService";
import Link from "next/link";
import { Calendar, User, ArrowRight } from "lucide-react";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
    title: "Blog | CRM Inmobiliario | Gestión de Propiedades | Alquileres | Compra y Venta | Zeta Prop",
    description: "Noticias y tutoriales de Zeta Prop. Descubre las últimas tendencias en tecnología inmobiliaria, gestión de alquileres y automatización para tu inmobiliaria.",
    keywords: "blog inmobiliario, crm inmobiliario, gestión propiedades, alquileres argentina, software inmobiliario, zeta prop, real estate crm",
};

export const revalidate = 60; // Revalidate every minute

export default async function BlogPage() {
    // Determine if we need to filter on client or server. 
    // blogService returns all published posts. Client logic filtered by date in service.
    // Since this is a server component, we can use the service directly.
    const posts = await blogService.getPublishedPosts();

    return (
        <main className="bg-gray-50 min-h-screen pb-24">
            {/* ── Hero ── */}
            <section className="relative overflow-hidden pt-32 pb-24 px-5 sm:px-6 bg-[#080810]">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-[#080810] to-purple-950/60 pointer-events-none" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-block px-4 py-1.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full text-sm font-semibold mb-6">
                        BLOG & NOVEDADES
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-white">
                        Insights del
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                            Mercado Inmobiliario
                        </span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
                        Descubre las últimas tendencias, tutoriales de la plataforma y noticias del sector.
                    </p>
                </div>
            </section>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 mt-12">
                {posts.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-lg">No hay artículos publicados aún.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <article
                                key={post.id}
                                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group"
                            >
                                <Link href={`/blog/${post.slug}`} className="block overflow-hidden aspect-[16/10] relative">
                                    {post.imageUrl ? (
                                        <Image
                                            src={post.imageUrl}
                                            alt={post.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                            <span className="text-gray-400 font-medium">Sin imagen</span>
                                        </div>
                                    )}
                                </Link>

                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                                        <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
                                            {post.category}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {post.publishedAt
                                                ? (post.publishedAt instanceof Date ? post.publishedAt.toLocaleDateString() : (post.publishedAt as any)?.toDate?.().toLocaleDateString())
                                                : "Reciente"}
                                        </div>
                                    </div>

                                    <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                        <Link href={`/blog/${post.slug}`}>
                                            {post.title}
                                        </Link>
                                    </h2>

                                    <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-3">
                                        {post.excerpt}
                                    </p>

                                    <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-50">
                                        <div className="flex items-center gap-2">
                                            {post.author?.photo ? (
                                                <Image
                                                    src={post.author.photo}
                                                    alt={post.author.name}
                                                    width={32}
                                                    height={32}
                                                    className="rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <User size={14} className="text-gray-500" />
                                                </div>
                                            )}
                                            <span className="text-sm font-medium text-gray-700">
                                                {post.author?.name || "Equipo Zeta Prop"}
                                            </span>
                                        </div>

                                        <Link
                                            href={`/blog/${post.slug}`}
                                            className="text-indigo-600 font-medium text-sm flex items-center gap-1 group/link"
                                        >
                                            Leer más
                                            <ArrowRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
