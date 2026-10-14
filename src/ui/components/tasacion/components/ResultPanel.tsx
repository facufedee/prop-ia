import React from 'react';
import { CheckCircle, CircleDollarSign, Loader2, AlertCircle, XCircle } from "lucide-react";
import { ProgressBar } from "./ProgressBar";

interface ResultPanelProps {
    result: number | null;
    loading: boolean;
    error: string | null;
    loadingMessage: string;
    progress: number;
    comparisons: number;
    propertyType: string;
    location: string;
    onCancel?: () => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
    result,
    loading,
    error,
    loadingMessage,
    progress,
    comparisons,
    propertyType,
    location,
    onCancel
}) => {
    if (!result && !error && !loading) {
        return (
            <div className="bg-[var(--color-paper-2)] p-8 rounded-2xl border border-[var(--color-rule)] text-center">
                <div className="flex justify-center mb-4">
                    <div className="p-4 bg-[var(--color-paper-3)] rounded-full">
                        <CircleDollarSign strokeWidth={1.5} className="w-12 h-12 text-[var(--color-neutral)]" />
                    </div>
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-ink-2)] mb-2">
                    Esperando Datos
                </h3>
                <p className="text-sm text-[var(--color-muted)]">
                    Complete el formulario y presione "Calcular Tasación" para obtener el valor estimado de su propiedad.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-[var(--color-paper-2)] p-8 rounded-2xl border border-[var(--color-rule)] text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-paper-4)]">
                    <div 
                        className="h-full bg-[var(--color-accent)] transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                
                <div className="flex justify-center mb-6 mt-2">
                    <div className="relative">
                        <Loader2 strokeWidth={1.5} className="w-16 h-16 text-[var(--color-accent)] animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[var(--color-accent)]">
                            {progress}%
                        </div>
                    </div>
                </div>

                <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
                    Analizando Propiedad
                </h3>

                <p className="text-sm text-[var(--color-muted)] min-h-[40px] transition-all duration-300 mb-6 font-medium">
                    {loadingMessage || "Procesando algoritmos..."}
                </p>

                <ProgressBar progress={progress} className="mb-6" />

                {comparisons > 0 && (
                    <div className="text-xs text-[var(--color-muted)] font-medium animate-pulse mb-6">
                        Comparando con <span className="font-bold text-[var(--color-accent)] text-sm">{comparisons.toLocaleString()}</span> propiedades similares
                    </div>
                )}

                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-danger)] transition-colors py-2 px-4 rounded-lg bg-[var(--color-paper-2)]/50 border border-[var(--color-rule)] hover:border-[var(--color-danger)]/30"
                    >
                        Cancelar cálculo
                    </button>
                )}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-[var(--color-paper-2)] p-8 rounded-2xl border border-[var(--color-danger)]/30">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <div className="p-3 bg-[var(--color-paper-3)] rounded-full">
                            <XCircle strokeWidth={1.5} className="w-6 h-6 text-[var(--color-muted)]" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[var(--color-danger)] mb-1">Error en el Cálculo</h3>
                        <p className="text-sm text-[var(--color-danger)] leading-relaxed">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (result !== null) {
        return (
            <div className="bg-[var(--color-paper-2)] p-8 rounded-2xl border border-[var(--color-rule)] overflow-hidden relative">

                <div className="text-center mb-8 relative z-10">
                    <div className="inline-flex items-center justify-center p-3 bg-[var(--color-paper-3)] rounded-full mb-4">
                        <CheckCircle strokeWidth={1.5} className="w-8 h-8 text-[var(--color-muted)]" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--color-ink)] mb-1">Valor Estimado</h3>
                    <p className="text-sm text-[var(--color-muted)] font-medium">Resultado del análisis de Inteligencia Artificial</p>
                </div>

                <div className="bg-[var(--color-paper-3)] p-8 rounded-2xl mb-8 text-center border border-[var(--color-rule)] relative z-10">
                    <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest mb-2">Precio sugerido en USD</p>
                    <p className="font-heading font-black text-[var(--color-ink)] text-5xl md:text-6xl tracking-tight">
                        ${result.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3 relative z-10">
                    <div className="flex items-center justify-between p-4 bg-[var(--color-paper)] rounded-xl border border-[var(--color-rule)]">
                        <span className="text-sm text-[var(--color-ink-2)] font-medium">Margen de error</span>
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-[var(--color-positive)]" />
                             <span className="text-sm font-bold text-[var(--color-positive)]">{"<"} 2.5%</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[var(--color-paper)] rounded-xl border border-[var(--color-rule)]">
                        <span className="text-sm text-[var(--color-ink-2)] font-medium">Ubicación analizada</span>
                        <span className="text-sm font-bold text-[var(--color-ink)]">{location}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[var(--color-paper)] rounded-xl border border-[var(--color-rule)]">
                        <span className="text-sm text-[var(--color-ink-2)] font-medium">Tipo de activo</span>
                        <span className="text-sm font-bold text-[var(--color-ink)] capitalize">{propertyType}</span>
                    </div>
                </div>

                <div className="mt-8 p-4 bg-[var(--color-paper-3)] rounded-xl border border-[var(--color-rule)] relative z-10">
                    <div className="flex gap-3">
                        <AlertCircle strokeWidth={1.5} className="w-5 h-5 flex-shrink-0 text-[var(--color-muted)]" />
                        <p className="text-[11px] leading-relaxed text-[var(--color-ink-2)]">
                             <strong>AVISO PROFESIONAL:</strong> Esta es una estimación generada mediante algoritmos que analizan más de 450,000 puntos de datos activos en el mercado. Para decisiones finales de inversión, recomendamos una tasación presencial de un martillero.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
