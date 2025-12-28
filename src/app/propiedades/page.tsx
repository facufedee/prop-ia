"use client";

import { useEffect, useState } from "react";
import { PublicProperty, publicService } from "@/infrastructure/services/publicService";
import PropertiesGrid from "@/ui/components/properties/public/PropertiesGrid";

export default function PublicPropertiesPage() {
    const [properties, setProperties] = useState<PublicProperty[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<'Todos' | 'Venta' | 'Alquiler'>('Todos');

    useEffect(() => {
        const load = async () => {
            const data = await publicService.getAllProperties();
            setProperties(data);
            setLoading(false);
        };
        load();
    }, []);

    const filteredProperties = properties.filter(p => {
        if (filterType === 'Todos') return true;
        return p.operation_type === filterType;
    });

    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-20">
            {/* Header / Hero Section (Mini) */}
            <div className="bg-white border-b py-12">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Encontrá tu próximo hogar
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto mb-8">
                        Explora las mejores propiedades de las inmobiliarias más confiables de Argentina.
                    </p>

                    {/* Filters */}
                    <div className="flex justify-center gap-2">
                        {['Todos', 'Alquiler', 'Venta'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type as any)}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${filterType === type
                                        ? 'bg-gray-900 text-white shadow-lg scale-105'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                {type === 'Venta' ? 'Compra' : type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8">
                <PropertiesGrid properties={filteredProperties} loading={loading} />
            </main>
        </div>
    );
}
