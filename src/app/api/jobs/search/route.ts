import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

export const maxDuration = 60;

const apiKey = process.env.GEMINI_API_KEY?.trim() || "";
const ai = new GoogleGenAI({ apiKey });

// In-Memory Search Cache (1 Min TTL)
const searchCache = new Map<string, { timestamp: number; jobs: any[]; queryStr: string }>();
const CACHE_TTL_MS = 60 * 1000;

// Verified active models (tested 2026-07-29)
const MODELS = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];

const rapidApiKey = process.env.RAPIDAPI_KEY?.trim() || "";
const openWebNinjaKey = process.env.OPENWEBNINJA_KEY?.trim() || "";

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
 * Call Gemini with model fallback — inline, no shared utility dependency
 */
async function callGemini(prompt: string): Promise<string> {
  let lastError: any;
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      const text = response.text;
      if (text && text.trim()) return text;
    } catch (err: any) {
      lastError = err;
      const msg: string = err?.message ?? "";
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        throw new Error("AI quota exceeded. Please try again in a moment.");
      }
      console.warn(`[JobSearch] Model ${model} failed: ${msg}`);
    }
  }
  throw lastError ?? new Error("All AI models failed.");
}

/**
 * Fetch real jobs using JSearch API (RapidAPI)
 */
async function fetchRealJobs(query: string, location: string, isRemote: boolean = false): Promise<any[]> {
  if (!openWebNinjaKey && !rapidApiKey) return [];
  
  const searchStr = `${query} in ${location} ${isRemote ? 'remote' : ''}`.trim();
  
  const isDirect = !!openWebNinjaKey;
  const url = isDirect 
    ? `https://api.openwebninja.com/jsearch/search-v2?query=${encodeURIComponent(searchStr)}&page=1&num_pages=1`
    : `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(searchStr)}&page=1&num_pages=1`;
  
  const headers: any = isDirect 
    ? { 'x-api-key': openWebNinjaKey }
    : {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      };
  
  try {
    const res = await fetch(url, { headers });
    
    if (!res.ok) throw new Error(`JSearch API error: ${res.status}`);
    
    const json = await res.json();
    const jobsArray = Array.isArray(json.data) ? json.data : (json.data?.jobs || []);
    if (!Array.isArray(jobsArray) || jobsArray.length === 0) return [];
    
    return jobsArray.map((job: any) => {
      return {
        id: job.job_id || uuidv4(),
        title: job.job_title || "Unknown Title",
        company: job.employer_name || "Unknown Company",
        companyLogo: job.employer_logo || `https://icon.horse/icon/${job.employer_website?.replace(new RegExp('^https?://'), '') || 'company.com'}`,
        companyDescription: null,
        location: `${job.job_city || ''}, ${job.job_state || ''}, ${job.job_country || ''}`.replace(/^, | ,|, $/g, '').trim() || location,
        isRemote: job.job_is_remote || isRemote,
        salary: job.job_min_salary ? `$${job.job_min_salary}k - $${job.job_max_salary}k` : null,
        contactEmail: null,
        applyLink: job.apply_options?.find((o: any) => o.is_direct)?.apply_link || job.job_apply_link || job.job_google_link || "https://google.com",
        description: job.job_description || "No description provided.",
        type: job.job_employment_type || "Full-time",
        employmentType: job.job_employment_type || "Full-time",
        source: "JSearch Verified",
        postedAt: job.job_posted_at_datetime_utc || new Date().toISOString(),
        skills: [], // We can't perfectly extract these yet without LLM
        responsibilities: [],
        qualifications: [],
        benefits: []
      };
    });
  } catch (err: any) {
    console.error("[JobSearch] RapidAPI fetch failed:", err.message);
    return [];
  }
}

/**
 * Fetch real remote tech jobs from Remotive API as a reliable fallback
 */
