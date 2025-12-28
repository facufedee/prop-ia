"use client";

import PropertyWizard from "@/ui/components/properties/wizard/PropertyWizard";
import { useSearchParams } from "next/navigation";

export default function NewPropertyPage() {
    const searchParams = useSearchParams();
    const returnTo = searchParams.get('returnTo');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Nueva Publicación</h1>
            </div>
            <PropertyWizard
                onSuccessRedirect={returnTo || undefined}
            />
        </div>
    );
}
