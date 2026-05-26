import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { callGeminiWithFallback } from "@/utils/gemini";

const nullableString = z.preprocess((val) => (val === null ? "" : val), z.string().default(""));

const ExtractedResumeSchema = z.object({
  personalInfo: z.object({
    fullName: nullableString,
    email: nullableString,
    phone: nullableString,
    location: nullableString,
    website: nullableString,
    summary: nullableString,
  }).default({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    summary: ""
  }),
  experience: z.array(z.object({
    id: z.string().optional(),
    company: nullableString,
    role: nullableString,
    dates: nullableString,
    bullets: z.array(z.string()).default([]),
  })).default([]),
  education: z.array(z.object({
    id: z.string().optional(),
    school: nullableString,
    degree: nullableString,
    dates: nullableString,
  })).default([]),
  skills: z.array(z.string()).default([]),
  projects: z.array(z.object({
    id: z.string().optional(),
    name: nullableString,
    description: nullableString,
    technologies: z.array(z.string()).default([]),
    link: nullableString,
  })).default([])
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Using inline data for Gemini
    const mimeType = file.type || "application/pdf";
    const base64Data = buffer.toString('base64');

    const prompt = `
      You are an expert ATS resume parser.
      Extract the content of this resume into a structured JSON format.
      
      Requirements:
      - Include personalInfo (fullName, email, phone, location, website, summary).
      - Include experience (array of objects with company, role, dates, bullets).
      - Include education (array of objects with school, degree, dates).
      - Include skills (array of strings).
      - Include projects (array of objects with name, description, technologies, link).
      
      Respond ONLY with the raw JSON. Ensure all fields exist. Do not output markdown code blocks.
    `;

    const text = await callGeminiWithFallback(
      [
        { text: prompt },
        {
          inlineData: {
            data: base64Data,
            mimeType
          }
        }
      ],
      { responseMimeType: "application/json" }
    );
    
    let data;
    try {
        // Try to find JSON block if it exists, otherwise parse full text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonToParse = jsonMatch ? jsonMatch[0] : text;
        data = JSON.parse(jsonToParse);
    } catch (e) {
        console.error("Failed to parse Gemini response:", text);
        throw new Error("The AI returned an invalid response format. Please try again or use a different file.");
    }

    const validatedData = ExtractedResumeSchema.parse(data);

    // Assign fresh IDs (ignore AI hallucinated ones which might be duplicates)
    const finalData = {
      ...validatedData,
      experience: validatedData.experience.map(exp => ({ ...exp, id: uuidv4() })),
      education: validatedData.education.map(edu => ({ ...edu, id: uuidv4() })),
      projects: validatedData.projects.map(proj => ({ ...proj, id: uuidv4() }))
    };

    return NextResponse.json({ success: true, data: finalData });
  } catch (error: any) {
    let errorMessage = error.message || "Failed to parse resume";
    
    if (error.message?.includes("API key not valid") || error.message?.includes("unregistered callers")) {
      errorMessage = "Google AI API Key is missing or invalid. Please add GEMINI_API_KEY to your web/.env.local file.";
    }

    console.error("Resume parsing error details:", {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: error.status || 500 });
  }
}
