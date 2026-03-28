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
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-2xl border border-gray-200 text-center shadow-sm">
                <div className="flex justify-center mb-4">
                    <div className="p-4 bg-white rounded-full shadow-sm">
                        <CircleDollarSign className="w-12 h-12 text-gray-400" />
                    </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Esperando Datos
                </h3>
                <p className="text-sm text-gray-500">
                    Complete el formulario y presione "Calcular Tasación" para obtener el valor estimado de su propiedad.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-2xl border border-indigo-100 text-center shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gray-200">
                    <div 
                        className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                
                <div className="flex justify-center mb-6 mt-2">
                    <div className="relative">
                        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-indigo-700">
                            {progress}%
                        </div>
                    </div>
                </div>

                <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                    Analizando Propiedad
                </h3>

                <p className="text-sm text-indigo-700 min-h-[40px] transition-all duration-300 mb-6 font-medium">
                    {loadingMessage || "Procesando algoritmos..."}
                </p>

                <ProgressBar progress={progress} className="mb-6" />

                {comparisons > 0 && (
                    <div className="text-xs text-indigo-500 font-medium animate-pulse mb-6">
                        Comparando con <span className="font-bold text-indigo-700 text-sm">{comparisons.toLocaleString()}</span> propiedades similares
                    </div>
                )}

                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-xs font-medium text-gray-500 hover:text-red-600 transition-colors py-2 px-4 rounded-lg bg-white/50 border border-gray-200 hover:border-red-200"
                    >
                        Cancelar cálculo
                    </button>
                )}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gradient-to-br from-red-50 to-orange-50 p-8 rounded-2xl border border-red-100 shadow-md">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <div className="p-3 bg-red-100 rounded-full">
                            <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-red-900 mb-1">Error en el Cálculo</h3>
                        <p className="text-sm text-red-700 leading-relaxed">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (result !== null) {
        return (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-2xl border border-emerald-100 shadow-xl overflow-hidden relative">
                <div className="absolute -right-12 -top-12 w-32 h-32 bg-emerald-200/20 rounded-full blur-2xl" />
                <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-teal-200/20 rounded-full blur-2xl" />

                <div className="text-center mb-8 relative z-10">
                    <div className="inline-flex items-center justify-center p-3 bg-emerald-100 rounded-full mb-4 ring-8 ring-emerald-50">
                        <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">Valor Estimado</h3>
                    <p className="text-sm text-gray-500 font-medium">Resultado del análisis de Inteligencia Artificial</p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl mb-8 text-center ring-1 ring-emerald-100 shadow-sm relative z-10">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Precio sugerido en USD</p>
                    <p className="font-black text-emerald-900 text-5xl md:text-6xl tracking-tight">
                        ${result.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3 relative z-10">
                    <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-emerald-100 shadow-sm">
                        <span className="text-sm text-gray-600 font-medium">Margen de error</span>
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500" />
                             <span className="text-sm font-bold text-emerald-700">{"<"} 2.5%</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-emerald-100 shadow-sm">
                        <span className="text-sm text-gray-600 font-medium">Ubicación analizada</span>
                        <span className="text-sm font-bold text-gray-800">{location}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-emerald-100 shadow-sm">
                        <span className="text-sm text-gray-600 font-medium">Tipo de activo</span>
                        <span className="text-sm font-bold text-gray-800 capitalize">{propertyType}</span>
                    </div>
                </div>

                <div className="mt-8 p-4 bg-indigo-900 text-white rounded-xl shadow-lg border border-indigo-800 relative z-10">
                    <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 text-indigo-300" />
                        <p className="text-[11px] leading-relaxed text-indigo-100">
                             <strong>AVISO PROFESIONAL:</strong> Esta es una estimación generada mediante algoritmos que analizan más de 450,000 puntos de datos activos en el mercado. Para decisiones finales de inversión, recomendamos una tasación presencial de un martillero.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
