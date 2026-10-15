"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BlogPost, blogService } from "@/infrastructure/services/blogService";
import { auth, db } from "@/infrastructure/firebase/client";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { Save, Image as ImageIcon, X, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { announceMessage, requestAnnounce } from "@/lib/social/requestAnnounce";

interface BlogFormProps {
    initialData?: BlogPost;
    isEditing?: boolean;
}

export default function BlogForm({ initialData, isEditing = false }: BlogFormProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<BlogPost>>({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        imageUrl: "",
        category: "Novedades",
        tags: [],
        author: { name: "", photo: "" },
        published: true,
        publishedAt: new Date(),
        expiresAt: undefined,
        ...initialData
    });

    // Handle date objects if they come as timestamps from Firestore in initialData
    useEffect(() => {
        if (initialData) {
            const data = { ...initialData };

            // Convert timestamps to dates for inputs
            if (data.publishedAt instanceof Timestamp) data.publishedAt = data.publishedAt.toDate();
            if (data.expiresAt instanceof Timestamp) data.expiresAt = data.expiresAt.toDate();

            setFormData(data);
        } else {
            // If creating new, try to pre-fill author
            // If creating new, try to pre-fill author
            const currentUser = auth?.currentUser;
            if (currentUser) {
                const fetchUser = async () => {
                    try {
                        // Try to get from Firestore profile first
                        if (currentUser.uid) {
                            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                            if (userDoc.exists()) {
                                const userData = userDoc.data();
                                setFormData(prev => ({
                                    ...prev,
                                    author: {
                                        name: userData.displayName || userData.name || currentUser.displayName || "Admin",
                                        photo: userData.photoURL || currentUser.photoURL || "",
                                        uid: currentUser.uid
                                    }
                                }));
                                return;
                            }
                        }

                        // Fallback to Auth profile
                        setFormData(prev => ({
                            ...prev,
                            author: {
                                name: currentUser.displayName || "Admin",
                                photo: currentUser.photoURL || "",
                                uid: currentUser.uid
                            }
                        }));
                    } catch (e) {
                        console.error("Error fetching user profile", e);
                    }
                };
                fetchUser();
            }
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Auto-generate slug from title
        if (name === "title" && !isEditing) {
            const slug = value
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, "")
                .replace(/[\s_-]+/g, "-")
                .replace(/^-+|-+$/g, "");
            setFormData(prev => ({ ...prev, title: value, slug }));
        }
    };

    const handleAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            author: { ...prev.author!, [name]: value }
        }));
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value ? new Date(value) : undefined
        }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validate size (e.g., 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error("La imagen no puede pesar más de 2MB.");
                return;
            }

            setUploading(true);
            try {
                const url = await blogService.uploadImage(file);
                setFormData(prev => ({ ...prev, imageUrl: url }));
                toast.success("Imagen subida correctamente");
            } catch (error) {
                console.error("Upload error:", error);
                toast.error("Error al subir la imagen");
            } finally {
                setUploading(false);
            }
        }
    };

    // Fire-and-forget: a social failure never blocks saving the post.
    const announceToSocial = (postId: string) => {
        const user = auth?.currentUser;
        if (!user) return;
        user.getIdToken()
            .then((token) => requestAnnounce(postId, token))
            .then((result) => {
                const { kind, text } = announceMessage(result);
                toast[kind](text);
            })
            .catch(() => toast.error(announceMessage({ status: "failed" }).text));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validations
            if (!formData.title || !formData.content) {
                toast.error("El título y el contenido son obligatorios");
                setLoading(false);
                return;
            }

            let savedId: string;
            if (isEditing && initialData?.id) {
                await blogService.updatePost(initialData.id, formData);
                savedId = initialData.id;
                toast.success("Post actualizado correctamente");
            } else {
                savedId = await blogService.createPost(formData as BlogPost);
                toast.success("Post creado correctamente");
            }
            // Only the draft -> published transition goes to social media.
            const wasPublished = isEditing && initialData?.published === true;
            if (formData.published && !wasPublished) announceToSocial(savedId);
            router.push("/dashboard/blog");
            router.refresh();
        } catch (error) {
            console.error("Error saving post:", error);
            toast.error("Error al guardar el post");
        } finally {
            setLoading(false);
        }
    };

    // Helper to format date for input datetime-local
    const formatDateForInput = (date?: Date | Timestamp) => {
        if (!date) return "";
        const d = date instanceof Timestamp ? date.toDate() : new Date(date);
        // Format: YYYY-MM-DDThh:mm
        const pad = (n: number) => n < 10 ? '0' + n : n;
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-20">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content (Left Column) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Title */}
                    <div className="bg-[var(--color-paper-2)] p-6 rounded-xl border border-[var(--color-rule)] shadow-sm space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Título del Artículo</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Ej: Nueva Ley de Alquileres 2025"
                                className="w-full px-4 py-2 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 font-bold text-lg text-[var(--color-ink)]"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Slug (URL)</label>
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-lg text-sm text-[var(--color-muted)] font-mono"
                            />
                        </div>
                    </div>

                    {/* Editor / Content */}
                    <div className="bg-[var(--color-paper-2)] p-6 rounded-xl border border-[var(--color-rule)] shadow-sm space-y-4">
                        <label className="block text-sm font-medium text-[var(--color-ink-2)]">Contenido</label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            rows={15}
                            placeholder="Escribe el contenido de tu post aquí..."
                            className="w-full px-4 py-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 resize-y text-[var(--color-ink)]"
                            required
                        />
                        <p className="text-xs text-[var(--color-muted)] text-right">Se recomienda usar Markdown o HTML simple.</p>
                    </div>

                    {/* Excerpt */}
                    <div className="bg-[var(--color-paper-2)] p-6 rounded-xl border border-[var(--color-rule)] shadow-sm space-y-4">
                        <label className="block text-sm font-medium text-[var(--color-ink-2)]">Resumen / Bajada</label>
                        <textarea
                            name="excerpt"
                            value={formData.excerpt}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Breve descripción que aparecerá en el listado..."
                            className="w-full px-4 py-2 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 text-[var(--color-ink)]"
                        />
                    </div>

                </div>

                {/* Sidebar (Right Column) */}
                <div className="space-y-6">

                    {/* Actions */}
                    <div className="bg-[var(--color-paper-2)] p-6 rounded-xl border border-[var(--color-rule)] shadow-sm">
                        <h3 className="font-semibold text-[var(--color-ink)] mb-4">Publicación</h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[var(--color-ink-2)]">Estado</span>
                                <div className="flex items-center gap-2">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.published}
                                            onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                                        />
                                        <div className="w-11 h-6 bg-[var(--color-paper-4)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--color-accent)]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[var(--color-paper-2)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--color-paper-2)] after:border-[var(--color-rule)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-positive)]"></div>
                                    </label>
                                    <span className={`text-sm font-medium ${formData.published ? 'text-[var(--color-positive)]' : 'text-[var(--color-muted)]'}`}>
                                        {formData.published ? 'Publicado' : 'Borrador'}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-[var(--color-rule-2)] pt-4">
                                <label className="block text-xs font-semibold text-[var(--color-muted)] uppercase mb-2">Fecha de Publicación</label>
                                <div className="relative">
                                    <Calendar strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral)]" size={16} />
                                    <input
                                        type="datetime-local"
                                        name="publishedAt"
                                        value={formatDateForInput(formData.publishedAt)}
                                        onChange={handleDateChange}
                                        className="w-full pl-10 pr-4 py-2 text-sm border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 text-[var(--color-ink)]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[var(--color-muted)] uppercase mb-2">Vencimiento (Opcional)</label>
                                <div className="relative">
                                    <Calendar strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral)]" size={16} />
                                    <input
                                        type="datetime-local"
                                        name="expiresAt"
                                        value={formatDateForInput(formData.expiresAt)}
                                        onChange={handleDateChange}
                                        className="w-full pl-10 pr-4 py-2 text-sm border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 text-[var(--color-ink)]"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-[var(--color-ink-2)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-lg hover:bg-[var(--color-paper-3)]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || uploading}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-[var(--color-paper)] bg-[var(--color-ink)] rounded-lg hover:bg-[var(--color-ink-2)] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Guardando...' : (
                                        <>
                                            <Save strokeWidth={1.5} size={16} /> Guardar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Author */}
                    <div className="bg-[var(--color-paper-2)] p-6 rounded-xl border border-[var(--color-rule)] shadow-sm">
                        <h3 className="font-semibold text-[var(--color-ink)] mb-4 flex items-center gap-2">
                            <User strokeWidth={1.5} size={18} /> Autor
                        </h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                name="name"
                                value={formData.author?.name || ""}
                                onChange={handleAuthorChange}
                                placeholder="Nombre del autor"
                                className="w-full px-3 py-2 text-sm border border-[var(--color-rule)] rounded-lg text-[var(--color-ink)]"
                            />
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className="bg-[var(--color-paper-2)] p-6 rounded-xl border border-[var(--color-rule)] shadow-sm">
                        <h3 className="font-semibold text-[var(--color-ink)] mb-4 flex items-center gap-2">
                            <ImageIcon strokeWidth={1.5} size={18} /> Imagen Principal
                        </h3>

                        <div className="space-y-4">
                            {formData.imageUrl ? (
                                <div className="relative rounded-lg overflow-hidden border border-[var(--color-rule)] aspect-video group">
                                    <img
                                        src={formData.imageUrl}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, imageUrl: "" }))}
                                        className="absolute top-2 right-2 p-1 bg-[var(--color-danger)] text-[var(--color-accent-ink)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X strokeWidth={1.5} size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-[var(--color-rule)] rounded-lg p-6 text-center cursor-pointer hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-colors"
                                >
                                    <ImageIcon strokeWidth={1.5} className="w-10 h-10 text-[var(--color-neutral)] mx-auto mb-2" />
                                    <p className="text-sm text-[var(--color-ink-2)]">
                                        Click para subir imagen
                                    </p>
                                    <p className="text-xs text-[var(--color-neutral)] mt-1">
                                        Max 2MB (JPG, PNG, WebP)
                                    </p>
                                </div>
                            )}

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />

                            {uploading && (
                                <div className="w-full bg-[var(--color-paper-4)] rounded-full h-1.5 mt-2">
                                    <div className="bg-[var(--color-accent)] h-1.5 rounded-full animate-pulse w-full"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="bg-[var(--color-paper-2)] p-6 rounded-xl border border-[var(--color-rule)] shadow-sm">
                        <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-3">Etiquetas (Tags)</label>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                placeholder="Añadir etiqueta..."
                                className="flex-1 px-3 py-2 text-sm border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 text-[var(--color-ink)]"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const val = e.currentTarget.value.trim();
                                        if (val && !formData.tags?.includes(val)) {
                                            setFormData(prev => ({
                                                ...prev,
                                                tags: [...(prev.tags || []), val]
                                            }));
                                            e.currentTarget.value = '';
                                        }
                                    }
                                }}
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.tags?.map((tag) => (
                                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            tags: prev.tags?.filter(t => t !== tag)
                                        }))}
                                        className="hover:text-[var(--color-accent-2)]"
                                    >
                                        <X strokeWidth={1.5} size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <p className="text-xs text-[var(--color-muted)] mt-2">Presiona Enter para añadir.</p>
                    </div>

                    {/* Category */}
                    <div className="bg-[var(--color-paper-2)] p-6 rounded-xl border border-[var(--color-rule)] shadow-sm">
                        <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-3">Categoría Principal</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-3 py-2 text-sm border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 text-[var(--color-ink)]"
                        >
                            <option value="Novedades">Novedades</option>
                            <option value="Tutoriales">Tutoriales</option>
                            <option value="Mercado Inmobiliario">Mercado Inmobiliario</option>
                            <option value="Eventos">Eventos</option>
                        </select>
                    </div>

                </div>
            </div>
        </form>
    );
}
