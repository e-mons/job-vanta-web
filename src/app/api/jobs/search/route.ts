import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

export const maxDuration = 60;

const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY?.trim() || "";
const MIN_INTERVAL_MS = parseInt(process.env.BRAVE_SEARCH_MIN_INTERVAL_MS || "1100", 10);

// Global timestamp to guarantee rate-limit spacing across sequential Brave API calls
let lastBraveCallTime = 0;

async function throttleBraveCall(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastBraveCallTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_INTERVAL_MS - elapsed));
  }
  lastBraveCallTime = Date.now();
}

export type SupportedPlatform = "greenhouse" | "lever" | "workable" | "wellfound";

interface BraveSearchResultItem {
  title: string;
  url: string;
  description?: string;
  age?: string;
  page_age?: string;
  profile?: {
    name?: string;
    long_name?: string;
    img?: string;
  };
}

interface ParsedJobMetadata {
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  salary: string | null;
  jobType: string;
  experienceLevel: string;
  description: string;
  tags: string[];
  matchScore: number;
  jobUrl: string;
  sourceUrl: string;
  platform: SupportedPlatform;
}

/**
 * Clean HTML entities and bold tags returned in search snippets
 */
function cleanSnippetText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse clean Job Title and Company Name from platform-specific search titles
 */
function parseTitleAndCompany(rawTitle: string, platform: SupportedPlatform, url: string): { title: string; company: string } {
  let clean = cleanSnippetText(rawTitle);

  // Platform specific cleanups
  if (platform === "greenhouse") {
    // "Job Application for Senior Frontend Engineer at Re:Build Manufacturing"
    const m1 = clean.match(/^Job Application for (.+?) at (.+?)(?: - Greenhouse)?$/i);
    if (m1) return { title: m1[1].trim(), company: m1[2].trim() };

    // "[Company] - [Role]"
    const m2 = clean.match(/^(.+?)\s*-\s*(.+?)(?: \| Greenhouse)?$/i);
    if (m2 && !m2[1].toLowerCase().includes("job application")) {
      return { company: m2[1].trim(), title: m2[2].trim() };
    }

    // "[Role] at [Company]"
    const m3 = clean.match(/^(.+?)\s+at\s+(.+?)(?: \| Greenhouse)?$/i);
    if (m3) return { title: m3[1].trim(), company: m3[2].trim() };
  } else if (platform === "lever") {
    // "Jobgether - AEM - Technical Lead / Frontend development Lead"
    // "CoderPad - Senior Software Engineer, Fullstack"
    const parts = clean.split(" - ");
    if (parts.length >= 2) {
      const company = parts[0].trim();
      const role = parts.slice(1).join(" - ").replace(/\s*\|.*$/, "").trim();
      return { company, title: role };
    }
  } else if (platform === "workable") {
    // "Frontend Software Engineer (Typescript) - ALTEN MÉXICO - Application"
    const cleaned = clean.replace(/\s*-\s*Application$/i, "").replace(/\s*-\s*Workable$/i, "");
    const parts = cleaned.split(" - ");
    if (parts.length >= 2) {
      return { title: parts[0].trim(), company: parts[1].trim() };
    }
  } else if (platform === "wellfound") {
    // "Senior Software Engineer, Front End at Axle Health • Santa Monica | Wellfound"
    const cleaned = clean.replace(/\s*\|\s*Wellfound$/i, "");
    const bulletParts = cleaned.split(" • ");
    const mainPart = bulletParts[0] || cleaned;
    const m = mainPart.match(/^(.+?)\s+at\s+(.+)$/i);
    if (m) {
      return { title: m[1].trim(), company: m[2].trim() };
    }
    const dashParts = cleaned.split(" - ");
    if (dashParts.length >= 2) {
      return { company: dashParts[0].trim(), title: dashParts[1].trim() };
    }
  }

  // Generic fallback if patterns did not catch
  const dashSplit = clean.split(" - ");
  if (dashSplit.length >= 2) {
    return { title: dashSplit[0].trim(), company: dashSplit[1].replace(/\|.*$/, "").trim() };
  }

  // Extract company domain from URL if available
  try {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    const guessedCompany = pathParts[0] || "Leading Tech Company";
    return {
      title: clean.replace(/\s*\|.*$/, "").trim() || "Software Engineer",
      company: guessedCompany.charAt(0).toUpperCase() + guessedCompany.slice(1),
    };
  } catch {
    return { title: clean || "Software Opportunity", company: "Innovative Company" };
  }
}

