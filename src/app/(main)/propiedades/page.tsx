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
        <div className="min-h-screen bg-gray-50 pb-20 pt-28">
            {/* Header / Hero Section (Mini) */}
            {/* Header / Hero Section (Mini) */}
            <div className="bg-indigo-50/30 border-b border-indigo-100 py-16 relative overflow-hidden">
                {/* Subtle decorative background - Matches PropertyNetworkCTA */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-gradient-to-tr from-blue-100 to-indigo-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

                <div className="container mx-auto px-4 text-center relative z-10">
                    <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
                        Descubrí las propiedades de la <br className="md:hidden" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            Red Zeta Prop
                        </span>
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
                        Las principales inmobiliarias del país confían en nuestra tecnología para conectar con clientes como vos.
                    </p>

                    {/* Filters */}
                    <div className="flex justify-center gap-2">
                        {['Todos', 'Alquiler', 'Venta'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type as any)}
                                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${filterType === type
                                    ? 'bg-indigo-600 text-white shadow-indigo-200'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-200 hover:text-indigo-600'
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
