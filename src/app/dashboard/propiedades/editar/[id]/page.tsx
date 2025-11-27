"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/infrastructure/firebase/client";
import PropertyWizard from "@/ui/components/properties/wizard/PropertyWizard";
import { Loader2 } from "lucide-react";

export default function EditPropertyPage() {
    const params = useParams();
    const router = useRouter();
    const [property, setProperty] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProperty = async () => {
            if (!params.id) return;

            try {
                const docRef = doc(db, "properties", params.id as string);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setProperty({ id: docSnap.id, ...docSnap.data() });
                } else {
                    console.error("Property not found");
                    router.push("/dashboard/propiedades");
                }
            } catch (error) {
                console.error("Error fetching property:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProperty();
    }, [params.id, router]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
            </div>
        );
    }

    if (!property) return null;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Editar Publicación</h1>
            </div>
            <PropertyWizard initialData={property} isEditing={true} />
        </div>
    );
}
