
import { useState, useRef, useEffect } from "react";
import { Property } from "@/ui/components/tables/PropertiesTable";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Ruler, BedDouble, Bath, Car, Trash2, Edit, Printer, Share2, Eye, LayoutGrid, Check, X, MoreVertical, Copy, Power, DollarSign, RefreshCw } from "lucide-react";
import FichasPdfModal from "@/ui/components/properties/ficha/FichasPdfModal";

interface PropertyCardProps {
    property: Property;
    onDelete: (id: string) => void;
    onUpdate?: (id: string, data: Partial<Property>) => Promise<void>;
    onDuplicate?: (property: Property) => Promise<void>;
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
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [showFichasModal, setShowFichasModal] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    const unmarkAsSold = () => {
        if (onUpdate) {
            onUpdate(property.id, { status: 'inactive' });
            setShowMenu(false);
        }
    };

    const getOperationColor = (type: string) => {
        switch (type) {
            case 'Venta': return 'bg-[var(--color-positive-soft)] text-[var(--color-positive)] border-[var(--color-positive)]/30';
            case 'Alquiler': return 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-[var(--color-accent)]/30';
            case 'Alquiler Temporal': return 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-[var(--color-accent)]/30';
            default: return 'bg-[var(--color-paper-3)] text-[var(--color-ink-2)] border-[var(--color-rule)]';
        }
    };

