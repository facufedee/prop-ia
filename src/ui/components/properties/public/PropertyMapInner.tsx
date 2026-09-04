"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
// leaflet/dist/leaflet.css is imported globally in globals.css
import { PublicProperty } from "@/infrastructure/services/publicService";

// Fix Leaflet's broken default icon paths in webpack/Next.js
if (typeof window !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });
}

function fmtPrice(price: number, currency: string, hidePrice?: boolean): string {
    if (hidePrice || !price) return "Consultar";
    const n = Math.abs(price);
    const sym = currency === "USD" ? "U$S" : "$";
    if (n >= 1_000_000) return `${sym} ${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
    if (n >= 1_000) return `${sym} ${(n / 1_000).toFixed(0)}k`;
    return `${sym} ${n.toLocaleString("es-AR")}`;
}

function makePriceIcon(price: number, currency: string, active: boolean, hidePrice?: boolean): L.DivIcon {
    const label = fmtPrice(price, currency, hidePrice);
    const bg = active ? "#1e1b4b" : "#4f46e5";
    const scale = active ? "scale(1.18)" : "scale(1)";
    return L.divIcon({
        className: "",
        html: `<div style="
            background:${bg};color:#fff;
            padding:5px 10px;border-radius:20px;
            font-size:12px;font-weight:700;white-space:nowrap;
            border:2.5px solid #fff;
            box-shadow:0 2px 10px rgba(0,0,0,0.22);
            transform:${scale};transition:transform .15s,background .15s;
            cursor:pointer;line-height:1.2;
        ">${label}</div>`,
        iconSize: undefined,
        iconAnchor: [30, 16],
    });
}

// Invalidate map size on mount — fixes the "gray tiles" issue in Next.js dynamic imports
function MapResizer() {
    const map = useMap();
    useEffect(() => {
        const t = setTimeout(() => map.invalidateSize(), 150);
        return () => clearTimeout(t);
    }, [map]);
    return null;
}

// Auto-fit map bounds whenever the visible properties change
function BoundsController({ properties }: { properties: PublicProperty[] }) {
    const map = useMap();
    useEffect(() => {
        const pts = properties.filter(p => {
            const lat = Number(p.lat);
            const lng = Number(p.lng);
            return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
        });
        if (!pts.length) return;
        if (pts.length === 1) { map.setView([Number(pts[0].lat), Number(pts[0].lng)], 15); return; }
        map.fitBounds(
            L.latLngBounds(pts.map(p => [Number(p.lat), Number(p.lng)] as [number, number])),
            { padding: [48, 48], maxZoom: 16 }
        );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [properties]);
    return null;
}

interface Props {
    properties: PublicProperty[];
    hoveredId?: string | null;
    onHover?: (id: string | null) => void;
}

export default function PropertyMapInner({ properties, hoveredId, onHover }: Props) {
    const visible = properties.filter(p => {
        const lat = Number(p.lat);
        const lng = Number(p.lng);
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0 && p.status !== "sold";
    });

    return (
        <MapContainer
            center={[-34.6037, -58.3816]}
            zoom={12}
            style={{ width: "100%", height: "100%" }}
            zoomControl
        >
            <MapResizer />
            <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
                maxZoom={20}
            />
            <BoundsController properties={visible} />

            {visible.map(p => (
                <Marker
                    key={p.id}
                    position={[Number(p.lat), Number(p.lng)]}
                    icon={makePriceIcon(p.price, p.currency, hoveredId === p.id, p.hidePrice)}
                    eventHandlers={{
                        mouseover: () => onHover?.(p.id),
                        mouseout: () => onHover?.(null),
                    }}
                    zIndexOffset={hoveredId === p.id ? 1000 : 0}
                >
                    <Popup maxWidth={252} minWidth={220} autoPan={false}>
                        <div style={{ width: "220px", fontFamily: "system-ui, sans-serif" }}>
                            {/* Image */}
                            {p.imageUrls?.[0] && (
                                <div style={{ height: "110px", borderRadius: "8px", overflow: "hidden", marginBottom: "8px" }}>
                                    <img
                                        src={p.imageUrls[0]}
                                        alt=""
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                </div>
                            )}
                            {/* Operation badge */}
                            <span style={{
                                display: "inline-block",
                                background: p.operation_type === "Venta" ? "#dcfce7" : "#dbeafe",
                                color: p.operation_type === "Venta" ? "#166534" : "#1e40af",
                                fontSize: "10px", fontWeight: "700", padding: "2px 7px",
                                borderRadius: "99px", marginBottom: "5px", textTransform: "uppercase",
                            }}>
                                {p.operation_type}
                            </span>
                            {/* Title */}
                            <div style={{ fontSize: "13px", fontWeight: "700", color: "#111827", lineHeight: "1.3", marginBottom: "3px" }}>
                                {p.calle ? `${p.calle}${p.altura ? ` ${p.altura}` : ""}` : p.title}
                            </div>
                            <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "7px" }}>
                                {[p.localidad, p.provincia].filter(Boolean).join(", ")}
                            </div>
                            {/* Price */}
                            <div style={{ fontSize: "16px", fontWeight: "800", color: "#4f46e5", marginBottom: "7px" }}>
                                {p.hidePrice || !Number(p.price) ? "Consultar precio" : `${p.currency === "USD" ? "U$S" : "$"} ${Number(p.price).toLocaleString("es-AR")}`}
                            </div>
                            {/* Specs */}
                            <div style={{ display: "flex", gap: "10px", fontSize: "11px", color: "#374151", marginBottom: "10px", flexWrap: "wrap" }}>
                                {p.rooms ? <span>🛏 {p.rooms} amb.</span> : null}
                                {p.bathrooms ? <span>🚿 {p.bathrooms}</span> : null}
                                {p.area_covered ? <span>📐 {p.area_covered} m²</span> : null}
                            </div>
                            {/* CTA */}
                            <a
                                href={`/propiedades/p/${p.id}`}
                                style={{
                                    display: "block", textAlign: "center",
                                    background: "#4f46e5", color: "#fff",
                                    padding: "8px", borderRadius: "8px",
                                    textDecoration: "none", fontSize: "12px", fontWeight: "700",
                                }}
                            >
                                Ver propiedad →
                            </a>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
