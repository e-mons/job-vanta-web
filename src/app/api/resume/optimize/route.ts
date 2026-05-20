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

    const { resumeData, jobTitle, jobDescription } = await req.json();

    if (!resumeData) {
      return NextResponse.json({ error: "No resume data provided" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobContext = jobDescription
      ? `Target Job Title: "${jobTitle}"\nFull Job Description:\n${jobDescription}`
      : `Target Job Title: "${jobTitle || 'General Professional'}"`;

    // Sanitize large base64 photo data to prevent exceeding model API payload limits
    const originalPhoto = resumeData.personalInfo?.photo;
    const sanitizedResumeData = { ...resumeData };
    if (sanitizedResumeData.personalInfo) {
      sanitizedResumeData.personalInfo = {
        ...sanitizedResumeData.personalInfo,
        photo: originalPhoto ? "[BASE64_PHOTO_DATA_REMOVED_FOR_OPTIMIZATION]" : ""
      };
    }

    const prompt = `
      You are an expert resume optimization AI. Your task is to rewrite and optimize the following resume data to maximize its ATS (Applicant Tracking System) compatibility for the target role.

      ${jobContext}

      Current Resume Data:
      ${JSON.stringify(sanitizedResumeData, null, 2)}

      Instructions:
      1. Rewrite the summary to be highly targeted for the role
      2. Enhance experience bullet points with strong action verbs and quantified achievements
      3. Add relevant keywords naturally throughout
      4. Improve skill descriptions to match industry terminology
      5. Keep all dates, company names, school names, and factual information EXACTLY the same
      6. Only improve the language, phrasing, and keyword optimization

      Respond ONLY with the optimized resume data as valid JSON matching the EXACT same structure as the input. Do not add any new fields or remove existing ones. Do not wrap in markdown code blocks.
    `;

    const content = await callGeminiWithFallback(prompt);

    let cleanedContent = content.trim();
    const startIdx = cleanedContent.indexOf('{');
    const endIdx = cleanedContent.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleanedContent = cleanedContent.substring(startIdx, endIdx + 1);
    }

    let optimizedData;
    try {
      optimizedData = JSON.parse(cleanedContent);
    } catch (e) {
      console.error("Failed to parse AI optimization response:", content);
      throw new Error("Invalid response format from AI");
    }

    // Restore original photo base64 data
    if (optimizedData.personalInfo) {
      optimizedData.personalInfo.photo = originalPhoto || "";
    }

    return NextResponse.json({ optimizedData });
  } catch (error: any) {
    console.error("Resume optimization error:", error);
    return NextResponse.json({ error: error.message || "Failed to optimize resume" }, { status: 500 });
  }
}
