import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { callGeminiWithFallback } from "@/utils/gemini";
import { v4 as uuidv4 } from "uuid";

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured. Please add it to your environment variables." },
        { status: 500 }
      );
    }

    const { prompt: userPrompt } = await req.json();

    if (!userPrompt || !userPrompt.trim()) {
      return NextResponse.json({ error: "Please describe the resume you wish to generate." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in to generate resumes." }, { status: 401 });
    }

    const systemPrompt = `You are an elite, executive resume writer and career strategist.
A candidate needs a complete, compelling, ATS-optimized resume generated based on the following input:

Candidate Request: "${userPrompt}"

CRITICAL INSTRUCTIONS:
- Generate an exhaustive, professional, and realistic resume covering EVERY section.
- If the user did not specify full details, craft realistic industry-standard details (e.g., reputable companies, degrees, metrics, bullet points, skills).
- DO NOT leave any array empty. Populate at least:
  - 2 Work Experience entries (each with 3-4 achievement-driven bullets containing action verbs and metrics)
  - 1 Education entry with school, degree, and graduation year
  - 6-10 Relevant Skills
  - 1-2 Key Projects with project name, clear description, technologies list, and demo/repo link
  - 1-2 Professional Certifications with certification name, issuing organization, year/date, and credential link
  - 1-2 Languages with fluency level
  - 2-3 Interests / Extracurricular activities
- Return ONLY valid raw JSON matching the exact schema below. No markdown backticks, no code blocks, no explanation text.

{
  "personalInfo": {
    "fullName": "Candidate Name",
    "email": "candidate@example.com",
    "phone": "+1 (555) 019-2834",
    "location": "City, State",
    "website": "https://linkedin.com/in/candidatename",
    "summary": "Compelling 3-4 sentence professional summary highlighting years of experience, core expertise, and measurable achievements.",
    "photo": ""
  },
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "dates": "Jan 2021 — Present",
      "bullets": [
        "Led cross-functional initiatives resulting in 35% improvement in operational efficiency.",
        "Architected scalable solutions adopted by 10,000+ active enterprise users.",
        "Mentored junior team members and spearheaded standard development best practices."
      ]
    }
  ],
  "education": [
    {
      "school": "University Name",
      "degree": "Bachelor of Science in Field",
      "year": "2017 — 2021"
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5", "Skill 6"],
  "projects": [
    {
      "name": "Project Name",
      "description": "High-impact project solving a real problem with modern technologies.",
      "technologies": ["Tool A", "Tool B", "Tool C"],
      "link": "https://github.com/example/project"
    }
  ],
  "certifications": [
    {
      "name": "Certified Professional Credential",
      "issuer": "Issuing Body / Cloud Provider",
      "date": "2023",
      "link": "https://credential.net/example"
    }
  ],
  "languages": [
    {
      "name": "English",
      "fluency": "Native / Bilingual"
    }
  ],
  "interests": ["Tech Mentorship", "Open Source Contributing"],
  "references": [
    {
      "name": "Professional Reference",
      "position": "Director of Engineering",
      "company": "Tech Corp",
      "contactInfo": "Available upon request"
    }
  ]
}`;

    const content = await callGeminiWithFallback(systemPrompt, { timeoutMs: 45000 });

    let cleanedContent = content.trim();
    cleanedContent = cleanedContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

    const startIdx = cleanedContent.indexOf('{');
    const endIdx = cleanedContent.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleanedContent = cleanedContent.substring(startIdx, endIdx + 1);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch (e) {
      console.error("[Resume Generate] Failed to parse AI generation response:", content);
      throw new Error("Invalid response format from AI. Please try again.");
    }

    // Attach UUIDs to all generated sub-items
    const generatedData = {
      personalInfo: {
        fullName: parsed.personalInfo?.fullName || "Candidate",
        email: parsed.personalInfo?.email || user.email || "",
        phone: parsed.personalInfo?.phone || "",
        location: parsed.personalInfo?.location || "",
        website: parsed.personalInfo?.website || "",
        summary: parsed.personalInfo?.summary || "",
        photo: parsed.personalInfo?.photo || "",
      },
      experience: (parsed.experience || []).map((exp: any) => ({
        id: uuidv4(),
        company: exp.company || "",
        role: exp.role || "",
        dates: exp.dates || "",
        bullets: Array.isArray(exp.bullets) ? exp.bullets : [],
      })),
      education: (parsed.education || []).map((edu: any) => ({
        id: uuidv4(),
        school: edu.school || "",
        degree: edu.degree || "",
        year: edu.year || edu.dates || "",
      })),
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      projects: (parsed.projects || []).map((proj: any) => ({
        id: uuidv4(),
        name: proj.name || "",
        description: proj.description || "",
        technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
        link: proj.link || "",
      })),
      certifications: (parsed.certifications || []).map((cert: any) => ({
        id: uuidv4(),
        name: cert.name || "",
        issuer: cert.issuer || "",
        date: cert.date || "",
        link: cert.link || "",
      })),
      languages: (parsed.languages || []).map((lang: any) => ({
        id: uuidv4(),
        name: lang.name || "",
        fluency: lang.fluency || "Fluent",
      })),
      interests: Array.isArray(parsed.interests) ? parsed.interests : [],
      references: (parsed.references || []).map((ref: any) => ({
        id: uuidv4(),
        name: ref.name || "",
        position: ref.position || "",
        company: ref.company || "",
        contactInfo: ref.contactInfo || "",
      })),
    };

    return NextResponse.json({ data: generatedData });
  } catch (error: any) {
    console.error("[Resume Generate] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate resume. Please try again." },
      { status: 500 }
    );
  }
}
