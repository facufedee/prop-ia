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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]"></div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <p className="text-[var(--color-muted)]">No se encontró el artículo.</p>
                <Link href="/dashboard/blog" className="text-[var(--color-accent)] hover:underline">
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
                        className="p-2 hover:bg-[var(--color-paper-3)] rounded-lg text-[var(--color-ink-2)] transition-colors"
                    >
                        <ArrowLeft strokeWidth={1.5} size={20} />
                    </Link>
                    <div>
                        <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">Editar Artículo</h1>
                        <p className="text-[var(--color-muted)]">Modificando: {post.title}</p>
                    </div>
                </div>
                <Link
                    href={`/social/blog/${post.id}`}
                    className="flex items-center gap-2 bg-[var(--color-danger-soft)] text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] px-4 py-2 rounded-lg font-medium transition-colors border border-[var(--color-danger)]/30"
                    target="_blank" rel="noopener noreferrer"
                >
                    <Share2 strokeWidth={1.5} size={18} />
                    <span>Generar RRSS</span>
                </Link>
            </div>

            <BlogForm initialData={post} isEditing />
        </div>
    );
}
