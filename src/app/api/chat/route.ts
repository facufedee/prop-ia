import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/apiAuth";
import { chatTools, runChatTool } from "@/infrastructure/ai/chatTools";
import { adminDb } from "@/infrastructure/firebase/admin";

const apiKey = process.env.GOOGLE_API_KEY;

const SYSTEM_PROMPT = `Sos el asistente virtual oficial de **Zeta Prop**, un CRM inmobiliario SaaS diseñado para inmobiliarias argentinas.

## Tu rol
Ayudás a los usuarios de la plataforma con consultas sobre:
- Funcionalidades y módulos de Zeta Prop
- Planes y precios de suscripción
- Noticias y artículos del blog
- Información de contacto y soporte
- Cómo usar las distintas secciones del sistema
- Propiedades disponibles en el sistema del usuario
- Contratos de alquiler activos

## Reglas estrictas
1. **Solo respondés temas relacionados con Zeta Prop y el sector inmobiliario argentino.**
2. Si el usuario pregunta algo completamente ajeno (recetas, clima, deportes, política, entretenimiento, etc.), respondés amablemente que solo podés ayudar con temas de Zeta Prop.
3. Usás español rioplatense: "vos", "tenés", "podés", "hacé", etc.
4. Sos conciso, profesional y cálido. Máximo 3-4 párrafos por respuesta salvo que se pida un listado.
5. Cuando uses herramientas para buscar datos, presentá los resultados de forma clara y ordenada.
6. No inventés precios, funciones ni datos. Si no tenés información, decilo y sugerí contactar soporte.
7. No respondas preguntas sobre otras plataformas o competidores.

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

        // Gate: free users get canned responses — no Gemini calls
        const isPaid = await hasActiveSub(authResult.user.uid);
        if (!isPaid) {
            const userMsgs = messages.filter((m: any) => m.role === "user");
            const lastUserMsg = userMsgs[userMsgs.length - 1];
            const rawUserText = lastUserMsg ? String(lastUserMsg.content).toLowerCase() : "";
            const userText = rawUserText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            let content = "";
            
            if (userText.includes("cuantas") && (userText.includes("casas") || userText.includes("propiedad"))) {
                const props = await runChatTool("search_user_properties", { status: "active" }, authResult.user.uid);
                content = `Actualmente tenés **${props.total || 0} propiedades activas** registradas en el sistema.\n\n*Para obtener reportes detallados y asistencia IA completa, actualizá tu plan.*`;
            } else if ((userText.includes("como") && userText.includes("carg")) || userText.includes("agregar") || userText.includes("crear") || userText.includes("nueva")) {
                content = `🏠 **Para cargar una propiedad:**\nAndá a la sección **Propiedades** y hacé clic en el botón "+ Nueva Propiedad". Ahí podés completar todos los datos, subir fotos y asignar la ubicación en el mapa.\n\n👉 [Ver Tutoriales](/dashboard/tutoriales)`;
            } else if ((userText.includes("como") && userText.includes("cobr")) || userText.includes("pago") || userText.includes("recibo") || userText.includes("alquiler")) {
                content = `💰 **Para gestionar cobros de alquileres:**\nAndá al módulo **Alquileres** > **Agenda de Cobros**. Desde ahí podés registrar los pagos mes a mes y llevar el control de morosos.\n\n👉 [Ver Tutoriales](/dashboard/tutoriales)`;
            } else if (userText.includes("plan") || userText.includes("precio") || userText.includes("suscrip")) {
                content = `💳 **Planes y Suscripciones:**\nTenemos planes adaptados al tamaño de cada inmobiliaria, desde el plan Básico (gratuito) hasta planes Profesionales con Inteligencia Artificial y funciones avanzadas.\n\n👉 [**Ver planes y precios**](/precios)`;
            } else if (userText.includes("soporte") || userText.includes("ayuda") || userText.includes("contact")) {
                content = `🎧 **Soporte Técnico:**\nPara comunicarte con nuestro equipo, podés ir a la sección de Soporte en el menú principal o enviarnos un email a zetaprop.com.ar@gmail.com.\n\n👉 [Ir a Soporte](/dashboard/soporte)`;
            } else if (userMsgs.length <= 1 && userText.split(" ").length < 4 && !userText.includes("?")) {
                content = CANNED_FREE_INTRO;
            } else {
                content = `Para responder esa consulta y ayudarte con un análisis más avanzado, podés usar nuestra Inteligencia Artificial impulsada por Gemini.\n\nActualizá tu plan para desbloquear consultas ilimitadas, lectura de documentos y tasación IA. 🚀\n\n👉 [**Ver planes y precios**](/precios)`;
            }

            const streamText = `0:${JSON.stringify(content)}\n`;
            return new Response(streamText, { 
                status: 200,
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'x-vercel-ai-data-stream': 'v1'
                }
            });
        }

        // Limit conversation history to last 10 messages to control tokens
        const recentMessages = messages.slice(-10);
        const history = recentMessages.slice(0, -1).map((m: any) => ({
            role: m.sender === "user" ? "user" : "model",
            parts: [{ text: String(m.content).substring(0, 2000) }],
        }));

        const lastMsg = recentMessages[recentMessages.length - 1];
        const userText = String(lastMsg.content).substring(0, 1000); // Limit user input

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            tools: [{ functionDeclarations: chatTools }],
            systemInstruction: SYSTEM_PROMPT,
            generationConfig: {
                maxOutputTokens: 800,
                temperature: 0.7,
            },
        });

        const chat = model.startChat({ history });
        let result = await chat.sendMessage(userText);
        let response = result.response;

        // Tool-call loop (max 3 steps)
        let steps = 0;
        while (steps < 3) {
            const calls = response.functionCalls();
            if (!calls?.length) break;

            const parts: any[] = [];
            for (const call of calls) {
                const toolResult = await runChatTool(call.name, call.args, authResult.user.uid);
                parts.push({
                    functionResponse: { name: call.name, response: { result: toolResult } },
                });
            }

            result = await chat.sendMessage(parts);
            response = result.response;
            steps++;
        }

        const text = response.text();
        if (!text) {
            const errText = `0:${JSON.stringify("No pude generar una respuesta. Por favor intentá de nuevo.")}\n`;
            return new Response(errText, { 
                status: 200,
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'x-vercel-ai-data-stream': 'v1'
                }
            });
        }

        const streamText = `0:${JSON.stringify(text)}\n`;
        return new Response(streamText, { 
            status: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'x-vercel-ai-data-stream': 'v1'
            }
        });
    } catch (error: any) {
        console.error("Chat API Error:", error.message);
        return NextResponse.json({ error: "Error procesando la respuesta" }, { status: 500 });
    }
}
