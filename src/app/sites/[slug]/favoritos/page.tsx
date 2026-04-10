"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { Heart, Trash2, MapPin, ChevronLeft, Building2 } from "lucide-react";
import { useSite } from "../SiteProvider";
import SiteNavbar from "../../components/SiteNavbar";
import SiteFooter from "../../components/SiteFooter";

interface SavedProperty {
    id: string;
    title: string;
    price: number;
    currency: string;
    operation_type: string;
    localidad: string;
    provincia: string;
    imageUrl: string;
    basePath: string;
}

export default function FavoritosPage() {
    const { site, basePath } = useSite();
    const [favorites, setFavorites] = useState<SavedProperty[]>([]);

    useEffect(() => {
        const keys = Object.keys(localStorage).filter(k => k.startsWith("fav_data_"));
        const items: SavedProperty[] = keys.map(k => {
            try { return JSON.parse(localStorage.getItem(k)!); } catch { return null; }
        }).filter(Boolean);
        setFavorites(items);
    }, []);

    const remove = (id: string) => {
        localStorage.removeItem(`fav_${id}`);
        localStorage.removeItem(`fav_data_${id}`);
        setFavorites(prev => prev.filter(p => p.id !== id));
    };

    if (!site) return null;

    return (
        <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <SiteNavbar site={site} basePath={basePath} />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20">
                <div className="flex items-center gap-3 mb-8">
                    <Link href={`${basePath}/propiedades`} className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-900 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <Heart className="w-6 h-6 text-red-500 fill-current" />
                        <h1 className="text-2xl font-bold text-gray-900">Mis Favoritos</h1>
                        {favorites.length > 0 && (
                            <span className="ml-1 text-sm font-medium text-gray-400">({favorites.length})</span>
                        )}
                    </div>
                </div>

                {favorites.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl border border-gray-100">
                        <Heart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No tenés favoritos guardados</h2>
                        <p className="text-gray-400 mb-8 max-w-xs mx-auto text-sm">
                            Tocá el corazón en cualquier propiedad para guardarla aquí. No necesitás registrarte.
                        </p>
                        <Link
                            href={`${basePath}/propiedades`}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90"
                            style={{ backgroundColor: site.colorPrimario }}
                        >
                            <Building2 className="w-4 h-4" /> Ver propiedades
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {favorites.map((prop) => (
                                <div key={prop.id} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all">
                                    <Link href={`${prop.basePath || basePath}/propiedades/${prop.id}`}>
                                        <div className="relative aspect-[4/3] bg-gray-100">
                                            {prop.imageUrl ? (
                                                <NextImage src={prop.imageUrl} alt={prop.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Building2 className="w-10 h-10 text-gray-200" />
                                                </div>
                                            )}
                                            <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${prop.operation_type === "Venta" ? "bg-green-500 text-white" : "bg-blue-600 text-white"}`}>
                                                {prop.operation_type}
                                            </span>
                                        </div>
                                        <div className="p-4">
                                            <p className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">{prop.title}</p>
                                            <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                                                <MapPin className="w-3 h-3" />
                                                <span>{prop.localidad}, {prop.provincia}</span>
                                            </div>
                                            <p className="font-bold text-gray-900 mt-2">
                                                {prop.currency} {Number(prop.price).toLocaleString("es-AR")}
                                            </p>
                                        </div>
                                    </Link>
                                    <div className="px-4 pb-4">
                                        <button
                                            onClick={() => remove(prop.id)}
                                            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors font-medium"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Quitar de favoritos
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p className="text-center text-xs text-gray-400 mt-10">
                            Los favoritos se guardan en tu dispositivo. No se sincronizan entre dispositivos.
                        </p>
                    </>
                )}
            </main>

            <SiteFooter site={site} basePath={basePath} />
        </div>
    );
}
