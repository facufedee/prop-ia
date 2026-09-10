"use client";

import { MapPin, Ruler, DoorOpen, Bath, Car, Maximize } from "lucide-react";
import { Property } from "@/ui/components/tables/PropertiesTable";
import { getFichaTemplate } from "./fichaTemplates";

export interface FichaAgentInfo {
    name: string;
    email: string;
    phone?: string;
    logoUrl?: string;
    agencyName?: string;
    address?: string;
}

interface FichaTemplateProps {
    property: Property;
    agent: FichaAgentInfo;
    templateId: string;
}

const PAGE_SIZE_MM: Record<string, { w: number; h: number }> = {
    A4: { w: 210, h: 297 },
    A5: { w: 148, h: 210 },
};

const formatPrice = (property: Property) => {
    if (property.hidePrice || !Number(property.price)) return "Consultar Precio";
    return `${property.currency} ${Number(property.price).toLocaleString("es-AR")}`;
};

const propertyAddress = (property: Property) =>
    property.calle ? `${property.calle} ${property.altura || ""}`.trim() : "";

const propertyLocation = (property: Property) =>
    [property.localidad, property.provincia].filter(Boolean).join(", ");

const propertyUrl = (property: Property) => `https://zetaprop.com.ar/propiedades/p/${property.id}`;

// ============================================================
// Shared building blocks
// ============================================================

function FichaHeader({ agent, pageSize }: { agent: FichaAgentInfo; pageSize: "A4" | "A5" }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                {agent.logoUrl ? (
                    <img src={agent.logoUrl} alt={agent.agencyName || "Logo"} className={pageSize === "A4" ? "h-10 w-auto object-contain" : "h-7 w-auto object-contain"} />
                ) : (
                    <span className={`font-extrabold tracking-tight ${pageSize === "A4" ? "text-xl" : "text-base"}`}>
                        <span className="text-gray-900">Zeta</span>
                        <span className="text-indigo-600">Prop</span>
                    </span>
                )}
            </div>
            <span className={`text-gray-400 font-semibold uppercase tracking-widest ${pageSize === "A4" ? "text-xs" : "text-[9px]"}`}>
                Ficha de Propiedad
            </span>
        </div>
    );
}

function FichaDivider() {
    return <div className="h-[3px] bg-indigo-600 w-full mb-4 print:print-color-adjust-exact" />;
}

function FichaFooter({ agent, pageSize }: { agent: FichaAgentInfo; pageSize: "A4" | "A5" }) {
    const parts = [agent.address, agent.phone, agent.email].filter(Boolean);
    return (
        <div className={`mt-auto pt-3 border-t border-gray-200 text-center text-gray-500 ${pageSize === "A4" ? "text-[10px]" : "text-[8px]"}`}>
            {agent.agencyName && <span className="font-semibold text-gray-700">{agent.agencyName} · </span>}
            {parts.join(" · ")}
        </div>
    );
}

function FeatureBadges({ property, pageSize }: { property: Property; pageSize: "A4" | "A5" }) {
    const items: { label: string; value: string | number; icon: any }[] = [];
    if (property.rooms) items.push({ label: "Ambientes", value: property.rooms, icon: DoorOpen });
    if (property.bathrooms) items.push({ label: "Baños", value: property.bathrooms, icon: Bath });
    if (property.garages) items.push({ label: "Cochera", value: Number(property.garages) > 0 ? "Sí" : "No", icon: Car });
    if (property.area_covered) items.push({ label: "Sup. cubierta m²", value: property.area_covered, icon: Ruler });
    if (property.area_total) items.push({ label: "Sup. total m²", value: property.area_total, icon: Maximize });

    if (items.length === 0) return null;

    return (
        <div className={`grid grid-cols-3 ${pageSize === "A4" ? "gap-2 mb-4" : "gap-1 mb-2"}`}>
            {items.slice(0, pageSize === "A4" ? 6 : 3).map((item) => (
                <div key={item.label} className={`border border-gray-200 rounded-lg text-center bg-gray-50 ${pageSize === "A4" ? "py-2" : "py-1"}`}>
                    <p className={`text-gray-400 ${pageSize === "A4" ? "text-[9px]" : "text-[7px]"}`}>{item.label}</p>
                    <p className={`font-bold text-gray-900 ${pageSize === "A4" ? "text-lg" : "text-xs"}`}>{item.value}</p>
                </div>
            ))}
        </div>
    );
}

