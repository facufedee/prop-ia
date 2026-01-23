"use client";

import { useState } from "react";
import { Search, MapPin, Building2, Home, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { PublicProperty } from "@/infrastructure/services/publicService";
import PropertiesGrid from "./PropertiesGrid";

interface PortalHomeProps {
    onSearch: (filters: any) => void;
    featuredProperties: PublicProperty[];
    loading?: boolean;
}

export default function PortalHome({ onSearch, featuredProperties, loading }: PortalHomeProps) {
    const [operationType, setOperationType] = useState("Venta");
    const [propertyType, setPropertyType] = useState("Departamento");
    const [location, setLocation] = useState("");

    const handleSearch = () => {
        onSearch({
            operationType,
            propertyType: propertyType === "Todos" ? "" : propertyType, // Map logic
            searchQuery: location
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Hero Section */}
            <section className="relative bg-white pt-32 pb-20 px-4 shadow-sm border-b border-gray-100">
                <div className="max-w-5xl mx-auto">

                    {/* Search Box Container */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 md:p-4 relative z-10 -mt-10 overflow-visible">
                        {/* Tabs inside or above? Image 1 has tabs inside dropdowns. Let's make a clean bar. */}
                        <div className="flex flex-col md:flex-row gap-4 p-4">

                            {/* Operation Select */}
                            <div className="relative min-w-[140px]">
                                <select
                                    value={operationType}
                                    onChange={(e) => setOperationType(e.target.value)}
                                    className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                                >
                                    <option value="Venta">Venta</option>
                                    <option value="Alquiler">Alquiler</option>
                                    <option value="Alquiler Temporal">Temporal</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                </div>
                            </div>

                            {/* Property Type Select */}
                            <div className="relative min-w-[180px]">
                                <select
                                    value={propertyType}
                                    onChange={(e) => setPropertyType(e.target.value)}
                                    className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                                >
                                    <option value="Departamento">Departamentos</option>
                                    <option value="Casa">Casas</option>
                                    <option value="PH">PH</option>
                                    <option value="Terreno">Terrenos</option>
                                    <option value="Local">Locales</option>
                                    <option value="Oficina">Oficinas</option>
                                    <option value="Todos">Todos</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                </div>
                            </div>

                            {/* Location Input */}
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Ingresá barrio o ciudad..."
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 py-3 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
                                />
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            </div>

                            {/* Search Button */}
                            <button
                                onClick={handleSearch}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Search className="w-5 h-5" />
                                Buscar
                            </button>
                        </div>

                        {/* Extra Options */}
                        <div className="px-4 pb-2 flex items-center gap-6 text-sm text-gray-500">
                            <label className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition">
                                <div className="w-10 h-6 bg-gray-200 rounded-full relative transition-colors peer-checked:bg-indigo-600">
                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform translate-x-0" />
                                </div>
                                Emprendimientos
                            </label>
                            <button className="hover:text-indigo-600 transition underline decoration-dotted">Búsqueda Avanzada</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Action Cards */}
            <section className="py-12 bg-gray-50">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Card 1: Publicar */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center group cursor-pointer">
                            <div className="w-16 h-16 mx-auto bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Home className="w-8 h-8 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Publicar</h3>
                            <p className="text-gray-500 text-sm mb-4">¿Querés vender o alquilar tu propiedad?</p>
                            <Link href="/dashboard/propiedades/nueva" className="text-indigo-600 font-bold hover:underline flex items-center justify-center gap-1">
                                Mi propiedad <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Card 2: Buscar (Default) */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center group cursor-pointer" onClick={handleSearch}>
                            <div className="w-16 h-16 mx-auto bg-purple-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Search className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Propiedades</h3>
                            <p className="text-gray-500 text-sm mb-4">Encontrá tu próximo hogar hoy</p>
                            <span className="text-purple-600 font-bold hover:underline flex items-center justify-center gap-1">
                                Ver Disponibles <ArrowRight className="w-4 h-4" />
                            </span>
                        </div>

                        {/* Card 3: Emprendimientos */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center group cursor-pointer">
                            <div className="w-16 h-16 mx-auto bg-pink-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Building2 className="w-8 h-8 text-pink-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Invertí</h3>
                            <p className="text-gray-500 text-sm mb-4">Descubrí las mejores oportunidades</p>
                            <Link href="/propiedades?type=emprendimiento" className="text-pink-600 font-bold hover:underline flex items-center justify-center gap-1">
                                Emprendimientos <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                    </div>
                </div>
            </section>

            {/* Featured Properties */}
            <section className="py-12 bg-white flex-1">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                            Propiedades Destacadas
                        </h2>
                        <button onClick={handleSearch} className="text-indigo-600 font-medium hover:underline">Ver todas</button>
                    </div>

                    <PropertiesGrid properties={featuredProperties.slice(0, 4)} loading={loading} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" />
                </div>
            </section>

        </div>
    );
}
