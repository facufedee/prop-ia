import { blogService } from "@/infrastructure/services/blogService";
import Link from "next/link";
import { Calendar, User, ArrowRight } from "lucide-react";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
    title: "Blog | Tasador Online, CRM y Software Inmobiliario | Prop-IA",
    description: "Descubre cómo usar el tasador online, bot con IA, CRM para agentes inmobiliarios y gestión multisucursal. Guías, tutoriales y casos de éxito.",
    keywords: "tasador online, bot con ia, crm agentes inmobiliarios, software inmobiliario multisucursal, blog inmobiliario",
};

export const revalidate = 60; // Revalidate every minute

export default async function BlogPage() {
    // Determine if we need to filter on client or server. 
    // blogService returns all published posts. Client logic filtered by date in service.
    // Since this is a server component, we can use the service directly.
    const posts = await blogService.getPublishedPosts();

    return (
        <main className="bg-gray-50 min-h-screen pb-24">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold mb-4">
                        BLOG & NOVEDADES
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                        Insights del Mercado Inmobiliario
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Descubre las últimas tendencias, tutoriales de la plataforma y noticias del sector.
                    </p>
                </div>
            </div>

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
                                                <img src={post.author.photo} alt={post.author.name} className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <User size={14} className="text-gray-500" />
                                                </div>
                                            )}
                                            <span className="text-sm font-medium text-gray-700">
                                                {post.author?.name || "Equipo Prop-IA"}
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
