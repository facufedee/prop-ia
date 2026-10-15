"use client";

import { Draggable } from "@hello-pangea/dnd";
import { VentaOperacion, ETAPA_CONFIG } from "@/domain/models/Venta";
import { Building2, User, DollarSign, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Props {
    venta: VentaOperacion;
    index: number;
}

const formatMonto = (n: number, moneda: 'ARS' | 'USD') =>
    moneda === 'USD'
        ? `USD ${n.toLocaleString("es-AR")}`
        : `$ ${n.toLocaleString("es-AR")}`;

export default function VentaKanbanCard({ venta, index }: Props) {
    const precio = venta.precioAcordado ?? venta.precioListado;
    const comprador = venta.compradores[0]?.nombre ?? "Sin comprador";
    const vendedor = venta.vendedores[0]?.nombre ?? "Sin vendedor";
    const etapa = ETAPA_CONFIG[venta.etapa];

    return (
        <Draggable draggableId={venta.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule-2)] shadow-sm mb-3 select-none transition-all duration-150
                        ${snapshot.isDragging
                            ? "shadow-2xl rotate-[1deg] scale-[1.02] border-[var(--color-accent)]/30 ring-2 ring-[var(--color-accent)]/30 z-50"
                            : "hover:shadow-md hover:border-[var(--color-accent)]/30"
                        }
                    `}
                >
                    <div className="p-3.5">
                        {/* Dirección */}
                        <Link
                            href={`/dashboard/ventas/${venta.id}`}
                            className="flex items-center gap-1.5 mb-2 group/link"
                            onClick={e => e.stopPropagation()}
                        >
                            <Building2 strokeWidth={1.5} size={13} className="text-[var(--color-accent)] flex-shrink-0" />
                            <span className="text-sm font-semibold text-[var(--color-ink)] truncate group-hover/link:text-[var(--color-accent)] transition-colors">
                                {venta.direccion}
                            </span>
                            <ArrowRight strokeWidth={1.5} size={11} className="text-[var(--color-accent)] opacity-0 group-hover/link:opacity-100 transition-opacity flex-shrink-0" />
                        </Link>

                        {/* Partes */}
                        <div className="space-y-1 mb-3">
                            <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
                                <User strokeWidth={1.5} size={11} className="text-[var(--color-positive)] flex-shrink-0" />
                                <span className="truncate">{comprador}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
                                <User strokeWidth={1.5} size={11} className="text-[var(--color-accent)] flex-shrink-0" />
                                <span className="truncate">{vendedor}</span>
                            </div>
                        </div>

                        {/* Footer: precio + tipo */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1 text-xs font-bold text-[var(--color-ink)]">
                                <DollarSign strokeWidth={1.5} size={12} className="text-[var(--color-positive)]" />
                                {formatMonto(precio, venta.moneda)}
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${etapa.bg} ${etapa.color}`}>
                                {venta.propiedadTipo}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
}
