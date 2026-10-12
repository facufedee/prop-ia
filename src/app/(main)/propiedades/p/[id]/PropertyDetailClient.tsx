"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { PublicProperty, publicService } from "@/infrastructure/services/publicService";
import {
    MapPin, Bath, DoorOpen, Ruler, Home, ChevronLeft, ChevronRight, Share2, Heart,
    ArrowLeft, ArrowRight, PlayCircle, Phone, MessageCircle, Send, X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import dynamic from 'next/dynamic';
import SimilarPropertyCard from "@/ui/components/properties/public/SimilarPropertyCard";
import { formatPropertyPrice } from "@/ui/utils/propertyPrice";

const PublicMap = dynamic(() => import("@/ui/components/properties/public/PublicMap"), {
    ssr: false,
    loading: () => <div className="s-map-loading animate-pulse" />
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

type MediaItem =
    | { type: 'image'; url: string }
    | { type: 'video'; url: string; videoId: string; thumbnail: string };

/** Desktop gallery shows the main photo plus up to four side tiles. */
const GRID_SIDE_TILES = 4;

const SECTIONS = [
    { id: "descripcion", label: "Descripción" },
    { id: "caracteristicas", label: "Características" },
    { id: "ubicacion", label: "Ubicación" },
] as const;

interface Props {
    id?: string;
}

export default function PropertyDetailPage({ id: propId }: Props) {
    const params = useParams();
    const router = useRouter();
    const id = propId || (params.id as string);

    const [property, setProperty] = useState<PublicProperty | null>(null);
    const [similarProperties, setSimilarProperties] = useState<PublicProperty[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [modalZoom, setModalZoom] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
    const [slideIndex, setSlideIndex] = useState(0);
    const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].id);

    const [isSaved, setIsSaved] = useState(false);
    const touchStartX = useRef(0);

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

    // Keyboard navigation for the lightbox and the video overlay
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (activeVideoId && e.key === 'Escape') { setActiveVideoId(null); return; }
            if (!showGalleryModal) return;
            if (e.key === 'Escape') { setShowGalleryModal(false); setModalZoom(false); }
            const total = property?.imageUrls?.length || 1;
            if (e.key === 'ArrowRight') setCurrentImageIndex(prev => (Math.min(prev, total - 1) + 1) % total);
            if (e.key === 'ArrowLeft') setCurrentImageIndex(prev => (Math.min(prev, total - 1) - 1 + total) % total);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [showGalleryModal, activeVideoId, property?.imageUrls?.length]);

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

    // WhatsApp link to the publishing agency. Only rendered when the agency has a phone.
    const handleWhatsApp = (phoneNumber: string) => {
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

    // Back keeps the visitor's listing filters when they came from inside the site.
    const handleBack = (e: React.MouseEvent<HTMLAnchorElement>) => {
        const cameFromSite = document.referrer.startsWith(window.location.origin);
        if (cameFromSite && window.history.length > 1) {
            e.preventDefault();
            router.back();
        }
    };

    // Parse createdAt date safely
    const getPublishedTimeAgo = () => {
        if (!property?.createdAt) return 'Publicado recientemente';

        try {
            let dateVal: Date;
            // Handle Firestore Timestamp
            if (typeof property.createdAt === 'object' && property.createdAt !== null && 'seconds' in property.createdAt) {
                dateVal = new Date((property.createdAt as { seconds: number }).seconds * 1000);
            } else {
                // Try parsing string or other formats
                dateVal = new Date(property.createdAt);
            }

            // Check if date is valid
            if (isNaN(dateVal.getTime())) return 'Publicado recientemente';

            return 'Publicado ' + formatDistanceToNow(dateVal, { addSuffix: true, locale: es });
        } catch {
            return 'Publicado recientemente';
        }
    };

    if (loading) return <main className="flex-1 min-h-screen" />;
    if (!property) return <main className="flex-1 s-status"><p className="s-page-lede">Propiedad no encontrada</p></main>;

    // ---- Derived view data ----
    const displayTitle = property.calle ? `${property.calle} ${property.altura || ''}`.trim() : property.title;
    const isSold = property.status === 'sold';
    const operationLabel = isSold ? 'Vendida' : property.operation_type;
    const priceLabel = formatPropertyPrice(property.price, property.currency, property.hidePrice);
    const hasExpenses = Number(property.expenses) > 0;
    const expensesLabel = hasExpenses ? `$ ${Number(property.expenses).toLocaleString('es-AR')}` : null;
    const agencyPhone = property.agency?.phoneNumber?.replace(/\D/g, '') ? property.agency.phoneNumber : undefined;
    const agencyHref = property.agency ? `/propiedades/${property.agency.slug || property.userId}` : null;

    // Images first, then the video, so an image's media index equals its imageUrls index.
    const mediaItems: MediaItem[] = property.imageUrls ? property.imageUrls.map(url => ({ type: 'image' as const, url })) : [];
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

    const openMedia = (idx: number) => {
        const item = mediaItems[idx];
        if (!item) return;
        if (item.type === 'video') {
            setActiveVideoId(item.videoId);
            return;
        }
        setCurrentImageIndex(idx);
        setModalZoom(false);
        setShowGalleryModal(true);
    };

    const sideTiles = mediaItems.slice(1, 1 + GRID_SIDE_TILES);
    const hiddenCount = Math.max(0, mediaItems.length - (1 + GRID_SIDE_TILES));

    const specs = [
        Number(property.area_covered) > 0 && { key: 'area', icon: Ruler, value: `${property.area_covered} m²`, label: 'Superficie' },
        Number(property.rooms) > 0 && { key: 'rooms', icon: DoorOpen, value: `${property.rooms}`, label: Number(property.rooms) === 1 ? 'Ambiente' : 'Ambientes' },
        Number(property.bathrooms) > 0 && { key: 'baths', icon: Bath, value: `${property.bathrooms}`, label: Number(property.bathrooms) === 1 ? 'Baño' : 'Baños' },
    ].filter(Boolean) as { key: string; icon: typeof Ruler; value: string; label: string }[];

    const features = [
        property.type && { label: 'Tipo de inmueble', value: property.type },
        { label: 'Operación', value: operationLabel },
        Number(property.area_covered) > 0 && { label: 'Superficie cubierta', value: `${property.area_covered} m²` },
        Number(property.rooms) > 0 && { label: 'Ambientes', value: `${property.rooms}` },
        Number(property.bathrooms) > 0 && { label: 'Baños', value: `${property.bathrooms}` },
        expensesLabel && { label: 'Expensas', value: expensesLabel },
        property.code && { label: 'Código', value: property.code },
    ].filter(Boolean) as { label: string; value: string }[];

    const renderTileMedia = (item: MediaItem, idx: number, sizes: string, priority = false) => (
        <>
            <Image
                src={item.type === 'video' ? item.thumbnail : item.url}
                alt={item.type === 'video' ? `Video de ${displayTitle}` : `${displayTitle} - Foto ${idx + 1}`}
                fill
                sizes={sizes}
                className="object-cover"
                priority={priority}
            />
            {item.type === 'video' && (
                <span className="s-pd-tile__play" aria-hidden="true">
                    <PlayCircle size={40} />
                </span>
            )}
        </>
    );

    return (
        <main className="flex-1 s-portal s-portal--detail">
            <div className="l-container">
                {/* Top row: back + context, share + save */}
                <div className="s-pd-top">
                    <div className="s-pd-top__left">
                        <Link href="/propiedades" onClick={handleBack} aria-label="Volver" className="s-icon-btn">
                            <ArrowLeft size={18} aria-hidden="true" />
                        </Link>
                        <nav aria-label="Ruta de navegación" className="s-pd-crumbs">
                            <Link href="/propiedades">Propiedades</Link>
                            <span aria-hidden="true">/</span>
                            <span>{property.localidad}</span>
                        </nav>
                    </div>
                    <div className="s-pd-top__actions">
                        <button type="button" onClick={handleShare} aria-label="Compartir propiedad" className="s-icon-btn">
                            <Share2 size={18} aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            aria-label={isSaved ? 'Quitar de guardados' : 'Guardar propiedad'}
                            aria-pressed={isSaved}
                            data-active={isSaved}
                            className="s-icon-btn"
                        >
                            <Heart size={18} className={isSaved ? 'fill-current' : ''} aria-hidden="true" />
                        </button>
                    </div>
                </div>

                {/* Gallery */}
                {mediaItems.length === 0 ? (
                    <div className="s-pd-empty">
                        <Home size={48} aria-hidden="true" />
                        <span>Sin contenido multimedia</span>
                    </div>
                ) : (
                    <>
                        {/* Desktop: main photo + side grid */}
                        <div
                            className={`s-pd-gallery ${isSold ? 's-pd-gallery--sold' : ''}`}
                            data-count={Math.min(mediaItems.length, 1 + GRID_SIDE_TILES)}
                        >
                            <button type="button" className="s-pd-tile s-pd-tile--main" onClick={() => openMedia(0)} aria-label="Abrir galería">
                                {renderTileMedia(mediaItems[0], 0, "(max-width: 768px) 100vw, 60vw", true)}
                            </button>
                            {sideTiles.length > 0 && (
                                <div className="s-pd-gallery__side">
                                    {sideTiles.map((item, i) => {
                                        const idx = i + 1;
                                        const isLast = i === sideTiles.length - 1;
                                        const showMore = isLast && hiddenCount > 0;
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                className="s-pd-tile"
                                                onClick={() => openMedia(showMore ? Math.min(idx, property.imageUrls.length - 1) : idx)}
                                                aria-label={showMore ? `Ver ${hiddenCount} fotos más` : `Ver foto ${idx + 1}`}
                                            >
                                                {renderTileMedia(item, idx, "(max-width: 768px) 50vw, 20vw")}
                                                {showMore && (
                                                    <span className="s-pd-tile__more" aria-hidden="true">+{hiddenCount}</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Mobile: one swipeable image with a counter */}
                        <div className={`s-pd-swipe ${isSold ? 's-pd-gallery--sold' : ''}`}>
                            <div
                                className="s-pd-swipe__track"
                                onScroll={(e) => {
                                    const el = e.currentTarget;
                                    const idx = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1));
                                    if (idx !== slideIndex) setSlideIndex(idx);
                                }}
                            >
                                {mediaItems.map((item, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        className="s-pd-tile s-pd-swipe__slide"
                                        onClick={() => openMedia(idx)}
                                        aria-label={item.type === 'video' ? 'Reproducir video' : `Ampliar foto ${idx + 1}`}
                                    >
                                        {renderTileMedia(item, idx, "(max-width: 768px) 100vw, 60vw", idx === 0)}
                                    </button>
                                ))}
                            </div>
                            {mediaItems.length > 1 && (
                                <span className="s-glass-pill s-pd-swipe__count" aria-hidden="true">
                                    {Math.min(slideIndex, mediaItems.length - 1) + 1} / {mediaItems.length}
                                </span>
                            )}
                        </div>
                    </>
                )}

                {/* Body: info + sticky price/contact card */}
                <div className="s-pd-layout">
                    <div className="s-pd-head">
                        <div className="s-detail-meta">
                            <span className={`s-op-badge ${isSold ? 's-op-badge--sold' : ''}`}>
                                {isSold ? 'VENDIDA' : property.operation_type}
                            </span>
                            {property.code && <span className="s-code">{property.code}</span>}
                            <span className="s-pd-head__time">{getPublishedTimeAgo()}</span>
                        </div>
                        <h1 className="s-detail-title">{displayTitle}</h1>
                        <p className="s-pd-loc">
                            <MapPin size={16} aria-hidden="true" />
                            <span>{property.localidad}, {property.provincia}</span>
                        </p>

                        {specs.length > 0 && (
                            <ul className="s-pd-specs" aria-label="Datos principales">
                                {specs.map(({ key, icon: Icon, value, label }) => (
                                    <li key={key}>
                                        <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                                        <span className="s-pd-specs__value">{value}</span>
                                        <span className="s-pd-specs__label">{label}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <aside className="s-pd-aside" aria-label="Precio y contacto">
                        <div className="s-pd-card">
                            <p className="s-pd-card__op">{operationLabel}</p>
                            <p className="s-pd-card__price">{priceLabel}</p>
                            {expensesLabel && (
                                <p className="s-pd-card__sub">Expensas {expensesLabel}</p>
                            )}

                            {property.agency && agencyHref && (
                                <div className="s-pd-agent">
                                    <div className="s-avatar s-pd-agent__avatar">
                                        {property.agency.photoURL ? (
                                            <Image src={property.agency.photoURL} alt={property.agency.displayName} fill sizes="48px" className="object-cover" />
                                        ) : (
                                            property.agency.displayName.substring(0, 2).toUpperCase()
                                        )}
                                    </div>
                                    <div className="s-pd-agent__text">
                                        <span className="s-pd-agent__label">Publicado por</span>
                                        <Link href={agencyHref} className="s-pd-agent__name">
                                            {property.agency.displayName}
                                        </Link>
                                    </div>
                                </div>
                            )}

                            <div className="s-pd-card__actions">
                                <button
                                    type="button"
                                    onClick={() => setShowContactModal(true)}
                                    className="l-btn l-btn--primary l-btn--block s-btn-reset s-btn-plain"
                                >
                                    <Send size={16} aria-hidden="true" /> Enviar consulta
                                </button>
                                {agencyPhone && (
                                    <div className="s-pd-card__row">
                                        <button type="button" onClick={() => handleWhatsApp(agencyPhone)} className="s-ghost-btn">
                                            <MessageCircle size={16} aria-hidden="true" /> WhatsApp
                                        </button>
                                        <a href={`tel:${agencyPhone.replace(/[^\d+]/g, '')}`} className="s-ghost-btn">
                                            <Phone size={16} aria-hidden="true" /> Llamar
                                        </a>
                                    </div>
                                )}
                                {agencyHref && (
                                    <Link href={agencyHref} className="l-link-arrow s-pd-card__more">
                                        Ver más propiedades de la inmobiliaria <ArrowRight size={16} aria-hidden="true" />
                                    </Link>
                                )}
                            </div>

                            <div className="s-report">
                                <button type="button" onClick={handleReport}>
                                    Denunciar o Reclamar Propiedad
                                </button>
                            </div>
                        </div>
                    </aside>

                    <div className="s-pd-body">
                        <nav className="s-pd-tabs" aria-label="Secciones de la propiedad">
                            {SECTIONS.map(s => (
                                <a
                                    key={s.id}
                                    href={`#${s.id}`}
                                    onClick={() => setActiveSection(s.id)}
                                    aria-current={activeSection === s.id ? 'true' : undefined}
                                    className="s-pd-tabs__item"
                                >
                                    {s.label}
                                </a>
                            ))}
                        </nav>

                        <section id="descripcion" className="s-pd-section">
                            <h2 className="s-pd-section__title">Descripción</h2>
                            <div className="s-pd-section__text">
                                {property.description || "Sin descripción disponible."}
                            </div>
                        </section>

                        <section id="caracteristicas" className="s-pd-section">
                            <h2 className="s-pd-section__title">Características</h2>
                            <dl className="s-pd-features">
                                {features.map(f => (
                                    <div key={f.label}>
                                        <dt>{f.label}</dt>
                                        <dd>{f.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>

                        <section id="ubicacion" className="s-pd-section">
                            <h2 className="s-pd-section__title">Ubicación</h2>
                            <p className="s-pd-loc">
                                <MapPin size={16} aria-hidden="true" />
                                <span>{property.localidad}, {property.provincia}</span>
                            </p>
                            <div className="s-map-frame s-pd-map">
                                {property.lat && property.lng ? (
                                    <PublicMap lat={property.lat} lng={property.lng} tone="dark" />
                                ) : (
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        id="gmap_canvas"
                                        title={`Mapa de ${property.localidad}`}
                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(`${property.title.replace(/^(ALQUILER|VENTA|ALQUILER TEMPORAL)\s*-\s*/i, '')}, ${property.localidad}, ${property.provincia}, Argentina`)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                        frameBorder="0"
                                        scrolling="no"
                                        marginHeight={0}
                                        marginWidth={0}
                                        className="filter grayscale hover:grayscale-0 transition-all duration-500"
                                    ></iframe>
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                {/* Similar Properties Section */}
                {similarProperties.length > 0 && (
                    <div className="s-similar">
                        <div className="s-row-head">
                            <h2 className="s-h2">Encontrá propiedades similares</h2>
                            <Link href="/propiedades" className="l-link-arrow">
                                Ver más recomendaciones <ArrowRight size={16} aria-hidden="true" />
                            </Link>
                        </div>

                        <div className="relative overflow-x-auto pb-4 scrollbar-hide">
                            <div className="flex gap-5 w-max">
                                {similarProperties.map((prop) => (
                                    <SimilarPropertyCard key={prop.id} property={prop} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Legal Disclaimer */}
                <PropertyDisclaimer />
            </div>

            {/* Mobile Sticky Contact Bar */}
            <div className="s-sticky-bar">
                <button
                    type="button"
                    onClick={() => setShowContactModal(true)}
                    className="l-btn l-btn--primary s-btn-reset s-btn-plain"
                >
                    Contactar
                </button>
                <div className="s-sticky-bar__info">
                    <span className="s-sticky-bar__price">
                        {property.hidePrice || Number(property.price) === 0 ? "Consultar" : `${property.currency} ${Number(property.price)?.toLocaleString('es-AR')}`}
                    </span>
                    <span className="s-sticky-bar__sub">
                        {property.agency?.displayName ? `Por ${property.agency.displayName}` : property.operation_type}
                    </span>
                </div>
            </div>

            {/* Video overlay */}
            {activeVideoId && (
                <div
                    className="s-lightbox s-lightbox--video"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Video de la propiedad"
                    onClick={(e) => { if (e.target === e.currentTarget) setActiveVideoId(null); }}
                >
                    <button type="button" onClick={() => setActiveVideoId(null)} aria-label="Cerrar video" className="s-icon-btn s-lightbox__close">
                        <X size={18} aria-hidden="true" />
                    </button>
                    <div className="s-lightbox__video">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1`}
                            title="YouTube video player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                </div>
            )}

            {/* Gallery Modal */}
            {showGalleryModal && property && property.imageUrls?.length > 0 && (() => {
                // Clamp to valid image index (avoids crash if current item is a video)
                const modalIdx = Math.min(currentImageIndex, property.imageUrls.length - 1);
                const total = property.imageUrls.length;
                const setModalIdx = (idx: number) => { setCurrentImageIndex(idx); setModalZoom(false); };

                return (
                <div
                    className="s-lightbox"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Galería de fotos"
                    onClick={(e) => { if (e.target === e.currentTarget) { setShowGalleryModal(false); setModalZoom(false); } }}
                    onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                    onTouchEnd={(e) => {
                        const diff = touchStartX.current - e.changedTouches[0].clientX;
                        if (diff > 40) setModalIdx((modalIdx + 1) % total);
                        else if (diff < -40) setModalIdx((modalIdx - 1 + total) % total);
                    }}
                >
                    <div className="w-full h-full flex flex-col">
                        {/* Header */}
                        <div className="s-lightbox__head">
                            <span className="s-lightbox__count">
                                {modalIdx + 1} / {total}
                            </span>
                            <span className="s-lightbox__hint">{modalZoom ? 'Zoom activo · Clic para ajustar' : 'Clic en la imagen para zoom'}</span>
                            <button
                                type="button"
                                onClick={() => { setShowGalleryModal(false); setModalZoom(false); }}
                                className="s-ghost-btn"
                            >
                                <X size={16} aria-hidden="true" />
                                Cerrar
                            </button>
                        </div>

                        {/* Main Image with click-to-zoom */}
                        <div
                            className={`s-lightbox__stage ${modalZoom ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                            onClick={() => setModalZoom(z => !z)}
                        >
                            {/* Stacked images — only render current ±1 to limit memory */}
                            {property.imageUrls.map((url, idx) => {
                                const dist = Math.min(Math.abs(idx - modalIdx), total - Math.abs(idx - modalIdx));
                                if (dist > 1) return null;
                                return (
                                    <div
                                        key={idx}
                                        className={`absolute inset-0 transition-opacity duration-200 flex items-center justify-center ${idx === modalIdx ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'}`}
                                    >
                                        {/* Blurred background */}
                                        <Image
                                            src={url}
                                            fill
                                            className="object-cover blur-2xl opacity-30 scale-110 pointer-events-none"
                                            sizes="100vw"
                                            alt=""
                                            aria-hidden
                                        />
                                        {/* Sharp image */}
                                        <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${modalZoom ? 'scale-[2]' : 'scale-100'}`}>
                                            <Image
                                                src={url}
                                                alt={`Imagen ${idx + 1}`}
                                                fill
                                                sizes="100vw"
                                                className="object-contain"
                                                priority={dist === 0}
                                            />
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Navigation Arrows */}
                            {!modalZoom && total > 1 && (
                                <>
                                    <button
                                        type="button"
                                        aria-label="Imagen anterior"
                                        onClick={(e) => { e.stopPropagation(); setModalIdx((modalIdx - 1 + total) % total); }}
                                        className="s-glass-btn s-glass-btn--lg absolute left-4 z-10"
                                    >
                                        <ChevronLeft size={22} />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Siguiente imagen"
                                        onClick={(e) => { e.stopPropagation(); setModalIdx((modalIdx + 1) % total); }}
                                        className="s-glass-btn s-glass-btn--lg absolute right-4 z-10"
                                    >
                                        <ChevronRight size={22} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnails Strip */}
                        {total > 1 && (
                            <div className="s-lightbox__thumbs">
                                {property.imageUrls.map((url, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        aria-label={`Ver imagen ${idx + 1}`}
                                        aria-current={idx === modalIdx}
                                        onClick={(e) => { e.stopPropagation(); setModalIdx(idx); }}
                                        className="s-lightbox__thumb"
                                    >
                                        <Image src={url} alt="" fill sizes="100px" className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                );
            })()}

            <ContactModal
                isOpen={showContactModal}
                onClose={() => setShowContactModal(false)}
                propertyId={property.id}
                propertyTitle={displayTitle}
                ownerId={property.userId}
                agencyId={property.agency?.uid}
            />
        </main>
    );
}
