"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BlogPost, blogService } from "@/infrastructure/services/blogService";
import { auth, db } from "@/infrastructure/firebase/client";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { Save, Image as ImageIcon, X, Calendar, User } from "lucide-react";
import { toast } from "sonner";

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

            if (isEditing && initialData?.id) {
                await blogService.updatePost(initialData.id, formData);
                toast.success("Post actualizado correctamente");
            } else {
                await blogService.createPost(formData as BlogPost);
                toast.success("Post creado correctamente");
            }
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
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Título del Artículo</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Ej: Nueva Ley de Alquileres 2025"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold text-lg"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 font-mono"
                            />
                        </div>
                    </div>

                    {/* Editor / Content */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <label className="block text-sm font-medium text-gray-700">Contenido</label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            rows={15}
                            placeholder="Escribe el contenido de tu post aquí..."
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-y"
                            required
                        />
                        <p className="text-xs text-gray-500 text-right">Se recomienda usar Markdown o HTML simple.</p>
                    </div>

                    {/* Excerpt */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <label className="block text-sm font-medium text-gray-700">Resumen / Bajada</label>
                        <textarea
                            name="excerpt"
                            value={formData.excerpt}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Breve descripción que aparecerá en el listado..."
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                </div>

                {/* Sidebar (Right Column) */}
                <div className="space-y-6">

                    {/* Actions */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-4">Publicación</h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">Estado</span>
                                <div className="flex items-center gap-2">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.published}
                                            onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                    </label>
                                    <span className={`text-sm font-medium ${formData.published ? 'text-green-600' : 'text-gray-500'}`}>
                                        {formData.published ? 'Publicado' : 'Borrador'}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4">
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Fecha de Publicación</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="datetime-local"
                                        name="publishedAt"
                                        value={formatDateForInput(formData.publishedAt)}
                                        onChange={handleDateChange}
                                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Vencimiento (Opcional)</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="datetime-local"
                                        name="expiresAt"
                                        value={formatDateForInput(formData.expiresAt)}
                                        onChange={handleDateChange}
                                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || uploading}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Guardando...' : (
                                        <>
                                            <Save size={16} /> Guardar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Author */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <User size={18} /> Autor
                        </h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                name="name"
                                value={formData.author?.name || ""}
                                onChange={handleAuthorChange}
                                placeholder="Nombre del autor"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                            />
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <ImageIcon size={18} /> Imagen Principal
                        </h3>

                        <div className="space-y-4">
                            {formData.imageUrl ? (
                                <div className="relative rounded-lg overflow-hidden border border-gray-200 aspect-video group">
                                    <img
                                        src={formData.imageUrl}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, imageUrl: "" }))}
                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                                >
                                    <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">
                                        Click para subir imagen
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
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
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                    <div className="bg-indigo-600 h-1.5 rounded-full animate-pulse w-full"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Etiquetas (Tags)</label>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                placeholder="Añadir etiqueta..."
                                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            tags: prev.tags?.filter(t => t !== tag)
                                        }))}
                                        className="hover:text-indigo-900"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Presiona Enter para añadir.</p>
                    </div>

                    {/* Category */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Categoría Principal</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
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
