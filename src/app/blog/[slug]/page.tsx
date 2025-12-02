"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Loader2 } from "lucide-react";
import { blogService, BlogPost } from "@/infrastructure/services/blogService";
import { useRouter } from "next/navigation";

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const data = await blogService.getPostBySlug(slug);
                if (data) {
                    setPost(data);
                } else {
                    // Handle 404
                    console.error("Post not found");
                }
            } catch (error) {
                console.error("Error fetching blog post:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Artículo no encontrado</h1>
                <p className="text-gray-600 mb-8">El artículo que estás buscando no existe o ha sido eliminado.</p>
                <Link
                    href="/blog"
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <ArrowLeft size={20} /> Volver al Blog
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header / Hero */}
            <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden">
                <div className="absolute inset-0 bg-black/50 z-10" />
                <img
                    src={post.image}
                    alt={post.title}
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 z-20 flex flex-col justify-end pb-20 px-6">
                    <div className="max-w-4xl mx-auto w-full">
                        <Link
                            href="/blog"
                            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
                        >
                            <ArrowLeft size={20} /> Volver al Blog
                        </Link>

                        <div className="flex items-center gap-4 text-white/90 mb-4 text-sm font-medium">
                            <span className="bg-indigo-600 px-3 py-1 rounded-full">
                                {post.category}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar size={16} />
                                {post.createdAt instanceof Date
                                    ? post.createdAt.toLocaleDateString()
                                    : post.createdAt?.toDate().toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                                <User size={16} /> {post.author}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                            {post.title}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="prose prose-lg max-w-none text-gray-700">
                    {/* Render content with line breaks */}
                    {post.content.split('\n').map((paragraph, index) => (
                        paragraph.trim() === "" ? <br key={index} /> : <p key={index}>{paragraph}</p>
                    ))}
                </div>
            </div>
        </div>
    );
}
