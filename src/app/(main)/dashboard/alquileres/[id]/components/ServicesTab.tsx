"use client";

import { useState, useEffect } from "react";
import { Alquiler } from "@/domain/models/Alquiler";
import { RentalService, ServiceCharge, SERVICE_TYPES } from "@/domain/models/RentalService";
import { rentalServicesService } from "@/infrastructure/services/rentalServicesService";
import { whatsappService } from "@/infrastructure/services/whatsappService";
import { auth } from "@/infrastructure/firebase/client";
import ServiceChargeForm from "./ServiceChargeForm";
import { MessageCircle, Calendar, CheckCircle, Clock } from "lucide-react";

interface ServicesTabProps {
    rental: Alquiler;
}

export default function ServicesTab({ rental }: ServicesTabProps) {
    const [services, setServices] = useState<RentalService[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [currentServices, setCurrentServices] = useState<RentalService | null>(null);

    useEffect(() => {
        loadServices();
    }, [rental.id]);

    useEffect(() => {
        loadCurrentMonthServices();
    }, [selectedMonth, selectedYear, services]);

    const loadServices = async () => {
        try {
            const data = await rentalServicesService.getServicesByRental(rental.id);
            setServices(data);
        } catch (error) {
            console.error("Error loading services:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadCurrentMonthServices = async () => {
        const existing = await rentalServicesService.getServicesByMonth(
            rental.id,
            selectedMonth,
            selectedYear
        );
        setCurrentServices(existing);
    };

    const handleSubmit = async (charges: ServiceCharge[]) => {
        if (!auth?.currentUser) return;

        setSubmitting(true);
        try {
            if (currentServices) {
                // Actualizar existente
                await rentalServicesService.updateServices(currentServices.id, charges);
            } else {
                // Crear nuevo
                await rentalServicesService.createMonthlyServices(
                    rental.id,
                    selectedMonth,
                    selectedYear,
                    charges,
                    auth.currentUser.uid
                );
            }

            // Recargar servicios
            await loadServices();
            await loadCurrentMonthServices();

            alert("Servicios guardados correctamente");
        } catch (error) {
            console.error("Error saving services:", error);
            alert("Error al guardar los servicios");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSendWhatsApp = (service: RentalService) => {
        const phone = rental.whatsappInquilino || rental.telefonoInquilino;

        if (!phone) {
            alert("No hay número de WhatsApp configurado para este inquilino");
            return;
        }

        const message = whatsappService.generateServicesMessage(rental, service);
        whatsappService.sendMessage(phone, message);

        // Marcar como enviado
        rentalServicesService.markAsSent(service.id).then(() => {
            loadServices();
        });
    };

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Generar opciones de meses (últimos 12 meses + próximos 2)
    const generateMonthOptions = () => {
        const options = [];
        const now = new Date();

        for (let i = -12; i <= 2; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
            options.push({
                month: date.getMonth() + 1,
                year: date.getFullYear(),
                label: `${monthNames[date.getMonth()]} ${date.getFullYear()}`
            });
        }

        return options.reverse();
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Cargando servicios...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Selector de Mes */}
            <div className="bg-white border rounded-xl p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-2" />
                    Seleccionar Mes
                </label>
                <select
                    value={`${selectedYear}-${selectedMonth}`}
                    onChange={(e) => {
                        const [year, month] = e.target.value.split('-');
                        setSelectedYear(parseInt(year));
                        setSelectedMonth(parseInt(month));
                    }}
                    className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                    {generateMonthOptions().map(opt => (
                        <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Formulario de Carga */}
            <div className="bg-white border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {currentServices ? 'Editar' : 'Cargar'} Servicios - {monthNames[selectedMonth - 1]} {selectedYear}
                </h3>
                <ServiceChargeForm
                    onSubmit={handleSubmit}
                    initialCharges={currentServices?.charges || []}
                    loading={submitting}
                />
            </div>

            {/* Historial de Servicios */}
            <div className="bg-white border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Servicios</h3>

                {services.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No hay servicios cargados aún</p>
                ) : (
                    <div className="space-y-4">
                        {services.map(service => (
                            <div key={service.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">
                                            {monthNames[service.month - 1]} {service.year}
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                            {service.sent ? (
                                                <span className="flex items-center gap-1 text-green-600">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Enviado {service.sentDate && `el ${new Date(service.sentDate).toLocaleDateString()}`}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-orange-600">
                                                    <Clock className="w-4 h-4" />
                                                    Pendiente de envío
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-indigo-600">
                                            ${service.total.toLocaleString('es-AR')}
                                        </p>
                                        <button
                                            onClick={() => handleSendWhatsApp(service)}
                                            className="mt-2 flex items-center gap-2 text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            {service.sent ? 'Reenviar' : 'Enviar'} por WhatsApp
                                        </button>
                                    </div>
                                </div>

                                {/* Detalle de servicios */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3 pt-3 border-t">
                                    {service.charges.map((charge, idx) => {
                                        const config = SERVICE_TYPES[charge.type];
                                        return (
                                            <div key={idx} className="text-sm">
                                                <span className="text-gray-600">
                                                    {config.icon} {config.label}:
                                                </span>
                                                <span className="font-medium ml-1">
                                                    ${charge.amount.toLocaleString('es-AR')}
                                                </span>
                                                {charge.description && (
                                                    <p className="text-xs text-gray-500 ml-5">({charge.description})</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
