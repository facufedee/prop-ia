"use client";

import { useState } from "react";
import { ServiceCharge, SERVICE_TYPES } from "@/domain/models/RentalService";
import { Loader2 } from "lucide-react";

interface ServiceChargeFormProps {
    onSubmit: (charges: ServiceCharge[]) => Promise<void>;
    initialCharges?: ServiceCharge[];
    loading?: boolean;
}

export default function ServiceChargeForm({
    onSubmit,
    initialCharges = [],
    loading = false
}: ServiceChargeFormProps) {
    const [charges, setCharges] = useState<Record<string, { amount: string; description: string }>>(() => {
        const initial: Record<string, { amount: string; description: string }> = {};
        Object.keys(SERVICE_TYPES).forEach(type => {
            const existing = initialCharges.find(c => c.type === type);
            initial[type] = {
                amount: existing?.amount.toString() || '',
                description: existing?.description || ''
            };
        });
        return initial;
    });

    const handleAmountChange = (type: string, value: string) => {
        setCharges(prev => ({
            ...prev,
            [type]: { ...prev[type], amount: value }
        }));
    };

    const handleDescriptionChange = (type: string, value: string) => {
        setCharges(prev => ({
            ...prev,
            [type]: { ...prev[type], description: value }
        }));
    };

    const calculateTotal = () => {
        return Object.values(charges).reduce((sum, charge) => {
            const amount = parseFloat(charge.amount) || 0;
            return sum + amount;
        }, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Convertir a array de ServiceCharge, filtrando los vacíos
        const serviceCharges: ServiceCharge[] = Object.entries(charges)
            .filter(([_, value]) => value.amount && parseFloat(value.amount) > 0)
            .map(([type, value]) => {
                const charge: ServiceCharge = {
                    type: type as ServiceCharge['type'],
                    amount: parseFloat(value.amount)
                };

                // Solo agregar description si tiene valor
                if (value.description && value.description.trim()) {
                    charge.description = value.description.trim();
                }

                return charge;
            });

        if (serviceCharges.length === 0) {
            alert("Debes ingresar al menos un servicio");
            return;
        }

        await onSubmit(serviceCharges);
    };

    const total = calculateTotal();

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(SERVICE_TYPES).map(([type, config]) => (
                    <div key={type} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            {config.icon} {config.label}
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0"
                                value={charges[type]?.amount || ''}
                                onChange={(e) => handleAmountChange(type, e.target.value)}
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        {type === 'otros' && charges[type]?.amount && parseFloat(charges[type].amount) > 0 && (
                            <input
                                type="text"
                                placeholder="Descripción (opcional)"
                                value={charges[type]?.description || ''}
                                onChange={(e) => handleDescriptionChange(type, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Total */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-indigo-900">Total</span>
                    <span className="text-2xl font-bold text-indigo-600">
                        ${total.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading || total === 0}
                className="w-full bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Guardando...
                    </>
                ) : (
                    'Guardar Servicios'
                )}
            </button>
        </form>
    );
}
