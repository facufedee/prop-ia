"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/infrastructure/firebase/client";

interface PropertyOption {
    id: string;
    direccion: string;
}

interface CartelPropertySelectorProps {
    userId: string;
    value: string;
    onSelect: (propertyId: string, direccion: string) => void;
}

export default function CartelPropertySelector({ userId, value, onSelect }: CartelPropertySelectorProps) {
    const [properties, setProperties] = useState<PropertyOption[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProperties = async () => {
            if (!db || !userId) return;
            try {
                const q = query(collection(db, "properties"), where("userId", "==", userId));
                const snapshot = await getDocs(q);
                const props = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        direccion: `${data.calle || ""} ${data.altura || ""}${data.localidad ? `, ${data.localidad}` : ""}`.trim(),
                    };
                });
                setProperties(props);
            } catch (error) {
                console.error("Error fetching properties:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProperties();
    }, [userId]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const propId = e.target.value;
        const prop = properties.find((p) => p.id === propId);
        onSelect(propId, prop?.direccion || "");
    };

    return (
        <select
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
            value={value}
            onChange={handleChange}
            disabled={loading}
        >
            <option value="">{loading ? "Cargando propiedades..." : "Seleccione una propiedad..."}</option>
            {properties.map((prop) => (
                <option key={prop.id} value={prop.id}>
                    {prop.direccion}
                </option>
            ))}
        </select>
    );
}
