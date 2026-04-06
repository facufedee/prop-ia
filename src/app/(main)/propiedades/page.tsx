import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Calendar, BookOpen, MapPin, ArrowRight, Home, Building2, TreePine, Warehouse } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { publicServerService } from "@/infrastructure/services/publicServerService";
import PropertyHero from "@/ui/components/properties/public/PropertyHero";
import PropertyPublicCard from "@/ui/components/properties/public/PropertyPublicCard";

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

export default async function PropiedadesLandingPage() {
    // Fetch data on the server
    const featured = await publicServerService.getFeaturedProperties(8);
    const posts = await publicServerService.getPublishedBlogPosts(4);

    const formatPostDate = (date: any) => {
        if (!date) return "";
        const d = new Date(date);
        return format(d, "dd MMM yyyy", { locale: es });
    };

    return (
        <main className="min-h-screen bg-gray-50">

            {/* ═══ HERO ═══════════════════════════════════════════════════ */}
            <PropertyHero />

            {/* ═══ CATEGORÍAS RÁPIDAS ════════════════════════════════════ */}
            <section aria-label="Categorías de propiedades" className="container mx-auto px-4 max-w-6xl mt-8 md:-mt-6 relative z-10 mb-12">
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
            <section aria-label="Propiedades destacadas" className="container mx-auto px-4 max-w-7xl mb-16">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Propiedades Destacadas</h2>
                        <p className="text-sm text-gray-500 mt-1">Una selección de las mejores propiedades disponibles en Argentina</p>
                    </div>
                    <Link
                        href="/busqueda"
                        className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                        Ver todas <ChevronRight size={16} aria-hidden="true" />
                    </Link>
                </div>

                {featured.length > 0 ? (
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
            <section aria-label="Zonas populares" className="bg-white py-14 mb-16">
                <div className="container mx-auto px-4 max-w-6xl">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Zonas Populares</h2>
                    <p className="text-sm text-gray-500 mb-8">Explorá propiedades en las ubicaciones más buscadas de Buenos Aires y GBA</p>
                    <nav aria-label="Búsquedas por zona">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            {POPULAR_ZONES.map(zona => (
                                <Link
                                    key={zona}
                                    href={`/busqueda?loc=${encodeURIComponent(zona)}`}
                                    title={`Propiedades en ${zona}`}
                                    className="group flex items-center justify-between p-4 bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 rounded-xl transition-all"
                                >
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">
                                        <MapPin size={12} className="inline mr-1 text-gray-400 group-hover:text-indigo-400" aria-hidden="true" />
                                        {zona}
                                    </span>
                                    <ArrowRight size={13} className="text-gray-300 group-hover:text-indigo-500 transition-colors" aria-hidden="true" />
                                </Link>
                            ))}
                        </div>
                    </nav>
                </div>
            </section>

            {/* ═══ TEXTO SEO ESTÁTICO ════════════════════════════════════ */}
            <section aria-label="Información sobre el portal" className="bg-gray-50 py-12 border-t border-gray-100">
                <div className="container mx-auto px-4 max-w-5xl">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Encontrá propiedades en venta y alquiler en Argentina</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600 leading-relaxed">
                        <div>
                            <h3 className="font-semibold text-gray-700 mb-2">Casas y departamentos</h3>
                            <p>Explorá una amplia selección de <strong>casas en venta</strong>, <strong>departamentos en alquiler</strong> y PH en Buenos Aires, GBA y todo el interior del país.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-700 mb-2">Inmuebles comerciales</h3>
                            <p>Encontrá <strong>locales comerciales</strong>, oficinas, galpones y depósitos para alquilar o comprar. La mejor oferta de inmuebles comerciales en Argentina.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-700 mb-2">Terrenos e inversiones</h3>
                            <p>Descubrí <strong>terrenos y lotes</strong> en las mejores ubicaciones para construir o invertir. Quintas vacacionales y propiedades rurales en todo el país.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ BLOG / RECURSOS ════════════════════════════════════════ */}
            {posts.length > 0 && (
                <section aria-label="Guías y recursos inmobiliarios" className="container mx-auto px-4 max-w-7xl mb-16">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Guías y Recursos</h2>
                            <p className="text-sm text-gray-500 mt-1">Todo lo que necesitás saber sobre el mercado inmobiliario</p>
                        </div>
                        <Link href="/blog" className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                            Ver blog <ChevronRight size={16} aria-hidden="true" />
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
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                                        <BookOpen className="w-10 h-10 text-indigo-400" aria-hidden="true" />
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
                                            <Calendar size={11} aria-hidden="true" />
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
            <section aria-label="Publicá tu inmobiliaria" className="py-16 mb-8">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 p-10 md:p-14 text-white text-center shadow-xl">
                        {/* Background decorative circles */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" aria-hidden="true" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" aria-hidden="true" />

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
        </main>
    );
}
