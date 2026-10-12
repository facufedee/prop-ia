import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { PublicProperty } from "@/infrastructure/services/publicService";
import { propertyPath } from "@/lib/seo/propertyUrl";

interface SimilarPropertyCardProps {
    property: PublicProperty;
}

export default function SimilarPropertyCard({ property }: SimilarPropertyCardProps) {
    // Format Price
    const formattedPrice = property.hidePrice || Number(property.price) === 0
        ? "Consultar Precio"
        : new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: property.currency,
            maximumFractionDigits: 0
        }).format(property.price);

    return (
        <Link href={propertyPath(property)} className="s-prop-card s-prop-card--fixed">
            {/* Image Section */}
            <div className="s-prop-card__media">
                <Image
                    src={property.imageUrls?.[0] || 'https://placehold.co/400x300?text=Sin+Imagen'}
                    alt={property.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 280px"
                />

                {/* Heart Icon */}
                <button type="button" aria-label="Guardar en favoritos" className="s-glass-btn absolute top-3 right-3 z-10">
                    <Heart size={16} />
                </button>

                {/* Tags (Venta - Tipo) */}
                <div className="s-prop-badges">
                    <span className="s-prop-badge">
                        {property.operation_type}
                    </span>
                    <span className="s-prop-badge">
                        Departamento {/* Hardcoded for now based on image, or map from title/type */}
                    </span>
                </div>

                {/* Agency Logo Overlay (Bottom Right) */}
                {property.agency?.photoURL && (
                    <div className="absolute bottom-3 right-3 w-8 h-8 rounded-lg overflow-hidden border border-[color:var(--color-rule)] bg-[var(--color-paper-2)]">
                        <Image src={property.agency.photoURL} alt={property.agency.displayName} fill className="object-contain p-0.5" sizes="32px" />
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="s-prop-card__body">
                {/* Price */}
                <h3 className="s-prop-card__price">
                    {formattedPrice}
                </h3>
                {property.expenses && (
                    <p className="s-prop-card__sub">Expensas $ {property.expenses.toLocaleString()}</p>
                )}

                {/* Address */}
                <p className="s-prop-card__title">
                    {property.calle ? `${property.calle} ${property.altura || ''}` : property.title}
                </p>

                {/* Location */}
                <p className="s-prop-card__loc">
                    <span>{property.localidad}, {property.provincia}</span>
                </p>

                {/* Specs */}
                {(property.area_covered || property.rooms || property.bathrooms) ? (
                    <ul className="s-prop-card__feats">
                        {Boolean(property.area_covered) && <li>{property.area_covered} m²</li>}
                        {Boolean(property.rooms) && <li>{property.rooms} Dorm</li>}
                        {Boolean(property.bathrooms) && <li>{property.bathrooms} Baño</li>}
                    </ul>
                ) : null}
            </div>
        </Link>
    );
}
