import { createAdminClient } from "@/utils/supabase/admin";
import { recordAdminAuditLog } from "./qaAuditService";
import type { 
  ApprovedGeminiModel, 
  QASettings, 
  PublicQASettings 
} from "@shared/types/adminQa";

export const APPROVED_GEMINI_MODELS: ApprovedGeminiModel[] = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro"
];

let _cachedSettings: QASettings | null = null;
let _cachedSettingsTime = 0;
const CACHE_TTL_MS = 15000; // 15 seconds cache

export const DEFAULT_QA_SETTINGS: QASettings = {
  id: "default",
  is_qa_enabled: true,
  is_voice_practice_enabled: true,
  is_5min_refresh_enabled: true,
  is_story_bank_enabled: true,
  is_interview_learning_enabled: true,
  active_gemini_model: "gemini-3.8-flash",
  generation_timeout_ms: 30000,
  max_retries: 2,
  audio_retention_hours: 24,
  rate_limit_per_hour: 30,
  prompt_version: 4,
  cost_alert_threshold_daily_usd: 50.00,
  updated_at: new Date().toISOString(),
  updated_by: null,
};

/**
 * Retrieves current Q&A operational settings.
 * Falls back safely to defaults if database is unreachable.
 */
export async function getQASettings(): Promise<QASettings> {
  const now = Date.now();
  if (_cachedSettings && (now - _cachedSettingsTime < CACHE_TTL_MS)) {
    return _cachedSettings;
  }

  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("qa_settings")
      .select("*")
      .eq("id", "default")
      .single();

    if (error || !data) {
      console.warn("[QA Settings] Database query failed, using safe defaults:", error?.message);
      return _cachedSettings || DEFAULT_QA_SETTINGS;
    }

    _cachedSettings = data as QASettings;
    _cachedSettingsTime = now;
    return _cachedSettings;
  } catch (err: any) {
    console.error("[QA Settings] Unexpected error reading settings:", err?.message);
    return _cachedSettings || DEFAULT_QA_SETTINGS;
  }
}

/**
 * Returns safe public feature flags for web and mobile clients.
 */
export async function getPublicQASettings(): Promise<PublicQASettings> {
  const settings = await getQASettings();
  
  // Check if there is an active incident with a public user notice
  let activeIncidentNotice: string | null = null;
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("qa_incidents")
      .select("user_notice")
      .neq("status", "resolved")
      .not("user_notice", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data?.user_notice) {
      activeIncidentNotice = data.user_notice;
    }
  } catch {
    // Non-blocking
  }

  return {
    is_qa_enabled: settings.is_qa_enabled,
    is_voice_practice_enabled: settings.is_voice_practice_enabled,
    is_5min_refresh_enabled: settings.is_5min_refresh_enabled,
    is_story_bank_enabled: settings.is_story_bank_enabled,
    is_interview_learning_enabled: settings.is_interview_learning_enabled,
    active_incident_notice: activeIncidentNotice,
  };
}

/**
 * Validates and updates operational Q&A settings.
 * Strictly checks approved model allowlist and records an audit log entry.
 */
export async function updateQASettings(
  updates: Partial<Omit<QASettings, "id" | "updated_at">>,
  adminContext: { adminId: string; adminEmail: string },
  reason?: string
): Promise<QASettings> {
  // 1. Model Allowlist Validation
  if (updates.active_gemini_model) {
    if (!APPROVED_GEMINI_MODELS.includes(updates.active_gemini_model as ApprovedGeminiModel)) {
      throw new Error(
        `Invalid model: '${updates.active_gemini_model}'. Must be one of approved models: ${APPROVED_GEMINI_MODELS.join(", ")}`
      );
    }
  }

  // 2. Safe Bounds Checks
  if (updates.generation_timeout_ms !== undefined) {
    if (updates.generation_timeout_ms < 5000 || updates.generation_timeout_ms > 120000) {
      throw new Error("Generation timeout must be between 5,000ms and 120,000ms");
    }
  }

  if (updates.max_retries !== undefined) {
    if (updates.max_retries < 0 || updates.max_retries > 5) {
      throw new Error("Max retries must be between 0 and 5");
    }
  }

  if (updates.audio_retention_hours !== undefined) {
    if (updates.audio_retention_hours < 1 || updates.audio_retention_hours > 720) {
      throw new Error("Audio retention must be between 1 hour and 720 hours (30 days)");
    }
  }

  if (updates.rate_limit_per_hour !== undefined) {
    if (updates.rate_limit_per_hour < 5 || updates.rate_limit_per_hour > 500) {
      throw new Error("Rate limit per hour must be between 5 and 500");
    }
  }

  const previousSettings = await getQASettings();

  const payloadToUpdate = {
    ...updates,
    updated_at: new Date().toISOString(),
    updated_by: adminContext.adminId,
  };

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("qa_settings")
    .update(payloadToUpdate)
    .eq("id", "default")
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to update settings: ${error?.message || "Unknown database error"}`);
  }

  // Invalidate in-memory cache
  _cachedSettings = data as QASettings;
  _cachedSettingsTime = Date.now();

  // Record audit log
  await recordAdminAuditLog({
    adminId: adminContext.adminId,
    adminEmail: adminContext.adminEmail,
    action: "change_setting",
    targetType: "qa_settings",
    targetId: "default",
    details: {
      before: previousSettings,
      after: _cachedSettings,
    },
    reason: reason || "Administrative configuration update",
  });

  return _cachedSettings;
}
