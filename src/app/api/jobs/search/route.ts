import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithFallback } from "@/utils/gemini";
import { z } from "zod";

const apiKey = process.env.GEMINI_API_KEY;

// Using a slightly more relaxed schema for Gemini parsing
const JobSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  companyLogo: z.string().nullable().optional(),
  companyDescription: z.string().nullable().optional(),
  location: z.string(),
  isRemote: z.boolean(),
  salary: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  applyLink: z.string(),
  description: z.string(),
  type: z.string(),
  employmentType: z.string().nullable().optional(),
  source: z.string(),
  postedAt: z.string(),
  skills: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).optional(),
  qualifications: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { query, location, skills, filters } = body;

    let searchContext = "";
    if (skills && Array.isArray(skills) && skills.length > 0) {
      searchContext = `Generate jobs that match a candidate with these skills: ${skills.join(", ")}.`;
      if (filters) {
        searchContext += `\nApply the following constraints to the jobs:\n`;
        if (filters.location) searchContext += `- Location near: ${filters.location} (or remote if preferred)\n`;
        if (filters.radius) searchContext += `- Distance: within ${filters.radius} miles\n`;
        if (filters.isRemote) searchContext += `- Must be 100% Remote\n`;
        if (filters.jobType) searchContext += `- Employment Type: ${filters.jobType}\n`;
        if (filters.experienceLevel) searchContext += `- Experience Level: ${filters.experienceLevel}\n`;
      }
    } else {
      searchContext = `Search Query: "${query || 'Software Engineer'}"\nLocation: "${location || 'Remote'}"`;
    }

    const todayISO = new Date().toISOString();

    const prompt = `
      You are the AI Search Engine for JobVanta. Generate 15 realistic, diverse job postings based on the following search criteria.
      
      ${searchContext}
      
      IMPORTANT RULES:
      - Today's date is ${todayISO}. ALL "postedAt" dates MUST be within the last 7 days from today. Generate varied dates within that range (some today, some 1-3 days ago, some 4-7 days ago).
      - Generate jobs from well-known, real companies as well as realistic mid-size and startup companies. Use a good mix.
      - For "contactEmail": Generate a realistic HR/recruiting email address for each company (e.g., careers@company.com, recruiting@company.com, talent@company.com, jobs@company.com, hr@company.com, hiring@company.com). Use the company's actual domain if it's a well-known company. Always try your absolute best to provide a contactEmail for every job. Only set it to null as a very last resort.
      - For "applyLink": Use the company's real careers page URL if it's a well-known company, otherwise generate a realistic one.
      - Make descriptions detailed (2-3 paragraphs), responsibilities specific (5-8 items), qualifications realistic (4-6 items), and benefits appealing (4-6 items).
      - Vary the salary ranges realistically based on role seniority and location.
      - Use real company logos via clearbit: https://logo.clearbit.com/{domain}
      
      Return ONLY a raw JSON array of objects. Do not wrap it in markdown code blocks.
      Each object MUST match this JSON structure EXACTLY:
      {
        "id": "uuid-string-here",
        "title": "Job Title",
        "company": "Company Name",
        "companyLogo": "https://logo.clearbit.com/company.com",
        "companyDescription": "Brief description of the company",
        "location": "City, State or Remote",
        "isRemote": true/false,
        "salary": "$100k - $150k",
        "contactEmail": "careers@company.com",
        "applyLink": "https://company.com/careers",
        "description": "Full job description (2-3 paragraphs)...",
        "type": "Full-time",
        "employmentType": "Full-time",
        "source": "JobVanta",
        "postedAt": "ISO date within last 7 days",
        "skills": ["Skill 1", "Skill 2"],
        "responsibilities": ["Responsibility 1", "Responsibility 2"],
        "qualifications": ["Qualification 1", "Qualification 2"],
        "benefits": ["Benefit 1", "Benefit 2"]
      }
    `;

    const content = await callGeminiWithFallback(prompt);

    // Clean any accidental markdown wrapping
    let cleanedContent = content.trim();
    const startIdx = cleanedContent.indexOf('[');
    const endIdx = cleanedContent.lastIndexOf(']');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleanedContent = cleanedContent.substring(startIdx, endIdx + 1);
    }

    let parsedJobs;
    try {
      parsedJobs = JSON.parse(cleanedContent);
    } catch (e) {
      console.error("Failed to parse Gemini jobs response:", content);
      throw new Error("Invalid response format from AI");
    }

    // Validate the array
    if (!Array.isArray(parsedJobs)) {
      throw new Error("Expected an array of jobs");
    }

    const validatedJobs = parsedJobs.map(job => JobSchema.parse(job));

    return NextResponse.json({ 
      success: true, 
      jobs: validatedJobs,
      query: query || (skills ? skills.join(", ") : "Jobs")
    });

  } catch (error: any) {
    console.error("Search jobs error:", error);
    return NextResponse.json({ error: error.message || "Failed to search jobs" }, { status: 500 });
  }
}
