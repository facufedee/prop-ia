import DevelopmentForm from "@/ui/components/developments/DevelopmentForm";
import { Building2 } from "lucide-react";

export default function NewDevelopmentPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Building2 className="text-indigo-600" /> Nuevo Emprendimiento
                </h1>
                <p className="text-gray-500 text-sm">Completá la información del proyecto paso a paso.</p>
            </div>

            <DevelopmentForm />
        </div>
    );
}
