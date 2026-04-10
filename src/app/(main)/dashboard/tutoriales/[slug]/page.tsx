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
        <div className="min-h-screen bg-gray-50/30">
            {/* Top Bar Navigation */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link
                        href="/dashboard/tutoriales"
                        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-bold transition-all group"
                    >
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="hidden sm:inline">Volver a Tutoriales</span>
                    </Link>
                    
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-inner">
                            <Icon size={20} />
                        </div>
                        <h1 className="text-lg font-black text-gray-900 truncate max-w-[200px] sm:max-w-md">
                            {tutorial.title}
                        </h1>
                    </div>

                    <div className="w-[100px] hidden sm:flex justify-end">
                        <span className="text-xs font-black text-indigo-400 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
                            {Math.round((activeStep / (tutorial.steps.length - 1)) * 100)}%
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start">
                    
                    {/* Left Sidebar Navigation */}
                    <aside className="hidden lg:block sticky top-28 space-y-6">
                        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gray-50" />
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 pl-2">Pasos de la Guía</h3>
                            <div className="space-y-4">
                                {tutorial.steps.map((step, index) => (
                                    <button
                                        key={index}
                                        onClick={() => scrollToStep(index)}
                                        className={`w-full flex items-start gap-3 p-3 rounded-2xl transition-all text-left relative group
                                            ${activeStep === index 
                                                ? "bg-indigo-50 text-indigo-700 font-bold translate-x-1 shadow-sm" 
                                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}
                                        `}
                                    >
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] shrink-0 font-black border-2
                                            ${activeStep === index 
                                                ? "bg-indigo-600 border-indigo-600 text-white" 
                                                : "bg-white border-gray-200 text-gray-300 group-hover:border-indigo-300 group-hover:text-indigo-500"}
                                        `}>
                                            {index + 1}
                                        </div>
                                        <span className="text-sm leading-tight pt-0.5 line-clamp-2">
                                            {step.title}
                                        </span>
                                        {activeStep === index && (
                                            <div className="absolute left-[-1.5rem] top-1/2 -translate-y-1/2 w-1.5 h-6 bg-indigo-600 rounded-r-full shadow-[2px_0_8px_rgba(79,70,229,0.4)]" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-900/10 group overflow-hidden relative">
                            <div className="relative z-10">
                                <h4 className="font-black mb-2 flex items-center gap-2">
                                    <PlayCircle size={18} />
                                    ¿Necesitas ayuda?
                                </h4>
                                <p className="text-indigo-100 text-xs leading-relaxed mb-4">
                                    Si tienes dudas sobre este proceso, contacta con soporte prioritario.
                                </p>
                                <Link 
                                    href="/dashboard/soporte"
                                    className="block w-full text-center bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-xl py-2 text-xs font-black transition-all border border-white/20"
                                >
                                    Abrir Ticket
                                </Link>
                            </div>
                            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="space-y-12 pb-24">
                        {/* Header Intro */}
                        <div className="space-y-4">
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100">
                                <Layout size={14} />
                                Tutorial Paso a Paso
                            </span>
                            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                                {tutorial.title}
                            </h2>
                            <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-3xl">
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
                                            <div className={`w-14 h-14 rounded-[1.25rem] shadow-xl flex items-center justify-center font-black text-xl border-4 border-white transition-all
                                                ${activeStep === index 
                                                    ? "bg-indigo-600 text-white shadow-indigo-200 lg:scale-110" 
                                                    : "bg-white text-gray-300 shadow-gray-100"}
                                            `}>
                                                {index + 1}
                                            </div>
                                            {index !== tutorial.steps.length - 1 && (
                                                <div className="w-1 h-32 bg-gray-100 mt-4 rounded-full" />
                                            )}
                                        </div>

                                        <div className={`flex-1 bg-white rounded-[2.5rem] border border-gray-100 p-8 md:p-12 shadow-sm transition-all duration-500
                                            ${activeStep === index ? "shadow-2xl shadow-indigo-500/5 ring-1 ring-indigo-50 border-indigo-100" : ""}
                                        `}>
                                            <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-6 flex items-center gap-4">
                                                {step.title}
                                                {activeStep === index && <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />}
                                            </h3>
                                            <div className="prose prose-lg prose-indigo max-w-none text-gray-600 font-medium leading-loose">
                                                <p>{step.description}</p>
                                            </div>

                                            {/* Action Button for specific steps */}
                                            {index === 0 && (
                                                <div className="mt-10 p-6 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                                            <ArrowRight className="text-indigo-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none mb-1">¡Ahorrá tiempo!</p>
                                                            <p className="text-gray-500 text-sm font-medium">Ir directamente a este módulo ahora.</p>
                                                        </div>
                                                    </div>
                                                    <Link 
                                                        href={tutorial.id.includes('propiedades') ? '/dashboard/propiedades' : 
                                                              tutorial.id.includes('alquileres') ? '/dashboard/alquileres' : 
                                                              tutorial.id.includes('clientes') ? '/dashboard/clientes' : '/dashboard'}
                                                        className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 whitespace-nowrap"
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
                        <div className="bg-white rounded-[3rem] border border-gray-100 p-12 md:p-20 text-center shadow-2xl shadow-indigo-500/5 relative overflow-hidden group/final">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-white pointer-events-none" />
                            <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 group-hover/final:scale-150 transition-transform duration-1000" />
                            
                            <div className="relative z-10 space-y-8">
                                <div className="w-24 h-24 bg-green-500 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-green-200 group-hover/final:scale-110 group-hover/final:rotate-6 transition-all duration-500">
                                    <CheckCircle2 size={48} />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-4xl font-black text-gray-900 tracking-tight">¡Guía Completada!</h3>
                                    <p className="text-lg text-gray-500 font-medium max-w-md mx-auto">
                                        Ahora dominas la <span className="text-indigo-600 font-bold">{tutorial.title}</span>.
                                        ¿Estás listo para el siguiente nivel?
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <Link
                                        href="/dashboard/tutoriales"
                                        className="w-full sm:w-auto px-8 py-4 bg-gray-50 text-gray-700 font-black rounded-2xl hover:bg-gray-100 transition-all border border-gray-100"
                                    >
                                        Ver otros tutoriales
                                    </Link>
                                    <Link
                                        href="/dashboard"
                                        className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2"
                                    >
                                        Ir al Dashboard principal
                                        <ArrowRight size={20} />
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
