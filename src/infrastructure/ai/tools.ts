import { db } from "@/infrastructure/firebase/client";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { SchemaType, FunctionDeclaration } from "@google/generative-ai";

export const tools: FunctionDeclaration[] = [
    {
        name: "search_properties",
        description: "Buscar propiedades en la base de datos según criterios. Usa esto cuando el usuario pregunte por inmuebles, casas, departamentos disponible, precios, etc.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                operation_type: { type: SchemaType.STRING, description: "Tipo de operación: 'Venta' o 'Alquiler'" },
                property_type: { type: SchemaType.STRING, description: "Tipo de propiedad: 'Departamento', 'Casa', 'PH', etc." },
                min_price: { type: SchemaType.NUMBER, description: "Precio mínimo" },
                max_price: { type: SchemaType.NUMBER, description: "Precio máximo" },
                rooms: { type: SchemaType.NUMBER, description: "Cantidad mínima de ambientes" },
                location: { type: SchemaType.STRING, description: "Barrio, localidad o provincia (búsqueda parcial)" }
            }
        }
    },
    {
        name: "search_rentals",
        description: "Buscar contratos de alquiler (alquileres) activos o historial. Usa esto para consultar sobre contratos vigentes, inquilinos, vencimientos.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                status: { type: SchemaType.STRING, description: "Estado del contrato: 'activo', 'finalizado', 'pendiente'" },
                tenant_name: { type: SchemaType.STRING, description: "Nombre del inquilino (búsqueda parcial)" }
            }
        }
    }
];

export const runTool = async (name: string, args: any) => {
    switch (name) {
        case "search_properties":
            return await searchProperties(args);
        case "search_rentals":
            return await searchRentals(args);
        default:
            return { error: "Tool not found" };
    }
};

async function searchProperties(args: any) {
    console.log("Searching properties with:", args);
    try {
        if (!db) return { error: "Database not initialized" };

        const constraints: any[] = [limit(10)];
        const coll = collection(db, "properties");

        if (args.operation_type) constraints.push(where("operation_type", "==", args.operation_type));
        if (args.property_type) constraints.push(where("property_type", "==", args.property_type));
        // Firestore doesn't accept multiple inequalities on different fields easily, so we process min/max price carefully.
        // For simplicity in this demo, strict equality or simple filter.
        // Also note: searching by text ("location") usually requires full text search (Algolia) or exact match in Firestore.
        // We will do client-side filtering (after fetch) for location if needed, or simple query.

        // Let's rely on basic filters for now.

        const q = query(coll, ...constraints);
        const snapshot = await getDocs(q);

        let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));

        // Post-filter in memory for complex fields (price range, location partial match)
        // Note: In production this should be a proper backend query or Algolia.
        if (args.min_price) results = results.filter((r: any) => Number(r.price) >= args.min_price);
        if (args.max_price) results = results.filter((r: any) => Number(r.price) <= args.max_price);
        if (args.rooms) results = results.filter((r: any) => Number(r.rooms) >= args.rooms);
        if (args.location) {
            const loc = args.location.toLowerCase();
            results = results.filter((r: any) =>
                r.localidad?.nombre?.toLowerCase().includes(loc) ||
                r.calle?.toLowerCase().includes(loc) ||
                r.provincia?.nombre?.toLowerCase().includes(loc)
            );
        }

        return {
            count: results.length,
            results: results.map((r: any) => ({
                title: r.title,
                price: `${r.currency} ${r.price}`,
                location: `${r.calle}, ${r.localidad?.nombre}`,
                type: `${r.property_type} en ${r.operation_type}`,
                features: `${r.rooms} amb, ${r.bedrooms} dorm`
            }))
        };
    } catch (e: any) {
        console.error("Tool execution error:", e);
        return { error: e.message };
    }
}

async function searchRentals(args: any) {
    console.log("Searching rentals with:", args);
    try {
        if (!db) return { error: "Database not initialized" };

        const constraints: any[] = [limit(10)];
        if (args.status) constraints.push(where("estado", "==", args.status));

        const q = query(collection(db, "alquileres"), ...constraints);
        const snapshot = await getDocs(q);

        let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));

        // Note: tenant name is often an ID in 'alquileres', fetching user data might be needed.
        // Assuming we stored denormalized 'nombreInquilino' or similar? 
        // Looking at alquileresService, it returns Alquiler model.
        // We might need to fetch users. For now, let's return raw data.

        return {
            count: results.length,
            results: results.map((r: any) => ({
                id: r.id,
                estado: r.estado,
                fechas: `${r.fechaInicio?.toDate?.()?.toLocaleDateString()} - ${r.fechaFin?.toDate?.()?.toLocaleDateString()}`,
                monto: r.monto,
                direccion: "Ver detalle" // Often rental is linked to property ID
            }))
        };
    } catch (e: any) {
        return { error: e.message };
    }
}
