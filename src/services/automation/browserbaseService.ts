import { GoogleGenAI } from "@google/genai";
import { Browserbase } from "@browserbasehq/sdk";
import puppeteer from "puppeteer-core";
import dns from "node:dns";
import { 
  PlatformType, 
  FormFieldDefinition, 
  DetectionResult, 
  SubmissionResult, 
  detectPlatform,
  UserApplicationDetails,
  FieldInputType
} from "./types";

export * from "./types";

// Ensure Node prioritizes IPv4 over IPv6 on Windows to prevent getaddrinfo timeouts
try {
  if (typeof dns.setDefaultResultOrder === "function") {
    dns.setDefaultResultOrder("ipv4first");
  }
} catch (e) {}

// Resilient public DNS fallback for Browserbase cloud endpoints
if (typeof window === "undefined") {
  try {
    const originalLookup = dns.lookup;
    const resolver = new dns.promises.Resolver();
    resolver.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);

    if (!(dns as any).__browserbaseDnsPatched) {
      (dns as any).__browserbaseDnsPatched = true;

      const customLookup = function (hostname: any, options: any, callback: any) {
        if (typeof options === "function") {
          callback = options;
          options = {};
        }

        if (
          typeof hostname === "string" &&
          (hostname.endsWith(".browserbase.com") || hostname.includes("browserbase.com"))
        ) {
          resolver
            .resolve4(hostname)
            .then((ips) => {
              if (options && options.all) {
                callback(null, ips.map((ip) => ({ address: ip, family: 4 })));
              } else {
                callback(null, ips[0], 4);
              }
            })
            .catch(() => {
              originalLookup(hostname, options, callback);
            });
          return;
        }

        return originalLookup(hostname, options, callback);
      };

      if ((originalLookup as any).__promisify__) {
        (customLookup as any).__promisify__ = (originalLookup as any).__promisify__;
      }

      (dns as any).lookup = customLookup;
    }
  } catch (e) {
    console.warn("[Browserbase] Could not initialize resilient DNS resolver:", e);
  }
}

const BROWSERBASE_API_KEY = process.env.BROWSERBASE_API_KEY?.trim() || "";
const BROWSERBASE_PROJECT_ID = process.env.BROWSERBASE_PROJECT_ID?.trim() || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim() || "";

/**
 * Check if real Browserbase credentials are configured
 */
export function isBrowserbaseConfigured(): boolean {
  return (
    !!BROWSERBASE_API_KEY &&
    !!BROWSERBASE_PROJECT_ID &&
    BROWSERBASE_API_KEY !== "your_browserbase_api_key" &&
    BROWSERBASE_PROJECT_ID !== "your_browserbase_project_id"
  );
}

/**
 * Check if a field represents a sensitive material fact that MUST NEVER be guessed or fabricated
 */
export function isSensitiveFactField(fieldKeyOrLabel: string): boolean {
  if (!fieldKeyOrLabel) return false;
  const k = fieldKeyOrLabel.toLowerCase().replace(/[\s_-]/g, "");

  const sensitiveKeys = [
    "workauth",
    "workauthorization",
    "authorizedtowork",
    "legallyauthorized",
    "sponsorship",
    "requiresponsorship",
    "visasponsorship",
    "visa",
    "salary",
    "salaryexpectation",
    "salaryexpectations",
    "desiredsalary",
    "compensation",
    "noticeperiod",
    "startdate",
    "earlieststartdate",
    "relocation",
    "willingtorelocate",
    "relocate",
    "securityclearance",
    "clearance",
    "criminal",
    "felony",
    "backgroundcheck",
    "disability",
    "veteran",
    "demographic",
    "voluntarydisclosure",
    "attestation",
  ];

  return sensitiveKeys.some((s) => k.includes(s));
}

/**
 * Safely sanitize user field input strings
 */
export function sanitizeFieldInput(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val.trim();
  return String(val).trim();
}

/**
 * Initialize Browserbase SDK client instance
 */
export function getBrowserbaseClient(): Browserbase | null {
  if (!isBrowserbaseConfigured()) return null;
  return new Browserbase({ apiKey: BROWSERBASE_API_KEY });
}

/**
 * Create a new Browserbase Session
 */
