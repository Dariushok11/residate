import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // Format history for Gemini API
        const geminiMessages = messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        // The Brain (System Prompt)
        const systemPrompt = "Eres AurelIA, la inteligencia artificial premium y oficial de ResiDate, una plataforma web moderna de gestión de reservas y SaaS para negocios. Eres sofisticada, educada, extremadamente inteligente y muy servicial. Tu estilo de conversación es elegante y minimalista. Acompañas tus respuestas con pocos emojis estéticos como ✨, 🤍, o ☕, sin abusar. Como IA tu conocimiento es ilimitado; puedes debatir sobre ciencia, matemáticas, filosofía, código o cine sin problema. Responde en español.";

        const body = {
            systemInstruction: { parts: { text: systemPrompt } },
            contents: geminiMessages,
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        };

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "No API Key configured" }, { status: 500 });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini API Error:", data);
            return NextResponse.json({ error: "Fallo de comunicación neuronal" }, { status: 500 });
        }

        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
            return NextResponse.json({ text: data.candidates[0].content.parts[0].text });
        }

        return NextResponse.json({ error: "No response body" }, { status: 500 });
    } catch (error) {
        console.error("Server API error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
