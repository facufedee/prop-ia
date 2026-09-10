"use client";

import { createPortal } from "react-dom";
import { X, Info } from "lucide-react";
import { FICHA_TEMPLATES } from "@/app/(print)/print/propiedades/components/ficha/fichaTemplates";
import FichaThumbnail from "./FichaThumbnail";

interface FichasPdfModalProps {
    propertyId: string;
    onClose: () => void;
}

export default function FichasPdfModal({ propertyId, onClose }: FichasPdfModalProps) {
    const handleSelect = (templateId: string) => {
        window.open(`/print/propiedades/${propertyId}?ficha=${templateId}`, "_blank", "noopener,noreferrer");
        onClose();
    };

    // Rendered via a portal straight into <body> — PropertyCard sits inside a
    // `content-visibility: auto` grid cell (Propiedades list perf optimization),
    // which implicitly applies CSS containment. A `position: fixed` element
    // nested inside a contained ancestor is positioned relative to THAT
    // ancestor instead of the viewport, so without the portal this modal
    // renders squeezed inside the property card instead of covering the page.
    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-bold text-gray-800">Fichas en PDF</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-4">Selecciona el tipo de ficha para imprimir:</p>

                    <div className="grid grid-cols-2 gap-3">
                        {FICHA_TEMPLATES.map((tpl) => (
                            <button
                                key={tpl.id}
                                onClick={() => handleSelect(tpl.id)}
                                className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors text-left"
                            >
                                <div className="w-14 h-16 flex-shrink-0">
                                    <FichaThumbnail config={tpl} />
                                </div>
                                <span className="text-sm font-medium text-gray-700">{tpl.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-start gap-2 flex-shrink-0">
                    <Info size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-500">
                        Si las imágenes salen muy chicas en la hoja, subí imágenes a la propiedad de mejor calidad y tamaño.
                        Te recomendamos subir imágenes en formato horizontal.
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
}
