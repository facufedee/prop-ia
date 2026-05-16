import { openai } from "@ai-sdk/openai";
import { streamText, convertToCoreMessages } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/apiAuth";
import { getChatTools, searchUserProperties } from "@/infrastructure/ai/chatTools";
import { adminDb } from "@/infrastructure/firebase/admin";

const apiKey = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `Sos el asistente virtual oficial de **Zeta Prop**, un CRM inmobiliario SaaS diseñado para inmobiliarias argentinas.

## Regla de Oro / Límite Estricto (PROHIBIDO HABLAR DE OTROS TEMAS)
**SOLO PODÉS RESPONDER SOBRE ZETA PROP Y EL SECTOR INMOBILIARIO.**
Si el usuario pregunta cosas como "¿para qué sirve esto?" o "¿cómo funciona el sistema?", ASUMÍ QUE ESTÁ HABLANDO DE ZETA PROP y explicale los beneficios y módulos.
PERO si el usuario intenta conversar sobre temas 100% ajenos (por ejemplo: recetas de cocina, turismo, deportes, programación general, tareas escolares, política, viajes, etc.), DEBÉS RECHAZAR LA CONSULTA INMEDIATAMENTE diciendo: "Lo siento, solo puedo ayudarte con temas relacionados al sistema Zeta Prop o al sector inmobiliario."

## Tu rol
Ayudás a los usuarios de la plataforma con consultas sobre:
- Funcionalidades y módulos de Zeta Prop
- Planes y precios de suscripción
- Noticias y artículos del blog
- Información de contacto y soporte
- Cómo usar las distintas secciones del sistema
- Propiedades disponibles en el sistema del usuario
- Contratos de alquiler activos

## Reglas de estilo
1. Usás español rioplatense: "vos", "tenés", "podés", "hacé", etc.
2. Sos conciso, profesional y cálido. Máximo 3-4 párrafos por respuesta salvo que se pida un listado.
3. Cuando uses herramientas para buscar datos, presentá los resultados de forma clara y ordenada.
4. No inventés precios, funciones ni datos. Si no tenés información, decilo y sugerí contactar soporte.

## Información base de Zeta Prop
- Sitio web: zetaprop.com.ar
- Contacto: zetaprop.com.ar@gmail.com | WhatsApp: +54 9 11 2388-9745
- Fundadores: equipo argentino especializado en tecnología inmobiliaria
- Prueba gratuita: 14 días sin tarjeta de crédito
- Módulos principales: Propiedades, Alquileres, CRM/Leads, Portal Inquilinos, Tasación IA, Multi-sucursal, Sitio web propio, Marketing, Blog`;

const CANNED_FREE_INTRO = `¡Hola! Soy el asistente IA de **Zeta Prop**. Con una suscripción activa puedo ayudarte con:

- 📊 **Estadísticas** de tu cartera (propiedades activas, leads, alquileres)
- 🏠 **Consultar propiedades** y contratos de alquiler en tiempo real
- 💡 **Responder dudas** sobre cómo usar el sistema
- 📋 **Resumir información** de clientes y operaciones

Para acceder al asistente completo necesitás tener un plan activo. ¿Querés ver nuestros planes?`;

const CANNED_FREE_UPGRADE = `Este asistente está disponible para usuarios con suscripción activa. 🚀

Actualizá tu plan para acceder a consultas ilimitadas con IA sobre tus propiedades, alquileres y leads.

👉 [**Ver planes y precios**](/precios)`;

async function hasActiveSub(userId: string): Promise<boolean> {
    try {
        const snap = await adminDb.collection("subscriptions")
            .where("userId", "==", userId)
            .where("status", "==", "active")
            .limit(1)
            .get();
        return !snap.empty;
    } catch {
        return false;
    }
}

