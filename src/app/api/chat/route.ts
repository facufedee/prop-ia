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
        const { messages } = body; // Array of { role: 'user'|'assistant', content: string }

        // Transform history for Gemini
        // Gemini expects: { role: 'user' | 'model', parts: [{ text: ... }] }
        // Also supports 'function' role but for simple chat history we map assistant->model
        const history = messages.map((m: any) => ({
            role: m.sender === "user" ? "user" : "model",
            parts: [{ text: m.content }]
        }));

        const genAI = new GoogleGenerativeAI(apiKey);
        // Use gemini-2.0-flash-exp or stable if available. 
        // Using "gemini-2.0-flash" as seen in other route.
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            tools: [{ functionDeclarations: tools }]
        });

        const chat = model.startChat({
            history: history.slice(0, -1), // Previous history
        });

        // Send last message
        const lastMsg = history[history.length - 1];
        let result = await chat.sendMessage(lastMsg.parts);
        let response = result.response;

        // Loop for function calls
        // Limit steps to avoid infinite loops
        let steps = 0;
        const MAX_STEPS = 5;

        while (steps < MAX_STEPS) {
            const calls = response.functionCalls();

            if (calls && calls.length > 0) {
                // Execute tools
                const parts: any[] = [];
                for (const call of calls) {
                    console.log("Calling tool:", call.name);
                    const toolResult = await runTool(call.name, call.args);
                    parts.push({
                        functionResponse: {
                            name: call.name,
                            response: { result: toolResult }
                        }
                    });
                }

                // Send function output back to model
                result = await chat.sendMessage(parts);
                response = result.response;
                steps++;
            } else {
                // No more function calls, we have the answer
                break;
            }
        }

        const text = response.text();
        return NextResponse.json({
            role: "assistant",
            content: text
        });

    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
