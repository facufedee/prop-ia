"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/infrastructure/firebase/client";
import { Property } from "@/ui/components/tables/PropertiesTable";
import { Loader2, ArrowLeft, Printer, Share2, Download } from "lucide-react";
import HorizontalFlyer from "../components/HorizontalFlyer";
import VerticalFlyer from "../components/VerticalFlyer";
import { useAuth } from "@/ui/context/AuthContext";

export default function PrintPage() {
    const { id } = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const mode = searchParams.get("mode") === "vertical" ? "vertical" : "horizontal";

    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const { userRole, user } = useAuth(); // Assuming we use auth context to get current agent info roughly?
    // Actually, ideally we should fetch the USER who OWNS the property, or the current logged in user if they are the agent.
    // For now, let's assume the logged-in user IS the agent/broker printing it.

    // We construct a mock agent object based on logged in user for now.
    // In a real app, we might fetch the specific agent assigned to the property.

    useEffect(() => {
        const fetchProperty = async () => {
            if (!id || !db) return;
            try {
                const docRef = doc(db, "properties", id as string);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setProperty({ id: docSnap.id, ...docSnap.data() } as Property);
                } else {
                    console.error("No such property!");
                }
            } catch (error) {
                console.error("Error fetching property:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProperty();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!property) return null;

    // Agent data construction
    const agentData = {
        name: user?.displayName || "Agente Inmobiliario",
        email: user?.email || "contacto@inmobiliaria.com",
        phone: (user as any)?.phoneNumber || "+54 9 11 1234-5678",
        photoUrl: user?.photoURL || undefined,
        logoUrl: (userRole as any)?.logoUrl || undefined, // Use organizational logo
        instagram: "zetaprop_arg" // Mock/Placeholder or from user profile if added
    };

    return (
        <div className="min-h-screen bg-gray-100 print:bg-white flex flex-col items-center py-8 print:py-0 print:block">
            {/* Toolbar - Hidden in Print */}
            <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 flex justify-between items-center z-50 print:hidden shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard/propiedades')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                        title="Volver al Panel"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="font-bold text-gray-800 hidden md:block">
                        Vista Previa de Impresión - {mode === 'horizontal' ? 'Cartelera' : 'Digital'}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    {/* Mode Switcher */}
                    <div className="bg-gray-100 p-1 rounded-lg flex items-center mr-4">
                        <button
                            onClick={() => router.push(`/print/propiedades/${id}?mode=horizontal`)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'horizontal' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Horizontal
                        </button>
                        <button
                            onClick={() => router.push(`/print/propiedades/${id}?mode=vertical`)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'vertical' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Vertical
                        </button>
                    </div>

                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm hover:shadow-md"
                    >
                        <Printer size={18} />
                        Imprimir / Guardar PDF
                    </button>
                </div>
            </div>

            {/* Spacer for toolbar */}
            <div className="h-20 print:hidden"></div>

            {/* Preview Area */}
            {mode === 'horizontal' ? (
                <HorizontalFlyer property={property} agent={agentData} />
            ) : (
                <VerticalFlyer property={property} agent={agentData} />
            )}

            <p className="mt-8 text-gray-400 text-sm print:hidden">
                Tip: En la configuración de impresión, asegurate de activar "Gráficos de fondo" y desactivar encabe/pie de página.
            </p>
        </div>
    );
}