function PriceBanner({ property, pageSize }: { property: Property; pageSize: "A4" | "A5" }) {
    return (
        <div className={`border-2 border-indigo-600 rounded-lg flex items-center justify-between print:print-color-adjust-exact ${pageSize === "A4" ? "px-5 py-3 mt-4" : "px-3 py-1.5 mt-2"}`}>
            <span className={`font-bold text-indigo-600 uppercase ${pageSize === "A4" ? "text-sm" : "text-[9px]"}`}>{property.operation_type}</span>
            <span className={`font-extrabold text-gray-900 ${pageSize === "A4" ? "text-3xl" : "text-lg"}`}>{formatPrice(property)}</span>
        </div>
    );
}

function DescriptionBlock({ property, pageSize }: { property: Property; pageSize: "A4" | "A5" }) {
    if (!property.description) return null;
    return (
        <p className={`text-gray-700 leading-relaxed whitespace-pre-line overflow-hidden ${pageSize === "A4" ? "text-sm mb-4" : "text-[8px] mb-2 line-clamp-6"}`}>
            {property.description}
        </p>
    );
}

function MapBlock({ property, pageSize }: { property: Property; pageSize: "A4" | "A5" }) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const hasCoords = property.lat && property.lng;
    const query = hasCoords
        ? `${property.lat},${property.lng}`
        : encodeURIComponent(`${propertyAddress(property) || property.title}, ${propertyLocation(property)}, Argentina`);

    const src = apiKey
        ? `https://maps.googleapis.com/maps/api/staticmap?center=${query}&zoom=15&size=440x300&scale=2&markers=color:0x4f46e5%7C${query}&key=${apiKey}`
        : null;

    return (
        <div className={`rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center ${pageSize === "A4" ? "h-56 mb-4" : "h-24 mb-2"}`}>
            {src ? (
                <img src={src} alt="Ubicación" className="w-full h-full object-cover" />
            ) : (
                <div className="flex flex-col items-center text-gray-400">
                    <MapPin size={pageSize === "A4" ? 28 : 16} />
                    <span className={pageSize === "A4" ? "text-xs mt-1" : "text-[7px] mt-0.5"}>{propertyLocation(property)}</span>
                </div>
            )}
        </div>
    );
}

function PhotoLayoutBlock({
    property, layout, pageSize,
}: { property: Property; layout: string; pageSize: "A4" | "A5" }) {
    const photos = property.imageUrls?.length ? property.imageUrls : ["/assets/img/placeholder.png"];
    const heroH = pageSize === "A4" ? "h-72" : "h-32";
    const smallH = pageSize === "A4" ? "h-20" : "h-10";

    if (layout === "hero") {
        return (
            <div className={`rounded-lg overflow-hidden bg-gray-100 mb-4 ${heroH}`}>
                <img src={photos[0]} className="w-full h-full object-cover" alt="" />
            </div>
        );
    }
    if (layout === "hero+1") {
        return (
            <div className={`grid grid-cols-3 gap-2 mb-4 ${heroH}`}>
                <div className="col-span-2 rounded-lg overflow-hidden bg-gray-100">
                    <img src={photos[0]} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="rounded-lg overflow-hidden bg-gray-100">
                    <img src={photos[1] || photos[0]} className="w-full h-full object-cover" alt="" />
                </div>
            </div>
        );
    }
    if (layout === "hero+3") {
        return (
            <div className="mb-4">
                <div className={`rounded-lg overflow-hidden bg-gray-100 mb-2 ${heroH}`}>
                    <img src={photos[0]} className="w-full h-full object-cover" alt="" />
                </div>
                <div className={`grid grid-cols-3 gap-2 ${smallH}`}>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-lg overflow-hidden bg-gray-100">
                            <img src={photos[i] || photos[0]} className="w-full h-full object-cover" alt="" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    if (layout === "grid4") {
        return (
            <div className={`grid grid-cols-2 gap-2 mb-4 ${pageSize === "A4" ? "h-72" : "h-28"}`}>
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="rounded-lg overflow-hidden bg-gray-100">
                        {photos[i] && <img src={photos[i]} className="w-full h-full object-cover" alt="" />}
                    </div>
                ))}
            </div>
        );
    }
    if (layout === "grid12") {
        return (
            <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="rounded-lg overflow-hidden bg-gray-100 aspect-square">
                        {photos[i] && <img src={photos[i]} className="w-full h-full object-cover" alt="" />}
                    </div>
                ))}
            </div>
        );
    }
    return null;
}

