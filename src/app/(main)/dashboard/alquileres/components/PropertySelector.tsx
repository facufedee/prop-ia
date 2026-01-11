"use client";

import { useState, useEffect } from "react";
import { app, auth } from "@/infrastructure/firebase/client";

interface Property {
    id: string;
    direccion: string;
    property_type: string;
    price?: number;
    currency?: string;
}

interface PropertySelectorProps {
    onSelect: (propertyId: string, direccion: string, tipo: string, price?: number, currency?: string) => void;
    selectedId?: string;
}

export default function PropertySelector({ onSelect, selectedId }: PropertySelectorProps) {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProperties = async () => {
            if (!auth?.currentUser) return;

            try {
                // Fetch properties from Firestore
                const { collection, query, where, getDocs } = await import("firebase/firestore");
                const { db } = await import("@/infrastructure/firebase/client");
                const { alquileresService } = await import("@/infrastructure/services/alquileresService");

                if (!db) return;

                // Parallel fetch: Properties and Active Rentals
                const q = query(
                    collection(db, "properties"),
                    where("userId", "==", auth.currentUser.uid)
                );

                const [snapshot, activeRentals] = await Promise.all([
                    getDocs(q),
                    alquileresService.getAlquileresActivos(auth.currentUser.uid)
                ]);

                // Create a Set of occupied property IDs for faster lookup
                const occupiedPropertyIds = new Set(activeRentals.map(a => a.propiedadId));

                const props = snapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        direccion: `${doc.data().calle} ${doc.data().altura}, ${doc.data().localidad}`,
                        property_type: doc.data().property_type,
                        price: doc.data().price,
                        currency: doc.data().currency,
                    }))
                    .filter(p => !occupiedPropertyIds.has(p.id)); // Filter out occupied ones

                setProperties(props);
            } catch (error) {
                console.error("Error fetching properties:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const propId = e.target.value;
        const prop = properties.find(p => p.id === propId);
        if (prop) {
            onSelect(prop.id, prop.direccion, prop.property_type, prop.price, prop.currency);
        }
    };

    if (loading) {
        return (
            <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Cargando propiedades...
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                    Seleccionar Propiedad *
                </label>
                <a
                    href="/dashboard/propiedades/nueva?returnTo=/dashboard/alquileres/nuevo"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                    + Nueva propiedad
                </a>
            </div>

            <select
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={selectedId || ""}
                onChange={handleChange}
            >
                <option value="">Seleccione una propiedad...</option>
                {properties.map(prop => (
                    <option key={prop.id} value={prop.id}>
                        {prop.direccion} - {prop.property_type}
                    </option>
                ))}
            </select>

            {properties.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">
                    No tenés propiedades. Creá una nueva para continuar.
                </p>
            )}
        </div>
    );
}
