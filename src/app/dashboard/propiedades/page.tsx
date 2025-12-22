"use client";

import { useEffect, useState } from "react";
import PropertiesTable, { Property } from "@/ui/components/tables/PropertiesTable";
import { Plus, Building2, Home, Key } from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/infrastructure/firebase/client";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function PropiedadesPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                fetchProperties(user.uid);
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchProperties = async (userId: string) => {
        try {
            if (!db) throw new Error("Firestore not initialized");
            const q = query(
                collection(db, "properties"),
                where("userId", "==", userId)
            );
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

    // Calculate stats
    const totalProperties = properties.length;
    const forSale = properties.filter(p => p.operation_type === 'Venta').length;
    const forRent = properties.filter(p => p.operation_type === 'Alquiler').length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Propiedades</h1>
                <Link href="/dashboard/propiedades/nueva" className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition">
                    <Plus className="w-4 h-4" /> Nueva Propiedad
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-gray-100 rounded-lg">
                        <Building2 className="w-6 h-6 text-gray-700" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total Propiedades</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {loading ? "..." : totalProperties}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                        <Home className="w-6 h-6 text-green-700" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">En Venta</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {loading ? "..." : forSale}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                        <Key className="w-6 h-6 text-blue-700" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">En Alquiler</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {loading ? "..." : forRent}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                <PropertiesTable
                    properties={properties}
                    loading={loading}
                    onDelete={handleDelete}
                />
            </div>
        </div>
    );
}