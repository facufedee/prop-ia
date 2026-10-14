import DevelopmentForm from "@/ui/components/developments/DevelopmentForm";
import { Building2 } from "lucide-react";

export default function NewDevelopmentPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)] flex items-center gap-2">
                    <Building2 strokeWidth={1.5} className="text-[var(--color-accent)]" /> Nuevo Emprendimiento
                </h1>
                <p className="text-[var(--color-muted)] text-sm">Completá la información del proyecto paso a paso.</p>
            </div>

            <DevelopmentForm />
        </div>
    );
}
