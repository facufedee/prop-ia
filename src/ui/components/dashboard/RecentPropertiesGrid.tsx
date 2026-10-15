"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Home, Plus } from "lucide-react";
import { formatPropertyPrice } from "@/ui/utils/propertyPrice";

export interface DashboardProperty {
    id: string;
    title?: string;
    localidad?: string;
    price?: number | string;
    currency?: string;
    hidePrice?: boolean;
    operation_type?: string;
    status?: string;
    imageUrls?: string[];
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
    active: {
        label: "Activa",
        className: "bg-[var(--color-positive-soft)] text-[var(--color-positive)] border-[var(--color-positive)]/30",
    },
    inactive: {
        label: "Pausada",
        className: "bg-[var(--color-paper-3)] text-[var(--color-muted)] border-[var(--color-rule)]",
    },
    reserved: {
        label: "Reservada",
        className: "bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-[var(--color-warning)]/30",
    },
    sold: {
        label: "Vendida",
        className: "bg-[var(--color-paper-3)] text-[var(--color-ink-2)] border-[var(--color-rule)]",
    },
};

function statusBadge(status?: string) {
    return STATUS_LABEL[status ?? "active"] ?? STATUS_LABEL.active;
}

function PropertyTile({ property }: { property: DashboardProperty }) {
    const cover = property.imageUrls?.[0];
    const status = statusBadge(property.status);
    return (
        <Link
            href={`/dashboard/propiedades/editar/${property.id}`}
            className="group bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] hover:border-[var(--color-neutral)] overflow-hidden flex flex-col transition-all"
        >
            <div className="relative aspect-[4/3] bg-[var(--color-paper-3)] overflow-hidden">
                {cover ? (
                    <Image
                        src={cover}
                        alt={property.title ?? "Propiedad"}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--color-neutral)]">
                        <Home size={24} strokeWidth={1.5} />
                    </div>
                )}
                {property.operation_type && (
                    <span className="absolute top-2.5 left-2.5 text-[9px] font-bold uppercase tracking-widest text-[var(--color-accent)] bg-[var(--color-paper)]/90 px-2.5 py-0.5 rounded-full border border-[var(--color-rule)]">
                        {property.operation_type}
                    </span>
                )}
            </div>
            <div className="p-3.5 flex flex-col gap-1 flex-1">
                <p className="text-xs font-bold font-heading text-[var(--color-ink)] line-clamp-1 group-hover:text-[var(--color-accent)] transition-colors">
                    {property.title || "Sin título"}
                </p>
                <p className="text-[11px] text-[var(--color-muted)] line-clamp-1">{property.localidad || "Sin localidad"}</p>
                <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-bold font-heading text-[var(--color-ink)] truncate">
                        {formatPropertyPrice(property.price, property.currency, property.hidePrice)}
                    </p>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex-shrink-0 ${status.className}`}>
                        {status.label}
                    </span>
                </div>
            </div>
        </Link>
    );
}

function TileSkeleton() {
    return (
        <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] overflow-hidden animate-pulse">
            <div className="aspect-[4/3] bg-[var(--color-paper-3)]" />
            <div className="p-3.5 space-y-2">
                <div className="h-3 w-3/4 rounded bg-[var(--color-paper-3)]" />
                <div className="h-2.5 w-1/2 rounded bg-[var(--color-paper-3)]" />
                <div className="h-3 w-1/3 rounded bg-[var(--color-paper-3)]" />
            </div>
        </div>
    );
}

interface RecentPropertiesGridProps {
    properties: DashboardProperty[];
    loading: boolean;
}

export function RecentPropertiesGrid({ properties, loading }: RecentPropertiesGridProps) {
    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold font-heading text-[var(--color-ink)] tracking-tight">Tus propiedades</h2>
                <Link
                    href="/dashboard/propiedades"
                    className="text-xs font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-2)] flex items-center gap-1 transition-colors"
                >
                    Ver todas <ChevronRight size={14} strokeWidth={1.5} />
                </Link>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }, (_, i) => <TileSkeleton key={i} />)}
                </div>
            ) : properties.length === 0 ? (
                <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] py-10 px-4 flex flex-col items-center text-center">
                    <Home size={24} strokeWidth={1.5} className="text-[var(--color-muted)] mb-3" />
                    <p className="text-sm font-semibold text-[var(--color-ink)]">Todavía no cargaste propiedades</p>
                    <p className="text-xs text-[var(--color-muted)] mt-1 mb-4">Cargá tu primera propiedad para verla acá.</p>
                    <Link
                        href="/dashboard/propiedades/nueva"
                        className="inline-flex items-center gap-2 text-xs font-bold text-[var(--color-paper)] bg-[var(--color-ink)] hover:bg-[var(--color-ink-2)] px-4 py-2 rounded-full transition-all active:scale-95"
                    >
                        <Plus size={14} strokeWidth={1.5} /> Cargar propiedad
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {properties.slice(0, 8).map((property) => (
                        <PropertyTile key={property.id} property={property} />
                    ))}
                </div>
            )}
        </section>
    );
}
