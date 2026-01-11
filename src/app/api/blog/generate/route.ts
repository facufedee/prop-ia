import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Google API Key is not configured" }, { status: 500 });
        }

        // 1. Fetch content
        const response = await fetch(url);
        const html = await response.text();

        // 2. Extract text using Cheerio
        const $ = cheerio.load(html);

        // Remove unnecessary elements
        $('script, style, nav, footer, header, aside, .ads, .comments').remove();

        // Get main content (prioritize article, main, or just body)
        let contentText = $('article').text() || $('main').text() || $('body').text();

        // Clean up whitespace
        contentText = contentText.replace(/\s+/g, ' ').trim().slice(0, 10000); // Limit context size

        if (contentText.length < 100) {
            return NextResponse.json({ error: "Could not extract enough content from the URL" }, { status: 400 });
        }

        // 3. Generate with Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Act as an expert real estate copywriter. 
            I will provide you with the text content of an article. 
            Your task is to rewrite it into a compelling blog post for a real estate agency website ("Zeta Prop").
            
            The tone should be professional yet engaging, informative, and optimized for SEO.
            
            Source Text:
            "${contentText}"

            Output Format (JSON only):
            {
                "title": "A catchy, SEO-friendly title",
                "excerpt": "A short summary (max 160 chars) for meta description",
                "content": "The full blog post content in Markdown format. Use headings (##), bullet points, and short paragraphs."
            }
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean up JSON markdown if present
        const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const generatedData = JSON.parse(jsonString);
            return NextResponse.json(generatedData);
        } catch (e) {
            console.error("Error parsing Gemini response:", responseText);
            return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Error generating blog post:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
