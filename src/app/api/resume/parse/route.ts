import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY?.trim();
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

const MODELS_TO_TRY = [
  "gemini-flash-latest",
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite"
];

const nullableString = z.preprocess(
  (val) => (val === null || val === undefined ? "" : String(val)),
  z.string().default("")
);

const ExtractedResumeSchema = z.object({
  personalInfo: z
    .object({
      fullName: nullableString,
      email: nullableString,
      phone: nullableString,
      location: nullableString,
      website: nullableString,
      summary: nullableString,
    })
    .default({ fullName: "", email: "", phone: "", location: "", website: "", summary: "" }),
  experience: z
    .array(
      z.object({
        id: z.string().optional(),
        company: nullableString,
        role: nullableString,
        dates: nullableString,
        bullets: z.array(z.string()).default([]),
      })
    )
    .default([]),
  education: z
    .array(
      z.object({
        id: z.string().optional(),
        school: nullableString,
        degree: nullableString,
        dates: nullableString,
      })
    )
    .default([]),
  skills: z.array(z.string()).default([]),
  projects: z
    .array(
      z.object({
        id: z.string().optional(),
        name: nullableString,
        description: nullableString,
        technologies: z.array(z.string()).default([]),
        link: nullableString,
      })
    )
    .default([]),
});

const PARSE_PROMPT = `You are an expert ATS resume parser. Extract the full structured content from this resume document.

Requirements:
- personalInfo: Extract fullName, email, phone, location, website, and a professional summary.
- experience: Array of all work experiences with company, role, dates (e.g. "Jan 2021 – Mar 2023"), and an array of bullet-point responsibilities/achievements.
- education: Array of all education entries with school, degree, and dates.
- skills: Flat array of all skill strings.
- projects: Array of personal or professional projects with name, description, technologies array, and link.

Rules:
- NEVER return null for any string field — use empty string "" instead.
- If a field is not present in the document, return an empty string or empty array.
- Return ONLY raw valid JSON. No markdown, no backticks, no code fences, no explanation text.

JSON structure (follow exactly):
{
  "personalInfo": { "fullName": "", "email": "", "phone": "", "location": "", "website": "", "summary": "" },
  "experience": [{ "company": "", "role": "", "dates": "", "bullets": [] }],
  "education": [{ "school": "", "degree": "", "dates": "" }],
  "skills": [],
  "projects": [{ "name": "", "description": "", "technologies": [], "link": "" }]
}`;

/**
 * Call Gemini with inline base64 data — works for PDF, DOCX, and images.
 * Tries multiple models with fallback.
 */
async function callGeminiWithInlineData(
  base64Data: string,
  mimeType: string
): Promise<string> {
  let lastError: any;

  for (const model of MODELS_TO_TRY) {
    try {
      console.log(`[Resume Parse] Trying model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              { text: PARSE_PROMPT },
              { inlineData: { data: base64Data, mimeType } },
            ],
          },
        ],
      });

      const text = response.text;
      if (text && text.trim()) {
        console.log(`[Resume Parse] Success with model: ${model}`);
        return text;
      }
    } catch (err: any) {
      lastError = err;
      const status = err?.status ?? err?.code ?? "unknown";
      console.warn(`[Resume Parse] Model ${model} failed (${status}): ${err.message}`);

      // Don't retry on quota errors — fail fast
      if (err.message?.includes("429") || err.message?.includes("quota") || err.message?.includes("RESOURCE_EXHAUSTED")) {
        throw new Error("AI quota exceeded. Please wait a moment and try again.");
      }
    }
  }

  throw lastError ?? new Error("All Gemini models failed to parse the resume.");
}

/**
 * Call Gemini with plain text — used for .txt files
 */
async function callGeminiWithText(textContent: string): Promise<string> {
  let lastError: any;

  for (const model of MODELS_TO_TRY) {
    try {
      console.log(`[Resume Parse] Trying text model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [{ text: `${PARSE_PROMPT}\n\nResume text to parse:\n${textContent}` }],
          },
        ],
      });

      const text = response.text;
      if (text && text.trim()) {
        console.log(`[Resume Parse] Success with model: ${model}`);
        return text;
      }
    } catch (err: any) {
      lastError = err;
      const status = err?.status ?? err?.code ?? "unknown";
      console.warn(`[Resume Parse] Text model ${model} failed (${status}): ${err.message}`);

      if (err.message?.includes("429") || err.message?.includes("quota") || err.message?.includes("RESOURCE_EXHAUSTED")) {
        throw new Error("AI quota exceeded. Please wait a moment and try again.");
      }
    }
  }

  throw lastError ?? new Error("All Gemini models failed.");
}

