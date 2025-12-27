import { PublicProperty } from "@/infrastructure/services/publicService";
import PropertyPublicCard from "./PropertyPublicCard";

interface PropertiesGridProps {
    properties: PublicProperty[];
    loading?: boolean;
}

export default function PropertiesGrid({ properties, loading }: PropertiesGridProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden h-[380px] animate-pulse">
                        <div className="h-[240px] bg-gray-200" />
                        <div className="p-5 space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                            <div className="flex gap-2 pt-4">
                                <div className="h-8 bg-gray-200 rounded flex-1" />
                                <div className="h-8 bg-gray-200 rounded flex-1" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (properties.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <p className="text-lg text-gray-500 font-medium">No se encontraron propiedades.</p>
                <p className="text-sm text-gray-400">Intenta ajustar los filtros de búsqueda.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((property) => (
                <PropertyPublicCard key={property.id} property={property} />
            ))}
        </div>
    );
}
