"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PublicProperty, PublicAgency, publicService } from "@/infrastructure/services/publicService";
import { MapPin, Bath, Bed, Maximize, Home, ChevronLeft, ChevronRight, Share2, Heart } from "lucide-react";
import Link from "next/link";

export default function PropertyDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [property, setProperty] = useState<PublicProperty | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showGalleryModal, setShowGalleryModal] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            try {
                const data = await publicService.getPropertyById(id);
                setProperty(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    if (loading) return <div className="min-h-screen bg-white" />;
    if (!property) return <div className="min-h-screen flex items-center justify-center">Propiedad no encontrada</div>;

    const nextImage = () => {
        if (!property.imageUrls?.length) return;
        setCurrentImageIndex((prev) => (prev + 1) % property.imageUrls.length);
    };

    const prevImage = () => {
        if (!property.imageUrls?.length) return;
        setCurrentImageIndex((prev) => (prev - 1 + property.imageUrls.length) % property.imageUrls.length);
    };

    return (
        <div className="min-h-screen bg-white pb-20 pt-24">
            <main className="container mx-auto px-4">
                {/* Header (Title & Price) */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${property.operation_type === 'Venta' ? 'bg-green-100 text-green-700' :
                                property.operation_type === 'Alquiler' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                }`}>
                                {property.operation_type}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-gray-500">
                                <MapPin size={14} /> {property.localidad}, {property.provincia}
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{property.title}</h1>
                        <p className="text-sm text-gray-500">Publicado hace 3 días</p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <p className="text-3xl font-bold text-gray-900">
                            {property.currency} {property.price?.toLocaleString('es-AR')}
                        </p>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-medium transition">
                                <Share2 className="w-4 h-4" /> Compartir
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:border-red-200 hover:bg-red-50 text-sm font-medium transition group">
                                <Heart className="w-4 h-4 group-hover:text-red-500" /> Guardar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Gallery Grid - Ecommerce Style */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-8 relative group">
                    {/* Main Image */}
                    <div className="md:col-span-2 h-full bg-gray-100 relative cursor-pointer" onClick={() => { setCurrentImageIndex(0); setShowGalleryModal(true); }}>
                        {property.imageUrls && property.imageUrls[0] ? (
                            <img
                                src={property.imageUrls[0]}
                                alt="Principal"
                                className="w-full h-full object-cover hover:brightness-95 transition"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Home size={48} opacity={0.3} />
                            </div>
                        )}
                    </div>

                    {/* Side Images */}
                    <div className="hidden md:grid md:col-span-2 grid-rows-2 gap-2 h-full">
                        {/* Top Right */}
                        <div className="bg-gray-100 relative cursor-pointer" onClick={() => { if (property.imageUrls?.[1]) { setCurrentImageIndex(1); setShowGalleryModal(true); } }}>
                            {property.imageUrls && property.imageUrls[1] ? (
                                <img src={property.imageUrls[1]} alt="Interior" className="w-full h-full object-cover hover:brightness-95 transition" />
                            ) : (
                                <div className="w-full h-full bg-gray-50" />
                            )}
                        </div>

                        {/* Bottom Right Split */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gray-100 relative cursor-pointer" onClick={() => { if (property.imageUrls?.[2]) { setCurrentImageIndex(2); setShowGalleryModal(true); } }}>
                                {property.imageUrls && property.imageUrls[2] ? (
                                    <img src={property.imageUrls[2]} alt="Detalle" className="w-full h-full object-cover hover:brightness-95 transition" />
                                ) : (
                                    <div className="w-full h-full bg-gray-50" />
                                )}
                            </div>
                            <div className="bg-gray-100 relative cursor-pointer group/more" onClick={() => setShowGalleryModal(true)}>
                                {property.imageUrls && property.imageUrls[3] ? (
                                    <img src={property.imageUrls[3]} alt="Detalle" className="w-full h-full object-cover hover:brightness-95 transition" />
                                ) : (
                                    <div className="w-full h-full bg-gray-50" />
                                )}
                                <div className="absolute inset-0 bg-black/10 group-hover/more:bg-black/20 flex items-center justify-center transition">
                                    <span className="bg-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">Ver todas las fotos</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Specs Bar */}
                        <div className="flex items-center justify-between border-y border-gray-100 py-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-lg text-gray-700">
                                    <Maximize size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{property.area_covered} m²</p>
                                    <p className="text-xs text-gray-500">Totales</p>
                                </div>
                            </div>
                            <div className="h-8 w-px bg-gray-100" />
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-lg text-gray-700">
                                    <Bed size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{property.rooms || '-'} Amb.</p>
                                    <p className="text-xs text-gray-500">Dormitorios</p>
                                </div>
                            </div>
                            <div className="h-8 w-px bg-gray-100" />
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-lg text-gray-700">
                                    <Bath size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{property.bathrooms || '-'} Baños</p>
                                    <p className="text-xs text-gray-500">Completos</p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Descripción</h2>
                            <div className="prose prose-gray max-w-none text-gray-600 whitespace-pre-wrap">
                                {property.description || "Sin descripción disponible."}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Agency Info */}
                    <div className="space-y-6">
                        {property.agency && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                                        {property.agency.photoURL ? (
                                            <img src={property.agency.photoURL} alt={property.agency.displayName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-bold text-indigo-600 text-xl">
                                                {property.agency.displayName.substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Publicado por</p>
                                        <h3 className="font-bold text-gray-900 text-lg leading-tight">
                                            <Link href={`/propiedades/${property.agency.slug || property.userId}`} className="hover:underline hover:text-indigo-600 transition">
                                                {property.agency.displayName}
                                            </Link>
                                        </h3>
                                    </div>
                                </div>

                                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-lg shadow-indigo-200 mb-3">
                                    Contactar Inmobiliaria
                                </button>
                                <button className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-xl transition">
                                    Ver todas sus propiedades
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Gallery Modal */}
            {showGalleryModal && property && property.imageUrls && (
                <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
                    <div className="bg-black w-full max-w-5xl h-full md:h-[85vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl ring-1 ring-white/10 relative">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 text-white bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
                            <span className="text-sm font-medium px-3 py-1 bg-black/40 backdrop-blur rounded-full">
                                {currentImageIndex + 1} / {property.imageUrls.length}
                            </span>
                            <button
                                onClick={() => setShowGalleryModal(false)}
                                className="p-2 bg-black/40 backdrop-blur hover:bg-white/20 rounded-full transition"
                            >
                                <span className="sr-only">Cerrar</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        {/* Main Image */}
                        <div className="flex-1 relative flex items-center justify-center bg-zinc-900">
                            <img
                                src={property.imageUrls[currentImageIndex]}
                                alt={`Imagen ${currentImageIndex + 1}`}
                                className="max-h-full max-w-full object-contain"
                            />

                            {/* Navigation Arrows */}
                            <button
                                onClick={prevImage}
                                className="absolute left-4 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition backdrop-blur-sm"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                onClick={nextImage}
                                className="absolute right-4 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition backdrop-blur-sm"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>

                        {/* Thumbnails Strip */}
                        <div className="h-24 bg-zinc-950 p-4 shrink-0 flex gap-2 overflow-x-auto justify-center border-t border-white/10">
                            {property.imageUrls.map((url, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentImageIndex(idx)}
                                    className={`h-full aspect-[4/3] rounded-lg overflow-hidden transition-all ${idx === currentImageIndex ? 'ring-2 ring-indigo-500 opacity-100 scale-105' : 'opacity-40 hover:opacity-80'
                                        }`}
                                >
                                    <img src={url} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
