"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search } from "lucide-react";
import { useSite } from "@/app/sites/[slug]/SiteProvider";

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

interface PropertyHeroProps {
    title?: string;
    subtitle?: string;
    coverUrl?: string;
    basePath?: string;
    /** Pass true when used inside a site template (custom domain or subdomain).
     *  Ensures the search routes to /propiedades (site listing) instead of /busqueda (main portal). */
    isSite?: boolean;
}

export default function PropertyHero({
    title = "Encontrá tu hogar ideal",
    subtitle = "Miles de propiedades en venta y alquiler en Argentina",
    coverUrl = "/hero-propiedades.png",
    basePath: propBasePath,
    isSite = false,
}: PropertyHeroProps) {
    const router = useRouter();
    const { basePath: contextBasePath } = useSite();
    const basePath = propBasePath || contextBasePath || "";

    // Hero search state
    const [operacion, setOperacion] = useState<"Alquiler" | "Comprar">("Comprar");
    const [tipo, setTipo] = useState("");
    const [ubicacion, setUbicacion] = useState("");

    const handleSearch = () => {
        const params = new URLSearchParams();
        const op = operacion === "Comprar" ? "venta" : "alquiler";
        params.set("operacion", op);
        if (tipo) params.set("tipo", tipo);
        if (ubicacion.trim()) params.set("loc", ubicacion.trim());

        // On a site (custom domain or subdomain), basePath may be "" but we still
        // need to go to /propiedades (middleware rewrites it to /sites/slug/propiedades).
        // On the main portal without isSite, fall back to /busqueda.
        const searchPath = isSite ? `${basePath}/propiedades` : basePath ? `${basePath}/propiedades` : "/busqueda";
        router.push(`${searchPath}?${params.toString()}`);
    };

    return (
        <section
            aria-label="Buscador de propiedades"
            className="relative w-full min-h-[540px] md:h-[500px] pt-32 pb-16 md:py-0 flex flex-col md:flex-row items-center justify-center overflow-hidden"
        >
            {/* Background Image */}
            <Image
                src={coverUrl}
                alt={title}
                fill
                className="object-cover object-center"
                priority
                sizes="100vw"
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/60" />

            <div className="relative z-10 w-full max-w-3xl mx-auto px-4 text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                    {title}
                </h1>
                <p className="text-white/80 text-lg mb-8 drop-shadow">
                    {subtitle}
                </p>

                {/* Search Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mx-2 sm:mx-0">
                    {/* Tabs */}
                    <div className="flex" role="tablist">
                        {(["Comprar", "Alquiler"] as const).map(op => (
                            <button
                                key={op}
                                onClick={() => setOperacion(op)}
                                role="tab"
                                aria-selected={operacion === op}
                                aria-label={`Operación de ${op}`}
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
                            <label htmlFor="property-type-select" className="sr-only">Tipo de inmueble</label>
                            <select
                                id="property-type-select"
                                value={tipo}
                                onChange={e => setTipo(e.target.value)}
                                aria-label="Seleccionar tipo de inmueble"
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
                            <label htmlFor="location-search-input" className="sr-only">Ubicación o características</label>
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 md:w-4 md:h-4" aria-hidden="true" />
                            <input
                                id="location-search-input"
                                type="text"
                                placeholder="Buscar ubicación o características..."
                                value={ubicacion}
                                onChange={e => setUbicacion(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleSearch()}
                                aria-label="Buscar ubicación o características"
                                className="w-full h-[52px] md:h-12 pl-11 md:pl-10 pr-4 text-[15px] text-gray-800 bg-gray-50 md:bg-transparent border border-gray-200 md:border-none rounded-xl md:rounded-none focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-400"
                            />
                        </div>

                        {/* Search button */}
                        <button
                            onClick={handleSearch}
                            aria-label="Ejecutar búsqueda"
                            className="w-full md:w-auto shrink-0 h-[52px] md:h-12 px-8 mt-1 md:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl md:rounded-lg transition-colors text-[15px] md:ml-2 flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/20 active:scale-[0.98]"
                        >
                            <Search className="w-4 h-4 md:hidden" aria-hidden="true" />
                            Buscar
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
