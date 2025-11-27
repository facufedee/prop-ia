"use client";

import PropertyWizard from "@/ui/components/properties/wizard/PropertyWizard";

export default function NewPropertyPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Nueva Publicación</h1>
            </div>
            <PropertyWizard />
        </div>
    );
}
