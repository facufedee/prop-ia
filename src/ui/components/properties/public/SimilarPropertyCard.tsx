import Link from "next/link";
import { Heart, MapPin, Maximize, Bed, Bath } from "lucide-react";
import { PublicProperty } from "@/infrastructure/services/publicService";

interface SimilarPropertyCardProps {
    property: PublicProperty;
}

export default function SimilarPropertyCard({ property }: SimilarPropertyCardProps) {
    // Format Price
    // Format Price
    const formattedPrice = property.hidePrice
        ? "Consultar Precio"
        : new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: property.currency,
            maximumFractionDigits: 0
        }).format(property.price);

    return (
        <Link href={`/propiedades/p/${property.id}`} className="block min-w-[280px] w-[280px] bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 group" >
            {/* Image Section */}
            < div className="relative aspect-[4/3] bg-gray-100" >
                <img
                    src={property.imageUrls?.[0] || 'https://placehold.co/400x300?text=Sin+Imagen'}
                    alt={property.title}
                    className="w-full h-full object-cover"
                />

                {/* Heart Icon */}
                < button className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm hover:text-red-500 transition-colors z-10" >
                    <Heart size={16} />
                </button >

                {/* Tags (Venta - Tipo) */}
                < div className="absolute top-2 left-2 flex gap-1" >
                    <span className="px-2 py-0.5 bg-white/90 backdrop-blur text-[10px] font-bold uppercase tracking-wider text-gray-800 rounded-md shadow-sm">
                        {property.operation_type}
                    </span>
                    <span className="px-2 py-0.5 bg-white/90 backdrop-blur text-[10px] font-bold uppercase tracking-wider text-gray-600 rounded-md shadow-sm">
                        Departamento {/* Hardcoded for now based on image, or map from title/type */}
                    </span>
                </div >

                {/* Agency Logo Overlay (Bottom Right) */}
                {
                    property.agency?.photoURL && (
                        <div className="absolute bottom-2 right-2 w-8 h-8 rounded-md bg-white p-0.5 shadow-sm overflow-hidden">
                            <img src={property.agency.photoURL} alt={property.agency.displayName} className="w-full h-full object-contain" />
                        </div>
                    )
                }
            </div >

            {/* Content Section */}
            < div className="p-3" >
                {/* Price */}
                < h3 className="text-lg font-bold text-gray-900 mb-1" >
                    {formattedPrice}
                </h3 >
                {
                    property.expenses && (
                        <p className="text-[10px] text-gray-500 mb-2">Expensas $ {property.expenses.toLocaleString()}</p>
                    )
                }

                {/* Address */}
                <p className="text-sm font-medium text-gray-900 truncate mb-0.5">
                    {/* Mock address since we don't have street in public model usually, using title fallback */}
                    {property.title}
                </p>

                {/* Location */}
                <p className="text-xs text-gray-500 mb-3 truncate">
                    {property.localidad}, {property.provincia}
                </p>

                {/* Specs */}
                <div className="flex items-center gap-3 text-gray-600 text-xs border-t border-gray-100 pt-2">
                    {property.area_covered && (
                        <div className="flex items-center gap-1">
                            <span className="font-semibold">{property.area_covered} m²</span>
                        </div>
                    )}
                    {property.rooms && (
                        <div className="flex items-center gap-1 pl-3 border-l border-gray-100">
                            <span className="font-semibold">{property.rooms} Dorm</span>
                        </div>
                    )}
                    {property.bathrooms && (
                        <div className="flex items-center gap-1 pl-3 border-l border-gray-100">
                            <span className="font-semibold">{property.bathrooms} Baño</span>
                        </div>
                    )}
                </div>
            </div >
        </Link >
    );
}
