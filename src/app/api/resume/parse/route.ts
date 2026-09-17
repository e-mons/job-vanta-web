import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { callGeminiWithFallback, callGeminiWithInlineDataFallback } from "@/utils/gemini";
import { createClient } from "@/utils/supabase/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const nullableString = z.preprocess(
  (val) => (val === null || val === undefined ? "" : String(val).trim()),
  z.string().default("")
);

const stringArray = z.preprocess((val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((v) => String(v).trim()).filter(Boolean);
  if (typeof val === "string") {
    return val
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}, z.array(z.string()).default([]));

const ExtractedResumeSchema = z.object({
  personalInfo: z
    .object({
      fullName: nullableString,
      email: nullableString,
      phone: nullableString,
      location: nullableString,
      website: nullableString,
      summary: nullableString,
      photo: nullableString.optional(),
    })
    .default({
      fullName: "",
      email: "",
      phone: "",
      location: "",
      website: "",
      summary: "",
      photo: "",
    }),
  experience: z
    .array(
      z.object({
        id: z.string().optional(),
        company: nullableString,
        role: nullableString,
        dates: nullableString,
        bullets: stringArray,
      })
    )
    .default([]),
  education: z
    .array(
      z.object({
        id: z.string().optional(),
        school: nullableString,
        degree: nullableString,
        year: nullableString.optional(),
        dates: nullableString.optional(),
      })
    )
    .default([]),
  skills: stringArray,
  projects: z
    .array(
      z.object({
        id: z.string().optional(),
        name: nullableString,
        description: nullableString,
        technologies: stringArray,
        link: nullableString.optional(),
      })
    )
    .default([]),
  certifications: z
    .array(
      z.object({
        id: z.string().optional(),
        name: nullableString,
        issuer: nullableString,
        date: nullableString.optional(),
        link: nullableString.optional(),
      })
    )
    .default([]),
  languages: z
    .array(
      z.object({
        id: z.string().optional(),
        name: nullableString,
        fluency: nullableString.default("Fluent"),
      })
    )
    .default([]),
  interests: stringArray,
  references: z
    .array(
      z.object({
        id: z.string().optional(),
        name: nullableString,
        position: nullableString,
        company: nullableString,
        contactInfo: nullableString,
      })
    )
    .default([]),
});

const PARSE_PROMPT = `You are an expert ATS resume parser. Extract the full structured content from this resume document accurately and thoroughly.

Requirements:
- personalInfo: Extract fullName, email, phone, location (city, state/country), website (portfolio, LinkedIn, GitHub, or personal site URL), and a professional summary.
- experience: Array of all work experiences with company name, job title (role), duration/dates (e.g. "Jan 2021 – Mar 2023" or "2019 – Present"), and an array of bullet-point responsibilities/achievements.
- education: Array of all education entries with school name, degree/major, and graduation year or dates (e.g. "2018 – 2022" or "2022").
- skills: Flat array of all technical, software, domain, and core professional skills.
- projects: Array of personal, academic, or professional projects with project name, concise description, technologies used (array of strings), and link/URL if available.
- certifications: Array of certifications or licenses with name, issuing organization/issuer, date/year, and credential verification link if present.
- languages: Array of spoken/written languages with name (e.g. "English", "Spanish") and fluency level (e.g. "Native", "Fluent", "Conversational").
- interests: Array of personal interests or activities if present.
- references: Array of professional references with name, position, company, contact info (or empty array if none listed).

Rules:
- NEVER return null for any string field — use empty string "" instead.
- If a section or field is not present in the document, return an empty string or empty array.
- Return ONLY raw valid JSON. No markdown, no backticks, no code fences, no explanation text.

JSON structure (follow exactly):
{
  "personalInfo": {
    "fullName": "",
    "email": "",
    "phone": "",
    "location": "",
    "website": "",
    "summary": ""
  },
  "experience": [
    {
      "company": "",
      "role": "",
      "dates": "",
      "bullets": [""]
    }
  ],
  "education": [
    {
      "school": "",
      "degree": "",
      "year": ""
    }
  ],
  "skills": [""],
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": [""],
      "link": ""
    }
  ],
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "date": "",
      "link": ""
    }
  ],
  "languages": [
    {
      "name": "",
      "fluency": ""
    }
  ],
  "interests": [""],
  "references": [
    {
      "name": "",
      "position": "",
      "company": "",
      "contactInfo": ""
    }
  ]
}`;

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
    throw new Error("The AI returned invalid JSON. Please try again or use a text version of your resume.");
  }

  return ExtractedResumeSchema.parse(parsed);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const paramFileName = (formData.get("fileName") as string | null) || "";
    const paramFileType = (formData.get("fileType") as string | null) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (buffer.length === 0) {
      return NextResponse.json({ error: "The selected file is empty." }, { status: 400 });
    }

    const originalName = paramFileName || file.name || "resume.pdf";
    const fileName = originalName.toLowerCase();

    // Magic bytes detection
    const isPdf = buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46; // %PDF
    const isZipOrDocx = (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04) || fileName.endsWith(".docx") || fileName.endsWith(".doc"); // PK.. or .docx/.doc
    const isTxt = fileName.endsWith(".txt") || (!isPdf && !isZipOrDocx && (paramFileType === "text/plain" || file.type === "text/plain"));

    let mimeType = isPdf
      ? "application/pdf"
      : isZipOrDocx
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : isTxt
      ? "text/plain"
      : file.type || "application/pdf";

    console.log(`[Resume Parse] Processing file: ${fileName}, size: ${bytes.byteLength}, detected: ${isPdf ? "PDF" : isZipOrDocx ? "DOCX" : isTxt ? "TXT" : "Other"}, mime: ${mimeType}`);

    // Optional upload to Supabase storage bucket `resumes` if user is logged in
    let storagePath: string | null = null;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${user.id}/${Date.now()}_${sanitizedName}`;
        const { error: uploadErr } = await supabase.storage
          .from("resumes")
          .upload(path, buffer, {
            contentType: mimeType,
            upsert: true,
          });
        if (!uploadErr) {
          storagePath = path;
          console.log(`[Resume Parse] Archived file to storage at: ${storagePath}`);
        } else {
          console.warn("[Resume Parse] Storage upload note:", uploadErr.message);
        }
      }
    } catch (e: any) {
      console.warn("[Resume Parse] Storage archive check skipped:", e.message);
    }

    let rawText: string;

    if (isZipOrDocx) {
      try {
        const mammothModule = await import("mammoth");
        const mammoth = (mammothModule as any).default || mammothModule;
        const result = await mammoth.extractRawText({ buffer });
        const docxText = (result?.value || "").trim();

        if (!docxText) {
          throw new Error("Could not extract readable text from the Word document. Please ensure it is not password protected.");
        }

        console.log(`[Resume Parse] Successfully extracted ${docxText.length} characters from DOCX.`);
        rawText = await callGeminiWithFallback(
          `${PARSE_PROMPT}\n\nResume text to parse:\n${docxText}`,
          { timeoutMs: 50000 }
        );
      } catch (docxErr: any) {
        console.error("[Resume Parse] DOCX extraction error:", docxErr.message);
        throw new Error(docxErr.message || "Failed to extract text from Word document. Please try converting to PDF or plain text.");
      }
    } else if (isTxt) {
      const textContent = new TextDecoder("utf-8").decode(bytes);
      rawText = await callGeminiWithFallback(
        `${PARSE_PROMPT}\n\nResume text to parse:\n${textContent}`,
        { timeoutMs: 45000 }
      );
    } else {
      // PDF or fallback binary document
      try {
        const base64Data = buffer.toString("base64");
        rawText = await callGeminiWithInlineDataFallback(
          base64Data,
          "application/pdf",
          PARSE_PROMPT,
          { timeoutMs: 50000 }
        );
      } catch (inlineErr: any) {
        console.warn("[Resume Parse] Gemini multimodal inline failed, attempting text fallback with pdf-parse:", inlineErr?.message);
        try {
          const pdfParseModule: any = await import("pdf-parse");
          let pdfText = "";
          if (pdfParseModule.PDFParse) {
            const parser = new pdfParseModule.PDFParse({ data: buffer });
            const result = await parser.getText();
            pdfText = (result?.text || "").trim();
          } else if (typeof pdfParseModule.default === "function") {
            const result = await pdfParseModule.default(buffer);
            pdfText = (result?.text || "").trim();
          } else if (typeof pdfParseModule === "function") {
            const result = await pdfParseModule(buffer);
            pdfText = (result?.text || "").trim();
          }

          if (!pdfText || pdfText.length < 20) {
            throw inlineErr;
          }

          console.log(`[Resume Parse] Fallback pdf-parse extracted ${pdfText.length} characters.`);
          rawText = await callGeminiWithFallback(
            `${PARSE_PROMPT}\n\nResume text to parse:\n${pdfText}`,
            { timeoutMs: 50000 }
          );
        } catch {
          throw inlineErr;
        }
      }
    }

    const validatedData = parseAndValidate(rawText);

    // Build the complete ResumeData object with guaranteed IDs and field normalization
    const finalData = {
      personalInfo: {
        fullName: validatedData.personalInfo.fullName || "",
        email: validatedData.personalInfo.email || "",
        phone: validatedData.personalInfo.phone || "",
        location: validatedData.personalInfo.location || "",
        website: validatedData.personalInfo.website || "",
        summary: validatedData.personalInfo.summary || "",
        photo: validatedData.personalInfo.photo || "",
      },
      experience: validatedData.experience.map((exp) => ({
        id: exp.id || uuidv4(),
        company: exp.company || "",
        role: exp.role || "",
        dates: exp.dates || "",
        bullets: Array.isArray(exp.bullets) ? exp.bullets : [],
      })),
      education: validatedData.education.map((edu) => ({
        id: edu.id || uuidv4(),
        school: edu.school || "",
        degree: edu.degree || "",
        year: edu.year || edu.dates || "",
      })),
      skills: Array.isArray(validatedData.skills) ? validatedData.skills : [],
      projects: validatedData.projects.map((proj) => ({
        id: proj.id || uuidv4(),
        name: proj.name || "",
        description: proj.description || "",
        technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
        link: proj.link || "",
      })),
      certifications: validatedData.certifications.map((cert) => ({
        id: cert.id || uuidv4(),
        name: cert.name || "",
        issuer: cert.issuer || "",
        date: cert.date || "",
        link: cert.link || "",
      })),
      languages: validatedData.languages.map((lang) => ({
        id: lang.id || uuidv4(),
        name: lang.name || "",
        fluency: lang.fluency || "Fluent",
      })),
      interests: Array.isArray(validatedData.interests) ? validatedData.interests : [],
      references: validatedData.references.map((ref) => ({
        id: ref.id || uuidv4(),
        name: ref.name || "",
        position: ref.position || "",
        company: ref.company || "",
        contactInfo: ref.contactInfo || "",
      })),
    };

    return NextResponse.json({
      success: true,
      data: finalData,
      storagePath,
    });
  } catch (error: any) {
    const msg: string = error?.message ?? "Unknown error";
    console.error("[Resume Parse] Error:", { message: msg, stack: error?.stack });

    let userMessage = "Failed to parse resume. Please try again.";

    if (msg.includes("API key") || msg.includes("unregistered callers") || msg.includes("API_KEY_INVALID")) {
      userMessage = "Gemini API key is invalid or missing. Please check your GEMINI_API_KEY configuration.";
    } else if (msg.includes("quota") || msg.includes("rate limit") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429")) {
      userMessage = "AI quota temporarily exceeded. Please wait a moment and try again.";
    } else if (msg.includes("fetch failed") || msg.includes("ECONNREFUSED") || msg.includes("network")) {
      userMessage = "Network error reaching the AI service. Please check your connection.";
    } else if (msg.includes("invalid JSON") || msg.includes("JSON")) {
      userMessage = "Could not extract data from your file. Try saving as .txt and uploading again.";
    } else if (msg.includes("No file")) {
      userMessage = msg;
    } else if (msg.includes("All Gemini models failed") || msg.includes("NOT_FOUND")) {
      userMessage = "The AI service is temporarily busy. Please try again in a few seconds.";
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