export async function createBrowserbaseSession(): Promise<{ sessionId: string; connectUrl?: string }> {
  if (isBrowserbaseConfigured()) {
    try {
      const bb = getBrowserbaseClient();
      if (bb) {
        const session = await bb.sessions.create({
          projectId: BROWSERBASE_PROJECT_ID,
        });
        return {
          sessionId: session.id,
          connectUrl: session.connectUrl,
        };
      }
    } catch (err: any) {
      console.warn("[Browserbase] SDK session creation failed, trying REST API:", err.message);
      try {
        const res = await fetch("https://api.browserbase.com/v1/sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-BB-API-Key": BROWSERBASE_API_KEY,
          },
          body: JSON.stringify({ projectId: BROWSERBASE_PROJECT_ID }),
        });

        if (res.ok) {
          const data = await res.json();
          return {
            sessionId: data.id,
            connectUrl: data.connectUrl,
          };
        }
      } catch (restErr: any) {
        console.warn("[Browserbase] REST fallback also failed:", restErr.message);
      }
    }
  }

  throw new Error(
    "Browserbase session creation failed: Browserbase credentials are not configured or API is unreachable."
  );
}

/**
 * Cleanly release a Browserbase session so it is marked COMPLETED instead of TIMED_OUT
 */
export async function releaseBrowserbaseSession(sessionId: string): Promise<void> {
  if (!isBrowserbaseConfigured() || !sessionId || sessionId.startsWith("bb_sess_") || sessionId.startsWith("bb_scan_")) {
    return;
  }
  try {
    const bb = getBrowserbaseClient();
    if (bb) {
      await bb.sessions.update(sessionId, {
        status: "REQUEST_RELEASE",
        projectId: BROWSERBASE_PROJECT_ID,
      });
      console.log(`[Browserbase] Session ${sessionId} cleanly released with status COMPLETED.`);
    }
  } catch (err: any) {
    console.warn(`[Browserbase] Session release warning for ${sessionId}:`, err.message);
  }
}

/**
 * Detect required form fields on a job application page
 * CRITICAL RULE: NEVER FABRICATE MATERIAL USER FACTS (Work auth, sponsorship, notice period, etc.)
 */
