"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TUTORIALS } from "@/infrastructure/data/tutorials";
import { Search, ChevronRight, Play, BookOpen, Star } from "lucide-react";

const CATEGORIES = [
    { id: 'all', label: 'Todos' },
    { id: 'alquileres', label: 'Alquileres' },
    { id: 'propiedades', label: 'Propiedades' },
    { id: 'clientes', label: 'CRM / Clientes' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'ia', label: 'Herramientas IA' },
];

export default function TutorialsPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");

    const filteredTutorials = TUTORIALS.filter(tutorial => {
        const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tutorial.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === "all" || tutorial.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const featuredTutorial = TUTORIALS[0];

    return (
        <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto space-y-10 group/page">
            
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-wider">
                        <BookOpen size={16} />
                        Learning Center
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                        Domina <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Zeta Prop</span>
                    </h1>
                    <p className="text-gray-500 text-lg max-w-2xl">
                        Aprende a potenciar tu inmobiliaria con guías interactivas paso a paso.
                    </p>
                </div>

                <div className="relative w-full lg:w-96 group/search">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/search:text-indigo-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="¿Qué quieres aprender hoy?"
                        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-gray-700 placeholder:text-gray-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Featured Tutorial */}
            {searchTerm === "" && activeCategory === "all" && (
                <div 
                    onClick={() => router.push(`/dashboard/tutoriales/${featuredTutorial.id}`)}
                    className="relative overflow-hidden rounded-[2.5rem] bg-indigo-600 p-8 md:p-12 text-white cursor-pointer group/featured hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500"
                >
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover/featured:scale-150 transition-transform duration-1000" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                        <div className="w-20 h-20 md:w-28 md:h-28 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center shrink-0 shadow-inner group-hover/featured:scale-110 group-hover/featured:rotate-3 transition-all duration-500">
                            <featuredTutorial.icon className="w-10 h-10 md:w-14 md:h-14" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <Star size={12} fill="currentColor" />
                                    Recomendado
                                </span>
                                <span className="text-indigo-100 text-sm font-medium">{featuredTutorial.steps.length} pasos</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
                                {featuredTutorial.title}
                            </h2>
                            <p className="text-indigo-50 text-base md:text-lg mb-8 max-w-xl opacity-90 leading-relaxed font-medium">
                                {featuredTutorial.description}
                            </p>
                            <button className="bg-white text-indigo-600 px-8 py-3.5 rounded-2xl font-black shadow-xl shadow-indigo-900/20 flex items-center gap-2 hover:bg-gray-50 transition-all hover:scale-105 active:scale-95">
                                <Play size={18} fill="currentColor" />
                                Comenzar ahora
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Categories & Listing */}
            <div className="space-y-8">
                <div className="flex flex-wrap gap-2 pb-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                                activeCategory === cat.id 
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 lg:scale-110" 
                                : "bg-white border-gray-100 text-gray-500 hover:border-indigo-200 hover:text-indigo-600"
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTutorials.map((tutorial) => (
                        <div
                            key={tutorial.id}
                            onClick={() => router.push(`/dashboard/tutoriales/${tutorial.id}`)}
                            className="group bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-2 transition-all duration-300 cursor-pointer relative flex flex-col items-start text-left"
                        >
                            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-50 group-hover:scale-110 transition-all duration-500 shadow-inner">
                                <tutorial.icon size={28} />
                            </div>

                            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-indigo-400 mb-3 block">
                                {tutorial.category === 'ia' ? 'Inteligencia Artificial' : tutorial.category} • {tutorial.steps.length} pasos
                            </span>

                            <h3 className="text-2xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-indigo-600 transition-colors">
                                {tutorial.title}
                            </h3>

                            <p className="text-gray-500 text-sm leading-relaxed mb-6 font-medium">
                                {tutorial.description}
                            </p>

                            <div className="mt-auto flex items-center text-sm font-bold text-indigo-600 group-hover:gap-3 transition-all">
                                Ver guía completa <ChevronRight size={18} className="translate-y-[0.5px]" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {filteredTutorials.length === 0 && (
                <div className="text-center py-24 bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200">
                    <div className="bg-white w-20 h-20 rounded-[2rem] shadow-sm flex items-center justify-center mx-auto mb-6">
                        <Search className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">No encontramos ese tutorial</h3>
                    <p className="text-gray-500 font-medium">Prueba con otros términos o cambia la categoría.</p>
                </div>
            )}
        </div>
    );
}