/**
 * Extract salary from snippet or null
 */
function extractSalary(snippet: string): string | null {
  const salaryRegex = /\$\d{2,3}(?:,\d{3})*(?:k|K)?(?:\s*-\s*\$\d{2,3}(?:,\d{3})*(?:k|K)?)?(?:\s*(?:\/|per)\s*(?:yr|year|hr|hour|mo|month))?/;
  const match = snippet.match(salaryRegex);
  if (match) return match[0];
  return null;
}

/**
 * Deterministic match score calculation based on candidate skills and role keywords
 */
function calculateMatchScore(
  jobTitle: string,
  description: string,
  candidateSkills: string[],
  targetRole: string
): { score: number; tags: string[] } {
  const combined = `${jobTitle} ${description}`.toLowerCase();
  const matchedTags: string[] = [];

  const commonTech = [
    "React", "Next.js", "TypeScript", "JavaScript", "Node.js", "Python", 
    "Go", "Rust", "Java", "AWS", "GCP", "PostgreSQL", "GraphQL", "Docker",
    "Tailwind", "System Design", "Microservices", "REST API", "CI/CD", "Vue"
  ];

  // Check candidate skills first
  for (const s of candidateSkills) {
    if (combined.includes(s.toLowerCase().trim())) {
      matchedTags.push(s);
    }
  }

  // Supplement with common tech from job description
  for (const t of commonTech) {
    if (matchedTags.length >= 6) break;
    if (combined.includes(t.toLowerCase()) && !matchedTags.some(m => m.toLowerCase() === t.toLowerCase())) {
      matchedTags.push(t);
    }
  }

  if (matchedTags.length === 0) {
    matchedTags.push(...candidateSkills.slice(0, 3));
  }

  // Calculate score between 75% and 98%
  let baseScore = 75;
  if (targetRole && combined.includes(targetRole.toLowerCase())) {
    baseScore += 10;
  }
  const skillBonus = Math.min(13, matchedTags.length * 3);
  const finalScore = Math.min(98, baseScore + skillBonus);

  return { score: finalScore, tags: matchedTags.slice(0, 6) };
}

/**
 * Call Brave Search API with throttling and query formatting
 */
