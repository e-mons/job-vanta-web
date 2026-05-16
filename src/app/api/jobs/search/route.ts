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
    const { query, location, skills } = body;

    let searchContext = "";
    if (skills && Array.isArray(skills) && skills.length > 0) {
      searchContext = `Generate jobs that match a candidate with these skills: ${skills.join(", ")}`;
    } else {
      searchContext = `Search Query: "${query || 'Software Engineer'}"\nLocation: "${location || 'Remote'}"`;
    }

    const prompt = `
      You are the AI Search Engine for JobVanta. Generate 6 realistic job postings based on the following search criteria.
      
      ${searchContext}
      
      Return ONLY a raw JSON array of objects. Do not wrap it in markdown code blocks.
      Each object MUST match this JSON structure EXACTLY:
      {
        "id": "uuid-string-here",
        "title": "Job Title",
        "company": "Company Name",
        "companyLogo": "https://logo.clearbit.com/apple.com", // use clearbit logos based on company domain if possible, or leave null
        "companyDescription": "Brief description of the company",
        "location": "City, State or Remote",
        "isRemote": true/false,
        "salary": "$100k - $150k",
        "applyLink": "https://example.com/apply",
        "description": "Full job description (2-3 paragraphs)...",
        "type": "Full-time",
        "employmentType": "Full-time",
        "source": "JobVanta",
        "postedAt": "2024-05-14T10:00:00Z", // Use recent ISO dates
        "skills": ["Skill 1", "Skill 2"],
        "responsibilities": ["Responsibility 1", "Responsibility 2"],
        "qualifications": ["Qualification 1", "Qualification 2"],
        "benefits": ["Benefit 1", "Benefit 2"]
      }
    `;

    const content = await callGeminiWithFallback(prompt);

    // Clean any accidental markdown wrapping
    let cleanedContent = content;
    if (content.includes("\`\`\`")) {
      cleanedContent = content.replace(/\`\`\`json\n?|\n?\`\`\`/g, '').trim();
    }

    let parsedJobs;
    try {
      parsedJobs = JSON.parse(cleanedContent);
    } catch (e) {
      console.error("Failed to parse Gemini jobs response:", cleanedContent);
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
