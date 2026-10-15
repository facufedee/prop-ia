"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Eye, FileText, Share2 } from "lucide-react";
import { blogService, BlogPost } from "@/infrastructure/services/blogService";
import { useRouter } from "next/navigation";

export default function BlogListPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const router = useRouter();

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        try {
            const data = await blogService.getAllPosts();
            setPosts(data);
        } catch (error) {
            console.error("Error loading posts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de que querés eliminar este post?")) {
            try {
                await blogService.deletePost(id);
                setPosts(posts.filter(post => post.id !== id));
            } catch (error) {
                console.error("Error deleting post:", error);
                alert("Error al eliminar el post");
            }
        }
    };

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="p-8 text-center text-[var(--color-muted)]">Cargando posts...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">Blog y Novedades</h1>
                    <p className="text-[var(--color-muted)]">Gestioná las noticias y artículos del blog</p>
                </div>
                <Link
                    href="/dashboard/blog/new"
                    className="inline-flex items-center gap-2 bg-[var(--color-ink)] text-[var(--color-paper)] px-4 py-2 rounded-lg hover:bg-[var(--color-ink-2)] transition-colors"
                >
                    <Plus strokeWidth={1.5} size={20} /> Nuevo Post
                </Link>
            </div>

            <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[var(--color-rule)]">
                    <div className="relative">
                        <Search strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral)]" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por título o categoría..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-[var(--color-rule)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[var(--color-paper)] text-[var(--color-ink-2)] font-medium border-b border-[var(--color-rule)]">
                            <tr>
                                <th className="px-6 py-3">Título</th>
                                <th className="px-6 py-3">Categoría</th>
                                <th className="px-6 py-3">Estado</th>
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-rule)]">
                            {filteredPosts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-[var(--color-muted)]">
                                        No se encontraron posts.
                                    </td>
                                </tr>
                            ) : (
                                filteredPosts.map((post) => (
                                    <tr key={post.id} className="hover:bg-[var(--color-paper-3)] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {post.imageUrl ? (
                                                    <img
                                                        src={post.imageUrl}
                                                        alt={post.title}
                                                        className="w-10 h-10 rounded-lg object-cover border border-[var(--color-rule)]"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-[var(--color-paper-3)] flex items-center justify-center text-[var(--color-neutral)]">
                                                        <FileText strokeWidth={1.5} size={16} />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-[var(--color-ink)] line-clamp-1">{post.title}</div>
                                                    <div className="text-xs text-[var(--color-muted)] truncate max-w-xs">{post.slug}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-paper-3)] text-[var(--color-ink)]">
                                                {post.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {post.published ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-positive-soft)] text-[var(--color-positive)]">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-positive)]"></span>
                                                        Publicado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-warning-soft)] text-[var(--color-warning)]">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)]"></span>
                                                        Borrador
                                                    </span>
                                                )}
                                                {post.expiresAt && (
                                                    <div className="text-xs text-[var(--color-warning)]">
                                                        Vence: {post.expiresAt instanceof Date ? post.expiresAt.toLocaleDateString() : (post.expiresAt as any)?.toDate?.().toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[var(--color-muted)] text-sm">
                                            {post.publishedAt
                                                ? (post.publishedAt instanceof Date ? post.publishedAt.toLocaleDateString() : (post.publishedAt as any)?.toDate?.().toLocaleDateString())
                                                : "-"
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/social/blog/${post.id}`}
                                                    className="p-2 text-[var(--color-neutral)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] rounded-lg transition-colors"
                                                    title="Generar para RRSS"
                                                    target="_blank" rel="noopener noreferrer"
                                                >
                                                    <Share2 strokeWidth={1.5} size={18} />
                                                </Link>
                                                <Link
                                                    href={`/dashboard/blog/${post.id}`}
                                                    className="p-2 text-[var(--color-neutral)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit strokeWidth={1.5} size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(post.id!)}
                                                    className="p-2 text-[var(--color-neutral)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 strokeWidth={1.5} size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
