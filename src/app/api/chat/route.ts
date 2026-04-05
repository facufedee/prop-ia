import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { tools, runTool } from "@/infrastructure/ai/tools";

const apiKey = process.env.GOOGLE_API_KEY;

export async function POST(request: Request) {
    if (!apiKey) {
        return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { messages } = body;

        if (!Array.isArray(messages)) {
            return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
        }

        const history = messages.map((m: any) => ({
            role: m.sender === "user" ? "user" : "model",
            parts: [{ text: String(m.content).substring(0, 10000) }],
        }));

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            tools: [{ functionDeclarations: tools }],
        });

        const chat = model.startChat({ history: history.slice(0, -1) });
        const lastMsg = history[history.length - 1];
        let result = await chat.sendMessage(lastMsg.parts);
        let response = result.response;

        let steps = 0;
        const MAX_STEPS = 5;

        while (steps < MAX_STEPS) {
            const calls = response.functionCalls();
            if (!calls?.length) break;

            const parts: any[] = [];
            for (const call of calls) {
                const toolResult = await runTool(call.name, call.args);
                parts.push({
                    functionResponse: { name: call.name, response: { result: toolResult } },
                });
            }

            result = await chat.sendMessage(parts);
            response = result.response;
            steps++;
        }

        return NextResponse.json({ role: "assistant", content: response.text() });
    } catch (error: any) {
        console.error("Chat API Error:", error.message);
        return NextResponse.json({ error: "Error procesando respuesta" }, { status: 500 });
    }
}
