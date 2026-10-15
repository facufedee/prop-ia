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
                    <div className="flex items-center gap-2 text-[var(--color-accent)] font-bold text-sm uppercase tracking-wider">
                        <BookOpen strokeWidth={1.5} size={16} />
                        Learning Center
                    </div>
                    <h1 className="font-heading text-4xl font-black text-[var(--color-ink)] tracking-tight">
                        Domina <span className="text-transparent bg-clip-text">Zeta Prop</span>
                    </h1>
                    <p className="text-[var(--color-muted)] text-lg max-w-2xl">
                        Aprende a potenciar tu inmobiliaria con guías interactivas paso a paso.
                    </p>
                </div>

                <div className="relative w-full lg:w-96 group/search">
                    <Search strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-neutral)] group-focus-within/search:text-[var(--color-accent)] transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="¿Qué quieres aprender hoy?"
                        className="w-full pl-12 pr-4 py-4 bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]/10 focus:border-[var(--color-accent)] transition-all text-[var(--color-ink-2)] placeholder:text-[var(--color-neutral)]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Featured Tutorial */}
            {searchTerm === "" && activeCategory === "all" && (
                <div 
                    onClick={() => router.push(`/dashboard/tutoriales/${featuredTutorial.id}`)}
                    className="relative overflow-hidden rounded-[2.5rem] bg-[var(--color-paper-2)] border border-[var(--color-rule)] p-8 md:p-12 text-[var(--color-ink)] cursor-pointer group/featured hover:border-[var(--color-accent)]/40 transition-all duration-500"
                >
                    
                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                        <div className="w-20 h-20 md:w-28 md:h-28 bg-[var(--color-paper-3)] rounded-full flex items-center justify-center shrink-0 text-[var(--color-muted)]">
                            <featuredTutorial.icon strokeWidth={1.5} className="w-10 h-10 md:w-14 md:h-14" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                                <span className="border border-[var(--color-accent)]/40 text-[var(--color-accent)] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <Star strokeWidth={1.5} size={12} fill="currentColor" />
                                    Recomendado
                                </span>
                                <span className="text-[var(--color-muted)] text-sm font-medium">{featuredTutorial.steps.length} pasos</span>
                            </div>
                            <h2 className="font-heading text-3xl md:text-4xl font-black mb-4 leading-tight">
                                {featuredTutorial.title}
                            </h2>
                            <p className="text-[var(--color-muted)] text-base md:text-lg mb-8 max-w-xl leading-relaxed font-medium">
                                {featuredTutorial.description}
                            </p>
                            <button className="bg-[var(--color-ink)] text-[var(--color-paper)] px-8 py-3.5 rounded-2xl font-black flex items-center gap-2 hover:bg-[var(--color-ink-2)] transition-all active:scale-95">
                                <Play strokeWidth={1.5} size={18} fill="currentColor" />
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
                                ? "bg-[var(--color-ink)] border-[var(--color-ink)] text-[var(--color-paper)]" 
                                : "bg-[var(--color-paper-2)] border-[var(--color-rule)] text-[var(--color-muted)] hover:border-[var(--color-neutral)] hover:text-[var(--color-ink)]"
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
                            className="group bg-[var(--color-paper-2)] rounded-[2rem] border border-[var(--color-rule-2)] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer relative flex flex-col items-start text-left"
                        >
                            <div className="w-14 h-14 bg-[var(--color-paper-3)] rounded-full flex items-center justify-center text-[var(--color-muted)] mb-6">
                                <tutorial.icon size={28} strokeWidth={1.5} />
                            </div>

                            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--color-muted)] mb-3 block">
                                {tutorial.category === 'ia' ? 'Inteligencia Artificial' : tutorial.category} • {tutorial.steps.length} pasos
                            </span>

                            <h3 className="text-2xl font-bold text-[var(--color-ink)] mb-3 leading-tight group-hover:text-[var(--color-accent)] transition-colors">
                                {tutorial.title}
                            </h3>

                            <p className="text-[var(--color-muted)] text-sm leading-relaxed mb-6 font-medium">
                                {tutorial.description}
                            </p>

                            <div className="mt-auto flex items-center text-sm font-bold text-[var(--color-accent)] group-hover:gap-3 transition-all">
                                Ver guía completa <ChevronRight strokeWidth={1.5} size={18} className="translate-y-[0.5px]" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {filteredTutorials.length === 0 && (
                <div className="text-center py-24 bg-[var(--color-paper)]/50 rounded-[3rem] border border-dashed border-[var(--color-rule)]">
                    <div className="bg-[var(--color-paper-2)] w-20 h-20 rounded-[2rem] shadow-sm flex items-center justify-center mx-auto mb-6">
                        <Search strokeWidth={1.5} className="w-8 h-8 text-[var(--color-neutral)]" />
                    </div>
                    <h3 className="text-2xl font-black text-[var(--color-ink)] mb-2">No encontramos ese tutorial</h3>
                    <p className="text-[var(--color-muted)] font-medium">Prueba con otros términos o cambia la categoría.</p>
                </div>
            )}
        </div>
    );
}
