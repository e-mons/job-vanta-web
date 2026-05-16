import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';
import { callGeminiWithFallback } from "@/utils/gemini";

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const { text, section } = await req.json();

    if (!text || !section) {
      return NextResponse.json({ error: "Missing text or section" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prompt = `
      You are an expert resume writer and career coach. 
      Improve the following "${section}" content from a professional resume.
      
      Original text:
      "${text}"
      
      Rules:
      - Make it more impactful, concise, and professional
      - Use strong action verbs where appropriate
      - Quantify achievements when possible
      - Keep the same general meaning but elevate the language
      - Return ONLY the improved text, nothing else — no quotes, no labels, no explanation
    `;

    const improvedText = await callGeminiWithFallback(prompt);

    return NextResponse.json({ improvedText: improvedText.trim() });
  } catch (error: any) {
    console.error("AI improve error:", error);
    return NextResponse.json({ error: error.message || "Failed to improve content" }, { status: 500 });
  }
}
