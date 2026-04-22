import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/apiAuth";
import { chatTools, runChatTool } from "@/infrastructure/ai/chatTools";

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
- Contacto: soporte@zetaprop.com.ar | WhatsApp: +54 9 11 2388-9745
- Fundadores: equipo argentino especializado en tecnología inmobiliaria
- Prueba gratuita: 14 días sin tarjeta de crédito
- Módulos principales: Propiedades, Alquileres, CRM/Leads, Portal Inquilinos, Tasación IA, Multi-sucursal, Sitio web propio, Marketing, Blog`;

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
            return NextResponse.json({ content: "No pude generar una respuesta. Por favor intentá de nuevo." });
        }

        return NextResponse.json({ role: "assistant", content: text });
    } catch (error: any) {
        console.error("Chat API Error:", error.message);
        return NextResponse.json({ error: "Error procesando la respuesta" }, { status: 500 });
    }
}
