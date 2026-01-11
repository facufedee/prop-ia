import { blogService } from "@/infrastructure/services/blogService";
import Link from "next/link";
import { Calendar, User, ArrowRight, Layout } from "lucide-react";
import Image from "next/image";

export const revalidate = 60;

export default async function NovedadesPage() {
    const posts = await blogService.getPublishedPosts();

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                    <Layout size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Novedades Zeta</h1>
                    <p className="text-gray-500">Noticias y actualizaciones exclusivas para nuestros clientes</p>
                </div>
            </div>

            {posts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-lg">No hay novedades publicadas aún.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post) => (
                        <article
                            key={post.id}
                            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-col group h-full"
                        >
                            <Link href={`/blog/${post.slug}`} target="_blank" className="block overflow-hidden aspect-video relative">
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

                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium text-[10px] uppercase tracking-wide">
                                        {post.category}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        {post.publishedAt
                                            ? (post.publishedAt instanceof Date ? post.publishedAt.toLocaleDateString() : (post.publishedAt as any)?.toDate?.().toLocaleDateString())
                                            : "Reciente"}
                                    </div>
                                </div>

                                <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                    <Link href={`/blog/${post.slug}`} target="_blank">
                                        {post.title}
                                    </Link>
                                </h2>

                                <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                                    {post.excerpt}
                                </p>

                                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                            {post.author?.photo ? (
                                                <img src={post.author.photo} alt={post.author.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={12} className="text-gray-400" />
                                            )}
                                        </div>
                                        <span className="text-xs font-medium text-gray-600">
                                            {post.author?.name || "Equipo Zeta Prop"}
                                        </span>
                                    </div>

                                    <Link
                                        href={`/blog/${post.slug}`}
                                        target="_blank"
                                        className="text-indigo-600 font-bold text-xs flex items-center gap-1 group/link hover:underline"
                                    >
                                        Leer más
                                        <ArrowRight size={12} className="group-hover/link:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
