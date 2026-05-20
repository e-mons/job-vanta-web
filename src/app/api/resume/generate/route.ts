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

    const { prompt: userPrompt } = await req.json();

    if (!userPrompt) {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const systemPrompt = `
      You are an expert, professional resume building AI. 
      The user wants to generate a complete resume from scratch based on the following short description:
      
      User's Request: "${userPrompt}"

      Your task is to generate a comprehensive, fully populated resume.
      CRITICAL INSTRUCTION: You MUST make sure all fields are generated or filled up even with example/fictional data no matter what the user enters. No field or content should be left out or empty.
      If the user does not provide specific dates, company names, schools, or details, you MUST invent realistic, professional placeholder data (e.g., "Tech Innovators Inc.", "2018-2022", "Example University").
      Generate at least 3 skills, 2 experience entries (with 3-4 bullets each), 1 education entry, and 1 project entry.

      Respond ONLY with valid JSON matching the exact structure below. Do not add any new fields. Do not wrap in markdown code blocks.

      {
        "personalInfo": {
          "fullName": "...",
          "email": "...",
          "phone": "...",
          "location": "...",
          "summary": "...",
          "website": "",
          "photo": ""
        },
        "experience": [
          {
            "id": "exp_1",
            "company": "...",
            "role": "...",
            "dates": "...",
            "bullets": ["...", "..."]
          }
        ],
        "education": [
          {
            "id": "edu_1",
            "school": "...",
            "degree": "...",
            "year": "..."
          }
        ],
        "skills": ["...", "..."],
        "projects": [
          {
            "id": "proj_1",
            "name": "...",
            "description": "...",
            "technologies": ["...", "..."],
            "link": ""
          }
        ],
        "certifications": [],
        "languages": [],
        "interests": [],
        "references": []
      }
    `;

    const content = await callGeminiWithFallback(systemPrompt);

    let cleanedContent = content.trim();
    const startIdx = cleanedContent.indexOf('{');
    const endIdx = cleanedContent.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleanedContent = cleanedContent.substring(startIdx, endIdx + 1);
    }

    let generatedData;
    try {
      generatedData = JSON.parse(cleanedContent);
    } catch (e) {
      console.error("Failed to parse AI generation response:", content);
      throw new Error("Invalid response format from AI");
    }

    return NextResponse.json({ data: generatedData });
  } catch (error: any) {
    console.error("Resume generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate resume" }, { status: 500 });
  }
}