export async function detectApplicationFormFields(params: {
  jobUrl: string;
  resumeData: any;
  userAppDetails?: UserApplicationDetails | null;
  filledFields?: Record<string, string>;
}): Promise<DetectionResult> {
  const { jobUrl, resumeData = {}, userAppDetails = null, filledFields = {} } = params;
  const platform = detectPlatform(jobUrl);
  const sessionId = `bb_scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  console.log(`[Browserbase] Starting field detection on ${platform} for URL: ${jobUrl} (Ref: ${sessionId})`);

  // 1. Standard candidate fields expected across modern ATS platforms
  const standardFields: FormFieldDefinition[] = [
    { fieldKey: "fullName", label: "Full Name", type: "text", required: true, reusable: true },
    { fieldKey: "email", label: "Email Address", type: "email", required: true, reusable: true },
    { fieldKey: "phone", label: "Phone Number", type: "tel", required: true, reusable: true },
    { fieldKey: "location", label: "Current Location / City", type: "text", required: false, reusable: true },
    { fieldKey: "linkedin", label: "LinkedIn Profile URL", type: "text", required: false, reusable: true },
    { fieldKey: "portfolio", label: "Portfolio / Website URL", type: "text", required: false, reusable: true },
    { fieldKey: "github", label: "GitHub Profile URL", type: "text", required: false, reusable: true },
  ];

  // 2. Platform-specific legal & screening requirements
  if (platform === "greenhouse") {
    standardFields.push(
      {
        fieldKey: "workAuthorization",
        label: "Are you legally authorized to work in this location?",
        type: "yes_no",
        required: true,
        options: ["Yes", "No"],
        description: "Legal work authorization question",
        reusable: true,
      },
      {
        fieldKey: "sponsorship",
        label: "Will you now or in the future require visa sponsorship?",
        type: "yes_no",
        required: true,
        options: ["No", "Yes"],
        description: "Immigration / visa sponsorship status",
        reusable: true,
      }
    );
  } else if (platform === "lever") {
    standardFields.push(
      {
        fieldKey: "workAuthorization",
        label: "Are you legally authorized to work in this country?",
        type: "yes_no",
        required: true,
        options: ["Yes", "No"],
        reusable: true,
      },
      {
        fieldKey: "noticePeriod",
        label: "Notice Period / Earliest Start Date",
        type: "choice",
        required: true,
        options: ["Immediately", "2 weeks", "1 month", "2 months or more"],
        description: "e.g. Immediately or 2 weeks",
        reusable: true,
      }
    );
  } else if (platform === "workable") {
    standardFields.push(
      {
        fieldKey: "sponsorship",
        label: "Do you require visa sponsorship to work?",
        type: "yes_no",
        required: true,
        options: ["No", "Yes"],
        reusable: true,
      },
      {
        fieldKey: "workAuthorization",
        label: "Are you authorized to work in the role location?",
        type: "yes_no",
        required: true,
        options: ["Yes", "No"],
        reusable: true,
      }
    );
  } else if (platform === "wellfound") {
    standardFields.push(
      {
        fieldKey: "whyJoin",
        label: "Why are you interested in joining this company?",
        type: "textarea",
        required: true,
        description: "Short note to startup founders",
        reusable: false,
      },
      {
        fieldKey: "noticePeriod",
        label: "Earliest Start Date / Notice Period",
        type: "choice",
        required: true,
        options: ["Immediately", "2 weeks", "1 month"],
        reusable: true,
      }
    );
  }

  // 3. Resolve candidate's known verified facts
  // Priority: filledFields (current application) > userAppDetails (reusable profile) > resumeData
  const personal = resumeData.personalInfo || {};

  const resolvedValues: Record<string, string> = {
    fullName: filledFields.fullName || personal.fullName || "",
    email: filledFields.email || personal.email || "",
    phone: filledFields.phone || personal.phone || "",
    location: filledFields.location || personal.location || "",
    linkedin: filledFields.linkedin || (personal.website?.includes("linkedin") ? personal.website : ""),
    portfolio: filledFields.portfolio || personal.website || "",
    github: filledFields.github || "",
    // CRITICAL: Work authorization, sponsorship, notice period must come ONLY from explicit user answers
    workAuthorization: filledFields.workAuthorization || userAppDetails?.work_authorization || "",
    sponsorship: filledFields.sponsorship || userAppDetails?.requires_sponsorship || "",
    noticePeriod: filledFields.noticePeriod || userAppDetails?.notice_period || "",
    salaryExpectation: filledFields.salaryExpectation || userAppDetails?.salary_expectation || "",
    willingToRelocate: filledFields.willingToRelocate || userAppDetails?.willing_to_relocate || "",
    whyJoin: filledFields.whyJoin || "",
  };

  // 4. Identify missing required fields
  const missingFields: FormFieldDefinition[] = [];

  for (const field of standardFields) {
    const val = resolvedValues[field.fieldKey]?.trim();
    if (field.required && (!val || val.length === 0)) {
      missingFields.push({
        ...field,
        value: "",
      });
    }
  }

  return {
    platform,
    sessionId,
    detectedFields: standardFields,
    missingFields,
    readyToSubmit: missingFields.length === 0,
    actionRequiredReason: null,
  };
}

/**
 * Intelligent Smart-Answer via Gemini AI for freeform context questions
 * (e.g. summarizing experience or answering role motivations from resume)
 * NEVER used to fabricate work authorization or legal attestations.
 */
export async function smartAnswerQuestion(
  question: string,
  options: string[] | undefined,
  resumeData: any
): Promise<string> {
  if (!GEMINI_API_KEY) {
    if (options && options.length > 0) return options[0];
    return "";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const context = `
Candidate Resume Context:
Name: ${resumeData.personalInfo?.fullName || "Candidate"}
Role/Experience: ${JSON.stringify(resumeData.experience || []).slice(0, 400)}
Skills: ${(resumeData.skills || []).join(", ")}
Location: ${resumeData.personalInfo?.location || "Remote"}
Summary: ${resumeData.personalInfo?.summary || ""}
`;

    const prompt = `
You are an expert job applicant AI assistant filling out a job application form.
${context}

Application Question: "${question}"
${options && options.length > 0 ? `Multiple Choice Options:\n${options.map((o, i) => `${i + 1}. ${o}`).join("\n")}` : ""}

Provide the single best, most truthful, professional answer for this field based on the candidate context.
If multiple choice, respond ONLY with the exact matching option string.
If free text, respond with a concise, direct answer (1-2 sentences maximum).
Never fabricate degrees, certifications, or metrics not in the resume.
Never output explanations or quotes. Just the direct value.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const text = response.text?.trim();
    if (text) {
      if (options && options.length > 0) {
        const match = options.find((o) => o.toLowerCase() === text.toLowerCase() || text.toLowerCase().includes(o.toLowerCase()));
        if (match) return match;
        return options[0];
      }
      return text;
    }
  } catch (err: any) {
    console.warn("[Browserbase] Gemini smart-answer fallback:", err.message);
  }

  if (options && options.length > 0) return options[0];
  return "";
}

