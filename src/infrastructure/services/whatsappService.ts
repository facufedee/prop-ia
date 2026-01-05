import { db } from "@/infrastructure/firebase/client";

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
