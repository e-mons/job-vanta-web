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

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing or invalid messages array" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Format prompt for Gemini general assistant
    const systemPrompt = `
You are Jobvanta AI Assistant, an exceptionally professional, friendly, and helpful career coach and navigation assistant for the Jobvanta app. Your goal is to explain and guide the user through the app's features in simple, non-technical language.

About Jobvanta:
1. Resume Builder: Users can create, customize, and edit ATS-friendly resumes using various templates (Modern, Executive, Creative, etc.).
2. ATS Optimization: Users can copy-paste a job description to analyze their resume, calculate a matching score, and get specific tailoring suggestions.
3. Cover Letter Generator: Instantly creates professional cover letters tailored to the selected resume and target job description.
4. Find Jobs: Matches the user's resume skills against active job listings, enabling simple applications.
5. Subscription/Plan Tab: Allows users to upgrade to Pro ($9.99/mo) or Enterprise ($14.99/mo) for unlimited AI optimizations, resume storage, and advanced career insights.
6. Settings: Managed under the Profile tab on mobile (Personal info, 2FA, password changes, notification alerts, and account deactivation).

Rules:
- Give very professional, direct, clear, and reassuring answers.
- Format lists with bullet points to make them easy to read.
- Keep answers concise (1-3 short paragraphs).
- Answer the user's questions about Jobvanta features or general career tips.

Here is the conversation history:
${messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}

Assistant:
    `;

    const reply = await callGeminiWithFallback(systemPrompt);

    return NextResponse.json({ reply: reply.trim() });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate reply" }, { status: 500 });
  }
}
