"use client";

import { Propietario } from "@/domain/models/Propietario";
import { Eye, Edit, Trash2, Phone, Mail, Building2 } from "lucide-react";

interface Props {
    propietarios: Propietario[];
    onDelete: (id: string) => void;
    onEdit: (p: Propietario) => void;
    onViewDetail: (p: Propietario) => void;
}

const getInitials = (name: string) =>
    name.trim().split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();

const AVATAR_COLORS = [
    "from-indigo-400 to-blue-500",
    "from-violet-400 to-purple-500",
    "from-emerald-400 to-teal-500",
    "from-rose-400 to-pink-500",
    "from-amber-400 to-orange-500",
    "from-cyan-400 to-sky-500",
];
const avatarColor = (name: string) =>
    AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

export default function PropietariosTable({ propietarios, onDelete, onEdit, onViewDetail }: Props) {
    if (propietarios.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 border border-indigo-100">
                    <Building2 size={28} className="text-indigo-400" />
                </div>
                <p className="text-[16px] font-bold text-gray-700">Sin propietarios registrados</p>
                <p className="text-sm text-gray-400 mt-1">Agregá un propietario para verlo aquí</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">Propietario</th>
                            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden md:table-cell">DNI / CUIT</th>
                            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden sm:table-cell">Contacto</th>
                            <th className="px-5 py-3.5 text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden lg:table-cell">Propiedades</th>
                            <th className="px-5 py-3.5 text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden lg:table-cell">Comisión</th>
                            <th className="px-5 py-3.5 text-right text-[11px] font-bold text-gray-400 uppercase tracking-widest">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {propietarios.map((p) => (
                            <tr
                                key={p.id}
                                onClick={() => onViewDetail(p)}
                                className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                            >
                                {/* Avatar + name */}
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(p.nombre)} text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm`}>
                                            {getInitials(p.nombre)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{p.nombre}</p>
                                            <p className="text-xs text-gray-400 sm:hidden">{p.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-4 text-sm text-gray-500 hidden md:table-cell font-mono">{p.dni || "—"}</td>
                                {/* Contact */}
                                <td className="px-5 py-4 hidden sm:table-cell" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-2">
                                        {p.telefono && (
                                            <a
                                                href={`tel:${p.telefono}`}
                                                title={p.telefono}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                                            >
                                                <Phone size={13} />
                                            </a>
                                        )}
                                        {p.email && (
                                            <a
                                                href={`mailto:${p.email}`}
                                                title={p.email}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                                            >
                                                <Mail size={13} />
                                            </a>
                                        )}
                                        {!p.telefono && !p.email && <span className="text-xs text-gray-400">—</span>}
                                    </div>
                                </td>
                                {/* Props count */}
                                <td className="px-5 py-4 text-center hidden lg:table-cell">
                                    {p.propiedades?.length > 0 ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                            <Building2 size={11} /> {p.propiedades.length}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400">—</span>
                                    )}
                                </td>
                                {/* Commission */}
                                <td className="px-5 py-4 text-center hidden lg:table-cell">
                                    {p.comision ? (
                                        <span className="text-sm font-bold text-emerald-600">{p.comision}%</span>
                                    ) : (
                                        <span className="text-xs text-gray-400">—</span>
                                    )}
                                </td>
                                {/* Actions */}
                                <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => onViewDetail(p)}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Ver detalle"
                                        >
                                            <Eye size={15} />
                                        </button>
                                        <button
                                            onClick={() => onEdit(p)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit size={15} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(p.id)}
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
                {propietarios.length} propietario{propietarios.length !== 1 ? "s" : ""}
            </div>
        </div>
    );
}