async function fetchRemotiveJobs(query: string): Promise<any[]> {
  try {
    const searchStr = query.split(' ')[0] || "software"; // Remotive search is best with single keyword
    const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(searchStr)}&limit=15`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Remotive API error: ${res.status}`);
    const json = await res.json();
    
    if (!json.jobs || !Array.isArray(json.jobs)) return [];
    
    return json.jobs.map((job: any) => ({
      id: `remotive-${job.id || uuidv4()}`,
      title: job.title || "Unknown Title",
      company: job.company_name || "Unknown Company",
      companyLogo: job.company_logo || `https://icon.horse/icon/${job.company_name?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'company'}.com`,
      companyDescription: null,
      location: job.candidate_required_location || "Remote Worldwide",
      isRemote: true,
      salary: job.salary || null,
      contactEmail: null,
      applyLink: job.url || "https://remotive.com",
      description: job.description || "No description provided.",
      type: job.job_type ? job.job_type.replace('_', '-') : "Full-time",
      employmentType: job.job_type ? job.job_type.replace('_', '-') : "Full-time",
      source: "Remotive Verified",
      postedAt: job.publication_date || new Date().toISOString(),
      skills: job.tags || [],
      responsibilities: [],
      qualifications: [],
      benefits: []
    }));
  } catch (err: any) {
    console.error("[JobSearch] Remotive fetch failed:", err.message);
    return [];
  }
}

/**
 * Resolve target location from filters, body params, or Vercel/CF geo headers
 */
function resolveTargetLocation(
  filters: any,
  locationParam?: string,
  bodyUserLoc?: string,
  reqHeaders?: Headers
): string {
  if (filters?.location?.trim()) return filters.location.trim();
  if (locationParam?.trim()) return locationParam.trim();
  if (bodyUserLoc?.trim()) return bodyUserLoc.trim();

  if (reqHeaders) {
    const city = reqHeaders.get("x-vercel-ip-city") || reqHeaders.get("cf-ipcity");
    const country = reqHeaders.get("x-vercel-ip-country") || reqHeaders.get("cf-ipcountry");
    if (city && country) return `${city}, ${country}`;
  }

  return "Local Tech Hub (Nearest)";
}

/**
 * Location-aware fallback jobs — used if AI call fails or times out
 */
