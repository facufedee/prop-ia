"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TUTORIALS } from "@/infrastructure/data/tutorials";
import { Search, ChevronRight } from "lucide-react";

export default function TutorialsPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");

    const filteredTutorials = TUTORIALS.filter(tutorial =>
        tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutorial.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Centro de Aprendizaje</h1>
                    <p className="text-gray-600">Guías paso a paso para dominar todas las funciones de Zeta Prop.</p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar tutorial..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTutorials.map((tutorial) => (
                    <div
                        key={tutorial.id}
                        onClick={() => router.push(`/dashboard/tutoriales/${tutorial.id}`)}
                        className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity -mr-2">
                            <ChevronRight className="w-5 h-5 text-indigo-400" />
                        </div>

                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                            <tutorial.icon className="w-6 h-6" />
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-700 transition-colors">
                            {tutorial.title}
                        </h3>

                        <p className="text-gray-500 text-sm leading-relaxed mb-4">
                            {tutorial.description}
                        </p>

                        <div className="flex items-center text-sm font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                            Ver tutorial <ChevronRight className="w-4 h-4 ml-1" />
                        </div>
                    </div>
                ))}
            </div>

            {filteredTutorials.length === 0 && (
                <div className="text-center py-20">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No se encontraron tutoriales</h3>
                    <p className="text-gray-500">Intenta con otros términos de búsqueda.</p>
                </div>
            )}
        </div>
    );
}
