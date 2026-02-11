"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TUTORIALS, Tutorial } from "@/infrastructure/data/tutorials";
import { ChevronLeft, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { use } from "react";

export default function TutorialDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const router = useRouter();
    // Use React.use() to unwrap params
    const resolvedParams = use(params);
    const [tutorial, setTutorial] = useState<Tutorial | null>(null);

    useEffect(() => {
        const found = TUTORIALS.find(t => t.id === resolvedParams.slug);
        if (found) {
            setTutorial(found);
        } else {
            router.push('/dashboard/tutoriales');
        }
    }, [resolvedParams.slug, router]);

    if (!tutorial) return null;

    const Icon = tutorial.icon;

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-8">
            <Link
                href="/dashboard/tutoriales"
                className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-6 group"
            >
                <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                Volver a tutoriales
            </Link>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 md:p-12 text-white">
                    <div className="flex items-start gap-6">
                        <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl shadow-inner">
                            <Icon className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-4">{tutorial.title}</h1>
                            <p className="text-indigo-100 text-lg max-w-2xl">{tutorial.description}</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 md:p-12">
                    <div className="space-y-12">
                        {tutorial.steps.map((step, index) => (
                            <div key={index} className="relative pl-10 md:pl-16">
                                {/* Connector Line */}
                                {index !== tutorial.steps.length - 1 && (
                                    <div className="absolute left-[19px] md:left-[27px] top-10 bottom-0 w-0.5 bg-indigo-100"></div>
                                )}

                                {/* Step Number */}
                                <div className="absolute left-0 top-0 w-10 h-10 md:w-14 md:h-14 bg-indigo-50 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 font-bold text-indigo-600 text-sm md:text-lg">
                                    {index + 1}
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-6 md:p-8 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100">
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                                    <div className="prose prose-indigo text-gray-600 max-w-none">
                                        <p>{step.description}</p>
                                    </div>
                                    {/* Placeholder for image */}
                                    {/* <div className="mt-4 h-48 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                                        Imagen explicativa
                                    </div> */}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 bg-green-50 rounded-2xl p-8 text-center border border-green-100">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Tutorial Completado!</h3>
                        <p className="text-gray-600 mb-6">Ahora estás listo para utilizar esta funcionalidad.</p>
                        <Link
                            href="/dashboard"
                            className="inline-flex px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                        >
                            Ir al Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
