"use client";

import { Droppable } from "@hello-pangea/dnd";
import { Lead, LeadEstado } from "@/domain/models/Lead";
import KanbanCard from "./KanbanCard";
import { LucideIcon } from "lucide-react";

interface KanbanColumnProps {
    id: string;
    title: string;
    subtitle: string;
    icon: LucideIcon;
    color: string; // tailwind bg+text classes for the header badge
    headerBg: string; // tailwind bg for the column header area
    columnBg: string; // tailwind bg for the column body
    leads: Lead[];
    onDelete?: (id: string) => void;
    onStatusChange?: (id: string, newStatus: LeadEstado) => void;
}

export default function KanbanColumn({
    id,
    title,
    subtitle,
    icon: Icon,
    color,
    headerBg,
    columnBg,
    leads,
    onDelete,
    onStatusChange
}: KanbanColumnProps) {
    return (
        <div className={`flex flex-col rounded-2xl ${columnBg} border border-gray-200/80 w-full md:min-w-[290px] md:max-w-[320px] flex-shrink-0 h-full shadow-sm`}>
            {/* Column Header */}
            <div className={`px-4 py-3.5 ${headerBg} rounded-t-2xl border-b border-gray-200/60 sticky top-0 z-10`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center`}>
                            <Icon size={15} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-sm leading-tight">{title}</h3>
                            <p className="text-[10px] text-gray-500 leading-none mt-0.5">{subtitle}</p>
                        </div>
                    </div>
                    {/* Count badge */}
                    <span className={`${color} text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center`}>
                        {leads.length}
                    </span>
                </div>
            </div>

            {/* Droppable Cards Area */}
            <Droppable droppableId={id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-3 overflow-y-auto transition-colors duration-200 
                            ${snapshot.isDraggingOver ? "bg-indigo-50/60 rounded-b-2xl" : ""}
                        `}
                        style={{ minHeight: "150px" }}
                    >
                        {leads.length === 0 && !snapshot.isDraggingOver && (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                                    <Icon size={18} className="opacity-40" />
                                </div>
                                <p className="text-xs text-center opacity-70">Sin consultas</p>
                                <p className="text-[10px] text-center opacity-50 mt-0.5">Arrastrá una tarjeta aquí</p>
                            </div>
                        )}
                        {leads.map((lead, idx) => (
                            <KanbanCard
                                key={lead.id}
                                lead={lead}
                                index={idx}
                                onDelete={onDelete}
                                onStatusChange={onStatusChange}
                            />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}
