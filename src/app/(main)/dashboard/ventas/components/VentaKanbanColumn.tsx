"use client";

import { Droppable } from "@hello-pangea/dnd";
import { VentaOperacion, VentaEtapa, ETAPA_CONFIG } from "@/domain/models/Venta";
import VentaKanbanCard from "./VentaKanbanCard";
import { Handshake } from "lucide-react";

interface Props {
    etapa: VentaEtapa;
    ventas: VentaOperacion[];
}

export default function VentaKanbanColumn({ etapa, ventas }: Props) {
    const cfg = ETAPA_CONFIG[etapa];

    return (
        <div className={`flex flex-col rounded-2xl bg-gray-50/70 border border-gray-200/80 min-w-[280px] max-w-[300px] flex-shrink-0 h-full shadow-sm`}>
            {/* Header */}
            <div className="px-4 py-3 bg-gray-100/60 rounded-t-2xl border-b border-gray-200/60 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg ${cfg.bg} ${cfg.color} flex items-center justify-center`}>
                            <Handshake size={13} />
                        </div>
                        <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${cfg.bg} ${cfg.color}`}>
                        {ventas.length}
                    </span>
                </div>
            </div>

            {/* Cards */}
            <Droppable droppableId={etapa}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-3 overflow-y-auto transition-colors duration-200 ${snapshot.isDraggingOver ? "bg-indigo-50/40 rounded-b-2xl" : ""}`}
                        style={{ minHeight: 120 }}
                    >
                        {ventas.length === 0 && !snapshot.isDraggingOver && (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                                    <Handshake size={16} className="opacity-30" />
                                </div>
                                <p className="text-xs opacity-60">Sin operaciones</p>
                            </div>
                        )}
                        {ventas.map((v, i) => (
                            <VentaKanbanCard key={v.id} venta={v} index={i} />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}
