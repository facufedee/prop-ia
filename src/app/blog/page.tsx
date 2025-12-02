"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, User, ArrowRight, Loader2 } from "lucide-react";
import { blogService, BlogPost } from "@/infrastructure/services/blogService";

export default function BlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const data = await blogService.getPublishedPosts();
                setPosts(data);
            } catch (error) {
                console.error("Error fetching blog posts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-slate-900 text-white py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
                        <ArrowLeft size={20} /> Volver al inicio
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog Inmobiliario</h1>
                    <p className="text-xl text-slate-300 max-w-2xl">
                        Noticias, tendencias y consejos expertos sobre el mercado inmobiliario y la tecnología que lo impulsa.
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-xl">No hay publicaciones disponibles por el momento.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <article key={post.id} className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
                                <div className="relative h-48 overflow-hidden">
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-indigo-600">
                                        {post.category}
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {post.createdAt instanceof Date
                                                ? post.createdAt.toLocaleDateString()
                                                : post.createdAt?.toDate().toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1"><User size={14} /> {post.author}</span>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                                        {post.title}
                                    </h3>

                                    <p className="text-gray-600 text-sm mb-6 flex-1 line-clamp-3">
                                        {post.excerpt}
                                    </p>

                                    <Link
                                        href={`/blog/${post.slug}`}
                                        className="flex items-center gap-2 text-indigo-600 font-medium text-sm group-hover:gap-3 transition-all"
                                    >
                                        Leer artículo <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