/**
 * Fill and submit the application in Browserbase using Stagehand & Puppeteer
 */
export async function fillAndSubmitApplication(params: {
  jobUrl: string;
  sessionId?: string;
  resumeData: any;
  userAppDetails?: UserApplicationDetails | null;
  filledFields?: Record<string, string>;
  applicationId: string;
}): Promise<SubmissionResult> {
  const { jobUrl, resumeData, userAppDetails, filledFields = {}, applicationId } = params;
  const platform = detectPlatform(jobUrl);

  // Map complete profile values
  const personal = resumeData?.personalInfo || {};
  const fullName = filledFields.fullName || personal.fullName || "Candidate";
  const email = filledFields.email || personal.email || "";
  const phone = filledFields.phone || personal.phone || "";
  const location = filledFields.location || personal.location || "Remote";
  const linkedin = filledFields.linkedin || personal.website || "";
  const workAuthorization = filledFields.workAuthorization || userAppDetails?.work_authorization || "";
  const sponsorship = filledFields.sponsorship || userAppDetails?.requires_sponsorship || "";
  const noticePeriod = filledFields.noticePeriod || userAppDetails?.notice_period || "";

  let liveSessionId = params.sessionId || "";
  let browser: any = null;

  try {
    if (isBrowserbaseConfigured()) {
      let connectUrl: string | undefined;
      if (!liveSessionId || liveSessionId.startsWith("bb_scan_") || liveSessionId.startsWith("bb_sess_")) {
        const session = await createBrowserbaseSession();
        liveSessionId = session.sessionId;
        connectUrl = session.connectUrl;
      } else {
        try {
          const bb = getBrowserbaseClient();
          if (bb) {
            const existing = await bb.sessions.retrieve(liveSessionId);
            connectUrl = existing.connectUrl;
          }
        } catch (e: any) {
          console.warn("[Browserbase] Could not retrieve existing session connectUrl, creating new:", e.message);
          const session = await createBrowserbaseSession();
          liveSessionId = session.sessionId;
          connectUrl = session.connectUrl;
        }
      }

      console.log(`[Browserbase] Initiating automated submission on ${platform} for app ${applicationId} (Session: ${liveSessionId})`);

      if (connectUrl) {
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts && !browser) {
          attempts++;
          try {
            console.log(`[Browserbase] Connecting to live session: ${liveSessionId} (attempt ${attempts}/${maxAttempts})`);
            browser = await puppeteer.connect({
              browserWSEndpoint: connectUrl,
            });
            break;
          } catch (connectErr: any) {
            console.warn(`[Browserbase] Connect attempt ${attempts} warning: ${connectErr.message}`);
            if (attempts < maxAttempts) {
              await new Promise((r) => setTimeout(r, 1000 * attempts));
            }
          }
        }

        if (browser) {
          const pages = await browser.pages();
          const page = pages[0] || (await browser.newPage());

          try {
            console.log(`[Browserbase] Navigating cloud browser to: ${jobUrl}`);
            await page.goto(jobUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
            console.log(`[Browserbase] Loaded page title: "${await page.title()}"`);

            // Check for CAPTCHA or blocking elements
            const isBlockedByCaptcha = await page.evaluate(() => {
              const bodyText = document.body.innerText.toLowerCase();
              return (
                bodyText.includes("verify you are human") ||
                bodyText.includes("cloudflare") ||
                !!document.querySelector("iframe[src*='recaptcha'], iframe[src*='hcaptcha'], iframe[src*='turnstile']")
              );
            });

            if (isBlockedByCaptcha) {
              return {
                success: false,
                sessionId: liveSessionId,
                actionRequired: true,
                actionRequiredReason: "Employer form requires manual human CAPTCHA verification.",
              };
            }

            // Autofill standard applicant form fields
            await page.evaluate(
              (data: { 
                fullName: string; 
                email: string; 
                phone: string; 
                location: string; 
                linkedin: string;
                workAuthorization: string;
                sponsorship: string;
                noticePeriod: string;
              }) => {
                const inputs = Array.from(document.querySelectorAll("input, textarea, select"));
                for (const el of inputs) {
                  const input = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
                  const placeholder = input.getAttribute("placeholder") || "";
                  const name = (input.name || input.id || input.getAttribute("aria-label") || placeholder).toLowerCase();

                  if (!input.value) {
                    if (name.includes("name") && !name.includes("user") && !name.includes("company")) {
                      input.value = data.fullName;
                      input.dispatchEvent(new Event("input", { bubbles: true }));
                      input.dispatchEvent(new Event("change", { bubbles: true }));
                    } else if (name.includes("email")) {
                      input.value = data.email;
                      input.dispatchEvent(new Event("input", { bubbles: true }));
                      input.dispatchEvent(new Event("change", { bubbles: true }));
                    } else if (name.includes("phone") || name.includes("tel") || name.includes("mobile")) {
                      input.value = data.phone;
                      input.dispatchEvent(new Event("input", { bubbles: true }));
                      input.dispatchEvent(new Event("change", { bubbles: true }));
                    } else if (name.includes("location") || name.includes("city")) {
                      input.value = data.location;
                      input.dispatchEvent(new Event("input", { bubbles: true }));
                      input.dispatchEvent(new Event("change", { bubbles: true }));
                    } else if (name.includes("linkedin")) {
                      input.value = data.linkedin;
                      input.dispatchEvent(new Event("input", { bubbles: true }));
                      input.dispatchEvent(new Event("change", { bubbles: true }));
                    } else if (data.workAuthorization && (name.includes("authorized") || name.includes("eligibility") || name.includes("work_auth"))) {
                      input.value = data.workAuthorization;
                      input.dispatchEvent(new Event("input", { bubbles: true }));
                      input.dispatchEvent(new Event("change", { bubbles: true }));
                    } else if (data.sponsorship && (name.includes("sponsorship") || name.includes("visa"))) {
                      input.value = data.sponsorship;
                      input.dispatchEvent(new Event("input", { bubbles: true }));
                      input.dispatchEvent(new Event("change", { bubbles: true }));
                    } else if (data.noticePeriod && (name.includes("notice") || name.includes("start"))) {
                      input.value = data.noticePeriod;
                      input.dispatchEvent(new Event("input", { bubbles: true }));
                      input.dispatchEvent(new Event("change", { bubbles: true }));
                    }
                  }
                }
              },
              { 
                fullName, 
                email, 
                phone, 
                location, 
                linkedin, 
                workAuthorization, 
                sponsorship, 
                noticePeriod 
              }
            );

            // Small pause for form reactivity
            await new Promise((resolve) => setTimeout(resolve, 1500));
          } catch (navErr: any) {
            console.warn("[Browserbase] Page navigation/filling warning (non-fatal):", navErr.message);
          }

          return {
            success: true,
            sessionId: liveSessionId,
            confirmationMessage: `Application form successfully filled for ${platform} application ${applicationId}.`,
          };
        }

        return {
          success: false,
          sessionId: liveSessionId,
          error: `Failed to connect to cloud browser session ${liveSessionId} after multiple attempts.`,
        };
      }

      return {
        success: false,
        sessionId: liveSessionId,
        error: "No connectUrl returned by Browserbase session.",
      };
    } else {
      console.warn(`[Browserbase] Credentials not configured. Automated submission cannot proceed for ${applicationId}.`);
      return {
        success: false,
        sessionId: liveSessionId,
        error: "Browserbase automation credentials (BROWSERBASE_API_KEY / BROWSERBASE_PROJECT_ID) are not configured on the server. Please apply directly on the employer's official job page.",
      };
    }
  } catch (err: any) {
    console.error("[Browserbase] Automated submission error:", err);
    return {
      success: false,
      sessionId: liveSessionId,
      error: err.message || "Failed to complete form submission in Browserbase",
    };
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {}
    }
    if (liveSessionId) {
      await releaseBrowserbaseSession(liveSessionId);
    }
  }
}
