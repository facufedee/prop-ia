"use client";

import { useEffect, useState } from "react";
import { PublicProperty, publicService } from "@/infrastructure/services/publicService";
import PropertiesGrid from "@/ui/components/properties/public/PropertiesGrid";

export default function PublicPropertiesPage() {
    const [properties, setProperties] = useState<PublicProperty[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await publicService.getAllProperties();
            setProperties(data);
            setLoading(false);
        };
        load();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-20">
            {/* Header / Hero Section (Mini) */}
            <div className="bg-white border-b py-12">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Encontrá tu próximo hogar
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto">
                        Explora las mejores propiedades de las inmobiliarias más confiables de Argentina.
                    </p>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8">
                <PropertiesGrid properties={properties} loading={loading} />
            </main>
        </div>
    );
}
