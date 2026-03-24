"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { PublicProperty, publicService } from "@/infrastructure/services/publicService";
import { BlogPost, blogService } from "@/infrastructure/services/blogService";
import PropertyPublicCard from "@/ui/components/properties/public/PropertyPublicCard";
import { Search, Home, Building2, TreePine, MapPin, Warehouse, ArrowRight, ChevronRight, Calendar, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";

const PROPERTY_TYPES = [
    "Casa",
    "Departamento",
    "PH",
    "Quinta Vacacional",
    "Lote/Terreno",
    "Local comercial",
    "Oficina comercial",
    "Cochera",
    "Edificio",
    "Bodega-Galpon",
    "Depósito",
    "Hotel",
];

const QUICK_CATEGORIES = [
    { label: "Casas", tipo: "Casa", icon: Home, color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
    { label: "Departamentos", tipo: "Departamento", icon: Building2, color: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" },
    { label: "PH", tipo: "PH", icon: Home, color: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100" },
    { label: "Quintas", tipo: "Quinta Vacacional", icon: TreePine, color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" },
    { label: "Terrenos", tipo: "Lote/Terreno", icon: MapPin, color: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" },
    { label: "Locales", tipo: "Local comercial", icon: Warehouse, color: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100" },
];

const POPULAR_ZONES = [
    "Ituzaingó", "Castelar", "Morón", "Ramos Mejía", "Haedo",
    "El Palomar", "Hurlingham", "Villa del Parque", "Palermo", "Belgrano",
];

// Simple shuffle
function shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export default function PropiedadesLandingPage() {
    const router = useRouter();

    // Hero search state
    const [operacion, setOperacion] = useState<"Alquiler" | "Comprar">("Comprar");
    const [tipo, setTipo] = useState("");
    const [ubicacion, setUbicacion] = useState("");

    // Data
    const [featured, setFeatured] = useState<PublicProperty[]>([]);
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loadingProps, setLoadingProps] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(true);

    useEffect(() => {
        publicService.getAllProperties().then(data => {
            const shuffled = shuffleArray(data);
            setFeatured(shuffled.slice(0, 8));
            setLoadingProps(false);
        }).catch(() => setLoadingProps(false));

        blogService.getPublishedPosts().then(data => {
            setPosts(data.slice(0, 4));
            setLoadingPosts(false);
        }).catch(() => setLoadingPosts(false));
    }, []);

    const handleSearch = () => {
        const params = new URLSearchParams();
        const op = operacion === "Comprar" ? "Venta" : "Alquiler";
        params.set("operacion", op);
        if (tipo) params.set("tipo", tipo);
        if (ubicacion.trim()) params.set("loc", ubicacion.trim());
        router.push(`/busqueda?${params.toString()}`);
    };

    const formatPostDate = (date: any) => {
        if (!date) return "";
        const d = date instanceof Timestamp ? date.toDate() : new Date(date);
        return format(d, "dd MMM yyyy", { locale: es });
    };

    return (
        <div className="min-h-screen bg-gray-50">

            {/* ═══ HERO ═══════════════════════════════════════════════════ */}
            <section className="relative w-full min-h-[540px] md:h-[500px] pt-32 pb-16 md:py-0 flex flex-col md:flex-row items-center justify-center overflow-hidden">
                {/* Background Image */}
                <Image
                    src="/hero-propiedades.png"
                    alt="Encontrá tu hogar ideal"
                    fill
                    className="object-cover object-center"
                    priority
                />
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/60" />

                <div className="relative z-10 w-full max-w-3xl mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                        Encontrá tu hogar
                    </h1>
                    <p className="text-white/80 text-lg mb-8 drop-shadow">
                        Miles de propiedades en venta y alquiler en Argentina
                    </p>

                    {/* Search Card */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mx-2 sm:mx-0">
                        {/* Tabs */}
                        <div className="flex">
                            {(["Comprar", "Alquiler"] as const).map(op => (
                                <button
                                    key={op}
                                    onClick={() => setOperacion(op)}
                                    className={`flex-1 py-4 text-sm font-semibold transition-all border-b-2 ${operacion === op
                                        ? "text-indigo-600 border-indigo-600 bg-white"
                                        : "text-gray-500 border-gray-100 bg-gray-50 hover:bg-gray-100/50 hover:text-gray-700"
                                        }`}
                                >
                                    {op}
                                </button>
                            ))}
                        </div>

                        {/* Inputs row */}
                        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-0 p-4 pt-5 md:pt-4">
                            {/* Property type */}
                            <div className="w-full md:w-auto md:shrink-0 relative">
                                <select
                                    value={tipo}
                                    onChange={e => setTipo(e.target.value)}
                                    className="w-full md:w-auto h-[52px] md:h-12 pl-4 pr-10 border border-gray-200 md:border-none rounded-xl md:rounded-none text-[15px] font-medium text-gray-700 bg-gray-50 md:bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer md:min-w-[170px]"
                                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
                                >
                                    <option value="">Tipo de inmueble</option>
                                    {PROPERTY_TYPES.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Divider */}
                            <div className="hidden md:block w-px h-8 bg-gray-200 mx-2 shrink-0" />

                            {/* Location input */}
                            <div className="w-full md:flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 md:w-4 md:h-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar ubicación o características..."
                                    value={ubicacion}
                                    onChange={e => setUbicacion(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleSearch()}
                                    className="w-full h-[52px] md:h-12 pl-11 md:pl-10 pr-4 text-[15px] text-gray-800 bg-gray-50 md:bg-transparent border border-gray-200 md:border-none rounded-xl md:rounded-none focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-400"
                                />
                            </div>

                            {/* Search button */}
                            <button
                                onClick={handleSearch}
                                className="w-full md:w-auto shrink-0 h-[52px] md:h-12 px-8 mt-1 md:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl md:rounded-lg transition-colors text-[15px] md:ml-2 flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/20 active:scale-[0.98]"
                            >
                                <Search className="w-4 h-4 md:hidden" />
                                Buscar
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ CATEGORÍAS RÁPIDAS ════════════════════════════════════ */}
            <section className="container mx-auto px-4 max-w-6xl mt-8 md:-mt-6 relative z-10 mb-12">
                <div className="flex flex-wrap justify-center gap-3">
                    {QUICK_CATEGORIES.map(cat => {
                        const Icon = cat.icon;
                        return (
                            <Link
                                key={cat.label}
                                href={`/busqueda?tipo=${encodeURIComponent(cat.tipo)}`}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold transition-all shadow-sm bg-white hover:shadow-md ${cat.color}`}
                            >
                                <Icon size={16} />
                                {cat.label}
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* ═══ PROPIEDADES DESTACADAS ════════════════════════════════ */}
            <section className="container mx-auto px-4 max-w-7xl mb-16">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Propiedades Destacadas</h2>
                        <p className="text-sm text-gray-500 mt-1">Una selección de las mejores propiedades disponibles</p>
                    </div>
                    <Link
                        href="/busqueda"
                        className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                        Ver todas <ChevronRight size={16} />
                    </Link>
                </div>

                {loadingProps ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden h-[340px] animate-pulse">
                                <div className="h-[220px] bg-gray-200" />
                                <div className="p-4 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : featured.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {featured.map(property => (
                            <PropertyPublicCard key={property.id} property={property} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-400">No hay propiedades disponibles aún.</div>
                )}
            </section>

            {/* ═══ ZONAS POPULARES ═══════════════════════════════════════ */}
            <section className="bg-white py-14 mb-16">
                <div className="container mx-auto px-4 max-w-6xl">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Zonas Populares</h2>
                    <p className="text-sm text-gray-500 mb-8">Explorá propiedades en las ubicaciones más buscadas</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {POPULAR_ZONES.map(zona => (
                            <Link
                                key={zona}
                                href={`/busqueda?loc=${encodeURIComponent(zona)}`}
                                className="group flex items-center justify-between p-4 bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 rounded-xl transition-all"
                            >
                                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">
                                    <MapPin size={12} className="inline mr-1 text-gray-400 group-hover:text-indigo-400" />
                                    {zona}
                                </span>
                                <ArrowRight size={13} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ BLOG / RECURSOS ════════════════════════════════════════ */}
            {!loadingPosts && posts.length > 0 && (
                <section className="container mx-auto px-4 max-w-7xl mb-16">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Guías y Recursos</h2>
                            <p className="text-sm text-gray-500 mt-1">Todo lo que necesitás saber sobre el mercado inmobiliario</p>
                        </div>
                        <Link href="/blog" className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                            Ver blog <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {posts.map(post => (
                            <Link
                                key={post.id}
                                href={`/blog/${post.slug}`}
                                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all"
                            >
                                {post.imageUrl ? (
                                    <div className="relative h-48 overflow-hidden">
                                        <Image
                                            src={post.imageUrl}
                                            alt={post.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                                        <BookOpen className="w-10 h-10 text-indigo-400" />
                                    </div>
                                )}
                                <div className="p-4">
                                    {post.category && (
                                        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">{post.category}</span>
                                    )}
                                    <h3 className="font-semibold text-gray-900 mt-1 line-clamp-2 group-hover:text-indigo-600 transition-colors text-sm">
                                        {post.title}
                                    </h3>
                                    {post.excerpt && (
                                        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{post.excerpt}</p>
                                    )}
                                    {post.publishedAt && (
                                        <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                                            <Calendar size={11} />
                                            {formatPostDate(post.publishedAt)}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* ═══ CTA INMOBILIARIAS ══════════════════════════════════════ */}
            <section className="py-16 mb-8">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 p-10 md:p-14 text-white text-center shadow-xl">
                        {/* Background decorative circles */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                                🏢 Para Inmobiliarias
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                ¿Tenés una inmobiliaria?
                            </h2>
                            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                                Publicá tus propiedades gratis por 14 días en Zeta Prop y llegá a miles de compradores e inquilinos en toda Argentina.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/login"
                                    className="px-8 py-3.5 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-sm"
                                >
                                    Publicá gratis
                                </Link>
                                <Link
                                    href="/contacto"
                                    target="_blank" rel="noopener noreferrer"
                                    className="px-8 py-3.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/30"
                                >
                                    Contactarnos
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}
