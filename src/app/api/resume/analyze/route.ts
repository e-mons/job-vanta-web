import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from '@/utils/supabase/server';
import { callGeminiWithFallback } from "@/utils/gemini";

const apiKey = process.env.GEMINI_API_KEY;

const nullableString = z.preprocess((val) => (val === null ? "" : val), z.string().default(""));

const ATSAnalysisSchema = z.object({
  score: z.number().min(0).max(100).default(0),
  feedback: nullableString,
  keywordsMissing: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const { resumeData, targetJobTitle, jobDescription } = await req.json();

    if (!resumeData) {
      return NextResponse.json({ error: "No resume data provided" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobDescriptionSection = jobDescription 
      ? `\n      Full Job Description:\n      ${jobDescription}\n\n      Use the job description above to perform a highly specific keyword and requirement analysis.`
      : '';

    const prompt = `
      You are an expert ATS (Applicant Tracking System) software used by Fortune 500 companies.
      Analyze the following structured resume data for the role of "${targetJobTitle || 'Software Professional'}'.${jobDescriptionSection}
      
      Resume Data:
      ${JSON.stringify(resumeData, null, 2)}
      
      Provide a comprehensive ATS analysis including:
      1. An overall ATS match score (0-100).
      2. A concise paragraph of feedback.
      3. A list of 5-8 missing keywords or skills relevant to this type of role${jobDescription ? ' based on the job description' : ''}.
      4. A list of 3-5 specific, actionable improvements for the resume.
      
      Respond ONLY with raw JSON matching this schema:
      {
        "score": number,
        "feedback": "string",
        "keywordsMissing": ["string"],
        "improvements": ["string"]
      }
    `;

    const content = await callGeminiWithFallback(prompt);

    // Clean any accidental markdown wrapping
    let cleanedContent = content;
    if (content.includes("```")) {
        cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    }

    let parsedData;
    try {
        parsedData = JSON.parse(cleanedContent);
    } catch (e) {
        console.error("Failed to parse AI response:", cleanedContent);
        throw new Error("Invalid response format from AI");
    }

    const validatedData = ATSAnalysisSchema.parse(parsedData);

    return NextResponse.json({ success: true, data: validatedData });
  } catch (error: any) {
    console.error("ATS analysis error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze resume" }, { status: 500 });
  }
}