/**
 * Safely parse and validate Gemini's JSON response
 */
function parseAndValidate(rawText: string) {
  let cleaned = rawText.trim();

  // Strip markdown code fences if present
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

  // Extract the outermost JSON object
  const startIdx = cleaned.indexOf("{");
  const endIdx = cleaned.lastIndexOf("}");
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("[Resume Parse] Raw Gemini output:", rawText.substring(0, 500));
    throw new Error("The AI returned invalid JSON. Please try again or use a .txt version of your resume.");
  }

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
    const fileName = (file.name ?? "").toLowerCase();
    // Normalise MIME: browsers sometimes send wrong MIME for DOCX
    let mimeType = file.type || "application/pdf";
    if (fileName.endsWith(".pdf")) mimeType = "application/pdf";
    if (fileName.endsWith(".docx")) mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (fileName.endsWith(".txt")) mimeType = "text/plain";

    console.log(`[Resume Parse] Processing file: ${fileName}, size: ${bytes.byteLength}, mime: ${mimeType}`);

    let rawText: string;

    if (fileName.endsWith(".txt")) {
      const textContent = new TextDecoder("utf-8").decode(bytes);
      rawText = await callGeminiWithText(textContent);
    } else {
      // Convert to base64 for inline data
      const uint8 = new Uint8Array(bytes);
      const binary = Array.from(uint8).map((b) => String.fromCharCode(b)).join("");
      const base64Data = btoa(binary);
      rawText = await callGeminiWithInlineData(base64Data, mimeType);
    }

    const validatedData = parseAndValidate(rawText);

    const finalData = {
      ...validatedData,
      experience: validatedData.experience.map((exp) => ({ ...exp, id: uuidv4() })),
      education: validatedData.education.map((edu) => ({ ...edu, id: uuidv4() })),
      projects: validatedData.projects.map((proj) => ({ ...proj, id: uuidv4() })),
    };

    return NextResponse.json({ success: true, data: finalData });
  } catch (error: any) {
    const msg: string = error?.message ?? "Unknown error";

    console.error("[Resume Parse] Error:", { message: msg, stack: error?.stack });

    let userMessage = "Failed to parse resume. Please try again.";

    if (msg.includes("API key") || msg.includes("unregistered callers") || msg.includes("API_KEY_INVALID")) {
      userMessage = "Gemini API key is invalid or missing. Please check your GEMINI_API_KEY environment variable.";
    } else if (msg.includes("quota") || msg.includes("rate limit") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429")) {
      userMessage = "AI quota exceeded. Please wait a moment and try again.";
    } else if (msg.includes("fetch failed") || msg.includes("ECONNREFUSED") || msg.includes("network")) {
      userMessage = "Network error reaching the AI service. Please check your connection.";
    } else if (msg.includes("invalid JSON") || msg.includes("JSON")) {
      userMessage = "Could not extract data from your file. Try saving as .txt and uploading again.";
    } else if (msg.includes("No file")) {
      userMessage = msg;
    } else if (msg.includes("All Gemini models failed") || msg.includes("NOT_FOUND")) {
      userMessage = "The AI service is temporarily unavailable. Please try again in a few minutes.";
    }

    return NextResponse.json(
      {
        error: userMessage,
        details: process.env.NODE_ENV === "development" ? msg : undefined,
      },
      { status: 500 }
    );
  }
}
