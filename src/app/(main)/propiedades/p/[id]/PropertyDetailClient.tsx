"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PublicProperty, PublicAgency, publicService } from "@/infrastructure/services/publicService";
import { MapPin, Bath, Bed, Maximize, Home, ChevronLeft, ChevronRight, Share2, Heart, ArrowRight, PlayCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import dynamic from 'next/dynamic';
import SimilarPropertyCard from "@/ui/components/properties/public/SimilarPropertyCard";

const PublicMap = dynamic(() => import("@/ui/components/properties/public/PublicMap"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 animate-pulse rounded-xl" />
});

import ContactModal from "@/ui/components/properties/public/ContactModal";
import PropertyDisclaimer from "@/ui/components/properties/public/PropertyDisclaimer";

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

function getYouTubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([\w-]{11}).*/;
    const match = url.match(regExp);
    return match ? match[2] : null;
}

interface Props {
    id?: string;
}

export default function PropertyDetailPage({ id: propId }: Props) {
    const params = useParams();
    const id = propId || (params.id as string);

    const [property, setProperty] = useState<PublicProperty | null>(null);
    const [similarProperties, setSimilarProperties] = useState<PublicProperty[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [modalZoom, setModalZoom] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);

    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            try {
                // 1. Get current property
                const data = await publicService.getPropertyById(id);
                setProperty(data);

                // 2. Get similar properties (Mock: fetch all and take 5 random/first ones excluding current)
                // In a real app, this would be a specific endpoint 'getSimilarProperties(id)'
                const allProps = await publicService.getAllProperties();
                const recommendations = allProps
                    .filter(p => p.id !== id)
                    .slice(0, 5);
                setSimilarProperties(recommendations);

                // Check persistence
                const saved = localStorage.getItem(`saved_${id}`);
                if (saved) setIsSaved(true);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    // Keyboard navigation for modal
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (!showGalleryModal) return;
            if (e.key === 'Escape') { setShowGalleryModal(false); setModalZoom(false); }
            if (e.key === 'ArrowRight') setCurrentImageIndex(prev => (prev + 1) % (property?.imageUrls?.length || 1));
            if (e.key === 'ArrowLeft') setCurrentImageIndex(prev => (prev - 1 + (property?.imageUrls?.length || 1)) % (property?.imageUrls?.length || 1));
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [showGalleryModal, property?.imageUrls?.length]);

    const handleSave = () => {
        if (isSaved) {
            localStorage.removeItem(`saved_${id}`);
            setIsSaved(false);
        } else {
            localStorage.setItem(`saved_${id}`, 'true');
            setIsSaved(true);
        }
    };

    const handleShare = async () => {
        const title = property?.calle ? `${property.calle} ${property.altura || ''}` : property?.title;
        const shareData = {
            title: title,
            text: `Mira esta propiedad en Zeta Prop: ${title}`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error(err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Enlace copiado al portapapeles');
        }
    };

    const handleContact = () => {
        const phoneNumber = property?.agency?.phoneNumber || "5491112345678"; // Fallback to generic if missing
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        const title = property?.calle ? `${property.calle} ${property.altura || ''}` : property?.title;
        const message = `Hola, estoy interesado en la propiedad "${title}" que vi en Zeta Prop.`;
        const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(waLink, '_blank');
    };

    const handleReport = () => {
        const title = property?.calle ? `${property.calle} ${property.altura || ''}` : property?.title;
        const message = `Hola, me gustaría denunciar o reclamar esta propiedad: "${title}" (ID: ${property?.id}). URL: ${window.location.href}`;
        const waLink = `https://wa.me/5491123889745?text=${encodeURIComponent(message)}`;
        window.open(waLink, '_blank');
    };

    // Parse createdAt date safely
    const getPublishedTimeAgo = () => {
        if (!property?.createdAt) return 'Publicado recientemente';

        try {
            let dateVal: Date;
            // Handle Firestore Timestamp
            if (typeof property.createdAt === 'object' && property.createdAt !== null && 'seconds' in property.createdAt) {
                dateVal = new Date((property.createdAt as any).seconds * 1000);
            } else {
                // Try parsing string or other formats
                dateVal = new Date(property.createdAt);
            }

            // Check if date is valid
            if (isNaN(dateVal.getTime())) return 'Publicado recientemente';

            return 'Publicado ' + formatDistanceToNow(dateVal, { addSuffix: true, locale: es });
        } catch (error) {
            return 'Publicado recientemente';
        }
    };

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
        <div className="min-h-screen bg-white pb-32 lg:pb-20 pt-24">
            <main className="container mx-auto px-4">
                {/* Header (Title & Price) */}
                <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
                    <div className="md:max-w-[70%]">
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border ${property.status === 'sold'
                                ? 'bg-red-100 text-red-600 border-red-200'
                                : property.operation_type === 'Venta'
                                    ? 'bg-green-100 text-green-700 border-green-200'
                                    : property.operation_type === 'Alquiler'
                                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                                        : 'bg-purple-100 text-purple-700 border-purple-200'
                                }`}>
                                {property.status === 'sold' ? 'VENDIDA' : property.operation_type}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-gray-500">
                                <MapPin size={14} /> {property.localidad}, {property.provincia}
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                            {property.calle ? `${property.calle} ${property.altura || ''}` : property.title}
                        </h1>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            {property.code && <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600 mr-2">{property.code}</span>}
                            <span>{getPublishedTimeAgo()}</span>
                        </div>
                    </div>


                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Interactive Gallery Slider */}
                        <div className="flex flex-col gap-4">
                            {(() => {
                                type MediaItem =
                                    | { type: 'image'; url: string }
                                    | { type: 'video'; url: string; videoId: string; thumbnail: string };

                                // Prepare media items
                                const mediaItems: MediaItem[] = property.imageUrls ? property.imageUrls.map(url => ({ type: 'image', url })) : [];

                                if (property.video_url) {
                                    const videoId = getYouTubeId(property.video_url);
                                    if (videoId) {
                                        mediaItems.push({
                                            type: 'video',
                                            url: property.video_url,
                                            videoId,
                                            thumbnail: `https://img.youtube.com/vi/${videoId}/0.jpg`
                                        });
                                    }
                                }

                                const currentItem = mediaItems[currentImageIndex]; // Utilize state index

                                return (
                                    <>
                                        {/* Main Stage — 16:9 container shows landscape photos fully */}
                                        <div className={`relative w-full aspect-[4/3] md:aspect-[16/9] bg-gray-900 rounded-2xl overflow-hidden group ${property.status === 'sold' ? 'grayscale opacity-90' : ''}`}>
                                            {mediaItems.length > 0 && currentItem ? (
                                                <>
                                                    {/* Content */}
                                                    {currentItem.type === 'video' ? (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                                                            <iframe
                                                                width="100%"
                                                                height="100%"
                                                                src={`https://www.youtube.com/embed/${currentItem.videoId}?autoplay=1`}
                                                                title="YouTube video player"
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                allowFullScreen
                                                                className="w-full h-full"
                                                            ></iframe>
                                                        </div>
                                                    ) : (
                                                        <Image
                                                            src={currentItem.url}
                                                            fill
                                                            alt="Vista Principal"
                                                            className="object-cover cursor-zoom-in"
                                                            sizes="(max-width: 1024px) 100vw, 66vw"
                                                            priority={currentImageIndex === 0}
                                                            onClick={() => setShowGalleryModal(true)}
                                                        />
                                                    )}

                                                    {/* Navigation Controls */}
                                                    {mediaItems.length > 1 && (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setCurrentImageIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
                                                                }}
                                                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full shadow-lg text-white transition-all duration-200 z-10"
                                                            >
                                                                <ChevronLeft size={24} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setCurrentImageIndex((prev) => (prev + 1) % mediaItems.length);
                                                                }}
                                                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full shadow-lg text-white transition-all duration-200 z-10"
                                                            >
                                                                <ChevronRight size={24} />
                                                            </button>

                                                            {/* Counter Badge */}
                                                            <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur-md border border-white/10 z-10">
                                                                {currentImageIndex + 1} / {mediaItems.length}
                                                            </div>
                                                        </>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <Home size={64} opacity={0.2} />
                                                    <span className="ml-4 text-lg font-medium">Sin contenido multimedia</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Thumbnails Strip */}
                                        {mediaItems.length > 1 && (
                                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                                {mediaItems.map((item, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setCurrentImageIndex(idx)}
                                                        className={`relative w-24 h-20 flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200 group ${idx === currentImageIndex
                                                            ? 'ring-2 ring-indigo-600 ring-offset-2 opacity-100'
                                                            : 'opacity-60 hover:opacity-100 grayscale hover:grayscale-0'
                                                            }`}
                                                    >
                                                        <Image
                                                            src={item.type === 'video' ? item.thumbnail : item.url}
                                                            alt={`Thumbnail ${idx}`}
                                                            fill
                                                            sizes="96px"
                                                            className="object-cover"
                                                        />
                                                        {item.type === 'video' && (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                                                                <PlayCircle className="text-white drop-shadow-md w-8 h-8" />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>

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

                        {/* Location Map */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Ubicación</h2>
                            <div className="w-full h-[300px] rounded-xl overflow-hidden bg-gray-100 relative z-0">
                                {property.lat && property.lng ? (
                                    <PublicMap lat={property.lat} lng={property.lng} />
                                ) : (
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        id="gmap_canvas"
                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(`${property.title.replace(/^(ALQUILER|VENTA|ALQUILER TEMPORAL)\s*-\s*/i, '')}, ${property.localidad}, ${property.provincia}, Argentina`)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                        frameBorder="0"
                                        scrolling="no"
                                        marginHeight={0}
                                        marginWidth={0}
                                        className="filter grayscale hover:grayscale-0 transition-all duration-500"
                                    ></iframe>
                                )}
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                <MapPin size={16} />
                                <p>{property.localidad}, {property.provincia}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Agency Info (Sticky) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            {/* Price & Actions Card */}
                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                                <p className="text-3xl font-bold text-gray-900 mb-6 text-center">
                                    {property.hidePrice ? "Consultar Precio" : `${property.currency} ${Number(property.price)?.toLocaleString('es-AR')}`}
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleShare}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-bold text-gray-700 transition"
                                    >
                                        <Share2 className="w-4 h-4" /> Compartir
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition group text-sm font-bold ${isSaved
                                            ? 'bg-red-50 border-red-200 text-red-600'
                                            : 'border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-700'
                                            }`}
                                    >
                                        <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : 'group-hover:text-red-500'}`} />
                                        {isSaved ? 'Guardado' : 'Guardar'}
                                    </button>
                                </div>
                            </div>
                            {property.agency && (
                                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="relative w-20 h-20 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200 p-0.5">
                                            {property.agency.photoURL ? (
                                                <Image src={property.agency.photoURL} alt={property.agency.displayName} fill sizes="80px" className="object-cover rounded-full p-0.5" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center font-bold text-indigo-600 text-2xl bg-indigo-50 rounded-full">
                                                    {property.agency.displayName.substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Publicado por</p>
                                            <h3 className="font-bold text-gray-900 text-xl leading-tight truncate">
                                                <Link href={`/propiedades/${property.agency.slug || property.userId}`} className="hover:underline hover:text-indigo-600 transition">
                                                    {property.agency.displayName}
                                                </Link>
                                            </h3>
                                            {(property.agency as any).rating && (property.agency as any).rating >= 5 ? (
                                                <div className="flex text-amber-500 text-xs mt-1">
                                                    ★★★★★ <span className="text-gray-400 ml-1">(5.0)</span>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setShowContactModal(true)}
                                        className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 px-4 rounded-xl transition shadow-xl shadow-gray-200/50 mb-3 flex items-center justify-center gap-3 text-lg"
                                    >
                                        <span>Contactar Inmobiliaria</span>
                                    </button>
                                    <Link
                                        href={`/propiedades/${property.agency.slug || property.userId}`}
                                        className="block w-full text-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-xl transition text-sm mb-4"
                                    >
                                        Ver más propiedades
                                    </Link>

                                    <div className="pt-4 border-t border-gray-100 text-center">
                                        <button onClick={handleReport} className="text-xs text-gray-400 hover:text-red-500 hover:underline transition font-medium">
                                            Denunciar o Reclamar Propiedad
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Similar Properties Section */}
                {similarProperties.length > 0 && (
                    <div className="border-t border-gray-100 pt-16 mt-16">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">Encontrá propiedades similares</h2>
                            <Link href="/propiedades" className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:underline">
                                Ver más recomendaciones <ArrowRight size={16} />
                            </Link>
                        </div>

                        <div className="relative -mx-4 px-4 overflow-x-auto pb-8 scrollbar-hide">
                            <div className="flex gap-6 w-max">
                                {similarProperties.map((prop) => (
                                    <SimilarPropertyCard key={prop.id} property={prop} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Legal Disclaimer */}
                <PropertyDisclaimer />
            </main>

            {/* Mobile Sticky Contact Bar */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 px-5 py-4 lg:hidden z-[45] flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.04)] sm:pb-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <button
                    onClick={() => setShowContactModal(true)}
                    className="bg-indigo-600 text-white font-semibold py-3.5 px-8 rounded-xl active:scale-95 transition-transform text-[15px] shadow-sm shadow-indigo-600/20"
                >
                    Contactar
                </button>
                <div className="flex flex-col items-end">
                    <span className="text-xl font-bold text-gray-900 leading-none">
                        {property.hidePrice ? "Consultar" : `${property.currency} ${Number(property.price)?.toLocaleString('es-AR')}`}
                    </span>
                    <span className="text-xs text-gray-500 font-medium mt-1">
                        {property.operation_type}
                    </span>
                </div>
            </div>

            {/* Gallery Modal */}
            {showGalleryModal && property && property.imageUrls && (
                <div
                    className="fixed inset-0 z-[60] bg-black/98 flex items-center justify-center animate-in fade-in duration-200"
                    onClick={(e) => { if (e.target === e.currentTarget) { setShowGalleryModal(false); setModalZoom(false); } }}
                >
                    <div className="w-full h-full flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-black/60 shrink-0 border-b border-white/10">
                            <span className="text-sm font-medium text-white/70">
                                {currentImageIndex + 1} / {property.imageUrls.length}
                            </span>
                            <span className="text-xs text-white/40">{modalZoom ? 'Zoom activo · Clic para ajustar' : 'Clic en la imagen para zoom'}</span>
                            <button
                                onClick={() => { setShowGalleryModal(false); setModalZoom(false); }}
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition text-white text-sm font-semibold border border-white/20"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                Cerrar
                            </button>
                        </div>

                        {/* Main Image with click-to-zoom */}
                        <div
                            className={`flex-1 relative flex items-center justify-center bg-zinc-950 overflow-hidden ${modalZoom ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                            onClick={() => setModalZoom(z => !z)}
                        >
                            {/* Blurred background to fill letterbox areas */}
                            <Image
                                src={property.imageUrls[currentImageIndex]}
                                fill
                                className="object-cover blur-2xl opacity-30 scale-110 pointer-events-none"
                                sizes="100vw"
                                alt=""
                                aria-hidden
                            />
                            {/* Sharp image centered */}
                            <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${modalZoom ? 'scale-[2]' : 'scale-100'}`}>
                                <Image
                                    src={property.imageUrls[currentImageIndex]}
                                    alt={`Imagen ${currentImageIndex + 1}`}
                                    fill
                                    sizes="100vw"
                                    className="object-contain"
                                    priority
                                />
                            </div>

                            {/* Navigation Arrows */}
                            {!modalZoom && property.imageUrls.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev - 1 + property.imageUrls.length) % property.imageUrls.length); }}
                                        className="absolute left-4 p-4 bg-black/40 hover:bg-black/80 rounded-full text-white transition backdrop-blur-md border border-white/10 z-10 group"
                                    >
                                        <ChevronLeft size={28} className="group-hover:-translate-x-0.5 transition-transform" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev + 1) % property.imageUrls.length); }}
                                        className="absolute right-4 p-4 bg-black/40 hover:bg-black/80 rounded-full text-white transition backdrop-blur-md border border-white/10 z-10 group"
                                    >
                                        <ChevronRight size={28} className="group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnails Strip */}
                        {property.imageUrls.length > 1 && (
                            <div className="h-20 bg-zinc-950 p-2 shrink-0 flex gap-2 overflow-x-auto border-t border-white/10">
                                {property.imageUrls.map((url, idx) => (
                                    <button
                                        key={idx}
                                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); setModalZoom(false); }}
                                        className={`relative h-full aspect-[4/3] rounded-lg overflow-hidden transition-all duration-200 border-2 shrink-0 ${idx === currentImageIndex
                                                ? 'border-indigo-500 opacity-100 scale-105 shadow-lg shadow-indigo-500/20'
                                                : 'border-transparent opacity-40 hover:opacity-80'
                                            }`}
                                    >
                                        <Image src={url} alt={`Thumbnail ${idx}`} fill sizes="100px" className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <ContactModal
                isOpen={showContactModal}
                onClose={() => setShowContactModal(false)}
                propertyId={property.id}
                propertyTitle={property.calle ? `${property.calle} ${property.altura || ''}` : property.title}
                ownerId={property.userId}
                agencyId={property.agency?.uid}
            />
        </div>
    );
}
