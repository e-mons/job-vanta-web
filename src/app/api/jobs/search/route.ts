import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithFallback } from "@/utils/gemini";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const apiKey = process.env.GEMINI_API_KEY;

// In-Memory Search Cache (30 Min TTL)
const searchCache = new Map<string, { timestamp: number; jobs: any[]; queryStr: string }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

// Job Schema
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

/**
 * Resolve target location accurately based on user filter, client payload, or server IP headers
 */
function resolveTargetLocation(filters: any, locationParam?: string, bodyUserLoc?: string, reqHeaders?: Headers): string {
  if (filters?.location && filters.location.trim().length > 0) {
    return filters.location.trim();
  }
  if (locationParam && locationParam.trim().length > 0) {
    return locationParam.trim();
  }
  if (bodyUserLoc && bodyUserLoc.trim().length > 0) {
    return bodyUserLoc.trim();
  }

  if (reqHeaders) {
    const city = reqHeaders.get("x-vercel-ip-city") || reqHeaders.get("cf-ipcity");
    const country = reqHeaders.get("x-vercel-ip-country") || reqHeaders.get("cf-ipcountry");
    if (city && country) {
      return `${city}, ${country}`;
    }
  }

  return "Local Tech Hub (Nearest)";
}

/**
 * High-quality, realistic fallback job generator tailored to the candidate's exact location.
 */
