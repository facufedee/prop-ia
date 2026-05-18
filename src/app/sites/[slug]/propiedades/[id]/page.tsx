"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import dynamic from 'next/dynamic';
import {
    ChevronLeft, MapPin, BedDouble, Bath, Maximize2,
    MessageCircle, Phone, Mail, Building2, ChevronRight,
    Share2, Heart, PlayCircle, Home, X
} from "lucide-react";
import { useSite } from "../../SiteProvider";
import { Site } from "@/domain/models/Site";
import { publicService, PublicProperty } from "@/infrastructure/services/publicService";
import SiteNavbar from "../../../components/SiteNavbar";
import SiteFooter from "../../../components/SiteFooter";
import SiteContactForm from "../../../components/SiteContactForm";

const PublicMap = dynamic(() => import("@/ui/components/properties/public/PublicMap"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 animate-pulse rounded-2xl" />
});

function getYouTubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([\w-]{11}).*/;
    const match = url.match(regExp);
    return match ? match[2] : null;
}

// ── Sidebar contact card with inline lead form ────────────────────────────────

interface SidebarContactCardProps {
    site: Site;
    primary: string;
    waUrl: string | null;
    propertyId: string;
    propertyTitle: string;
}

import { trackContact } from "@/lib/trackContact";

type FormErrors = { nombre?: string; email?: string; telefono?: string; mensaje?: string };

