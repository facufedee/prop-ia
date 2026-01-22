"use client";

import { useEffect, useState, use } from "react";
import { BlogPost, blogService } from "@/infrastructure/services/blogService";
import BlogForm from "../components/BlogForm";
import Link from "next/link";
import { ArrowLeft, Share2 } from "lucide-react";

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params in Next.js 15+ (if applicable, ensuring safety)
    const { id } = use(params);

    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const data = await blogService.getPostById(id);
                setPost(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <p className="text-gray-500">No se encontró el artículo.</p>
                <Link href="/dashboard/blog" className="text-indigo-600 hover:underline">
                    Volver al listado
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/blog"
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Editar Artículo</h1>
                        <p className="text-gray-500">Modificando: {post.title}</p>
                    </div>
                </div>
                <Link
                    href={`/social/blog/${post.id}`}
                    className="flex items-center gap-2 bg-pink-50 text-pink-700 hover:bg-pink-100 px-4 py-2 rounded-lg font-medium transition-colors border border-pink-200"
                    target="_blank"
                >
                    <Share2 size={18} />
                    <span>Generar RRSS</span>
                </Link>
            </div>

            <BlogForm initialData={post} isEditing />
        </div>
    );
}
