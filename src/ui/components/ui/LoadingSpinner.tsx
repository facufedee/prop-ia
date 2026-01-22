import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
    message?: string;
    size?: "sm" | "md" | "lg";
}

export default function LoadingSpinner({
    message = "Cargando...",
    size = "md"
}: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: "w-6 h-6",
        md: "w-10 h-10",
        lg: "w-16 h-16"
    };

    const textSizeClasses = {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg"
    };

    return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
            {/* Animated gradient spinner */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 rounded-full blur-lg opacity-30 animate-pulse" />
                <div className={`relative ${sizeClasses[size]} border-4 border-gray-200 border-t-transparent rounded-full`}>
                    <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 border-r-purple-600 rounded-full animate-spin" />
                </div>
            </div>

            {/* Loading message */}
            {message && (
                <p className={`${textSizeClasses[size]} text-gray-600 font-medium`}>
                    {message}
                </p>
            )}
        </div>
    );
}