function SidebarContactCard({ site, primary, waUrl, propertyId, propertyTitle }: SidebarContactCardProps) {
    const [tab, setTab] = useState<"contacto" | "form">("contacto");
    const [form, setForm] = useState({ nombre: "", email: "", telefono: "", mensaje: "" });
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errors, setErrors] = useState<FormErrors>({});

    if (!site) return null;

    const setField = (field: keyof typeof form, value: string) => {
        setForm(p => ({ ...p, [field]: value }));
        if (errors[field]) setErrors(p => ({ ...p, [field]: undefined }));
    };

    const validate = (): boolean => {
        const e: FormErrors = {};
        const nombre = form.nombre.trim();
        const tel = form.telefono.trim();

        if (!nombre) e.nombre = "El nombre es requerido";
        else if (nombre.length < 2) e.nombre = "Mínimo 2 caracteres";
        else if (nombre.length > 60) e.nombre = "Máximo 60 caracteres";
        else if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'\-]+$/.test(nombre)) e.nombre = "Solo se permiten letras";

        if (form.email) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email inválido";
            else if (form.email.length > 100) e.email = "Email demasiado largo";
        }

        if (!tel) e.telefono = "El teléfono es requerido";
        else if (!/^[\d\s\+\-\(\)]+$/.test(tel)) e.telefono = "Solo se permiten números";
        else if (tel.replace(/\D/g, "").length < 6) e.telefono = "Mínimo 6 dígitos";
        else if (tel.length > 20) e.telefono = "Máximo 20 caracteres";

        if (form.mensaje.length > 500) e.mensaje = "Máximo 500 caracteres";

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setStatus("loading");
        try {
            const res = await fetch("/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre: form.nombre.trim(),
                    email: form.email.trim() || undefined,
                    telefono: form.telefono.trim(),
                    mensaje: (form.mensaje.trim() || `Consulta sobre: ${propertyTitle}`).slice(0, 500),
                    userId: site.userId,
                    propertyId,
                    propertyTitle,
                    origen: "web-propiedad",
                }),
            });
            if (!res.ok) throw new Error();
            setStatus("success");
        } catch {
            setStatus("error");
        }
    };

    return (
        <div className="bg-white rounded-[32px] shadow-xl shadow-black/5 border border-gray-100 overflow-hidden">
            {/* Agency header */}
            <div className="flex items-center gap-4 p-8 pb-6">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 p-1.5 flex-shrink-0">
                    {site.logoUrl ? (
                        <Image src={site.logoUrl} alt={site.nombre} fill className="object-contain p-1" />
                    ) : (
                        <Building2 className="w-full h-full text-gray-200" />
                    )}
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Publicado por</p>
                    <h3 className="text-lg font-black text-gray-900 truncate">{site.nombre}</h3>
                </div>
            </div>

            {/* Tab switcher */}
            <div className="flex border-b border-gray-100 mx-8 mb-6">
                <button
                    onClick={() => setTab("contacto")}
                    className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors mr-6 ${tab === "contacto" ? "border-b-2 text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
                    style={tab === "contacto" ? { borderColor: primary } : {}}
                >
                    Contacto rápido
                </button>
                <button
                    onClick={() => setTab("form")}
                    className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors ${tab === "form" ? "border-b-2 text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
                    style={tab === "form" ? { borderColor: primary } : {}}
                >
                    Dejar consulta
                </button>
            </div>

            <div className="px-8 pb-8">
                {tab === "contacto" ? (
                    <div className="space-y-3">
                        {waUrl && (
                            <a href={waUrl} target="_blank" rel="noopener noreferrer"
                                onClick={() => trackContact({ userId: site.userId, origen: "click-whatsapp", propertyId, propertyTitle })}
                                className="flex items-center justify-center gap-3 w-full py-4 bg-[#25D366] hover:bg-[#1fb354] text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-green-100">
                                <MessageCircle size={20} /> WhatsApp
                            </a>
                        )}
                        {site.email && (
                            <a href={`mailto:${site.email}?subject=Consulta: ${propertyTitle}`}
                                onClick={() => trackContact({ userId: site.userId, origen: "click-email", propertyId, propertyTitle })}
                                className="flex items-center justify-center gap-3 w-full py-4 bg-white border-2 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 hover:bg-gray-50"
                                style={{ color: primary, borderColor: primary }}>
                                <Mail size={20} /> Enviar Email
                            </a>
                        )}
                        {site.whatsapp && (
                            <a href={`tel:${site.whatsapp.replace(/\D/g, "")}`}
                                onClick={() => trackContact({ userId: site.userId, origen: "click-telefono", propertyId, propertyTitle })}
                                className="flex items-center justify-center gap-3 w-full py-4 text-gray-500 font-bold text-sm tracking-wide">
                                <Phone size={18} /> {site.whatsapp}
                            </a>
                        )}
                        <button
                            onClick={() => setTab("form")}
                            className="w-full py-3 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-700 transition-colors border border-dashed border-gray-200 rounded-2xl hover:border-gray-300"
                        >
                            Dejar mis datos para que me contacten
                        </button>
                    </div>
                ) : status === "success" ? (
                    <div className="text-center py-6">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="font-bold text-gray-900 mb-1">¡Consulta enviada!</p>
                        <p className="text-sm text-gray-500">{site.nombre} se va a poner en contacto con vos pronto.</p>
                        <button onClick={() => { setStatus("idle"); setTab("contacto"); setForm({ nombre: "", email: "", telefono: "", mensaje: "" }); }}
                            className="mt-4 text-xs text-gray-400 hover:text-gray-600 underline">Volver</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-2.5">
                        <div>
                            <input type="text" placeholder="Tu nombre *" value={form.nombre}
                                onChange={e => setField("nombre", e.target.value)}
                                maxLength={60}
                                className={`w-full px-4 py-3 rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400 border ${errors.nombre ? "border-red-400 bg-red-50" : "bg-gray-50 border-transparent"}`} />
                            {errors.nombre && <p className="mt-1 text-[11px] text-red-500 ml-1">{errors.nombre}</p>}
                        </div>
                        <div>
                            <input type="text" placeholder="Email (opcional)" value={form.email}
                                onChange={e => setField("email", e.target.value)}
                                maxLength={100}
                                className={`w-full px-4 py-3 rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400 border ${errors.email ? "border-red-400 bg-red-50" : "bg-gray-50 border-transparent"}`} />
                            {errors.email && <p className="mt-1 text-[11px] text-red-500 ml-1">{errors.email}</p>}
                        </div>
                        <div>
                            <input type="tel" placeholder="Teléfono / WhatsApp *" value={form.telefono}
                                onChange={e => setField("telefono", e.target.value.replace(/[^0-9\s\+\-\(\)]/g, ""))}
                                maxLength={20}
                                className={`w-full px-4 py-3 rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400 border ${errors.telefono ? "border-red-400 bg-red-50" : "bg-gray-50 border-transparent"}`} />
                            {errors.telefono && <p className="mt-1 text-[11px] text-red-500 ml-1">{errors.telefono}</p>}
                        </div>
                        <div className="relative">
                            <textarea placeholder="¿Alguna pregunta? (opcional)" value={form.mensaje} rows={3}
                                onChange={e => setField("mensaje", e.target.value)}
                                maxLength={500}
                                className={`w-full px-4 py-3 rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-300 resize-none placeholder-gray-400 border ${errors.mensaje ? "border-red-400 bg-red-50" : "bg-gray-50 border-transparent"}`} />
                            <span className="absolute bottom-2 right-3 text-[10px] text-gray-400">{form.mensaje.length}/500</span>
                            {errors.mensaje && <p className="mt-1 text-[11px] text-red-500 ml-1">{errors.mensaje}</p>}
                        </div>
                        {status === "error" && <p className="text-xs text-red-500 text-center">Hubo un error. Intentá de nuevo.</p>}
                        <button type="submit" disabled={status === "loading"}
                            className="w-full py-4 rounded-2xl text-white font-black text-sm uppercase tracking-widest transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                            style={{ backgroundColor: primary }}>
                            {status === "loading" ? "Enviando..." : "Enviar Consulta"}
                        </button>
                        <p className="text-[10px] text-gray-400 text-center">
                            Tu consulta quedará guardada en el sistema y te contactarán a la brevedad.
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function PropiedadDetailPage() {
    const { site, basePath } = useSite();
    const params = useParams<{ id: string; slug: string }>();
    const [property, setProperty] = useState<PublicProperty | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isSaved, setIsSaved] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [otherProperties, setOtherProperties] = useState<PublicProperty[]>([]);
    const touchStartX = useRef(0);

    useEffect(() => {
        if (!params?.id) return;
        publicService.getPropertyById(params.id).then((p) => {
            setProperty(p);
            setLoading(false);

            const saved = localStorage.getItem(`saved_${params.id}`);
            if (saved) setIsSaved(true);
        }).catch(() => setLoading(false));
    }, [params?.id]);

    useEffect(() => {
        if (!site?.userId) return;
        publicService.getPropertiesByUserId(site.userId).then((props) => {
            setOtherProperties(props.filter(p => p.id !== params?.id && p.status === "active").slice(0, 8));
        }).catch(() => {});
    }, [site?.userId, params?.id]);

    // Keyboard nav for lightbox — must be before any early returns (Rules of Hooks)
    useEffect(() => {
        if (!lightboxOpen || !property) return;
        // Only navigate within images in the lightbox (video is never shown there)
        const total = property.imageUrls?.length || 1;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setLightboxOpen(false);
            if (e.key === "ArrowRight") setCurrentImageIndex(i => (Math.min(i, total - 1) + 1) % total);
            if (e.key === "ArrowLeft") setCurrentImageIndex(i => (Math.min(i, total - 1) - 1 + total) % total);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [lightboxOpen, property]);

    // Preload adjacent images for instant transitions
    useEffect(() => {
        if (!property?.imageUrls?.length) return;
        const total = property.imageUrls.length;
        [1, 2, -1].forEach(offset => {
            const idx = (currentImageIndex + offset + total * 10) % total;
            const url = property.imageUrls[idx];
            if (url) {
                const img = new window.Image();
                img.src = url;
            }
        });
    }, [currentImageIndex, property?.imageUrls]);

    if (!site) return null;
    const primary = site.colorPrimario || "#4f46e5";

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!property) {
        return (
            <div className="min-h-screen flex items-center justify-center text-center px-6 bg-gray-50">
                <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
                    <Building2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Propiedad no encontrada</h1>
                    <p className="text-gray-400 mb-8 max-w-xs mx-auto">Lo sentimos, no pudimos localizar la propiedad que estás buscando.</p>
                    <Link href={`${basePath}/propiedades`} className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold bg-gray-900 text-white hover:bg-black transition-all">
                        <ChevronLeft className="w-4 h-4" /> Volver al listado
                    </Link>
                </div>
            </div>
        );
    }

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: property.title,
                url: window.location.href
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Enlace copiado al portapapeles");
        }
    };

    const handleSave = () => {
        if (isSaved) {
            localStorage.removeItem(`saved_${property.id}`);
            setIsSaved(false);
        } else {
            localStorage.setItem(`saved_${property.id}`, 'true');
            setIsSaved(true);
        }
    };

    const mediaItems = [
        ...(property.imageUrls?.map(url => ({ type: 'image', url })) || []),
        ...(property.video_url ? [{
            type: 'video',
            url: property.video_url,
            videoId: getYouTubeId(property.video_url),
            thumbnail: `https://img.youtube.com/vi/${getYouTubeId(property.video_url)}/0.jpg`
        }] : [])
    ].filter((item: any) => item.type === 'video' ? !!item.videoId : true);

    const currentMedia = mediaItems[currentImageIndex];

    const waMessage = encodeURIComponent(`Hola! Me interesa la propiedad: ${property.title}. Link: ${window.location.href}`);
    const waUrl = site.whatsapp
        ? `https://wa.me/${site.whatsapp.replace(/\D/g, "")}?text=${waMessage}`
        : null;

    return (
        <>
            <div className="min-h-screen bg-gray-50 font-sans pb-28 lg:pb-0" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <SiteNavbar site={site} basePath={basePath} />

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 lg:pt-28">
                    {/* ── Breadcrumbs & Actions ── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <nav className="flex items-center gap-3 text-sm text-gray-400 font-medium">
                            <Link href={`${basePath}/propiedades`} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all font-bold shadow-sm active:scale-95">
                                <ChevronLeft className="w-4 h-4" /> Todas las propiedades
                            </Link>
                            <ChevronRight className="w-4 h-4" />
                            <span className="text-gray-900 font-bold truncate max-w-[160px] md:max-w-md">{property.title}</span>
                        </nav>

                        <div className="flex items-center gap-3">
                            <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all active:scale-95 shadow-sm">
                                <Share2 size={16} /> Compartir
                            </button>
                            <button onClick={handleSave} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all active:scale-95 shadow-sm text-sm font-bold ${isSaved ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                                <Heart size={16} className={isSaved ? "fill-current" : ""} /> {isSaved ? "Guardado" : "Guardar"}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                        {/* ── Main content (Gallery + Details) ── */}
                        <div className="lg:col-span-8 space-y-10">

                            {/* ── Gallery ── */}
                            <div className="space-y-4">
                                <div
                                    className="relative aspect-[16/10] sm:aspect-[16/9] rounded-[32px] overflow-hidden bg-gray-900 shadow-2xl border border-black/5 group"
                                    onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                                    onTouchEnd={(e) => {
                                        const diff = touchStartX.current - e.changedTouches[0].clientX;
                                        if (Math.abs(diff) > 40) {
                                            diff > 0
                                                ? setCurrentImageIndex(i => (i + 1) % mediaItems.length)
                                                : setCurrentImageIndex(i => (i - 1 + mediaItems.length) % mediaItems.length);
                                        }
                                    }}
                                >
                                    {mediaItems.length > 0 ? (
                                        <>
                                            {/* Stacked layers — CSS opacity transition for instant, smooth switching */}
                                            {mediaItems.map((item, i) => (
                                                <div
                                                    key={i}
                                                    className={`absolute inset-0 transition-opacity duration-200 ${i === currentImageIndex ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'}`}
                                                >
                                                    {item.type === 'video' ? (
                                                        i === currentImageIndex ? (
                                                            <iframe
                                                                width="100%"
                                                                height="100%"
                                                                src={`https://www.youtube.com/embed/${(item as any).videoId}?autoplay=1`}
                                                                title="YouTube video player"
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                allowFullScreen
                                                                className="w-full h-full"
                                                            />
                                                        ) : null
                                                    ) : (
                                                        <button
                                                            className="absolute inset-0 w-full h-full cursor-zoom-in"
                                                            onClick={() => setLightboxOpen(true)}
                                                            aria-label="Ver imagen ampliada"
                                                        >
                                                            <Image
                                                                src={(item as any).url}
                                                                alt={property.title}
                                                                fill
                                                                className="object-cover"
                                                                sizes="(max-width: 1024px) 100vw, 850px"
                                                                priority={i === 0}
                                                            />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}

                                            {mediaItems.length > 1 && (
                                                <>
                                                    <button onClick={() => setCurrentImageIndex(i => (i - 1 + mediaItems.length) % mediaItems.length)}
                                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-lg z-10">
                                                        <ChevronLeft size={24} />
                                                    </button>
                                                    <button onClick={() => setCurrentImageIndex(i => (i + 1) % mediaItems.length)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-lg z-10">
                                                        <ChevronRight size={24} />
                                                    </button>
                                                    <div className="absolute bottom-6 right-6 bg-black/50 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-widest border border-white/10 z-10">
                                                        {currentImageIndex + 1} / {mediaItems.length}
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
                                            <Home size={64} className="mb-4" />
                                            <p className="font-bold uppercase tracking-widest text-xs">Sin imágenes</p>
                                        </div>
                                    )}
                                </div>

                                {mediaItems.length > 1 && (
                                    <div className="flex gap-3 overflow-x-auto pb-4 px-1 scrollbar-hide">
                                        {mediaItems.map((item, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentImageIndex(i)}
                                                className={`relative w-24 h-16 sm:w-32 sm:h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${i === currentImageIndex ? "scale-105 shadow-md shadow-black/10" : "grayscale opacity-50 hover:opacity-100 hover:grayscale-0"}`}
                                                style={i === currentImageIndex ? { borderColor: primary } : { borderColor: "transparent" }}
                                            >
                                                <Image src={item.type === 'video' ? (item as any).thumbnail : (item as any).url} alt="" fill className="object-cover" sizes="128px" />
                                                {item.type === 'video' && <div className="absolute inset-0 flex items-center justify-center bg-black/20"><PlayCircle className="text-white w-8 h-8" /></div>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ── Key Features Bar ── */}
                            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-wrap items-center justify-around gap-4 sm:gap-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
                                        <Maximize2 size={24} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xl font-black text-gray-900">{property.area_covered || "-"}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">m² cubiertos</span>
                                    </div>
                                </div>
                                <div className="w-[1px] h-10 bg-gray-100 hidden sm:block" />
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
                                        <BedDouble size={24} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xl font-black text-gray-900">{property.rooms || "-"}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ambientes</span>
                                    </div>
                                </div>
                                <div className="w-[1px] h-10 bg-gray-100 hidden sm:block" />
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
                                        <Bath size={24} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xl font-black text-gray-900">{property.bathrooms || "-"}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Baños</span>
                                    </div>
                                </div>
                            </div>

                            {/* ── Description & Location ── */}
                            <div className="space-y-10">
                                <div className="bg-white rounded-[32px] p-8 sm:p-10 shadow-sm border border-gray-100">
                                    <h2 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">Descripción General</h2>
                                    <div className="text-gray-600 leading-relaxed whitespace-pre-line text-lg font-medium">
                                        {property.description}
                                    </div>
                                </div>

                                <div className="bg-white rounded-[32px] p-8 sm:p-10 shadow-sm border border-gray-100">
                                    <h2 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">Ubicación</h2>
                                    <div className="h-[400px] w-full rounded-[24px] overflow-hidden bg-gray-50 border border-gray-100 relative z-0">
                                        <PublicMap lat={property.lat || -34.6037} lng={property.lng || -58.3816} />
                                    </div>
                                    <div className="mt-6 flex items-start gap-3 p-4 bg-gray-50 rounded-2xl">
                                        <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                                        <div>
                                            <p className="font-bold text-gray-900 text-lg">{[property.address || property.calle, property.altura].filter(Boolean).join(" ")}</p>
                                            <p className="text-gray-500 font-medium">{[property.localidad, property.provincia].filter(Boolean).join(", ")}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Sidebar (Contact & Price) ── */}
                        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
                            {/* Price Card */}
                            <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-black/5 border border-gray-100 text-center">
                                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-white" style={{ backgroundColor: primary }}>
                                    {property.operation_type}
                                </span>
                                <h2 className="text-4xl font-black text-gray-900 mb-2">
                                    {property.hidePrice ? "Consultar Precio" : `${property.currency} ${Number(property.price).toLocaleString("es-AR")}`}
                                </h2>
                                {property.expenses && (
                                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">+ ${property.expenses.toLocaleString("es-AR")} expensas</p>
                                )}
                            </div>

                            {/* Contact Agency Card */}
                            <SidebarContactCard
                                site={site}
                                primary={primary}
                                waUrl={waUrl}
                                propertyId={property.id}
                                propertyTitle={property.title}
                            />

                            {/* Disclaimer Small */}
                            <div className="p-6 bg-gray-100/50 rounded-2xl border border-gray-100">
                                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                                    Todas las operaciones inmobiliarias son objeto de intermediación y conclusión por parte del martillero y corredor colegiado, cuyos datos se exhiben en este sitio.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>

                <div className="bg-white border-t border-gray-100 mt-20 pt-20">
                    <SiteContactForm site={site} propertyId={property.id} propertyTitle={property.title} />
                </div>

                {/* ── Otras propiedades ── */}
                {otherProperties.length > 0 && (
                    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 border-t border-gray-100">
                        <div className="max-w-7xl mx-auto">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Otras propiedades</h2>
                                <Link
                                    href={`${basePath}/propiedades`}
                                    className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                                    style={{ color: primary }}
                                >
                                    Ver todas <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>

                            <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
                                {otherProperties.map((p) => (
                                    <Link
                                        key={p.id}
                                        href={`${basePath}/propiedades/${p.id}`}
                                        className="flex-shrink-0 w-72 snap-start bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
                                    >
                                        <div className="relative h-44 bg-gray-100 overflow-hidden">
                                            {p.imageUrls?.[0] ? (
                                                <img
                                                    src={p.imageUrls[0]}
                                                    alt={p.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <Building2 size={40} />
                                                </div>
                                            )}
                                            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white" style={{ backgroundColor: primary }}>
                                                {p.operation_type}
                                            </span>
                                        </div>
                                        <div className="p-5">
                                            <p className="font-black text-gray-900 text-sm leading-tight mb-1 line-clamp-2">{p.title}</p>
                                            {p.localidad && <p className="text-xs text-gray-400 font-medium mb-3">{p.localidad}</p>}
                                            <p className="text-base font-black text-gray-900">
                                                {p.hidePrice || !p.price ? "Consultar" : `${p.currency} ${Number(p.price).toLocaleString("es-AR")}`}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            <div className="flex justify-center mt-8">
                                <Link
                                    href={`${basePath}/propiedades`}
                                    className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm border-2 text-gray-700 hover:bg-gray-100 transition-all active:scale-95"
                                    style={{ borderColor: primary, color: primary }}
                                >
                                    <ChevronLeft className="w-4 h-4" /> Volver a todas las propiedades
                                </Link>
                            </div>
                        </div>
                    </section>
                )}

                <SiteFooter site={site} basePath={basePath} />

                {/* ── Mobile Sticky Contact Bar ── */}
                <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 px-5 py-4 lg:hidden z-[45] flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.04)] sm:pb-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    {waUrl ? (
                        <a
                            href={waUrl} target="_blank" rel="noopener noreferrer"
                            onClick={() => trackContact({ userId: site.userId, origen: "click-whatsapp", propertyId: property?.id, propertyTitle: property?.title })}
                            className="text-white font-black py-3.5 px-6 rounded-xl active:scale-95 transition-transform text-sm shadow-sm shadow-green-900/20 flex items-center gap-2 uppercase tracking-widest"
                            style={{ backgroundColor: "#25D366" }}
                        >
                            <MessageCircle size={18} /> WhatsApp
                        </a>
                    ) : (
                        <button
                            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                            className="text-white font-black py-3.5 px-6 rounded-xl active:scale-95 transition-transform text-sm uppercase tracking-widest"
                            style={{ backgroundColor: primary }}
                        >
                            Contactar
                        </button>
                    )}
                    <div className="flex flex-col items-end text-right">
                        <span className="text-xl font-black text-gray-900 leading-none">
                            {property.hidePrice || Number(property.price) === 0 ? "Consultar Precio" : `${property.currency} ${Number(property.price).toLocaleString("es-AR")}`}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">
                            {property.operation_type}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Lightbox ── */}
            {lightboxOpen && property.imageUrls?.length > 0 && (() => {
                const imgs = property.imageUrls;
                const total = imgs.length;
                // Clamp to valid image index (avoids crash if gallery is on video position)
                const lbIdx = Math.min(currentImageIndex, total - 1);
                const setLbIdx = (idx: number) => setCurrentImageIndex(idx);

                return (
                    <div
                        className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center animate-in fade-in duration-150"
                        onClick={() => setLightboxOpen(false)}
                        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                        onTouchEnd={(e) => {
                            const diff = touchStartX.current - e.changedTouches[0].clientX;
                            if (Math.abs(diff) > 40) {
                                diff > 0
                                    ? setLbIdx((lbIdx + 1) % total)
                                    : setLbIdx((lbIdx - 1 + total) % total);
                            }
                        }}
                    >
                        {/* Close */}
                        <button
                            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
                            onClick={() => setLightboxOpen(false)}
                        >
                            <X size={20} />
                        </button>

                        {/* Counter */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-4 py-1.5 rounded-full font-bold tracking-widest z-10">
                            {lbIdx + 1} / {total}
                        </div>

                        {/* Stacked images — render current ±1 for smooth transitions */}
                        <div className="relative w-full h-full max-w-6xl max-h-[90vh] mx-auto px-16" onClick={(e) => e.stopPropagation()}>
                            {imgs.map((url, i) => {
                                const dist = Math.min(Math.abs(i - lbIdx), total - Math.abs(i - lbIdx));
                                if (dist > 1) return null;
                                return (
                                    <div
                                        key={i}
                                        className={`absolute inset-0 transition-opacity duration-200 ${i === lbIdx ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'}`}
                                    >
                                        <Image src={url} alt={property.title} fill className="object-contain" sizes="100vw" priority={dist === 0} />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Arrows */}
                        {total > 1 && (
                            <>
                                <button
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-all z-10"
                                    onClick={(e) => { e.stopPropagation(); setLbIdx((lbIdx - 1 + total) % total); }}
                                >
                                    <ChevronLeft size={28} />
                                </button>
                                <button
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-all z-10"
                                    onClick={(e) => { e.stopPropagation(); setLbIdx((lbIdx + 1) % total); }}
                                >
                                    <ChevronRight size={28} />
                                </button>
                            </>
                        )}
                    </div>
                );
            })()}
        </>
    );
}
