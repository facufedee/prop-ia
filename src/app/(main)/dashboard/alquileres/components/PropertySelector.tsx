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

const NEW_PROPERTY_HREF = "/dashboard/propiedades/nueva?returnTo=/dashboard/alquileres/nuevo";

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
            <div className="w-full p-3 border border-[var(--color-rule)] rounded-lg bg-[var(--color-paper)] text-[var(--color-muted)]">
                Cargando propiedades...
            </div>
        );
    }

    return (
        <div>
            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">
                Seleccionar Propiedad *
            </label>
            <p className="mb-3 text-sm text-[var(--color-muted)]">
                Para generar un contrato podés{" "}
                <a
                    href={NEW_PROPERTY_HREF}
                    className="font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-2)] underline underline-offset-2"
                >
                    cargar una nueva propiedad
                </a>{" "}
                o elegirla del listado si ya la tenés.
            </p>

            <select
                required
                className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
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
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                    Todavía no tenés propiedades.{" "}
                    <a
                        href={NEW_PROPERTY_HREF}
                        className="font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-2)] underline underline-offset-2"
                    >
                        Cargá la primera
                    </a>{" "}
                    para continuar.
                </p>
            )}
        </div>
    );
}
