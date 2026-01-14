"use client";

import { useState } from "react";
import { Home, Loader2, Trash2, Edit, Printer, Share2, MoreVertical, Copy, Eye, X, Check, EyeOff } from "lucide-react";
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
    property_type?: string;
    bedrooms?: number | string;
    bathrooms?: number | string;
    garages?: number | string;
    rooms?: number | string;
    imageUrls?: string[];
    userId?: string;
    branchId?: string;
    hidePrice?: boolean;
    isRemodeled?: boolean;
    remodeledYear?: string;
    status?: 'active' | 'inactive' | 'reserved' | 'sold';
    calle?: string;
    altura?: string;
}

interface PropertiesTableProps {
    properties: Property[];
    loading: boolean;
    onDelete: (id: string) => void;
    onUpdate?: (id: string, data: Partial<Property>) => Promise<void>;
    onDuplicate?: (property: Property) => void;
}

export default function PropertiesTable({ properties, loading, onDelete, onUpdate, onDuplicate }: PropertiesTableProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Property>>({});
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const handleEditClick = (property: Property) => {
        setEditingId(property.id);
        setEditForm({
            title: property.title,
            price: property.price,
            currency: property.currency,
            operation_type: property.operation_type,
            property_type: property.property_type || '', // Handle potentially undefined
            status: property.status || 'active',
            hidePrice: property.hidePrice || false
        });
        setOpenMenuId(null);
    };

    const handleSave = async () => {
        if (!editingId || !onUpdate) return;

        try {
            await onUpdate(editingId, editForm);
            setEditingId(null);
        } catch (error) {
            console.error("Error saving property:", error);
            alert("Error al guardar los cambios");
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({});
    };

    const toggleMenu = (id: string) => {
        if (openMenuId === id) {
            setOpenMenuId(null);
        } else {
            setOpenMenuId(id);
        }
    };

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
        <div className="bg-white border rounded-2xl shadow-sm overflow-visible">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-100 text-gray-700 text-sm">
                        <th className="p-4 w-12 text-center">ID</th>
                        <th className="p-4 w-20">Imagen</th>
                        <th className="p-4">Título</th>
                        <th className="p-4">Dirección</th>
                        <th className="p-4">Precio</th>
                        <th className="p-4">Categoría</th>
                        <th className="p-4 w-[50px]"></th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {properties.map((p) => {
                        const isEditing = editingId === p.id;

                        if (isEditing) {
                            return (
                                <tr key={p.id} className="bg-gray-50 border-t border-b hover:bg-gray-50">
                                    <td colSpan={7} className="p-4">
                                        <div className="bg-gray-800 text-white p-4 rounded-xl shadow-lg relative -mx-2 my-2">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="font-semibold text-lg">Edición rápida</h3>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                                <div className="col-span-2">
                                                    <label className="block text-xs text-gray-400 mb-1">Título</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.title || ''}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Categoría</label>
                                                    <select
                                                        value={editForm.operation_type || 'Venta'}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, operation_type: e.target.value }))}
                                                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    >
                                                        <option value="Venta">Venta</option>
                                                        <option value="Alquiler">Alquiler</option>
                                                        <option value="Alquiler Temporal">Temporal</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Tipo</label>
                                                    <select
                                                        value={editForm.property_type || ''}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, property_type: e.target.value }))}
                                                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    >
                                                        <option value="Casa">Casa</option>
                                                        <option value="Departamento">Departamento</option>
                                                        <option value="PH">PH</option>
                                                        <option value="Terreno">Terreno</option>
                                                        <option value="Local">Local</option>
                                                        <option value="Oficina">Oficina</option>
                                                        <option value="Galpon">Galpon</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Precio</label>
                                                    <input
                                                        type="number"
                                                        value={editForm.price || ''}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                                                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Moneda</label>
                                                    <select
                                                        value={editForm.currency || 'USD'}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, currency: e.target.value }))}
                                                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    >
                                                        <option value="USD">USD</option>
                                                        <option value="ARS">ARS</option>
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-2 pb-3">
                                                    <div
                                                        onClick={() => setEditForm(prev => ({ ...prev, hidePrice: !prev.hidePrice }))}
                                                        className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${editForm.hidePrice ? 'bg-indigo-600' : 'bg-gray-600'}`}
                                                    >
                                                        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${editForm.hidePrice ? 'translate-x-4' : ''}`} />
                                                    </div>
                                                    <span className="text-sm text-gray-300">Consultar precio</span>
                                                </div>

                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Estado</label>
                                                    <select
                                                        value={editForm.status || 'active'}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                                                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    >
                                                        <option value="active">Activa</option>
                                                        <option value="inactive">Pausada</option>
                                                        <option value="reserved">Reservada</option>
                                                        <option value="sold">Vendida / Alquilada</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                                                <button
                                                    onClick={() => onDelete(p.id)}
                                                    className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm"
                                                >
                                                    <Trash2 size={14} /> Eliminar propiedad
                                                </button>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleCancel}
                                                        className="px-4 py-2 rounded text-gray-300 hover:text-white hover:bg-gray-700 transition"
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        onClick={handleSave}
                                                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition font-medium"
                                                    >
                                                        Guardar cambios
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        }

                        // Regular Row
                        return (
                            <tr key={p.id} className="border-t text-gray-700 hover:bg-gray-50 transition relative group">
                                <td className="p-4 text-center text-xs text-gray-500">
                                    {/* Using substring of ID as a short ref just for visual match with screenshot */}
                                    {p.id.substring(0, 4)}
                                </td>
                                <td className="p-4">
                                    <div className="w-16 h-12 rounded bg-gray-200 overflow-hidden flex-shrink-0">
                                        {p.imageUrls && p.imageUrls.length > 0 ? (
                                            <img src={p.imageUrls[0]} alt={p.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <Home size={16} />
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <Link href={`/dashboard/propiedades/editar/${p.id}`} className="font-medium text-indigo-600 hover:underline block truncate max-w-[250px]">
                                        {p.title || "Sin título"}
                                    </Link>
                                    <div className="flex gap-2 mt-1">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${p.operation_type === 'Venta' ? 'bg-green-50 text-green-700 border-green-200' :
                                            p.operation_type === 'Alquiler' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                'bg-purple-50 text-purple-700 border-purple-200'
                                            }`}>
                                            {p.operation_type}
                                        </span>
                                        {p.status === 'inactive' && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                                Pausada
                                            </span>
                                        )}
                                        {p.status === 'reserved' && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
                                                Reservada
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-xs text-gray-500">
                                    <p>{p.calle} {p.altura}</p>
                                    <p>{p.localidad}, {p.provincia}</p>
                                </td>
                                <td className="p-4 font-medium text-gray-900">
                                    {p.hidePrice ? (
                                        <span className="text-gray-400 text-xs italic">Consultar</span>
                                    ) : (
                                        <>{p.currency} {p.price?.toLocaleString()}</>
                                    )}
                                </td>
                                <td className="p-4 text-sm text-gray-600">
                                    {p.property_type || '-'}
                                </td>
                                <td className="p-4 text-right relative">
                                    <button
                                        onClick={() => toggleMenu(p.id)}
                                        className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition"
                                    >
                                        <MoreVertical size={18} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {openMenuId === p.id && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setOpenMenuId(null)}
                                            />
                                            <div className="absolute right-10 top-8 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                <button
                                                    onClick={() => handleEditClick(p)}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <Edit size={14} className="text-gray-400" /> Edición rápida
                                                </button>
                                                <Link
                                                    href={`/propiedades/p/${p.id}`}
                                                    target="_blank"
                                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <Eye size={14} className="text-gray-400" /> Ver publicación
                                                </Link>
                                                <Link
                                                    href={`/dashboard/propiedades/editar/${p.id}`}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <Edit size={14} className="text-gray-400" /> Editar
                                                </Link>

                                                <div className="h-px bg-gray-100 my-1" />

                                                {p.status === 'active' ? (
                                                    <button
                                                        onClick={() => {
                                                            if (onUpdate) onUpdate(p.id, { status: 'inactive' });
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                    >
                                                        <EyeOff size={14} className="text-gray-400" /> Despublicar
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            if (onUpdate) onUpdate(p.id, { status: 'active' });
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                    >
                                                        <Eye size={14} className="text-gray-400" /> Publicar
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => {
                                                        if (onDuplicate) onDuplicate(p);
                                                        setOpenMenuId(null);
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <Copy size={14} className="text-gray-400" /> Duplicado
                                                </button>

                                                <div className="h-px bg-gray-100 my-1" />

                                                <button
                                                    onClick={() => onDelete(p.id)}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                >
                                                    <Trash2 size={14} /> Elimina
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}