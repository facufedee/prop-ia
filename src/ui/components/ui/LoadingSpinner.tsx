import Wordmark from "@/ui/components/brand/Wordmark";

interface LoadingSpinnerProps {
    message?: string;
    size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
    sm: "w-6 h-6",
    md: "w-9 h-9",
    lg: "w-14 h-14",
};

const TEXT_SIZE_CLASSES = {
    sm: "text-sm",
    md: "text-sm",
    lg: "text-base",
};

/** Minimal bronze ring; holds still when the user prefers reduced motion. */
function Ring({ size = "md" }: { size?: LoadingSpinnerProps["size"] }) {
    return (
        <span
            aria-hidden="true"
            className={`block ${SIZE_CLASSES[size]} rounded-full border-2 border-[var(--color-rule)] border-t-[var(--color-accent)] animate-spin motion-reduce:animate-none`}
        />
    );
}

export default function LoadingSpinner({ message = "Cargando...", size = "md" }: LoadingSpinnerProps) {
    return (
        <div role="status" aria-live="polite" className="flex flex-col items-center justify-center py-12 gap-4">
            <Ring size={size} />
            {message && (
                <p className={`${TEXT_SIZE_CLASSES[size]} text-[var(--color-muted)] font-medium`}>{message}</p>
            )}
        </div>
    );
}

/** Full-screen brand loader for the dashboard (auth check, route transitions). */
export function BrandLoader({ message }: { message?: string }) {
    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-paper)]"
        >
            <div className="flex flex-col items-center gap-8">
                <Wordmark size="xl" />
                <Ring size="sm" />
                <p className="text-sm text-[var(--color-muted)] font-medium">{message ?? "Cargando..."}</p>
            </div>
        </div>
    );
}
