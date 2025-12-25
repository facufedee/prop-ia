import { Alquiler, Pago } from "@/domain/models/Alquiler";
import { RentalService } from "@/domain/models/RentalService";

export const whatsappService = {
    /**
     * Genera el mensaje formateado de servicios para WhatsApp
     */
    generateServicesMessage(rental: Alquiler, services: RentalService): string {
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        const month = monthNames[services.month - 1];
        const address = `${rental.direccion || 'Propiedad'}`;

        let message = `🏠 *Servicios - ${month} ${services.year}*\n`;
        message += `${address}\n\n`;

        // Agregar cada servicio
        services.charges.forEach(charge => {
            const icon = this.getServiceIcon(charge.type);
            const label = this.getServiceLabel(charge.type);
            const amount = this.formatCurrency(charge.amount);

            message += `${icon} ${label}: ${amount}\n`;

            if (charge.type === 'otros' && charge.description) {
                message += `   (${charge.description})\n`;
            }
        });

        message += `\n*Total: ${this.formatCurrency(services.total)}*\n\n`;

        if (rental.diaVencimiento) {
            const nextMonth = services.month === 12 ? 1 : services.month + 1;
            const year = services.month === 12 ? services.year + 1 : services.year;
            message += `Vencimiento: ${rental.diaVencimiento}/${nextMonth.toString().padStart(2, '0')}/${year}`;
        }

        return message;
    },

    generatePaymentMessage(rental: Alquiler, pago: Pago): string {
        const address = `${rental.direccion || 'Propiedad'}`;
        let message = `🏠 *Informe de Pago - ${pago.mes}*\n`;
        message += `${address}\n\n`;

        message += `Alquiler: ${this.formatCurrency(pago.montoAlquiler || 0)}\n`;

        if (pago.detalleServicios && pago.detalleServicios.length > 0) {
            message += `\n*Servicios:*\n`;
            pago.detalleServicios.forEach(s => {
                message += `- ${s.concepto}: ${this.formatCurrency(s.monto)}\n`;
            });
        }

        if (pago.montoPunitorios) {
            message += `Punitorios: ${this.formatCurrency(pago.montoPunitorios)}\n`;
        }
        if (pago.montoDescuento) {
            message += `Descuento: -${this.formatCurrency(pago.montoDescuento)}\n`;
        }

        message += `\n*Total a Pagar: ${this.formatCurrency(pago.monto)}*\n`;

        if (pago.fechaVencimiento) {
            message += `\nVencimiento: ${new Date(pago.fechaVencimiento).toLocaleDateString()}`;
        }

        return message;
    },

    /**
     * Abre WhatsApp con el mensaje pre-cargado
     */
    sendMessage(phone: string, message: string): void {
        // Limpiar el número de teléfono (quitar espacios, guiones, etc.)
        const cleanPhone = phone.replace(/\D/g, '');

        // Asegurarse de que tenga código de país (Argentina: 54)
        const phoneWithCountry = cleanPhone.startsWith('54') ? cleanPhone : `54${cleanPhone}`;

        // Codificar el mensaje para URL
        const encodedMessage = encodeURIComponent(message);

        // Abrir WhatsApp Web
        const url = `https://wa.me/${phoneWithCountry}?text=${encodedMessage}`;
        window.open(url, '_blank');
    },

    /**
     * Genera un mensaje genérico para contactar al inquilino
     */
    generateGenericMessage(rental: Alquiler): string {
        const address = `${rental.direccion || 'la propiedad'}`;
        return `Hola! Te contacto por el alquiler de ${address}.`;
    },

    // Helpers privados
    getServiceIcon(type: string): string {
        const icons: Record<string, string> = {
            luz: '💡',
            gas: '🔥',
            agua: '💧',
            expensas: '🏢',
            seguridad: '🛡️',
            otros: '📋'
        };
        return icons[type] || '📋';
    },

    getServiceLabel(type: string): string {
        const labels: Record<string, string> = {
            luz: 'Luz',
            gas: 'Gas',
            agua: 'Agua',
            expensas: 'Expensas',
            seguridad: 'Seguridad',
            otros: 'Otros Gastos'
        };
        return labels[type] || 'Otros';
    },

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0
        }).format(amount);
    }
};
