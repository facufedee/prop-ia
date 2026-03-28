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

const AVATAR_COLORS = [
    "from-emerald-400 to-teal-500",
    "from-indigo-400 to-blue-500",
    "from-violet-400 to-purple-500",
    "from-rose-400 to-pink-500",
    "from-amber-400 to-orange-500",
    "from-cyan-400 to-sky-500",
];
const avatarColor = (name: string) =>
    AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

export default function InquilinosTable({ inquilinos, onDelete, onEdit, onViewDetail }: Props) {
    if (inquilinos.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
                    <Home size={28} className="text-emerald-400" />
                </div>
                <p className="text-[16px] font-bold text-gray-700">Sin inquilinos registrados</p>
                <p className="text-sm text-gray-400 mt-1">Agregá un inquilino para verlo aquí</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">Inquilino</th>
                            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden md:table-cell">DNI</th>
                            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden lg:table-cell">Domicilio</th>
                            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden sm:table-cell">Contacto</th>
                            <th className="px-5 py-3.5 text-right text-[11px] font-bold text-gray-400 uppercase tracking-widest">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {inquilinos.map((i) => (
                            <tr
                                key={i.id}
                                onClick={() => onViewDetail(i)}
                                className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                            >
                                {/* Avatar + name */}
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(i.nombre)} text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm`}>
                                            {getInitials(i.nombre)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{i.nombre}</p>
                                            <p className="text-xs text-gray-400 sm:hidden">{i.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-4 text-sm text-gray-500 hidden md:table-cell font-mono">{i.dni || "—"}</td>
                                <td className="px-5 py-4 text-sm text-gray-500 hidden lg:table-cell max-w-[200px] truncate">{i.domicilio || "—"}</td>
                                {/* Contact shortcuts */}
                                <td className="px-5 py-4 hidden sm:table-cell" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-2">
                                        {i.telefono && (
                                            <a
                                                href={`tel:${i.telefono}`}
                                                title={i.telefono}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                            >
                                                <Phone size={13} />
                                            </a>
                                        )}
                                        {i.email && (
                                            <a
                                                href={`mailto:${i.email}`}
                                                title={i.email}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                                            >
                                                <Mail size={13} />
                                            </a>
                                        )}
                                    </div>
                                </td>
                                {/* Actions */}
                                <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => onViewDetail(i)}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Ver detalle"
                                        >
                                            <Eye size={15} />
                                        </button>
                                        <button
                                            onClick={() => onEdit(i)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit size={15} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(i.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50 text-xs text-gray-400 font-medium">
                {inquilinos.length} inquilino{inquilinos.length !== 1 ? "s" : ""}
            </div>
        </div>
    );
}
