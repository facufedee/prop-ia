"use client";

import Image from "next/image";
import Link from "next/link";
import { Home } from "lucide-react";

export interface PropertyRankingRow {
    id: string;
    title?: string;
    imageUrl?: string;
    metric: string;
    detail?: string;
}

interface PropertyRankingListProps {
    title: string;
    rows: PropertyRankingRow[];
    loading: boolean;
    emptyMessage: string;
}

function RowSkeleton() {
    return (
        <div className="flex items-center gap-3 px-5 py-3 animate-pulse">
            <div className="w-12 h-9 rounded-lg bg-[var(--color-paper-3)] flex-shrink-0" />
            <div className="flex-1 h-3 rounded bg-[var(--color-paper-3)]" />
            <div className="w-14 h-3 rounded bg-[var(--color-paper-3)]" />
        </div>
    );
}

export function PropertyRankingList({ title, rows, loading, emptyMessage }: PropertyRankingListProps) {
    return (
        <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-[var(--color-rule)] bg-[var(--color-paper)]">
                <h3 className="font-bold font-heading text-[var(--color-ink)] text-xs uppercase tracking-wider">{title}</h3>
            </div>

            <div className="flex-1 divide-y divide-[var(--color-rule-2)] min-h-[140px]">
                {loading ? (
                    Array.from({ length: 3 }, (_, i) => <RowSkeleton key={i} />)
                ) : rows.length === 0 ? (
                    <div className="flex items-center justify-center h-full py-8 px-6 text-center">
                        <p className="text-xs text-[var(--color-muted)] leading-relaxed max-w-xs">{emptyMessage}</p>
                    </div>
                ) : (
                    rows.map((row, index) => (
                        <Link
                            key={row.id}
                            href={`/dashboard/propiedades/editar/${row.id}`}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--color-paper-3)] transition-colors group"
                        >
                            <span className="w-4 text-[11px] font-bold text-[var(--color-muted)] flex-shrink-0">{index + 1}</span>
                            <div className="relative w-12 h-9 rounded-lg overflow-hidden bg-[var(--color-paper-3)] flex-shrink-0">
                                {row.imageUrl ? (
                                    <Image src={row.imageUrl} alt={row.title ?? "Propiedad"} fill className="object-cover" sizes="48px" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[var(--color-neutral)]">
                                        <Home size={14} strokeWidth={1.5} />
                                    </div>
                                )}
                            </div>
                            <p className="flex-1 min-w-0 text-xs font-bold text-[var(--color-ink)] truncate group-hover:text-[var(--color-accent)] transition-colors">
                                {row.title || "Sin título"}
                            </p>
                            <div className="text-right flex-shrink-0">
                                <p className="text-xs font-bold font-heading text-[var(--color-ink)]">{row.metric}</p>
                                {row.detail && <p className="text-[10px] text-[var(--color-muted)] mt-0.5">{row.detail}</p>}
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