function generateFallbackJobs(
  skills: string[] = [],
  query: string = "",
  location: string = "",
  filters: any = {},
  targetLoc: string = "Nearest Tech Hub"
) {
  const targetRole = query || (skills.length > 0 ? `${skills[0]} Specialist` : "Software Engineer");
  const isRemoteOnly = !!filters?.isRemote;
  const activeLocation = isRemoteOnly ? "100% Remote" : targetLoc;

  const baseCompanies = [
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
    { name: "Postman", domain: "postman.com", bg: "API platform for building, testing, and managing APIs." },
  ];

  const topTechCompanies = [...baseCompanies].sort(() => Math.random() - 0.5);

  const now = new Date();

  return topTechCompanies.map((comp, idx) => {
    const daysAgo = (idx % 3) + 1;
    const postedDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const candidateSkills = Array.from(
      new Set([...skills, "TypeScript", "React", "Node.js", "System Design", "Cloud Infrastructure"])
    ).slice(0, 6);

    const titlePrefixes = ["Senior", "Lead", "Staff", "Principal", "Senior Full-Stack"];
    const prefix = titlePrefixes[idx % titlePrefixes.length];
    const jobTitle =
      idx === 0
        ? targetRole
        : `${prefix} ${targetRole.replace(/^(Senior|Lead|Staff|Junior|Principal)\s+/i, "")}`;

    const jobLoc = isRemoteOnly
      ? "100% Remote"
      : idx % 3 === 0
      ? `Remote (${activeLocation})`
      : activeLocation;

    return {
      id: uuidv4(),
      title: jobTitle,
      company: comp.name,
      companyLogo: `https://icon.horse/icon/${comp.domain}`,
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
        "Optimize system latency, web vitals, and database query performance",
      ],
      qualifications: [
        "3+ years of professional experience building modern software applications",
        `Strong expertise in ${candidateSkills.slice(0, 3).join(", ")}`,
        "Proven track record of shipping production-grade applications with high user satisfaction",
        "Solid understanding of RESTful APIs, modern databases, and state management",
        "Excellent communication and collaboration skills in remote or hybrid teams",
      ],
      benefits: [
        "Competitive salary + top-tier equity package",
        "100% employer-covered Health, Dental & Vision insurance",
        "Flexible PTO + Paid Parental Leave",
        "$2,500 annual home office & learning stipend",
        "401(k) matching up to 5%",
      ],
    };
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, location, skills, filters, userLocation, detectedLocation } = body;

    const targetLocation = resolveTargetLocation(
      filters,
      location,
      userLocation || detectedLocation,
      req.headers
    );

    // 1. Cache check
    const sortedSkills = Array.isArray(skills) ? [...skills].sort() : [];
    const cacheKey = JSON.stringify({
      query: query || "",
      location: targetLocation,
      skills: sortedSkills,
      filters: filters || {},
      realJobsOnly: true
    });

    if (searchCache.has(cacheKey)) {
      const cachedEntry = searchCache.get(cacheKey)!;
      if (Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
        console.log("[JobSearch] Cache hit for:", targetLocation);
        return NextResponse.json({
          success: true,
          jobs: cachedEntry.jobs,
          query: cachedEntry.queryStr,
          targetLocation,
          cached: true,
        });
      }
    }

    // JSearch queries fail if they are too long/specific.
    // Start with a reasonable base query: User's typed query, OR top 2 skills, OR generic "Jobs"
    const displayQuery = query || (sortedSkills.length > 0 ? sortedSkills.slice(0, 2).join(" ") : "Jobs");
    let validatedJobs: any[] = [];

    // Prioritize REAL jobs via RapidAPI JSearch
    console.log(`[JobSearch] Fetching real jobs for "${displayQuery}" in "${targetLocation}"`);
    
    if (openWebNinjaKey || rapidApiKey) {
      let searchLoc = targetLocation;
      if (searchLoc === "Local Tech Hub (Nearest)") searchLoc = "";
      
      // 1. Initial Strict Search (Location + Top 2 Skills)
      let realJobs = await fetchRealJobs(displayQuery, searchLoc, filters?.isRemote);
      
      // 2. Broad Search (Country/Remote + Top Skill)
      if (!realJobs || realJobs.length === 0) {
        let broaderLocation = "Remote";
        if (searchLoc.includes(',')) broaderLocation = searchLoc.split(',').pop()?.trim() || "Remote";
        
        const broaderQuery = sortedSkills.length > 0 ? sortedSkills[0] : displayQuery;
        
        console.log(`[JobSearch] Broadening search to: "${broaderQuery}" in "${broaderLocation}"`);
        realJobs = await fetchRealJobs(broaderQuery, broaderLocation, filters?.isRemote);
      }

      // 3. The Ultimate Global Fallback
      if (!realJobs || realJobs.length === 0) {
        console.log(`[JobSearch] Still no matches. Searching for generic "Software" globally`);
        realJobs = await fetchRealJobs(query || "Software", "", false);
      }

      if (realJobs && realJobs.length > 0) {
        validatedJobs = realJobs;
      } else {
        console.warn(`[JobSearch] JSearch returned 0 results even after expanding location and query.`);
      }
    } else {
      console.warn("[JobSearch] No RAPIDAPI_KEY configured. Cannot fetch real jobs.");
    }

    // 4. Reliable Remotive API Fallback
    if (validatedJobs.length === 0) {
      console.log(`[JobSearch] JSearch failed or empty. Falling back to Remotive API for "${displayQuery}"`);
      validatedJobs = await fetchRemotiveJobs(displayQuery);
    }

    // Apply Pricing Plan Limits
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let maxJobs = 6; // Free plan limit
    if (user) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan_id, status')
        .eq('user_id', user.id)
        .single();
        
      if (sub && (sub.status === 'active' || sub.status === 'trialing')) {
        if (sub.plan_id === 'enterprise' || sub.plan_id === 'pdt_0NewgKeXYMkBEofXpxy9Z') {
          maxJobs = Infinity;
        } else if (sub.plan_id === 'pro' || sub.plan_id === 'pdt_0Newfu26VwAPCKJBoT8z5') {
          maxJobs = 18;
        }
      }
    }
    
    // Slice jobs according to plan limit
    if (maxJobs !== Infinity) {
      validatedJobs = validatedJobs.slice(0, maxJobs);
    }

    // Save to cache
    searchCache.set(cacheKey, {
      timestamp: Date.now(),
      jobs: validatedJobs, // Caching the sliced array so free users don't get full array on reload
      queryStr: displayQuery,
    });

    return NextResponse.json({
      success: true,
      jobs: validatedJobs,
      query: displayQuery,
      targetLocation,
    });

  } catch (error: any) {
    console.error("[JobSearch] Endpoint error:", error.message);
    return NextResponse.json({
      success: false,
      jobs: [],
      error: error.message || "An error occurred while fetching real jobs."
    });
  }
}
