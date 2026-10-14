"use client";

import { Inquilino } from "@/domain/models/Inquilino";
import { Eye, Edit, Trash2, Phone, Mail, Home } from "lucide-react";

interface Props {
    inquilinos: Inquilino[];
    onDelete: (id: string) => void;
    onEdit: (i: Inquilino) => void;
    onViewDetail: (i: Inquilino) => void;
}

const getInitials = (name: string) =>
    name.trim().split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();

export default function InquilinosTable({ inquilinos, onDelete, onEdit, onViewDetail }: Props) {
    if (inquilinos.length === 0) {
        return (
            <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule-2)] shadow-sm flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="w-16 h-16 bg-[var(--color-paper-3)] rounded-full flex items-center justify-center mb-4">
                    <Home strokeWidth={1.5} size={28} className="text-[var(--color-muted)]" />
                </div>
                <p className="text-[16px] font-bold text-[var(--color-ink-2)]">Sin inquilinos registrados</p>
                <p className="text-sm text-[var(--color-neutral)] mt-1">Agregá un inquilino para verlo aquí</p>
            </div>
        );
    }

    return (
        <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule-2)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-[var(--color-paper)] border-b border-[var(--color-rule-2)]">
                            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-[var(--color-neutral)] uppercase tracking-widest">Inquilino</th>
                            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-[var(--color-neutral)] uppercase tracking-widest hidden md:table-cell">DNI</th>
                            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-[var(--color-neutral)] uppercase tracking-widest hidden lg:table-cell">Domicilio</th>
                            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-[var(--color-neutral)] uppercase tracking-widest hidden sm:table-cell">Contacto</th>
                            <th className="px-5 py-3.5 text-right text-[11px] font-bold text-[var(--color-neutral)] uppercase tracking-widest">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-rule-2)]">
                        {inquilinos.map((i) => (
                            <tr
                                key={i.id}
                                onClick={() => onViewDetail(i)}
                                className="hover:bg-[var(--color-paper-3)] transition-colors cursor-pointer group"
                            >
                                {/* Avatar + name */}
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-full bg-[var(--color-paper-3)] text-[var(--color-ink-2)] flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                                            {getInitials(i.nombre)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-accent-2)] transition-colors">{i.nombre}</p>
                                            <p className="text-xs text-[var(--color-neutral)] sm:hidden">{i.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-4 text-sm text-[var(--color-muted)] hidden md:table-cell font-mono">{i.dni || "—"}</td>
                                <td className="px-5 py-4 text-sm text-[var(--color-muted)] hidden lg:table-cell max-w-[200px] truncate">{i.domicilio || "—"}</td>
                                {/* Contact shortcuts */}
                                <td className="px-5 py-4 hidden sm:table-cell" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-2">
                                        {i.telefono && (
                                            <a
                                                href={`tel:${i.telefono}`}
                                                title={i.telefono}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--color-positive-soft)] text-[var(--color-positive)] hover:bg-[var(--color-positive-soft)] transition-colors"
                                            >
                                                <Phone strokeWidth={1.5} size={13} />
                                            </a>
                                        )}
                                        {i.email && (
                                            <a
                                                href={`mailto:${i.email}`}
                                                title={i.email}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--color-rule)] text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] transition-colors"
                                            >
                                                <Mail strokeWidth={1.5} size={13} />
                                            </a>
                                        )}
                                    </div>
                                </td>
                                {/* Actions */}
                                <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => onViewDetail(i)}
                                            className="p-2 text-[var(--color-neutral)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] rounded-lg transition-colors"
                                            title="Ver detalle"
                                        >
                                            <Eye strokeWidth={1.5} size={15} />
                                        </button>
                                        <button
                                            onClick={() => onEdit(i)}
                                            className="p-2 text-[var(--color-neutral)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit strokeWidth={1.5} size={15} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(i.id)}
                                            className="p-2 text-[var(--color-neutral)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 strokeWidth={1.5} size={15} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="px-5 py-3 border-t border-[var(--color-rule-2)] bg-[var(--color-paper)]/50 text-xs text-[var(--color-neutral)] font-medium">
                {inquilinos.length} inquilino{inquilinos.length !== 1 ? "s" : ""}
            </div>
        </div>
    );
}