    return (
        <div className={`bg-[var(--color-paper-2)] rounded-xl border overflow-hidden hover:shadow-lg transition-all duration-200 group flex flex-col h-full relative ${property.status === 'sold' ? 'opacity-75' : ''} ${property.status === 'inactive' ? 'border-[var(--color-rule)] bg-[var(--color-paper)]' : 'border-[var(--color-rule)]'}`}>
            {/* Clickable Area for whole card */}
            {!isEditing && (
                <Link href={`/dashboard/propiedades/editar/${property.id}`} className="absolute inset-0 z-0" title="Editar propiedad" />
            )}

            {/* Menu Button - Top Right */}
            <div className="absolute top-3 right-3 z-50 pointer-events-auto" ref={menuRef}>
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(!showMenu); }}
                    className="p-2 bg-[var(--color-paper-2)]/90 hover:bg-[var(--color-paper-3)] rounded-full text-[var(--color-ink-2)] shadow-md transition-all"
                >
                    <MoreVertical strokeWidth={1.5} size={16} />
                </button>
                {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-[var(--color-paper-2)] rounded-xl shadow-2xl border border-[var(--color-rule-2)] p-1 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 pointer-events-auto">
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsEditing(true); setShowMenu(false); }}
                            className="w-full text-left px-3 py-2 text-sm text-[var(--color-ink-2)] hover:bg-[var(--color-paper-3)] rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Edit strokeWidth={1.5} size={14} /> Edición rápida
                        </button>
                        <button
                            onClick={async (e) => { 
                                e.preventDefault(); 
                                e.stopPropagation(); 
                                if (onDuplicate && !isDuplicating) {
                                    setIsDuplicating(true);
                                    try {
                                        await onDuplicate(property);
                                    } finally {
                                        setIsDuplicating(false);
                                        setShowMenu(false);
                                    }
                                } 
                            }}
                            disabled={isDuplicating}
                            className={`w-full text-left px-3 py-2 text-sm text-[var(--color-ink-2)] hover:bg-[var(--color-paper-3)] rounded-lg flex items-center gap-2 transition-colors ${isDuplicating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isDuplicating ? (
                                <>
                                    <RefreshCw strokeWidth={1.5} size={14} className="animate-spin text-[var(--color-accent)]" /> Duplicando...
                                </>
                            ) : (
                                <>
                                    <Copy strokeWidth={1.5} size={14} /> Duplicar
                                </>
                            )}
                        </button>
                        {property.status !== 'sold' ? (
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); markAsSold(); }}
                                className="w-full text-left px-3 py-2 text-sm text-[var(--color-ink-2)] hover:bg-[var(--color-paper-3)] rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <DollarSign strokeWidth={1.5} size={14} /> Marcar Vendida
                            </button>
                        ) : (
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); unmarkAsSold(); }}
                                className="w-full text-left px-3 py-2 text-sm text-[var(--color-ink-2)] hover:bg-[var(--color-paper-3)] rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <RefreshCw strokeWidth={1.5} size={14} /> Desmarcar Vendida
                            </button>
                        )}
                        <div className="h-px bg-[var(--color-paper-3)] my-1 mx-2" />
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(property.id); }}
                            className="w-full text-left px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)] rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Trash2 strokeWidth={1.5} size={14} /> Eliminar
                        </button>
                    </div>
                )}
            </div>

            {/* Image Header */}
            <div className="relative h-48 bg-[var(--color-paper-3)] group z-10 pointer-events-none">
                {property.imageUrls && property.imageUrls.length > 0 ? (
                    <Image
                        src={property.imageUrls[0]}
                        alt={property.title}
                        fill
                        className={`object-cover transition-all ${property.status === 'sold' ? 'grayscale' : ''}`}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={false}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--color-neutral)]">
                        <span className="text-sm">Sin imagen</span>
                    </div>
                )}

                {/* Status Overlay */}
                {property.status === 'sold' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <span className="text-[var(--color-ink)] font-bold text-xl tracking-widest border-4 border-[var(--color-ink)] px-4 py-2 rotate-[-15deg]">VENDIDA</span>
                    </div>
                )}

                {/* Badges - Top Left */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm w-fit ${getOperationColor(property.operation_type)}`}>
                        {property.operation_type}
                    </span>
                    {property.status === 'inactive' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm bg-[var(--color-ink)] text-[var(--color-paper)] w-fit">
                            PAUSADA
                        </span>
                    )}
                    {property.status === 'reserved' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm bg-[var(--color-warning)]/30 text-[var(--color-warning)] w-fit">
                            RESERVADA
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col">
                {isEditing ? (
                    <div className="flex-1 space-y-3">
                        <div>
                            <label className="text-xs text-[var(--color-muted)] font-semibold uppercase">Título</label>
                            <input
                                type="text"
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                className="w-full p-2 border border-[var(--color-rule)] rounded-lg text-sm text-[var(--color-ink)] focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)]"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-[var(--color-muted)] font-semibold uppercase">Precio</label>
                            <div className="flex gap-2">
                                <select
                                    value={editForm.currency}
                                    onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                                    className="p-2 border border-[var(--color-rule)] rounded-lg text-sm text-[var(--color-ink)] bg-[var(--color-paper)]"
                                >
                                    <option value="USD">USD</option>
                                    <option value="ARS">ARS</option>
                                </select>
                                <input
                                    type="number"
                                    value={editForm.price}
                                    onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                                    className="w-full p-2 border border-[var(--color-rule)] rounded-lg text-sm text-[var(--color-ink)] focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)]"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id={`hidePrice-${property.id}`}
                                checked={editForm.hidePrice}
                                onChange={(e) => setEditForm({ ...editForm, hidePrice: e.target.checked })}
                                className="rounded text-[var(--color-accent)] focus:ring-[var(--color-accent)]/40"
                            />
                            <label htmlFor={`hidePrice-${property.id}`} className="text-sm text-[var(--color-ink-2)]">Ocultar Precio</label>
                        </div>

                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--color-rule-2)]">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex-1 py-1.5 text-sm text-[var(--color-ink-2)] bg-[var(--color-paper-3)] rounded-lg hover:bg-[var(--color-paper-4)]"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 py-1.5 text-sm text-[var(--color-paper)] bg-[var(--color-ink)] rounded-lg hover:bg-[var(--color-ink-2)] font-medium"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 z-10 pointer-events-none">
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-[var(--color-ink)] line-clamp-1 text-lg mb-1" title={property.title}>
                                {property.title || "Sin título"}
                            </h3>
                        </div>

                        <div className="flex items-center text-[var(--color-muted)] text-sm mb-4">
                            <MapPin strokeWidth={1.5} className="w-4 h-4 mr-1 flex-shrink-0" />
                            <span className="truncate">{property.localidad}, {property.provincia}</span>
                        </div>

                        <div className="text-xl font-bold text-[var(--color-accent)] mb-4">
                            {property.hidePrice || Number(property.price) === 0 ? (
                                "Consultar Precio"
                            ) : (
                                `${property.currency} ${Number(property.price)?.toLocaleString('es-AR')}`
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-3 border-t border-[var(--color-rule-2)] text-xs text-[var(--color-muted)]">
                            <div className="flex items-center gap-1" title="Superficie Cubierta">
                                <Ruler strokeWidth={1.5} className="w-4 h-4" />
                                <span>{property.area_covered}m²</span>
                            </div>
                            {Number(property.rooms) > 0 && (
                                <div className="flex items-center gap-1" title="Ambientes">
                                    <LayoutGrid strokeWidth={1.5} className="w-4 h-4" />
                                    <span>{property.rooms}</span>
                                </div>
                            )}
                            {Number(property.bedrooms) > 0 && (
                                <div className="flex items-center gap-1" title="Dormitorios">
                                    <BedDouble strokeWidth={1.5} className="w-4 h-4" />
                                    <span>{property.bedrooms}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                {!isEditing && (
                    <div className="pt-4 mt-auto border-t border-[var(--color-rule-2)] flex items-center justify-between gap-3 z-10 pointer-events-auto relative">
                        {property.status === 'active' ? (
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleStatus(); }}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-paper-3)] text-[var(--color-ink-2)] font-bold hover:bg-[var(--color-paper-4)] transition-colors text-xs border border-[var(--color-rule)]"
                                title="Pausar publicación"
                            >
                                <Power strokeWidth={1.5} size={14} /> Pausar Propiedad
                            </button>
                        ) : property.status === 'inactive' ? (
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleStatus(); }}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-positive-soft)] text-[var(--color-positive)] font-bold hover:bg-[var(--color-positive-soft)] transition-colors text-xs border border-[var(--color-positive)]/30"
                                title="Activar publicación"
                            >
                                <Check strokeWidth={1.5} size={14} /> Publicar Propiedad
                            </button>
                        ) : (
                            <div className="flex-1 text-center py-2 text-xs font-bold text-[var(--color-neutral)] select-none">
                                {property.status === 'sold' ? 'VENDIDA' : 'RESERVADA'}
                            </div>
                        )}

                        <div className="flex items-center gap-1 border-l pl-3 border-[var(--color-rule-2)] pointer-events-auto">
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowFichasModal(true); }}
                                className="p-2 rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-accent-2)] transition-colors"
                                title="Fichas en PDF"
                            >
                                <Printer strokeWidth={1.5} className="w-4 h-4" />
                            </button>
                            <Link
                                href={`/dashboard/propiedades/editar/${property.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-accent-2)] transition-colors"
                                title="Edición completa"
                            >
                                <Edit strokeWidth={1.5} className="w-4 h-4" />
                            </Link>
                            <Link
                                href={`/propiedades/p/${property.id}`}
                                target="_blank" rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-accent-2)] transition-colors"
                                title="Ver publicación"
                            >
                                <Eye strokeWidth={1.5} className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {showFichasModal && (
                <FichasPdfModal propertyId={property.id} onClose={() => setShowFichasModal(false)} />
            )}
        </div>
    );
}
