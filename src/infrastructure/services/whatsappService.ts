import { db } from "@/infrastructure/firebase/client";
import { Alquiler } from "@/domain/models/Alquiler";
import { RentalService, SERVICE_TYPES } from "@/domain/models/RentalService";

// Constants for Meta Cloud API
const API_VERSION = 'v17.0';
// These should be environment variables. 
// For now, we will use placeholders or try to read from process.env if available elsewhere, 
// but usually in Next.js public/client side we shouldn't expose the Token.
// SECURITY WARNING: This service should ideally be called from a Server Action or API Route 
// to keep the Token secret. Client-side calls expose the token.

// Therefore, I should create a SERVER-SIDE handler (API Route) and this service calls THAT.
// But valid for prototype: I'll make this service call our own internal API `/api/whatsapp/send`.

export const whatsappService = {
    // Envia un mensaje de plantilla (Template Message)
    sendTemplate: async (
        to: string,
        templateName: string,
        languageCode: string = 'es',
        components: any[] = []
    ) => {
        try {
            const response = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to,
                    type: 'template',
                    template: {
                        name: templateName,
                        language: { code: languageCode },
                        components
                    }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error sending WhatsApp message');
            }

            return await response.json();
        } catch (error) {
            console.error('WhatsApp Service Error:', error);
            // Don't crash the app if notification fails
            return { success: false, error };
        }
    },

    // Enviar mensaje de texto simple
    sendMessage: async (to: string, message: string) => {
        try {
            const response = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to,
                    type: 'text',
                    text: { body: message }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error sending WhatsApp message');
            }

            return await response.json();
        } catch (error) {
            console.error('WhatsApp Service Error:', error);
            return { success: false, error };
        }
    },

    // Generar mensaje de servicios para enviar al inquilino
    generateServicesMessage: (rental: Alquiler, service: RentalService): string => {
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        let message = `🏠 *Liquidación de Servicios*\n\n`;
        message += `📅 *Período:* ${monthNames[service.month - 1]} ${service.year}\n`;
        message += `🏡 *Propiedad:* ${rental.direccion}\n\n`;
        message += `📋 *Detalle de Servicios:*\n`;

        service.charges.forEach(charge => {
            const config = SERVICE_TYPES[charge.type];
            message += `\n${config.icon} *${config.label}:* $${charge.amount.toLocaleString('es-AR')}`;
            if (charge.description) {
                message += `\n   _${charge.description}_`;
            }
        });

        message += `\n\n💰 *TOTAL: $${service.total.toLocaleString('es-AR')}*\n\n`;
        message += `Por favor, proceder con el pago a la brevedad. Ante cualquier consulta, no dudes en contactarnos.`;

        return message;
    },

    // Helper: Enviar mensaje de bienvenida
    sendWelcomeMessage: async (name: string, phone: string) => {
        // Example template: "hello_world" or a custom "welcome_new_user"
        // Components usually replace variables {{1}}, {{2}} in body
        return await whatsappService.sendTemplate(
            phone,
            'hello_world', // Default testing template from Meta
            'en_US', // hello_world is usually en_US
            [
                // Example body component parameters if template has them
                // { type: 'body', parameters: [{ type: 'text', text: name }] } 
            ]
        );
    }
};
