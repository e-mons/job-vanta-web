import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY?.trim();
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

const nullableString = z.preprocess((val) => (val === null || val === undefined ? "" : String(val)), z.string().default(""));

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

const PARSE_PROMPT = `
You are an expert ATS resume parser. Extract the full structured content from this resume document.

Requirements:
- personalInfo: Extract fullName, email, phone, location, website, and a professional summary.
- experience: Array of all work experiences with company, role, dates (e.g. "Jan 2021 – Mar 2023"), and an array of bullet-point responsibilities/achievements.
- education: Array of all education entries with school, degree, and dates.
- skills: Flat array of all skill strings.
- projects: Array of personal or professional projects with name, description, technologies array, and link.

Rules:
- Never return null for any string field — use empty string "" instead.
- If a field is not present in the document, return an empty string or empty array.
- Return ONLY raw valid JSON, no markdown, no backticks, no code fences.

JSON structure:
{
  "personalInfo": { "fullName": "", "email": "", "phone": "", "location": "", "website": "", "summary": "" },
  "experience": [{ "company": "", "role": "", "dates": "", "bullets": [] }],
  "education": [{ "school": "", "degree": "", "dates": "" }],
  "skills": [],
  "projects": [{ "name": "", "description": "", "technologies": [], "link": "" }]
}
`;

/**
 * Parse a PDF/DOCX using the new Google GenAI Files API (recommended for binary files)
 */
async function parseWithFilesAPI(bytes: ArrayBuffer, mimeType: string): Promise<string> {
  const blob = new Blob([bytes], { type: mimeType });

  // Upload file via Files API
  const uploadResponse = await ai.files.upload({
    file: blob,
    config: { mimeType },
  });

  const fileUri = uploadResponse.uri;
  if (!fileUri) throw new Error("File upload to Gemini failed — no URI returned.");

  // Generate content with the uploaded file reference
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: PARSE_PROMPT },
          { fileData: { fileUri, mimeType } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
    }
  });

  const text = response.text;
  if (!text) throw new Error("Gemini returned an empty response for the uploaded file.");
  return text;
}

/**
 * Parse plain text file by sending text inline
 */
async function parseWithInlineText(textContent: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: PARSE_PROMPT + "\n\nResume text to parse:\n" + textContent }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
    }
  });

  const text = response.text;
  if (!text) throw new Error("Gemini returned an empty response.");
  return text;
}

/**
 * Safely parse and validate the JSON string from Gemini
 */
function parseAndValidate(rawText: string) {
  let cleaned = rawText.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/, "").trim();
  }

  // Find first valid JSON object
  const startIdx = cleaned.indexOf("{");
  const endIdx = cleaned.lastIndexOf("}");
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  const parsed = JSON.parse(cleaned);
  return ExtractedResumeSchema.parse(parsed);
}

export async function POST(req: NextRequest) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key is not configured. Please add GEMINI_API_KEY to your .env.local file." },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const mimeType = file.type || "application/pdf";
    const fileName = file.name?.toLowerCase() || "";

    let rawText: string;

    if (fileName.endsWith(".txt")) {
      // Plain text — decode and send inline
      const textContent = new TextDecoder("utf-8").decode(bytes);
      rawText = await parseWithInlineText(textContent);
    } else {
      // PDF, DOCX, or other binary — use Files API
      rawText = await parseWithFilesAPI(bytes, mimeType);
    }

    const validatedData = parseAndValidate(rawText);

    // Assign fresh IDs
    const finalData = {
      ...validatedData,
      experience: validatedData.experience.map(exp => ({ ...exp, id: uuidv4() })),
      education: validatedData.education.map(edu => ({ ...edu, id: uuidv4() })),
      projects: validatedData.projects.map(proj => ({ ...proj, id: uuidv4() })),
    };

    return NextResponse.json({ success: true, data: finalData });

  } catch (error: any) {
    console.error("[Resume Parse] Error:", {
      message: error.message,
      stack: error.stack,
    });

    let userMessage = "Failed to parse resume. Please try again.";

    if (error.message?.includes("API key") || error.message?.includes("unregistered callers")) {
      userMessage = "Gemini API key is invalid or missing. Please check your GEMINI_API_KEY environment variable.";
    } else if (error.message?.includes("quota") || error.message?.toLowerCase().includes("rate limit")) {
      userMessage = "AI quota exceeded. Please wait a moment and try again.";
    } else if (error.message?.includes("fetch failed") || error.message?.includes("network")) {
      userMessage = "Network error connecting to AI service. Please check your internet connection.";
    } else if (error.message?.includes("JSON")) {
      userMessage = "The AI could not extract structured data from your file. Try a cleaner PDF or copy-paste your resume as a .txt file.";
    }

    return NextResponse.json(
      {
        error: userMessage,
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