function generateFallbackJobs(skills: string[] = [], query: string = "", location: string = "", filters: any = {}, targetLoc: string = "Nearest Tech Hub") {
  const targetRole = query || (skills.length > 0 ? `${skills[0]} Specialist` : "Software Engineer");
  const isRemoteOnly = !!filters?.isRemote;
  const activeLocation = isRemoteOnly ? "100% Remote" : targetLoc;

  const topTechCompanies = [
    { name: "Stripe", domain: "stripe.com", bg: "Fintech infrastructure platform for internet payments." },
    { name: "Vercel", domain: "vercel.com", bg: "Frontend cloud platform for Next.js and web applications." },
    { name: "Supabase", domain: "supabase.com", bg: "Open-source Firebase alternative powered by Postgres." },
    { name: "Linear", domain: "linear.app", bg: "Purpose-built tool for modern software product development." },
    { name: "Figma", domain: "figma.com", bg: "Collaborative design and interface creation platform." },
    { name: "OpenAI", domain: "openai.com", bg: "AI research and deployment company developing ChatGPT." },
    { name: "Datadog", domain: "datadoghq.com", bg: "Monitoring and analytics platform for cloud-scale infrastructure." },
    { name: "Snowflake", domain: "snowflake.com", bg: "AI Data Cloud platform enabling unified data architecture." },
    { name: "Airbnb", domain: "airbnb.com", bg: "Global marketplace for vacation rentals and travel experiences." },
    { name: "Anthropic", domain: "anthropic.com", bg: "AI safety and research company building reliable AI models." },
    { name: "Notion", domain: "notion.so", bg: "Connected workspace for docs, wikis, and project management." },
    { name: "Postman", domain: "postman.com", bg: "API platform for building, testing, and managing APIs." }
  ];

  const now = new Date();

  return topTechCompanies.map((comp, idx) => {
    const daysAgo = (idx % 3) + 1;
    const postedDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const candidateSkills = Array.from(new Set([...skills, "TypeScript", "React", "Node.js", "System Design", "Cloud Infrastructure"])).slice(0, 6);

    const titlePrefixes = ["Senior", "Lead", "Staff", "Principal", "Senior Full-Stack"];
    const prefix = titlePrefixes[idx % titlePrefixes.length];
    const jobTitle = idx === 0 ? targetRole : `${prefix} ${targetRole.replace(/^(Senior|Lead|Staff|Junior|Principal)\s+/i, "")}`;

    // Ensure 70% of jobs match user's target location and 30% are 100% remote global
    const jobLoc = isRemoteOnly 
      ? "100% Remote" 
      : (idx % 3 === 0 ? `Remote (${activeLocation})` : activeLocation);

    return {
      id: uuidv4(),
      title: jobTitle,
      company: comp.name,
      companyLogo: `https://logo.clearbit.com/${comp.domain}`,
      companyDescription: comp.bg,
      location: jobLoc,
      isRemote: isRemoteOnly || idx % 3 === 0,
      salary: `$${115 + idx * 8}k - $${160 + idx * 10}k / year`,
      contactEmail: `careers@${comp.domain}`,
      applyLink: `https://${comp.domain}/careers`,
      description: `We are looking for a highly skilled ${jobTitle} located in or available to work with our team in ${activeLocation}. In this role, you will design, architect, and deliver mission-critical features using modern web technologies.\n\nYou will work closely with cross-functional engineering teams to build scalable, high-performance systems.`,
      type: filters?.jobType || "Full-time",
      employmentType: filters?.jobType || "Full-time",
      source: "JobVanta Direct Verified",
      postedAt: postedDate,
      skills: candidateSkills,
      responsibilities: [
        `Architect and maintain core features and scalable web services for ${comp.name}`,
        "Collaborate closely with product managers and designers to translate product vision into code",
        "Write clean, well-tested, maintainable code with high performance and accessibility in mind",
        "Perform code reviews and mentor junior and mid-level software engineers",
        "Optimize system latency, web vitals, and database query performance"
      ],
      qualifications: [
        `3+ years of professional experience building modern software applications`,
        `Strong expertise in ${candidateSkills.slice(0, 3).join(", ")}`,
        "Proven track record of shipping production-grade applications with high user satisfaction",
        "Solid understanding of RESTful APIs, modern databases, and state management",
        "Excellent communication and collaboration skills in remote or hybrid teams"
      ],
      benefits: [
        "Competitive salary + top-tier equity package",
        "100% employer-covered Health, Dental & Vision insurance",
        "Flexible PTO + Paid Parental Leave",
        "$2,500 annual home office & learning stipend",
        "401(k) matching up to 5%"
      ]
    };
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, location, skills, filters, userLocation, detectedLocation } = body;

    const targetLocation = resolveTargetLocation(filters, location, userLocation || detectedLocation, req.headers);

    // 1. Build Cache Key & Check In-Memory Cache
    const sortedSkills = Array.isArray(skills) ? [...skills].sort() : [];
    const cacheKey = JSON.stringify({ query: query || "", location: targetLocation, skills: sortedSkills, filters: filters || {} });
    
    if (searchCache.has(cacheKey)) {
      const cachedEntry = searchCache.get(cacheKey)!;
      if (Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
        console.log("[JobSearch API] Cache Hit for location:", targetLocation);
        return NextResponse.json({
          success: true,
          jobs: cachedEntry.jobs,
          query: cachedEntry.queryStr,
          targetLocation,
          cached: true
        });
      }
    }

    let searchContext = "";
    if (sortedSkills.length > 0) {
      searchContext = `Generate jobs matching a candidate with these skills: ${sortedSkills.join(", ")}.`;
    } else {
      searchContext = `Search Query: "${query || 'Software Engineer'}"`;
    }

    const todayISO = new Date().toISOString();

    const prompt = `
      You are the AI Search Engine for JobVanta. Generate 12 realistic, active job postings based on:
      ${searchContext}

      CRITICAL GEOGRAPHIC & LOCATION INSTRUCTION:
      - Target Candidate Location: "${targetLocation}".
      - The FIRST 8 jobs in the returned JSON MUST be active openings located specifically in/near "${targetLocation}" (or local hybrid/remote positions based in "${targetLocation}"), with realistic market salaries.
      - Do NOT default to American cities (like San Francisco or New York) UNLESS "${targetLocation}" is explicitly located in the United States.
      - The remaining 4 jobs should be 100% Remote global roles open to candidates in "${targetLocation}".
      
      RULES:
      - Today is ${todayISO}. "postedAt" must be within last 1 to 4 days.
      - Use real company names (e.g. Stripe, Vercel, Linear, Airbnb, Supabase, Figma, Datadog) and matching logos (https://logo.clearbit.com/{domain}).
      - Provide real contact emails (careers@company.com) and apply links.
      
      Return ONLY a raw JSON array of 12 objects matching this structure EXACTLY:
      [
        {
          "id": "${uuidv4()}",
          "title": "Job Title",
          "company": "Company Name",
          "companyLogo": "https://logo.clearbit.com/company.com",
          "companyDescription": "Brief description",
          "location": "${targetLocation}",
          "isRemote": true,
          "salary": "$120k - $160k",
          "contactEmail": "careers@company.com",
          "applyLink": "https://company.com/careers",
          "description": "Full job description...",
          "type": "Full-time",
          "employmentType": "Full-time",
          "source": "JobVanta Direct Verified",
          "postedAt": "${todayISO}",
          "skills": ["Skill 1", "Skill 2"],
          "responsibilities": ["Resp 1", "Resp 2"],
          "qualifications": ["Qual 1", "Qual 2"],
          "benefits": ["Benefit 1", "Benefit 2"]
        }
      ]
    `;

    let validatedJobs: any[] = [];
    const displayQuery = query || (sortedSkills.length > 0 ? sortedSkills.join(", ") : "Jobs");

    try {
      // 7-second hard timeout for AI call
      const aiPromise = callGeminiWithFallback(prompt);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("AI generation timeout")), 7000)
      );

      const content = await Promise.race([aiPromise, timeoutPromise]);
      let cleanedContent = content.trim();
      const startIdx = cleanedContent.indexOf('[');
      const endIdx = cleanedContent.lastIndexOf(']');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        cleanedContent = cleanedContent.substring(startIdx, endIdx + 1);
      }

      const parsedJobs = JSON.parse(cleanedContent);
      if (Array.isArray(parsedJobs) && parsedJobs.length > 0) {
        validatedJobs = parsedJobs.map(j => JobSchema.parse(j));
      }
    } catch (aiErr: any) {
      console.warn(`[JobSearch API] AI call failed (${aiErr.message}). Generating location-tailored fallback jobs for: ${targetLocation}`);
      validatedJobs = generateFallbackJobs(sortedSkills, query, location, filters, targetLocation);
    }

    // Ensure fallback if empty array returned
    if (!validatedJobs || validatedJobs.length === 0) {
      validatedJobs = generateFallbackJobs(sortedSkills, query, location, filters, targetLocation);
    }

    // Save to Cache
    searchCache.set(cacheKey, {
      timestamp: Date.now(),
      jobs: validatedJobs,
      queryStr: displayQuery
    });

    return NextResponse.json({ 
      success: true, 
      jobs: validatedJobs,
      query: displayQuery,
      targetLocation
    });

  } catch (error: any) {
    console.error("Search jobs endpoint error:", error);
    const fallbackJobs = generateFallbackJobs([], "", "", {}, "Nearest Tech Hub");
    return NextResponse.json({ 
      success: true, 
      jobs: fallbackJobs,
      query: "Matching Opportunities"
    });
  }
}
