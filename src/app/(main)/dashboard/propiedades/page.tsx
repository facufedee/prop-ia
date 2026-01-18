"use client";

import { useEffect, useState } from "react";
import PropertiesTable, { Property } from "@/ui/components/tables/PropertiesTable";
import { Plus, Building2, Home, Key, Search, Filter, LayoutGrid, List, Share2 } from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/infrastructure/firebase/client";
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, addDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useBranchContext } from "@/infrastructure/context/BranchContext";
import PropertyCard from "./components/PropertyCard";

export default function PropiedadesPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<'Todos' | 'Venta' | 'Alquiler' | 'Alquiler Temporal'>('Todos');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const { selectedBranchId } = useBranchContext();
    const [user, setUser] = useState<any>(null);

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
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(p =>
                (p.title && p.title.toLowerCase().includes(lowerTerm)) ||
                (p.localidad && p.localidad.toLowerCase().includes(lowerTerm)) ||
                (p.provincia && p.provincia.toLowerCase().includes(lowerTerm))
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
            const props = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Property[];

            setProperties(props);
        } catch (error) {
            console.error("Error fetching properties:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de que querés eliminar esta propiedad?")) return;

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
        if (!confirm(`¿Duplicar la propiedad "${property.title}"?`)) return;

        try {
            if (!db) throw new Error("Firestore not initialized");

            // Prepare copy data
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...rest } = property;
            const newPropertyData = {
                ...rest,
                title: `${rest.title} (Copia)`,
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'inactive', // Default to inactive for safety
                // We reuse image URLs for now. 
                // Note: Deleting images from one property won't affect the other if they are just URLs,
                // but deleting the actual file in storage would affect both if we don't copy files.
                // For MVP: Shared reference is acceptable if clearly understood, or we accept the risk.
            };

            const docRef = await addDoc(collection(db, "properties"), newPropertyData);

            // Add to local state
            const newProperty = { id: docRef.id, ...newPropertyData } as Property;
            setProperties(prev => [newProperty, ...prev]);

            alert("Propiedad duplicada correctamente. Se creó como 'Pausada'.");
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
                <div className="text-gray-500">Cargando propiedades...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Propiedades</h1>
                    <p className="text-gray-500">Gestioná tu inventario de inmuebles</p>
                </div>
                <Link
                    href="/dashboard/propiedades/nueva"
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
                >
                    <Plus className="w-5 h-5" /> Nueva Propiedad
                </Link>
            </div>

            {/* Share Portfolio Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold mb-1">Compartí tu portafolio con clientes</h2>
                        <p className="text-indigo-100 text-sm md:text-base">Tu link público muestra todas tus propiedades activas de forma profesional.</p>
                    </div>
                    <button
                        onClick={() => {
                            const url = `${window.location.origin}/propiedades/${user?.uid}`;
                            navigator.clipboard.writeText(url);
                            alert("Link copiado al portapapeles!");
                        }}
                        className="flex items-center gap-2 bg-white text-indigo-700 px-4 py-2.5 rounded-lg font-bold hover:bg-indigo-50 transition shadow-sm active:scale-95"
                    >
                        <Share2 className="w-4 h-4" />
                        Copiar Link Público
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <Building2 className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total Propiedades</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                        <Home className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">En Venta</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.venta}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <Key className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">En Alquiler</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.alquiler}</p>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por título, ubicación..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all shadow-sm text-gray-900 placeholder-gray-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                    <Filter className="w-5 h-5 text-gray-400 shrink-0 hidden md:block" />
                    <div className="flex p-1 bg-gray-100 rounded-lg">
                        {(['Todos', 'Venta', 'Alquiler', 'Alquiler Temporal'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${filter === f
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-6 bg-gray-300 mx-2 hidden md:block"></div>

                    {/* View Toggle */}
                    <div className="flex p-1 bg-gray-100 rounded-lg">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            title="Vista en cuadrícula"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            title="Vista en lista"
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {filteredProperties.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                    <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No se encontraron propiedades</p>
                    <p className="text-gray-400 text-sm">Probá cambiando los filtros o agregá una nueva propiedad.</p>
                </div>
            ) : (
                <>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProperties.map(property => (
                                <PropertyCard
                                    key={property.id}
                                    property={property}
                                    onDelete={handleDelete}
                                    onUpdate={handleUpdateProperty}
                                    onDuplicate={handleDuplicateProperty}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                            <PropertiesTable
                                properties={filteredProperties}
                                loading={loading}
                                onUpdate={handleUpdateProperty}
                                onDuplicate={handleDuplicateProperty}
                                onDelete={handleDelete}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}