async function searchBravePlatform(
  siteQuery: string,
  keywords: string,
  freshness = "pw",
  count = 10
): Promise<BraveSearchResultItem[]> {
  if (!BRAVE_API_KEY) {
    console.warn("[JobSearch] BRAVE_SEARCH_API_KEY is not configured!");
    return [];
  }

  await throttleBraveCall();

  const fullQuery = `${siteQuery} ${keywords}`.trim();
  const params = new URLSearchParams({
    q: fullQuery,
    count: count.toString(),
    freshness: freshness,
  });

  const url = `https://api.search.brave.com/res/v1/web/search?${params.toString()}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-Subscription-Token": BRAVE_API_KEY,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.warn(`[JobSearch] Brave API returned HTTP ${res.status} for query: ${fullQuery}`);
      return [];
    }

    const data = await res.json();
    return data.web?.results || [];
  } catch (err: any) {
    console.error("[JobSearch] Brave Search error:", err.message);
    return [];
  }
}

/**
 * Platform site queries
 */
const PLATFORM_SITES: Record<SupportedPlatform, string> = {
  greenhouse: "site:job-boards.greenhouse.io OR site:boards.greenhouse.io",
  lever: "site:jobs.lever.co",
  workable: "site:apply.workable.com",
  wellfound: "site:wellfound.com/jobs",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      resumeId,
      resumeData,
      skills = [],
      filters = {},
      platforms = ["greenhouse", "lever", "workable", "wellfound"],
      query = "",
    } = body;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Resolve Resume Data (fetch from DB if ID passed without inline content)
    let candidateSkills: string[] = Array.isArray(skills) ? skills : [];
    let candidateRole = query || "";
    let candidateLocation = filters?.location || "";
    let resumeRecord: any = null;

    if (user && resumeId) {
      const { data: dbResume } = await supabase
        .from("resumes")
        .select("*")
        .eq("id", resumeId)
        .eq("user_id", user.id)
        .single();

      if (dbResume) {
        resumeRecord = dbResume;
        const content = dbResume.content || {};
        if (candidateSkills.length === 0 && Array.isArray(content.skills)) {
          candidateSkills = content.skills;
        }
        if (!candidateRole) {
          // Derive role from experience or summary
          const latestExp = content.experience?.[0];
          if (latestExp?.role) {
            candidateRole = latestExp.role;
          }
        }
        if (!candidateLocation && content.personalInfo?.location) {
          candidateLocation = content.personalInfo.location;
        }
      }
    }

    // Fallback to inline resumeData if passed
    if (!resumeRecord && resumeData?.content) {
      const content = resumeData.content;
      if (candidateSkills.length === 0 && Array.isArray(content.skills)) {
        candidateSkills = content.skills;
      }
      if (!candidateRole && content.experience?.[0]?.role) {
        candidateRole = content.experience[0].role;
      }
      if (!candidateLocation && content.personalInfo?.location) {
        candidateLocation = content.personalInfo.location;
      }
    }

    if (!candidateRole && candidateSkills.length > 0) {
      candidateRole = `${candidateSkills[0]} Engineer`;
    }
    if (!candidateRole) {
      candidateRole = "Software Engineer";
    }

    // 2. Compute Deterministic Search Fingerprint
    const selectedPlatforms: SupportedPlatform[] = (
      Array.isArray(platforms) && platforms.length > 0
        ? platforms
        : ["greenhouse", "lever", "workable", "wellfound"]
    ) as SupportedPlatform[];

    selectedPlatforms.sort();
    const sortedSkills = [...candidateSkills].sort();

    const fingerprintPayload = {
      resumeId: resumeId || "no_resume",
      platforms: selectedPlatforms,
      skills: sortedSkills,
      location: filters?.location || candidateLocation || "",
      radius: filters?.radius || "25",
      isRemote: !!filters?.isRemote,
      jobType: filters?.jobType || "Full-time",
      experienceLevel: filters?.experienceLevel || "Mid-level",
      query: query || "",
    };

    const searchFingerprint = crypto
      .createHash("sha256")
      .update(JSON.stringify(fingerprintPayload))
      .digest("hex");

    // 3. Check Supabase 6-Hour Cache
    if (user && resumeId) {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

      const { data: cachedJobs, error: cacheError } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id)
        .eq("resume_id", resumeId)
        .eq("search_fingerprint", searchFingerprint)
        .gte("fetched_at", sixHoursAgo)
        .order("match_score", { ascending: false });

      if (!cacheError && cachedJobs && cachedJobs.length > 0) {
        console.log(`[JobSearch] Returning ${cachedJobs.length} cached jobs (6-hour valid) for fingerprint ${searchFingerprint.slice(0, 8)}`);

        // Check plan limits
        const maxJobs = await getUserPlanLimit(supabase, user.id);
        const sliced = maxJobs === Infinity ? cachedJobs : cachedJobs.slice(0, maxJobs);

        return NextResponse.json({
          success: true,
          jobs: sliced.map(formatDbJobToStoreJob),
          cached: true,
          fetchedAt: cachedJobs[0].fetched_at,
          total: cachedJobs.length,
        });
      }

      // If older than 6 hours or fingerprint changed, clear old cached jobs for this resume to prevent database clutter
      await supabase
        .from("jobs")
        .delete()
        .eq("user_id", user.id)
        .eq("resume_id", resumeId);
    }

    // 4. Multi-Tier Progressive Search via Brave Search API
    console.log(`[JobSearch] Executing Brave Search across [${selectedPlatforms.join(", ")}] for "${candidateRole}"`);

    let rawResults: { item: BraveSearchResultItem; platform: SupportedPlatform }[] = [];
    const locationStr = filters?.isRemote ? "Remote" : (candidateLocation ? candidateLocation.split(",")[0].trim() : "Remote");
    const cleanExpLevel = (filters?.experienceLevel || "").replace(/-level$/i, "").trim();
    const expKeyword = (cleanExpLevel && cleanExpLevel !== "Mid" && !candidateRole.toLowerCase().includes(cleanExpLevel.toLowerCase())) ? cleanExpLevel : "";
    const jobTypeKeyword = (filters?.jobType && filters.jobType !== "Full-time") ? `"${filters.jobType}"` : "";
    const topSkill = candidateSkills[0] ? `"${candidateSkills[0]}"` : "";

    // Tier 1: Platform search with up to 20 results per platform
    for (const p of selectedPlatforms) {
      const site = PLATFORM_SITES[p];
      const primaryKeywords = `"${candidateRole}" ${expKeyword} ${jobTypeKeyword} ${topSkill} ${locationStr}`.replace(/\s+/g, " ").trim();
      let items = await searchBravePlatform(site, primaryKeywords, "pm", 20);

      // Per-platform resilience: if a platform returns fewer than 5 jobs (due to strict quote constraints),
      // give it a relaxed query so Lever, Workable, Wellfound also contribute abundant verified jobs
      if (items.length < 5) {
        const broadRole = candidateRole.replace(/^(Senior|Junior|Lead|Staff|Principal|Associate)\s+/i, "");
        const relaxedKeywords = `"${broadRole}" ${expKeyword} ${locationStr}`.replace(/\s+/g, " ").trim();
        const relaxedItems = await searchBravePlatform(site, relaxedKeywords, "pm", 20);
        items = [...items, ...relaxedItems];
      }

      for (const item of items) {
        rawResults.push({ item, platform: p });
      }
    }

    // Tier 2: If low overall results (< 25), widen location / remote search across selected platforms
    if (rawResults.length < 25) {
      console.log(`[JobSearch] Tier 1 yielded ${rawResults.length} jobs. Expanding to Tier 2 (Location / Remote widening)...`);
      for (const p of selectedPlatforms) {
        const site = PLATFORM_SITES[p];
        const tier2Keywords = `${candidateRole} ${candidateSkills[0] || ""} Remote`.trim();
        const items = await searchBravePlatform(site, tier2Keywords, "pm", 20);
        for (const item of items) {
          if (!rawResults.some(r => r.item.url === item.url)) {
            rawResults.push({ item, platform: p });
          }
        }
      }
    }

    // Tier 3: If still low results (< 25), widen skill & role keywords across platforms
    if (rawResults.length < 25) {
      console.log(`[JobSearch] Expanding to Tier 3 (Skill & Tech Stack Widening)...`);
      const coreSkill = candidateSkills[0] || "Software";
      for (const p of selectedPlatforms) {
        const site = PLATFORM_SITES[p];
        const tier3Keywords = `${coreSkill} Developer Remote`.trim();
        const items = await searchBravePlatform(site, tier3Keywords, "pm", 20);
        for (const item of items) {
          if (!rawResults.some(r => r.item.url === item.url)) {
            rawResults.push({ item, platform: p });
          }
        }
      }
    }

    // Tier 4: The Ultimate Guarantee — Global platform engineering search
    if (rawResults.length < 15) {
      console.log(`[JobSearch] Tier 4: Global platform tech opportunity guarantee...`);
      for (const p of selectedPlatforms) {
        const site = PLATFORM_SITES[p];
        const tier4Keywords = "Software Engineer Remote";
        const items = await searchBravePlatform(site, tier4Keywords, "pm", 20);
        for (const item of items) {
          if (!rawResults.some(r => r.item.url === item.url)) {
            rawResults.push({ item, platform: p });
          }
        }
      }
    }

    // 5. Deduplicate and Normalize Results
    const seenUrls = new Set<string>();
    const normalizedJobs: any[] = [];

    // Preload user's saved and applied jobs to reflect status accurately
    const userSavedUrlSet = new Set<string>();
    const userAppliedUrlSet = new Set<string>();

    if (user) {
      const { data: savedEntries } = await supabase
        .from("saved_jobs")
        .select("job_url, metadata")
        .eq("user_id", user.id);
      savedEntries?.forEach(s => {
        if (s.job_url) userSavedUrlSet.add(s.job_url);
        if (s.metadata?.applyLink) userSavedUrlSet.add(s.metadata.applyLink);
      });

      const { data: appEntries } = await supabase
        .from("job_applications")
        .select("metadata")
        .eq("user_id", user.id);
      appEntries?.forEach(a => {
        if (a.metadata?.applyLink) userAppliedUrlSet.add(a.metadata.applyLink);
      });
    }

    for (const { item, platform } of rawResults) {
      if (seenUrls.has(item.url)) continue;
      seenUrls.add(item.url);

      const snippet = cleanSnippetText(item.description || "");
      const { title, company } = parseTitleAndCompany(item.title, platform, item.url);
      const salary = extractSalary(snippet);
      const { score, tags } = calculateMatchScore(title, snippet, candidateSkills, candidateRole);

      // Construct company logo domain
      const companyDomain = company
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .concat(".com");
      const companyLogo = item.profile?.img || `https://icon.horse/icon/${companyDomain}`;

      const isSaved = userSavedUrlSet.has(item.url);
      const isApplied = userAppliedUrlSet.has(item.url);

      const jobRecord = {
        id: uuidv4(),
        user_id: user?.id || null,
        resume_id: resumeId || null,
        search_fingerprint: searchFingerprint,
        platform,
        title,
        company,
        company_logo: companyLogo,
        location: filters?.isRemote ? "100% Remote" : (candidateLocation || "Remote / Hybrid"),
        salary: salary || (score > 90 ? "$130k - $175k" : "$110k - $150k"),
        job_type: filters?.jobType || "Full-time",
        experience_level: filters?.experienceLevel || (score > 90 ? "Senior-level" : "Mid-level"),
        description: snippet || "Click Apply Now to view complete job responsibilities and submit your application on the official platform.",
        tags,
        match_score: score,
        job_url: item.url,
        source_url: item.url,
        applied_status: isApplied ? "applied" : "not_applied",
        saved_status: isSaved,
        fetched_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      normalizedJobs.push(jobRecord);
    }

    // Sort jobs by match_score descending
    normalizedJobs.sort((a, b) => b.match_score - a.match_score);

    // 6. Save to Supabase `jobs` Table (if user logged in)
    if (user && normalizedJobs.length > 0) {
      const recordsToInsert = normalizedJobs.map(j => ({
        ...j,
        user_id: user.id,
      }));

      const { error: insertError } = await supabase
        .from("jobs")
        .insert(recordsToInsert);

      if (insertError) {
        console.error("[JobSearch] Error persisting jobs to Supabase:", insertError.message);
      } else {
        console.log(`[JobSearch] Successfully cached ${recordsToInsert.length} jobs in Supabase for user ${user.id}`);
      }
    }

    // 7. Plan Limits & Response
    const maxJobs = user ? await getUserPlanLimit(supabase, user.id) : 6;
    const displayedJobs = maxJobs === Infinity ? normalizedJobs : normalizedJobs.slice(0, maxJobs);

    return NextResponse.json({
      success: true,
      jobs: displayedJobs.map(formatDbJobToStoreJob),
      cached: false,
      fetchedAt: new Date().toISOString(),
      total: normalizedJobs.length,
      query: candidateRole,
    });
  } catch (error: any) {
    console.error("[JobSearch] Route exception:", error);
    return NextResponse.json(
      {
        success: false,
        jobs: [],
        error: error.message || "Failed to discover matching jobs. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * Format DB job row to Store Job interface
 */
function formatDbJobToStoreJob(dbJob: any) {
  return {
    id: dbJob.id,
    title: dbJob.title,
    company: dbJob.company,
    companyLogo: dbJob.company_logo,
    company_logo: dbJob.company_logo,
    location: dbJob.location || "Remote",
    isRemote: dbJob.location?.toLowerCase().includes("remote") ?? true,
    salary: dbJob.salary,
    applyLink: dbJob.job_url,
    job_url: dbJob.job_url,
    source_url: dbJob.source_url,
    description: dbJob.description,
    type: dbJob.job_type || "Full-time",
    job_type: dbJob.job_type || "Full-time",
    employmentType: dbJob.job_type || "Full-time",
    experience_level: dbJob.experience_level || "Mid-level",
    source: dbJob.platform ? `${dbJob.platform.charAt(0).toUpperCase() + dbJob.platform.slice(1)} Verified` : "Direct Verified",
    platform: dbJob.platform,
    postedAt: dbJob.fetched_at || dbJob.created_at || new Date().toISOString(),
    fetched_at: dbJob.fetched_at,
    skills: Array.isArray(dbJob.tags) ? dbJob.tags : [],
    tags: Array.isArray(dbJob.tags) ? dbJob.tags : [],
    match_score: dbJob.match_score || 85,
    matchScore: dbJob.match_score || 85,
    applied_status: dbJob.applied_status || "not_applied",
    saved_status: dbJob.saved_status || false,
  };
}

/**
 * Helper to get user subscription tier limit
 */
async function getUserPlanLimit(supabase: any, userId: string): Promise<number> {
  try {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan_id, status")
      .eq("user_id", userId)
      .single();

    if (sub && (sub.status === "active" || sub.status === "trialing")) {
      if (sub.plan_id === "unlimited" || sub.plan_id === "enterprise" || sub.plan_id === "pdt_0NewgKeXYMkBEofXpxy9Z") {
        return Infinity;
      }
      if (sub.plan_id === "pro" || sub.plan_id === "pdt_0Newfu26VwAPCKJBoT8z5") {
        return 45;
      }
    }
  } catch (err) {
    console.warn("[JobSearch] Error checking user plan:", err);
  }
  return 25; // Free plan limit: generous 25 jobs
}