function QrHeroBlock({ property, pageSize }: { property: Property; pageSize: "A4" | "A5" }) {
    const url = propertyUrl(property);
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=480x480&data=${encodeURIComponent(url)}`;
    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 py-8">
            <img src={qrSrc} alt="Código QR" className={pageSize === "A4" ? "w-64 h-64" : "w-40 h-40"} />
            <div className="text-center">
                <h1 className="text-xl font-bold text-gray-900">{propertyAddress(property) || property.title}</h1>
                <p className="text-gray-500 text-sm flex items-center justify-center gap-1 mt-1">
                    <MapPin size={14} /> {propertyLocation(property)}
                </p>
            </div>
            <PriceBanner property={property} pageSize={pageSize} />
            <p className="text-gray-400 text-xs">Escaneá el código para ver todas las fotos y detalles</p>
        </div>
    );
}

// ============================================================
// Page wrapper (A4 / A5 sizing shared by every template)
// ============================================================

function FichaPage({
    pageSize, children, breakAfter,
}: { pageSize: "A4" | "A5"; children: React.ReactNode; breakAfter?: boolean }) {
    const { w, h } = PAGE_SIZE_MM[pageSize];
    return (
        <div
            className={`bg-white text-gray-900 mx-auto shadow-2xl print:shadow-none print:m-0 flex flex-col bg-page ${breakAfter ? "break-after-page" : ""}`}
            style={{ width: `${w}mm`, height: `${h}mm`, padding: pageSize === "A4" ? "12mm" : "8mm" }}
        >
            {children}
        </div>
    );
}

// ============================================================
// Main template
// ============================================================

export default function FichaTemplate({ property, agent, templateId }: FichaTemplateProps) {
    const config = getFichaTemplate(templateId);
    const { pageSize } = config;

    if (config.qrHero) {
        return (
            <FichaPage pageSize={pageSize}>
                <FichaHeader agent={agent} pageSize={pageSize} />
                <FichaDivider />
                <QrHeroBlock property={property} pageSize={pageSize} />
                <FichaFooter agent={agent} pageSize={pageSize} />
            </FichaPage>
        );
    }

    const mainPage = (
        <FichaPage pageSize={pageSize} breakAfter={config.galleryPage}>
            <FichaHeader agent={agent} pageSize={pageSize} />
            <FichaDivider />

            <div className={pageSize === "A4" ? "grid grid-cols-2 gap-6 mb-4" : "space-y-2"}>
                {config.showMap && <MapBlock property={property} pageSize={pageSize} />}
                <div>
                    <h1 className={`font-bold text-gray-900 leading-tight ${pageSize === "A4" ? "text-xl mb-2" : "text-xs mb-1"}`}>
                        {property.title}
                    </h1>
                    <p className={`text-gray-500 flex items-center gap-1 ${pageSize === "A4" ? "text-sm mb-3" : "text-[8px] mb-1.5"}`}>
                        <MapPin size={pageSize === "A4" ? 14 : 9} />
                        {propertyAddress(property) ? `${propertyAddress(property)} - ${propertyLocation(property)}` : propertyLocation(property)}
                    </p>
                    {config.showBadges && <FeatureBadges property={property} pageSize={pageSize} />}
                </div>
            </div>

            {config.photoLayout !== "none" && (
                <PhotoLayoutBlock property={property} layout={config.photoLayout} pageSize={pageSize} />
            )}

            {config.showDescription && <DescriptionBlock property={property} pageSize={pageSize} />}

            <div className="mt-auto">
                <PriceBanner property={property} pageSize={pageSize} />
                <FichaFooter agent={agent} pageSize={pageSize} />
            </div>
        </FichaPage>
    );

    if (!config.galleryPage) return mainPage;

    return (
        <>
            {mainPage}
            <FichaPage pageSize={pageSize}>
                <FichaHeader agent={agent} pageSize={pageSize} />
                <FichaDivider />
                <PhotoLayoutBlock property={property} layout="grid12" pageSize={pageSize} />
                <div className="mt-auto">
                    <FichaFooter agent={agent} pageSize={pageSize} />
                </div>
            </FichaPage>
        </>
    );
}