export async function POST(request: NextRequest) {
    if (!apiKey) {
        return NextResponse.json({ error: "Configuración incompleta del servidor" }, { status: 500 });
    }

    // Verify authentication
    const authResult = await verifyAuth(request);
    if (authResult.error) return authResult.error;

    try {
        const body = await request.json();
        const { messages } = body;

        if (!Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: "Formato de mensajes inválido" }, { status: 400 });
        }

        const userMsgs = messages.filter((m: any) => m.role === "user");
        const lastUserMsg = userMsgs[userMsgs.length - 1];
        const rawUserText = lastUserMsg ? String(lastUserMsg.content).toLowerCase() : "";
        const userText = rawUserText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        let cannedContent = "";
        
        // Fast-path: Predefined responses for BOTH free and paid users to save tokens and time
        if (userText.includes("cuantas") && (userText.includes("casas") || userText.includes("propiedad"))) {
            const props = await searchUserProperties(authResult.user.uid, "active");
            cannedContent = `Actualmente tenés **${props.total || 0} propiedades activas** registradas en el sistema.`;
        } else if ((userText.includes("como") && userText.includes("carg")) || userText.includes("agregar") || userText.includes("crear") || userText.includes("nueva")) {
            cannedContent = `🏠 **Para cargar una propiedad:**\nAndá a la sección **Propiedades** y hacé clic en el botón "+ Nueva Propiedad". Ahí podés completar todos los datos, subir fotos y asignar la ubicación en el mapa.\n\n👉 [Ver Tutoriales](/dashboard/tutoriales)`;
        } else if ((userText.includes("como") && userText.includes("cobr")) || userText.includes("pago") || userText.includes("recibo") || userText.includes("alquiler")) {
            cannedContent = `💰 **Para gestionar cobros de alquileres:**\nAndá al módulo **Alquileres** > **Agenda de Cobros**. Desde ahí podés registrar los pagos mes a mes y llevar el control de morosos.\n\n👉 [Ver Tutoriales](/dashboard/tutoriales)`;
        } else if (userText.includes("plan") || userText.includes("precio") || userText.includes("suscrip")) {
            cannedContent = `💳 **Planes y Suscripciones:**\nTenemos planes adaptados al tamaño de cada inmobiliaria, desde el plan Básico (gratuito) hasta planes Profesionales con Inteligencia Artificial y funciones avanzadas.\n\n👉 [**Ver planes y precios**](/precios)`;
        } else if (userText.includes("soporte") || userText.includes("ayuda") || userText.includes("contact")) {
            cannedContent = `🎧 **Soporte Técnico:**\nPara comunicarte con nuestro equipo, podés ir a la sección de Soporte en el menú principal o enviarnos un email a zetaprop.com.ar@gmail.com.\n\n👉 [Ir a Soporte](/dashboard/soporte)`;
        } else if (userText.includes("lead") || userText.includes("cliente") || userText.includes("consulta")) {
            cannedContent = `👥 **CRM y Consultas:**\nPodés ver todos los mensajes y clientes interesados en el módulo **Consultas**. Ahí funciona un tablero tipo Trello (Kanban) para que muevas a los clientes según su estado de negociación.\n\n👉 [Ir al CRM](/dashboard/leads)`;
        } else if (userText.includes("web") || userText.includes("sitio") || userText.includes("pagina")) {
            cannedContent = `🌐 **Tu Sitio Web:**\nDesde la sección **Mi Sitio** podés configurar el dominio, logo, colores y la información de tu inmobiliaria para que se genere tu página pública automáticamente.\n\n👉 [Configurar Sitio Web](/dashboard/mi-sitio)`;
        }

        const isPaid = await hasActiveSub(authResult.user.uid);
        
        if (!isPaid && !cannedContent) {
            if (userMsgs.length <= 1 && userText.split(" ").length < 4 && !userText.includes("?")) {
                cannedContent = CANNED_FREE_INTRO;
            } else {
                cannedContent = `Para responder esa consulta y ayudarte con un análisis avanzado, podés usar nuestra Inteligencia Artificial.\n\nActualizá tu plan para desbloquear consultas ilimitadas, lectura de documentos y tasación IA. 🚀\n👉 [**Ver planes y precios**](/precios)\n\n💡 *Tip: Mientras tanto, te invito a utilizar las **Consultas Rápidas** que están en los botones de abajo para navegar velozmente por el sistema.*`;
            }
        }

        if (cannedContent) {
            const streamTextResponse = `0:${JSON.stringify(cannedContent)}\n`;
            return new Response(streamTextResponse, { 
                status: 200,
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'x-vercel-ai-data-stream': 'v1'
                }
            });
        }

        const coreMessages = convertToCoreMessages(messages);

        const result = streamText({
            model: openai("gpt-4o-mini"),
            system: SYSTEM_PROMPT,
            messages: coreMessages,
            tools: getChatTools(authResult.user.uid),
            maxSteps: 3,
            temperature: 0.7,
        });

        return result.toDataStreamResponse();
    } catch (error: any) {
        console.error("Chat API Error:", error.message);
        return NextResponse.json({ error: "Error procesando la respuesta" }, { status: 500 });
    }
}
