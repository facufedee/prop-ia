import { PublicProperty } from "@/infrastructure/services/publicService";
import PropertyPublicCard from "./PropertyPublicCard";

interface PropertiesGridProps {
    properties: PublicProperty[];
    loading?: boolean;
}

export default function PropertiesGrid({ properties, loading, className }: PropertiesGridProps & { className?: string }) {
    const gridClasses = className || "s-prop-grid";

    if (loading) {
        return (
            <div className={gridClasses}>
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="s-skeleton h-[380px] animate-pulse" aria-hidden="true">
                        <div className="h-[240px] bg-[var(--color-paper-3)]" />
                        <div className="p-5 space-y-3">
                            <div className="s-skeleton__block h-4 w-3/4" />
                            <div className="s-skeleton__block h-3 w-1/2" />
                            <div className="flex gap-2 pt-4">
                                <div className="s-skeleton__block h-8 flex-1" />
                                <div className="s-skeleton__block h-8 flex-1" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (properties.length === 0) {
        return (
            <div className="s-empty">
                <p className="s-empty__title">No se encontraron propiedades.</p>
                <p className="s-empty__text">Intenta ajustar los filtros de búsqueda.</p>
            </div>
        );
    }

    return (
        <div className={gridClasses}>
            {properties.map((property) => (
                <PropertyPublicCard key={property.id} property={property} tone="dark" />
            ))}
        </div>
    );
}
