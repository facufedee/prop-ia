"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Building2, MapPin, BedDouble, Bath } from "lucide-react";
import { publicService, PublicProperty } from "@/infrastructure/services/publicService";
import { formatPropertyPrice } from "@/ui/utils/propertyPrice";

export default function PropertyNetworkCTA() {
    const [properties, setProperties] = useState<PublicProperty[]>([]);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        publicService.getAllProperties().then((all) => {
            // Only those with at least one image, limit to 12
            const withImages = all.filter((p) => p.imageUrls?.length > 0 && p.status === "active").slice(0, 12);
            setProperties(withImages);
        });
    }, []);

    // Duplicate list for seamless infinite loop
    const track = [...properties, ...properties];

    return (
        <section className="l-section l-network">
            <div className="l-container l-network__head">
                <span className="l-kicker">
                    <Building2 size={14} />
                    Red de inmobiliarias federal
                </span>

                <h2 className="l-network__title">
                    Encontrá tu próxima propiedad en nuestra <span>red de inmobiliarias de toda Argentina</span>
                </h2>

                <p className="l-network__lede">
                    Catálogo en constante crecimiento con propiedades gestionadas por inmobiliarias de todo el país.
                </p>

                <Link href="/propiedades" className="l-btn l-btn--primary">
                    Explorar propiedades
                    <ArrowRight size={18} />
                </Link>
            </div>

            {properties.length > 0 && (
                <div
                    className="l-network__track-wrap"
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                >
                    <div className="l-network__fade l-network__fade--left" />
                    <div className="l-network__fade l-network__fade--right" />

                    <div
                        className="l-network__track"
                        style={{
                            animation: `l-carousel-scroll ${properties.length * 5}s linear infinite`,
                            animationPlayState: paused ? "paused" : "running",
                        }}
                    >
                        {track.map((prop, i) => (
                            <Link key={`${prop.id}-${i}`} href={`/propiedades/p/${prop.id}`} className="l-property-card">
                                <div className="l-property-card__image">
                                    <Image
                                        src={prop.imageUrls[0]}
                                        alt={prop.title}
                                        fill
                                        className="object-cover"
                                        sizes="272px"
                                    />
                                    <span className="l-property-card__tag">{prop.operation_type}</span>
                                </div>

                                <div className="l-property-card__body">
                                    <p className="l-property-card__price">
                                        {formatPropertyPrice(prop.price, prop.currency, prop.hidePrice)}
                                    </p>
                                    <p className="l-property-card__title">{prop.title}</p>
                                    {prop.localidad && (
                                        <p className="l-property-card__loc">
                                            <MapPin size={12} />
                                            {prop.localidad}{prop.provincia ? `, ${prop.provincia}` : ""}
                                        </p>
                                    )}
                                    <div className="l-property-card__meta">
                                        {prop.rooms > 0 && (
                                            <span><BedDouble size={13} /> {prop.rooms} amb.</span>
                                        )}
                                        {prop.bathrooms > 0 && (
                                            <span><Bath size={13} /> {prop.bathrooms}</span>
                                        )}
                                        {prop.area_covered > 0 && <span>{prop.area_covered} m²</span>}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes l-carousel-scroll {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </section>
    );
}
