"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Save,
    Loader2,
    Wand2,
    Link as LinkIcon,
    Image as ImageIcon,
} from "lucide-react";

export default function FormArticulo() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        image: "",
        excerpt: "",
        published: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((f) => ({ ...f, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData((f) => ({ ...f, [name]: checked }));
    };

    return (
        <div className="flex flex-col gap-6">
            {/* ENCABEZADO */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft size={18} />
                    Volver
                </button>

                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    <Save size={18} />
                    Guardar
                </button>
            </div>

            {/* CONTENIDO */}
            <div className="bg-white shadow rounded-lg p-6 border border-gray-100 space-y-6">
                {/* IMAGEN */}
                <div>
                    <label className="text-sm font-medium text-gray-700">Imagen principal</label>
                    <div className="relative mt-2">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <LinkIcon size={18} />
                        </div>

                        <input
                            type="text"
                            name="image"
                            value={formData.image}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="https://..."
                        />
                    </div>

                    {formData.image && (
                        <div className="mt-2 relative h-40 w-full rounded-lg overflow-hidden border border-gray-200">
                            <img
                                src={formData.image}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                </div>

                {/* EXCERPT */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Extracto (Resumen)</label>

                    <textarea
                        name="excerpt"
                        value={formData.excerpt}
                        onChange={handleChange}
                        required
                        rows={3}
                        maxLength={160}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Breve descripción..."
                    />

                    <p className="text-xs text-gray-500 text-right">
                        {formData.excerpt.length}/160
                    </p>
                </div>

                {/* PUBLICAR */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    <input
                        type="checkbox"
                        id="published"
                        name="published"
                        checked={formData.published}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="published" className="text-sm font-medium text-gray-700">
                        Publicar inmediatamente
                    </label>
                </div>
            </div>
        </div>
    );
}
