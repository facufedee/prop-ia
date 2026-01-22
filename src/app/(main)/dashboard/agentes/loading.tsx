import LoadingSpinner from "@/ui/components/ui/LoadingSpinner";

export default function ModuleLoading() {
    return (
        <div className="min-h-[400px] flex items-center justify-center">
            <LoadingSpinner message="Cargando módulo..." size="md" />
        </div>
    );
}
