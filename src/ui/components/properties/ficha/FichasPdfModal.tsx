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
    // The portal leaves the dashboard's `.app-theme` wrapper, so it re-applies it
    // to keep the theme tokens available.
    return createPortal(
        <div className="app-theme dark font-sans text-[var(--color-ink)]">
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-2xl shadow-xl shadow-black/50 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-[var(--color-rule)] flex justify-between items-center flex-shrink-0">
                    <h2 className="font-heading text-lg font-semibold text-[var(--color-ink)]">Fichas en PDF</h2>
                    <button onClick={onClose} className="text-[var(--color-muted)] hover:text-[var(--color-ink)]" aria-label="Cerrar">
                        <X size={20} strokeWidth={1.5} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <p className="text-sm font-medium text-[var(--color-ink-2)] mb-4">Selecciona el tipo de ficha para imprimir:</p>

                    <div className="grid grid-cols-2 gap-3">
                        {FICHA_TEMPLATES.map((tpl) => (
                            <button
                                key={tpl.id}
                                onClick={() => handleSelect(tpl.id)}
                                className="flex items-center gap-3 p-3 border border-[var(--color-rule)] rounded-xl hover:border-[var(--color-accent)]/60 hover:bg-[var(--color-paper-3)] transition-colors text-left"
                            >
                                <div className="w-14 h-16 flex-shrink-0">
                                    <FichaThumbnail config={tpl} />
                                </div>
                                <span className="text-sm font-medium text-[var(--color-ink-2)]">{tpl.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-6 py-3 border-t border-[var(--color-rule)] bg-[var(--color-paper-3)] flex items-start gap-2 flex-shrink-0">
                    <Info size={14} strokeWidth={1.5} className="text-[var(--color-muted)] mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-[var(--color-muted)]">
                        Si las imágenes salen muy chicas en la hoja, subí imágenes a la propiedad de mejor calidad y tamaño.
                        Te recomendamos subir imágenes en formato horizontal.
                    </p>
                </div>
            </div>
        </div>
        </div>,
        document.body
    );
}
