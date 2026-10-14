"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { TUTORIALS, Tutorial } from "@/infrastructure/data/tutorials";
import { ChevronLeft, CheckCircle2, PlayCircle, ArrowRight, Layout, Key, Home, Users, Search } from "lucide-react";
import Link from "next/link";
import { use } from "react";

export default function TutorialDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const [tutorial, setTutorial] = useState<Tutorial | null>(null);
    const [activeStep, setActiveStep] = useState(0);
    const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const found = TUTORIALS.find(t => t.id === resolvedParams.slug);
        if (found) {
            setTutorial(found);
        } else {
            router.push('/dashboard/tutoriales');
        }
    }, [resolvedParams.slug, router]);

    // Handle scroll to highlight active step
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 200;
            const currentStep = stepRefs.current.findIndex((ref, index) => {
                if (!ref) return false;
                const top = ref.offsetTop;
                const bottom = top + ref.offsetHeight;
                return scrollPosition >= top && scrollPosition < bottom;
            });
            if (currentStep !== -1) setActiveStep(currentStep);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [tutorial]);

    if (!tutorial) return null;

    const Icon = tutorial.icon;

    const scrollToStep = (index: number) => {
        const ref = stepRefs.current[index];
        if (ref) {
            window.scrollTo({
                top: ref.offsetTop - 100,
                behavior: "smooth"
            });
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-paper)]/30">
            {/* Top Bar Navigation */}
            <div className="sticky top-0 z-30 bg-[var(--color-paper-2)]/80 backdrop-blur-md border-b border-[var(--color-rule-2)] px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link
                        href="/dashboard/tutoriales"
                        className="flex items-center gap-2 text-[var(--color-muted)] hover:text-[var(--color-accent-2)] font-bold transition-all group"
                    >
                        <ChevronLeft strokeWidth={1.5} size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="hidden sm:inline">Volver a Tutoriales</span>
                    </Link>
                    
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--color-paper-3)] rounded-full flex items-center justify-center text-[var(--color-muted)] shadow-inner">
                            <Icon strokeWidth={1.5} size={20} />
                        </div>
                        <h1 className="font-heading text-lg font-black text-[var(--color-ink)] truncate max-w-[200px] sm:max-w-md">
                            {tutorial.title}
                        </h1>
                    </div>

                    <div className="w-[100px] hidden sm:flex justify-end">
                        <span className="text-xs font-black text-[var(--color-accent)] uppercase tracking-widest bg-[var(--color-accent-soft)] px-3 py-1 rounded-full">
                            {Math.round((activeStep / (tutorial.steps.length - 1)) * 100)}%
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start">
                    
                    {/* Left Sidebar Navigation */}
                    <aside className="hidden lg:block sticky top-28 space-y-6">
                        <div className="bg-[var(--color-paper-2)] rounded-[2rem] border border-[var(--color-rule-2)] p-6 shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-paper)]" />
                            <h3 className="text-xs font-black text-[var(--color-neutral)] uppercase tracking-[0.2em] mb-6 pl-2">Pasos de la Guía</h3>
                            <div className="space-y-4">
                                {tutorial.steps.map((step, index) => (
                                    <button
                                        key={index}
                                        onClick={() => scrollToStep(index)}
                                        className={`w-full flex items-start gap-3 p-3 rounded-2xl transition-all text-left relative group
                                            ${activeStep === index 
                                                ? "bg-[var(--color-paper-3)] text-[var(--color-ink)] font-bold translate-x-1" 
                                                : "text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)]"}
                                        `}
                                    >
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] shrink-0 font-black border-2
                                            ${activeStep === index 
                                                ? "bg-[var(--color-ink)] border-[var(--color-ink)] text-[var(--color-paper)]" 
                                                : "bg-[var(--color-paper-2)] border-[var(--color-rule)] text-[var(--color-neutral)] group-hover:border-[var(--color-accent)]/30 group-hover:text-[var(--color-accent-2)]"}
                                        `}>
                                            {index + 1}
                                        </div>
                                        <span className="text-sm leading-tight pt-0.5 line-clamp-2">
                                            {step.title}
                                        </span>
                                        {activeStep === index && (
                                            <div className="absolute left-[-1.5rem] top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[var(--color-accent)] rounded-r-full" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[2rem] p-6 text-[var(--color-ink)] group overflow-hidden relative">
                            <div className="relative z-10">
                                <h4 className="font-black mb-2 flex items-center gap-2">
                                    <PlayCircle strokeWidth={1.5} size={18} />
                                    ¿Necesitas ayuda?
                                </h4>
                                <p className="text-[var(--color-muted)] text-xs leading-relaxed mb-4">
                                    Si tienes dudas sobre este proceso, contacta con soporte prioritario.
                                </p>
                                <Link 
                                    href="/dashboard/soporte"
                                    className="block w-full text-center bg-[var(--color-ink)] hover:bg-[var(--color-ink-2)] text-[var(--color-paper)] rounded-xl py-2 text-xs font-black transition-all"
                                >
                                    Abrir Ticket
                                </Link>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="space-y-12 pb-24">
                        {/* Header Intro */}
                        <div className="space-y-4">
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--color-accent-soft)] text-[var(--color-accent)] rounded-full text-xs font-black uppercase tracking-widest border border-[var(--color-accent)]/30">
                                <Layout strokeWidth={1.5} size={14} />
                                Tutorial Paso a Paso
                            </span>
                            <h2 className="text-4xl sm:text-5xl font-black text-[var(--color-ink)] tracking-tight leading-tight">
                                {tutorial.title}
                            </h2>
                            <p className="text-xl text-[var(--color-muted)] font-medium leading-relaxed max-w-3xl">
                                {tutorial.description}
                            </p>
                        </div>

                        {/* Steps Loop */}
                        <div className="space-y-16">
                            {tutorial.steps.map((step, index) => (
                                <div 
                                    key={index} 
                                    ref={el => { stepRefs.current[index] = el; }}
                                    className={`relative group transition-all duration-500
                                        ${activeStep === index ? "opacity-100 scale-100" : "opacity-40 scale-[0.98] blur-[0.5px] hover:blur-0 hover:opacity-100"}
                                    `}
                                >
                                    <div className="flex flex-col md:flex-row gap-8 items-start">
                                        <div className="flex flex-col items-center shrink-0">
                                            <div className={`w-14 h-14 rounded-[1.25rem] shadow-xl flex items-center justify-center font-black text-xl border-4 border-[var(--color-paper-2)] transition-all
                                                ${activeStep === index 
                                                    ? "bg-[var(--color-ink)] text-[var(--color-paper)] lg:scale-110" 
                                                    : "bg-[var(--color-paper-2)] text-[var(--color-neutral)]"}
                                            `}>
                                                {index + 1}
                                            </div>
                                            {index !== tutorial.steps.length - 1 && (
                                                <div className="w-1 h-32 bg-[var(--color-paper-3)] mt-4 rounded-full" />
                                            )}
                                        </div>

                                        <div className={`flex-1 bg-[var(--color-paper-2)] rounded-[2.5rem] border border-[var(--color-rule-2)] p-8 md:p-12 shadow-sm transition-all duration-500
                                            ${activeStep === index ? "shadow-2xl ring-1 ring-[var(--color-accent)]/15 border-[var(--color-accent)]/30" : ""}
                                        `}>
                                            <h3 className="text-2xl md:text-3xl font-black text-[var(--color-ink)] mb-6 flex items-center gap-4">
                                                {step.title}
                                                {activeStep === index && <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-ping" />}
                                            </h3>
                                            <div className="prose prose-lg prose-indigo max-w-none text-[var(--color-ink-2)] font-medium leading-loose">
                                                <p>{step.description}</p>
                                            </div>

                                            {/* Action Button for specific steps */}
                                            {index === 0 && (
                                                <div className="mt-10 p-6 bg-[var(--color-paper)] rounded-3xl border border-[var(--color-rule-2)] flex flex-col sm:flex-row items-center justify-between gap-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-[var(--color-paper-2)] rounded-2xl flex items-center justify-center shadow-sm">
                                                            <ArrowRight strokeWidth={1.5} className="text-[var(--color-accent)]" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-[var(--color-ink)] uppercase tracking-widest leading-none mb-1">¡Ahorrá tiempo!</p>
                                                            <p className="text-[var(--color-muted)] text-sm font-medium">Ir directamente a este módulo ahora.</p>
                                                        </div>
                                                    </div>
                                                    <Link 
                                                        href={tutorial.id.includes('propiedades') ? '/dashboard/propiedades' : 
                                                              tutorial.id.includes('alquileres') ? '/dashboard/alquileres' : 
                                                              tutorial.id.includes('clientes') ? '/dashboard/clientes' : '/dashboard'}
                                                        className="px-6 py-3 bg-[var(--color-ink)] text-[var(--color-paper)] font-bold rounded-2xl hover:bg-[var(--color-ink-2)] transition-all shadow-lg flex items-center gap-2 whitespace-nowrap"
                                                    >
                                                        Abrir {tutorial.id.includes('propiedades') ? 'Propiedades' : 'Alquileres'}
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Completion Card */}
                        <div className="bg-[var(--color-paper-2)] rounded-[3rem] border border-[var(--color-rule-2)] p-12 md:p-20 text-center relative overflow-hidden group/final">
                            <div className="absolute inset-0 pointer-events-none" />
                            
                            <div className="relative z-10 space-y-8">
                                <div className="w-24 h-24 bg-[var(--color-positive-soft)] text-[var(--color-positive)] rounded-full flex items-center justify-center mx-auto transition-all duration-500">
                                    <CheckCircle2 strokeWidth={1.5} size={48} />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-4xl font-black text-[var(--color-ink)] tracking-tight">¡Guía Completada!</h3>
                                    <p className="text-lg text-[var(--color-muted)] font-medium max-w-md mx-auto">
                                        Ahora dominas la <span className="text-[var(--color-accent)] font-bold">{tutorial.title}</span>.
                                        ¿Estás listo para el siguiente nivel?
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <Link
                                        href="/dashboard/tutoriales"
                                        className="w-full sm:w-auto px-8 py-4 bg-[var(--color-paper)] text-[var(--color-ink-2)] font-black rounded-2xl hover:bg-[var(--color-paper-3)] transition-all border border-[var(--color-rule-2)]"
                                    >
                                        Ver otros tutoriales
                                    </Link>
                                    <Link
                                        href="/dashboard"
                                        className="w-full sm:w-auto px-8 py-4 bg-[var(--color-ink)] text-[var(--color-paper)] font-black rounded-2xl hover:bg-[var(--color-ink-2)] transition-all shadow-xl flex items-center justify-center gap-2"
                                    >
                                        Ir al Dashboard principal
                                        <ArrowRight strokeWidth={1.5} size={20} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            <style jsx>{`
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
}
