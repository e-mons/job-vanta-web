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

    const body = await req.json();
    // Support both old format (targetJobTitle/companyName) and new format (jobTitle/company)
    const jobTitle = body.jobTitle || body.targetJobTitle;
    const company = body.company || body.companyName;
    const resumeData = body.resumeData;
    const tone = body.tone || 'Professional and confident';

    if (!jobTitle) {
      return NextResponse.json({ error: "Job title is required" }, { status: 400 });
    }

    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resumeSummary = resumeData ? [
      resumeData.personalInfo?.fullName && `Name: ${resumeData.personalInfo.fullName}`,
      resumeData.personalInfo?.email && `Email: ${resumeData.personalInfo.email}`,
      resumeData.personalInfo?.summary && `Summary: ${resumeData.personalInfo.summary}`,
      resumeData.experience?.length && `Experience:\n${resumeData.experience.map((e: any) => `- ${e.role} at ${e.company} (${e.dates})`).join('\n')}`,
      resumeData.skills?.length && `Skills: ${resumeData.skills.join(', ')}`,
      resumeData.education?.length && `Education: ${resumeData.education.map((e: any) => `${e.degree} from ${e.school}`).join(', ')}`,
    ].filter(Boolean).join('\n') : 'No resume data provided.';

    const prompt = `You are an expert career coach and professional cover letter writer.
Write a compelling cover letter for the position of "${jobTitle}"${company ? ` at "${company}"` : ''}.
Tone: ${tone}.

Candidate Profile:
${resumeSummary}

Requirements:
- Write in first person, professional tone
- 3-4 paragraphs maximum
- Highlight relevant experience and skills
- Show enthusiasm for the specific role${company ? ' and company' : ''}
- Include a strong opening and call to action closing
- Use the candidate's actual name if available, do NOT use placeholders like [Your Name]
- Output ONLY the cover letter text, no JSON wrapping, no markdown, no headers`;

    const rawContent = await callGeminiWithFallback(prompt);
    let finalContent = rawContent;

    // Clean any accidental JSON or markdown wrapping
    if (rawContent.startsWith('{') || rawContent.startsWith('```')) {
      try {
        const cleaned = rawContent.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        finalContent = parsed.content || rawContent;
      } catch { /* use raw content */ }
    }

    return NextResponse.json({ content: finalContent });
  } catch (error: any) {
    console.error("Cover letter generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate cover letter" },
      { status: 500 }
    );
  }
}
