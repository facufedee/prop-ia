"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PublicProperty, PublicAgency, publicService } from "@/infrastructure/services/publicService";
import PropertiesGrid from "@/ui/components/properties/public/PropertiesGrid";
import { Mail, Loader2, Home } from "lucide-react";

export default function AgencyPropertiesPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [properties, setProperties] = useState<PublicProperty[]>([]);
    const [agency, setAgency] = useState<PublicAgency | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!slug) return;
            try {
                const result = await publicService.getPropertiesByAgencySlug(slug);
                if (result) {
                    setAgency(result.agency);
                    setProperties(result.properties);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-gray-400 w-8 h-8" />
            </div>
        );
    }

    if (error || !agency) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <Home className="w-12 h-12 text-gray-300 mb-4" />
                <h1 className="text-xl font-semibold text-gray-900 mb-2">Inmobiliaria no encontrada</h1>
                <p className="text-gray-500">No pudimos encontrar la inmobiliaria que estás buscando.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-20">
            {/* Agency Header */}
            <div className="bg-white border-b shadow-sm">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gray-100 overflow-hidden border-4 border-white shadow-lg shrink-0">
                            {agency.photoURL ? (
                                <img src={agency.photoURL} alt={agency.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-600">
                                    {agency.displayName.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left space-y-2">
                            <h1 className="text-3xl font-bold text-gray-900">{agency.displayName}</h1>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-600">
                                {agency.email && (
                                    <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full text-sm">
                                        <Mail className="w-4 h-4" />
                                        <span>{agency.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats or Actions */}
                        <div className="bg-gray-50 rounded-xl p-4 min-w-[150px] text-center">
                            <p className="text-sm text-gray-500 mb-1">Propiedades</p>
                            <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Propiedades en Cartera
                    </h2>
                </div>
                <PropertiesGrid properties={properties} loading={loading} />
            </main>
        </div>
    );
}
