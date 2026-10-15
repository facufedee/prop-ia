import { useState, useRef } from "react";
import { X, Printer, Download } from "lucide-react";
import { Alquiler } from "@/domain/models/Alquiler";
import { RentalContractTemplate } from "../documents/RentalContractTemplate";
import { useReactToPrint } from "react-to-print";

interface ContractGeneratorPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    contract: Alquiler;
}

export default function ContractGeneratorPreviewModal({ isOpen, onClose, contract }: ContractGeneratorPreviewModalProps) {
    const [signingCity, setSigningCity] = useState(contract.direccion.split(',')[1]?.trim() || "Buenos Aires");
    const [signingDate, setSigningDate] = useState(new Date());
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Contrato_${contract.direccion}`,
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--color-paper-3)] rounded-xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-4 bg-[var(--color-paper-2)] border-b rounded-t-xl shrink-0">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Download strokeWidth={1.5} className="text-[var(--color-accent)] w-5 h-5" />
                        Generar Contrato
                    </h3>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                            <label className="text-[var(--color-ink-2)] font-medium">Ciudad de Firma:</label>
                            <input
                                type="text"
                                value={signingCity}
                                onChange={(e) => setSigningCity(e.target.value)}
                                className="border border-[var(--color-rule)] rounded px-2 py-1 text-[var(--color-ink)]"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <label className="text-[var(--color-ink-2)] font-medium">Fecha:</label>
                            <input
                                type="date"
                                value={signingDate.toISOString().split('T')[0]}
                                onChange={(e) => setSigningDate(new Date(e.target.value))}
                                className="border border-[var(--color-rule)] rounded px-2 py-1 text-[var(--color-ink)]"
                            />
                        </div>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-lg hover:bg-[var(--color-ink-2)] transition-colors font-medium shadow-sm"
                        >
                            <Printer strokeWidth={1.5} size={18} />
                            Imprimir / Guardar PDF
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-[var(--color-paper-3)] rounded-lg transition-colors text-[var(--color-muted)]">
                            <X strokeWidth={1.5} size={24} />
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 overflow-y-auto p-8 bg-[var(--color-paper-4)]">
                    <div ref={componentRef} className="origin-top transition-transform">
                        <RentalContractTemplate
                            contract={contract}
                            signingCity={signingCity}
                            signingDate={signingDate}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
