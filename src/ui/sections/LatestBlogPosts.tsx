"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { BlogPost, blogService } from "@/infrastructure/services/blogService";

export default function LatestBlogPosts() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPosts() {
            try {
                // Fetch all published posts and slice top 3
                // Ideally we would have a limit parameter in API/Service
                const allPosts = await blogService.getPublishedPosts();
                setPosts(allPosts.slice(0, 3));
            } catch (error) {
                console.error("Failed to fetch latest posts", error);
            } finally {
                setLoading(false);
            }
        }

        fetchPosts();
    }, []);

    if (loading) {
        return (
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
                        <div className="grid md:grid-cols-3 gap-8 mt-12">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-gray-100 h-80 rounded-2xl"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (posts.length === 0) return null;

    return (
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <span className="inline-block px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold mb-4">
                            BLOG & NOVEDADES
                        </span>
                        <h2 className="text-4xl font-bold text-gray-900">
                            Últimas publicaciones
                        </h2>
                    </div>
                    <Link
                        href="/blog"
                        className="group flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
                    >
                        Ver todos los artículos
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {posts.map((post) => {
                        const words = post.content.split(/\s+/).length;
                        const readTime = Math.ceil(words / 200);

                        return (
                            <Link key={post.id} href={`/blog/${post.slug}`} className="group flex flex-col h-full bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300">
                                {/* Image */}
                                <div className="relative aspect-[16/10] overflow-hidden">
                                    {post.imageUrl ? (
                                        <Image
                                            src={post.imageUrl}
                                            alt={post.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                            Sin imagen
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-gray-900 rounded-full">
                                        {post.category}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex flex-col flex-1 p-6">
                                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {post.publishedAt
                                                ? (post.publishedAt instanceof Date ? post.publishedAt.toLocaleDateString() : (post.publishedAt as any)?.toDate?.().toLocaleDateString())
                                                : ""}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {readTime} min
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                        {post.title}
                                    </h3>

                                    <p className="text-gray-600 text-sm mb-4 flex-1">
                                        {post.excerpt.length > 100 ? `${post.excerpt.substring(0, 100)}... ` : post.excerpt}
                                        <span className="text-indigo-600 font-medium hover:underline inline-block ml-1">
                                            Leer mas
                                        </span>
                                    </p>

                                    <div className="flex items-center gap-2 pt-4 border-t border-gray-50 mt-auto">
                                        <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                                            {post.author?.photo ? (
                                                <img src={post.author.photo} alt={post.author.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-indigo-100" />
                                            )}
                                        </div>
                                        <span className="text-xs font-medium text-gray-700">
                                            {post.author?.name}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
