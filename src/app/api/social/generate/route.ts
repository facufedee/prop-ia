import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/apiAuth";

const apiKey = process.env.GOOGLE_API_KEY;

export async function POST(request: NextRequest) {
    const authResult = await verifyAuth(request);
    if (authResult.error) return authResult.error;

    if (!apiKey) {
        return NextResponse.json({ error: "Configuration Error: API Key missing" }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { title, content } = body;

        if (!title || !content) {
            return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Actúa como un experto en marketing digital inmobiliario (Community Manager).

            Tu tarea es redactar el copy perfecto para redes sociales (Instagram/LinkedIn) basado en el siguiente artículo de blog.

            Datos del artículo:
            - Título: "${title}"
            - Contenido: "${content.substring(0, 5000)}" (truncado para contexto)

            Requisitos EXCLUYENTES del formato de salida:
            1. Genera un resumen atractivo en exactamente DOS párrafos cortos.
               - El primer párrafo debe ser un "gancho" que resume la noticia principal.
               - El segundo párrafo debe profundizar un poco más o explicar el impacto/beneficio.
            2. El tono debe ser profesional pero cercano, ideal para un agente inmobiliario.
            3. NO incluyas hashtags ni CTA en el texto generado por la IA, ya que yo los agregaré programáticamente después.
            4. Devuelve SOLAMENTE el texto de los dos párrafos, separados por un salto de línea doble (\\n\\n). Sin comillas, sin "Aquí tienes el copy", etc.
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        let cleanText = responseText.replace(/```/g, "").trim();

        const cta = "Más info en nuestro blog zetaprop.com.ar/blog";
        const hashtags = "#zetaprop #crmInmobiliario #gestiondealquileres #gestiondeemprendimientos #desarrollosinmobiliarios";
        const finalCopy = `🔥 ${title}\n\n${cleanText}\n\n${cta}\n\n${hashtags}`;

        return NextResponse.json({ copy: finalCopy });
    } catch (error: any) {
        console.error("[social/generate] Error:", error.message);
        return NextResponse.json({ error: "Error generando contenido" }, { status: 500 });
    }
}
