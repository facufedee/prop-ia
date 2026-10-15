"use client";

import { useEffect, useState } from "react";
import PropertiesTable, { Property } from "@/ui/components/tables/PropertiesTable";
import { Plus, Building2, Home, Key, Search, Filter, LayoutGrid, List, Share2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from "@/infrastructure/firebase/client";
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, addDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useBranchContext } from "@/infrastructure/context/BranchContext";
import PropertyCard from "./components/PropertyCard";

function normalizeStr(str: string): string {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function fuzzyMatch(text: string, query: string): boolean {
    const normText = normalizeStr(text);
    const normQuery = normalizeStr(query.trim());
    if (!normQuery) return true;
    if (normText.includes(normQuery)) return true;
    const queryWords = normQuery.split(/\s+/).filter(Boolean);
    if (queryWords.length > 1) {
        const textWords = normText.split(/[\s,.-]+/).filter(Boolean);
        return queryWords.every(qw =>
            textWords.some(tw => tw.includes(qw) || qw.includes(tw))
        );
    }
    return false;
}

export default function PropiedadesPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<'Todos' | 'Venta' | 'Alquiler' | 'Alquiler Temporal'>('Todos');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const { selectedBranchId } = useBranchContext();
    const [user, setUser] = useState<any>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    
    const router = useRouter();

    // 1. Auth Listener
    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 2. Fetch Data when User or Branch changes
    useEffect(() => {
        if (user) {
            fetchProperties(user.uid, selectedBranchId);
        }
    }, [user, selectedBranchId]);

    // 3. Filter Logic
    useEffect(() => {
        let result = properties;

        // Filter by Operation
        if (filter !== 'Todos') {
            result = result.filter(p => p.operation_type === filter);
        }

        // Filter by Search
        if (searchTerm.trim()) {
            result = result.filter(p =>
                (p.title && fuzzyMatch(p.title, searchTerm)) ||
                (p.localidad && fuzzyMatch(p.localidad, searchTerm)) ||
                (p.provincia && fuzzyMatch(p.provincia, searchTerm))
            );
        }

        setFilteredProperties(result);
    }, [properties, filter, searchTerm]);

    const fetchProperties = async (userId: string, branchId?: string) => {
        try {
            setLoading(true);
            if (!db) throw new Error("Firestore not initialized");

            let q = query(
                collection(db, "properties"),
                where("userId", "==", userId)
            );

            if (branchId && branchId !== 'all') {
                q = query(q, where("branchId", "==", branchId));
            }

            const querySnapshot = await getDocs(q);
            const props = (querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Property[]).sort((a, b) => {
                const aDate = (a as any).createdAt?.toMillis?.() ?? (a as any).createdAt ?? 0;
                const bDate = (b as any).createdAt?.toMillis?.() ?? (b as any).createdAt ?? 0;
                return bDate - aDate;
            });

            setProperties(props);
        } catch (error) {
            console.error("Error fetching properties:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmId) return;
        const id = deleteConfirmId;
        setDeleteConfirmId(null);
        try {
            if (!db) throw new Error("Firestore not initialized");
            await deleteDoc(doc(db, "properties", id));
            setProperties(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error("Error deleting property:", error);
            alert("Error al eliminar la propiedad");
        }
    };

    const handleUpdateProperty = async (id: string, data: Partial<Property>) => {
        try {
            if (!db) throw new Error("Firestore not initialized");
            const propertyRef = doc(db, "properties", id);
            await updateDoc(propertyRef, {
                ...data,
                updatedAt: new Date()
            });

            // Update local state
            setProperties(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
        } catch (error) {
            console.error("Error updating property:", error);
            throw error; // Re-throw to be handled by component
        }
    };

    const handleDuplicateProperty = async (property: Property) => {
        try {
            if (!db) throw new Error("Firestore not initialized");

            const { id, ...rest } = property;
            const newPropertyData = {
                ...rest,
                title: `${rest.title} (Copia)`,
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'inactive', 
            };

            const docRef = await addDoc(collection(db, "properties"), newPropertyData);

            const newProperty = { id: docRef.id, ...newPropertyData } as Property;
            setProperties(prev => [newProperty, ...prev]);

            router.push(`/dashboard/propiedades/editar/${docRef.id}`);
        } catch (error) {
            console.error("Error duplicating property:", error);
            alert("Error al duplicar la propiedad");
        }
    };

    // Calculate stats
    const stats = {
        total: properties.length,
        venta: properties.filter(p => p.operation_type === 'Venta').length,
        alquiler: properties.filter(p => p.operation_type === 'Alquiler').length,
    };

    if (loading && properties.length === 0) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-[var(--color-muted)]">Cargando propiedades...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">Propiedades</h1>
                    <p className="text-[var(--color-muted)]">Gestioná tu inventario de inmuebles</p>
                </div>
                <Link
                    href="/dashboard/propiedades/nueva"
                    className="flex items-center gap-2 bg-[var(--color-ink)] text-[var(--color-paper)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-ink-2)] transition shadow-sm"
                >
                    <Plus strokeWidth={1.5} className="w-5 h-5" /> Nueva Propiedad
                </Link>
            </div>

            {/* Share Portfolio Banner */}
            <div className="bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-2xl p-6 text-[var(--color-ink)] relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h2 className="font-heading text-xl font-bold mb-1">Compartí tu portafolio con clientes</h2>
                        <p className="text-[var(--color-muted)] text-sm md:text-base">Tu link público muestra todas tus propiedades activas de forma profesional.</p>
                    </div>
                    <button
                        onClick={() => {
                            const url = `${window.location.origin}/propiedades/${user?.uid}`;
                            navigator.clipboard.writeText(url);
                            alert("Link copiado al portapapeles!");
                        }}
                        className="flex items-center gap-2 bg-[var(--color-ink)] text-[var(--color-paper)] px-4 py-2.5 rounded-full font-bold hover:bg-[var(--color-ink-2)] transition active:scale-95"
                    >
                        <Share2 strokeWidth={1.5} className="w-4 h-4" />
                        Copiar Link Público
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[var(--color-paper-2)] p-5 rounded-xl border border-[var(--color-rule)] shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-[var(--color-paper)] rounded-lg">
                        <Building2 strokeWidth={1.5} className="w-6 h-6 text-[var(--color-ink-2)]" />
                    </div>
                    <div>
                        <p className="text-sm text-[var(--color-muted)]">Total Propiedades</p>
                        <p className="text-2xl font-bold text-[var(--color-ink)]">{stats.total}</p>
                    </div>
                </div>
                <div className="bg-[var(--color-paper-2)] p-5 rounded-xl border border-[var(--color-rule)] shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-[var(--color-paper-3)] rounded-full">
                        <Home strokeWidth={1.5} className="w-6 h-6 text-[var(--color-muted)]" />
                    </div>
                    <div>
                        <p className="text-sm text-[var(--color-muted)]">En Venta</p>
                        <p className="text-2xl font-bold text-[var(--color-ink)]">{stats.venta}</p>
                    </div>
                </div>
                <div className="bg-[var(--color-paper-2)] p-5 rounded-xl border border-[var(--color-rule)] shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-[var(--color-paper-3)] rounded-full">
                        <Key strokeWidth={1.5} className="w-6 h-6 text-[var(--color-muted)]" />
                    </div>
                    <div>
                        <p className="text-sm text-[var(--color-muted)]">En Alquiler</p>
                        <p className="text-2xl font-bold text-[var(--color-ink)]">{stats.alquiler}</p>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                    <Search strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-neutral)]" />
                    <input
                        type="text"
                        placeholder="Buscar por título, ubicación..."
                        className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] focus:bg-[var(--color-paper-2)] transition-all shadow-sm text-[var(--color-ink)] placeholder-[var(--color-neutral)]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                    <Filter strokeWidth={1.5} className="w-5 h-5 text-[var(--color-neutral)] shrink-0 hidden md:block" />
                    <div className="flex p-1 bg-[var(--color-paper-3)] rounded-lg">
                        {(['Todos', 'Venta', 'Alquiler', 'Alquiler Temporal'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${filter === f
                                    ? 'bg-[var(--color-paper-2)] text-[var(--color-accent)] shadow-sm'
                                    : 'text-[var(--color-ink-2)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-4)]'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-6 bg-[var(--color-paper-4)] mx-2 hidden md:block"></div>

                    {/* View Toggle */}
                    <div className="flex p-1 bg-[var(--color-paper-3)] rounded-lg">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[var(--color-paper-2)] text-[var(--color-accent)] shadow-sm' : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'}`}
                            title="Vista en cuadrícula"
                        >
                            <LayoutGrid strokeWidth={1.5} size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-[var(--color-paper-2)] text-[var(--color-accent)] shadow-sm' : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'}`}
                            title="Vista en lista"
                        >
                            <List strokeWidth={1.5} size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {filteredProperties.length === 0 ? (
                <div className="text-center py-16 bg-[var(--color-paper)] rounded-xl border border-[var(--color-rule)] border-dashed">
                    <Home strokeWidth={1.5} className="w-12 h-12 text-[var(--color-neutral)] mx-auto mb-4" />
                    <p className="text-[var(--color-muted)] text-lg">No se encontraron propiedades</p>
                    <p className="text-[var(--color-neutral)] text-sm">Probá cambiando los filtros o agregá una nueva propiedad.</p>
                </div>
            ) : (
                <>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProperties.map(property => (
                                // content-visibility skips layout/paint work for cards scrolled out of
                                // view — cuts render cost on accounts with hundreds of properties without
                                // changing what's fetched or how search/filtering works.
                                <div key={property.id} style={{ contentVisibility: 'auto', containIntrinsicSize: '0 420px' }}>
                                    <PropertyCard
                                        property={property}
                                        onDelete={handleDeleteClick}
                                        onUpdate={handleUpdateProperty}
                                        onDuplicate={handleDuplicateProperty}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-[var(--color-paper-2)] border rounded-2xl shadow-sm overflow-hidden">
                            <PropertiesTable
                                properties={filteredProperties}
                                loading={loading}
                                onUpdate={handleUpdateProperty}
                                onDuplicate={handleDuplicateProperty}
                                onDelete={handleDeleteClick}
                            />
                        </div>
                    )}
                </>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[var(--color-paper-2)] rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4 text-[var(--color-danger)]">
                            <div className="p-3 bg-[var(--color-paper-3)] rounded-full">
                                <AlertTriangle strokeWidth={1.5} className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--color-ink)]">Eliminar Propiedad</h3>
                        </div>
                        <p className="text-[var(--color-ink-2)] mb-6 leading-relaxed">¿Estás seguro de que deseás eliminar esta propiedad? Esta acción eliminará permanentemente los datos y no se puede deshacer.</p>
                        <div className="flex flex-col sm:flex-row justify-end gap-3 flex-wrap">
                            <button 
                                onClick={() => setDeleteConfirmId(null)} 
                                className="px-5 py-2.5 bg-[var(--color-paper-3)] text-[var(--color-ink-2)] font-medium rounded-xl hover:bg-[var(--color-paper-4)] transition-colors w-full sm:w-auto"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmDelete} 
                                className="px-5 py-2.5 bg-[var(--color-danger)] text-[var(--color-accent-ink)] font-medium rounded-xl hover:bg-[var(--color-danger)] transition-colors shadow-lg w-full sm:w-auto"
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}