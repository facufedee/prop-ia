
import { useState } from "react";
import { Property } from "@/ui/components/tables/PropertiesTable";
import Link from "next/link";
import { MapPin, Ruler, BedDouble, Bath, Car, Trash2, Edit, Printer, Share2, Eye, LayoutGrid, Check, X, MoreVertical, Copy, Power, DollarSign } from "lucide-react";

interface PropertyCardProps {
    property: Property;
    onDelete: (id: string) => void;
    onUpdate?: (id: string, data: Partial<Property>) => Promise<void>;
    onDuplicate?: (property: Property) => void;
}

export default function PropertyCard({ property, onDelete, onUpdate, onDuplicate }: PropertyCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        title: property.title || "",
        price: property.price || 0,
        currency: property.currency || "USD",
        hidePrice: property.hidePrice || false
    });
    const [showMenu, setShowMenu] = useState(false);

    const handleSave = async () => {
        if (onUpdate) {
            await onUpdate(property.id, editForm);
            setIsEditing(false);
        }
    };

    const toggleStatus = () => {
        if (onUpdate) {
            const newStatus = property.status === 'active' ? 'inactive' : 'active';
            onUpdate(property.id, { status: newStatus });
        }
    };

    const markAsSold = () => {
        if (onUpdate) {
            onUpdate(property.id, { status: 'sold' });
            setShowMenu(false);
        }
    };

    const getOperationColor = (type: string) => {
        switch (type) {
            case 'Venta': return 'bg-green-100 text-green-700 border-green-200';
            case 'Alquiler': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Alquiler Temporal': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className={`bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-all duration-200 group flex flex-col h-full relative ${property.status === 'sold' ? 'opacity-75' : ''} ${property.status === 'inactive' ? 'border-gray-300 bg-gray-50' : 'border-gray-200'}`}>
            {/* Image Header */}
            <div className="relative h-48 bg-gray-100 group">
                {property.imageUrls && property.imageUrls.length > 0 ? (
                    <img
                        src={property.imageUrls[0]}
                        alt={property.title}
                        className={`w-full h-full object-cover transition-all ${property.status === 'sold' ? 'grayscale' : ''}`}
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-sm">Sin imagen</span>
                    </div>
                )}

                {/* Status Overlay */}
                {property.status === 'sold' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <span className="text-white font-bold text-xl tracking-widest border-4 border-white px-4 py-2 rotate-[-15deg]">VENDIDA</span>
                    </div>
                )}

                {/* Badges - Top Left */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm w-fit ${getOperationColor(property.operation_type)}`}>
                        {property.operation_type}
                    </span>
                    {property.status === 'inactive' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm bg-gray-800 text-white w-fit">
                            PAUSADA
                        </span>
                    )}
                    {property.status === 'reserved' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm bg-yellow-400 text-yellow-900 w-fit">
                            RESERVADA
                        </span>
                    )}
                </div>

                {/* Menu Button - Top Right */}
                <div className="absolute top-3 right-3 z-30">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 bg-white/90 hover:bg-white rounded-full text-gray-700 shadow-md transition-all"
                    >
                        <MoreVertical size={16} />
                    </button>
                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95">
                                <button
                                    onClick={() => { setIsEditing(true); setShowMenu(false); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Edit size={14} /> Edición rápida
                                </button>
                                <button
                                    onClick={() => { if (onDuplicate) onDuplicate(property); setShowMenu(false); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Copy size={14} /> Duplicar
                                </button>
                                {property.status !== 'sold' && (
                                    <button
                                        onClick={markAsSold}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <DollarSign size={14} /> Marcar Vendida
                                    </button>
                                )}
                                <div className="h-px bg-gray-100 my-1" />
                                <button
                                    onClick={() => onDelete(property.id)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <Trash2 size={14} /> Eliminar
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col">
                {isEditing ? (
                    <div className="flex-1 space-y-3">
                        <div>
                            <label className="text-xs text-gray-500 font-semibold uppercase">Título</label>
                            <input
                                type="text"
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-semibold uppercase">Precio</label>
                            <div className="flex gap-2">
                                <select
                                    value={editForm.currency}
                                    onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                                    className="p-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-gray-50"
                                >
                                    <option value="USD">USD</option>
                                    <option value="ARS">ARS</option>
                                </select>
                                <input
                                    type="number"
                                    value={editForm.price}
                                    onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id={`hidePrice-${property.id}`}
                                checked={editForm.hidePrice}
                                onChange={(e) => setEditForm({ ...editForm, hidePrice: e.target.checked })}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor={`hidePrice-${property.id}`} className="text-sm text-gray-600">Ocultar Precio</label>
                        </div>

                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex-1 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 py-1.5 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 font-medium"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-gray-900 line-clamp-1 text-lg mb-1" title={property.title}>
                                {property.title || "Sin título"}
                            </h3>
                        </div>

                        <div className="flex items-center text-gray-500 text-sm mb-4">
                            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                            <span className="truncate">{property.localidad}, {property.provincia}</span>
                        </div>

                        <div className="text-xl font-bold text-indigo-600 mb-4">
                            {property.hidePrice ? (
                                "Consultar Precio"
                            ) : (
                                `${property.currency} ${Number(property.price)?.toLocaleString('es-AR')}`
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-3 border-t border-gray-100 text-xs text-gray-500">
                            <div className="flex items-center gap-1" title="Superficie Cubierta">
                                <Ruler className="w-4 h-4" />
                                <span>{property.area_covered}m²</span>
                            </div>
                            {Number(property.rooms) > 0 && (
                                <div className="flex items-center gap-1" title="Ambientes">
                                    <LayoutGrid className="w-4 h-4" />
                                    <span>{property.rooms}</span>
                                </div>
                            )}
                            {Number(property.bedrooms) > 0 && (
                                <div className="flex items-center gap-1" title="Dormitorios">
                                    <BedDouble className="w-4 h-4" />
                                    <span>{property.bedrooms}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                {!isEditing && (
                    <div className="pt-4 mt-auto border-t border-gray-100 flex items-center justify-between gap-3">
                        {property.status === 'active' ? (
                            <button
                                onClick={toggleStatus}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors text-xs border border-gray-200"
                                title="Pausar publicación"
                            >
                                <Power size={14} /> Despublicar
                            </button>
                        ) : property.status === 'inactive' ? (
                            <button
                                onClick={toggleStatus}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-50 text-green-700 font-bold hover:bg-green-100 transition-colors text-xs border border-green-200"
                                title="Activar publicación"
                            >
                                <Check size={14} /> Publicar
                            </button>
                        ) : (
                            <div className="flex-1 text-center py-2 text-xs font-bold text-gray-400 select-none">
                                {property.status === 'sold' ? 'VENDIDA' : 'RESERVADA'}
                            </div>
                        )}

                        <div className="flex items-center gap-1 border-l pl-3 border-gray-100">
                            <Link
                                href={`/print/propiedades/${property.id}`}
                                target="_blank"
                                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                                title="Imprimir Ficha"
                            >
                                <Printer className="w-4 h-4" />
                            </Link>
                            <Link
                                href={`/dashboard/propiedades/editar/${property.id}`}
                                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                                title="Edición completa"
                            >
                                <Edit className="w-4 h-4" />
                            </Link>
                            <Link
                                href={`/propiedades/p/${property.id}`}
                                target="_blank"
                                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                                title="Ver publicación"
                            >
                                <Eye className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
