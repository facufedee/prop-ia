import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GOOGLE_API_KEY;


export async function POST(request: Request) {
    console.log("API Route: /api/generate-description called");

    if (!apiKey) {
        console.error("API Error: GOOGLE_API_KEY is missing");
        return NextResponse.json(
            { error: "Configuration Error: API Key missing" },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();
        console.log("API Route: Received body", JSON.stringify(body, null, 2));

        const {
            operation_type,

            property_type,
            property_subtype,
            provincia,
            localidad,
            calle,
            rooms,
            bedrooms,
            bathrooms,
            area_total,
            area_covered,
            antiquity_type,
            price,
            currency
        } = body;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            Actúa como un experto agente inmobiliario (copywriter).
            Genera un título atractivo y una descripción detallada y vendedora para una publicación inmobiliaria con los siguientes datos:

            - Operación: ${operation_type}
            - Tipo: ${property_type} ${property_subtype || ''}
            - Ubicación: ${calle}, ${localidad}, ${provincia}
            - Ambientes: ${rooms}
            - Dormitorios: ${bedrooms}
            - Baños: ${bathrooms}
            - Superficie: ${area_total}m² total (${area_covered}m² cubiertos)
            - Antigüedad: ${antiquity_type}
            - Precio: ${currency} ${price}

            Responde EXCLUSIVAMENTE con un objeto JSON (sin markdown, sin bloques de código) con el siguiente formato:
            {
                "title": "Título corto pero llamativo (máx 60 caracteres)",
                "description": "Descripción completa, resaltando puntos fuertes, ubicación y oportunidades. Usa párrafos claros."
            }
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean up markdown if present (Gemini sometimes adds ```json ... ```)
        const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

        const jsonResponse = JSON.parse(cleanedText);

        return NextResponse.json(jsonResponse);

    } catch (error: any) {
        console.error("Error generating description:", error);
        return NextResponse.json(
            { error: "Error generating content", details: error.message },
            { status: 500 }
        );
    }
}
