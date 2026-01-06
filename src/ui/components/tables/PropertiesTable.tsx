"use client";

import { useEffect, useState } from "react";
import { Home, Loader2, Trash2, Edit } from "lucide-react";
import { db, auth } from "@/infrastructure/firebase/client";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

export interface Property {
    id: string;
    title: string;
    localidad: string;
    provincia: string;
    area_covered: number;
    price: number;
    currency: string;
    operation_type: string;
    imageUrls?: string[];
    userId?: string;
    branchId?: string;
}

interface PropertiesTableProps {
    properties: Property[];
    loading: boolean;
    onDelete: (id: string) => void;
}

export default function PropertiesTable({ properties, loading, onDelete }: PropertiesTableProps) {
    // Internal state removed, using props

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8 bg-white border rounded-2xl shadow-sm">
                <Loader2 className="animate-spin text-gray-400" />
            </div>
        );
    }

    if (properties.length === 0) {
        return (
            <div className="p-8 text-center bg-white border rounded-2xl shadow-sm text-gray-500">
                No tenés propiedades publicadas aún.
            </div>
        );
    }

    return (
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-100 text-gray-700 text-sm">
                        <th className="p-4">Propiedad</th>
                        <th className="p-4">Ubicación</th>
                        <th className="p-4">Precio</th>
                        <th className="p-4">Operación</th>
                        <th className="p-4 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {properties.map((p) => (
                        <tr key={p.id} className="border-t text-black hover:bg-gray-50 transition">
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                                        {p.imageUrls && p.imageUrls.length > 0 ? (
                                            <img src={p.imageUrls[0]} alt={p.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <Home size={16} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm truncate max-w-[200px]">{p.title || "Sin título"}</p>
                                        <p className="text-xs text-gray-500">{p.area_covered} m²</p>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4 text-sm text-gray-600">{p.localidad}, {p.provincia}</td>
                            <td className="p-4 font-medium text-sm">{p.currency} {p.price?.toLocaleString()}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.operation_type === 'Venta' ? 'bg-green-100 text-green-700' :
                                    p.operation_type === 'Alquiler' ? 'bg-blue-100 text-blue-700' :
                                        'bg-purple-100 text-purple-700'
                                    }`}>
                                    {p.operation_type}
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Link href={`/dashboard/propiedades/editar/${p.id}`} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition">
                                        <Edit size={16} />
                                    </Link>
                                    <button
                                        onClick={() => onDelete(p.id)}
                                        className="p-2 hover:bg-red-50 rounded-full text-red-500 transition"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}