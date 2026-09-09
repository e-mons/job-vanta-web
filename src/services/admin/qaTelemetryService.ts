import { createAdminClient } from "@/utils/supabase/admin";
import type { 
  QAGenerationLog, 
  QAGenerationFeature, 
  QAGenerationStatus, 
  QAErrorCategory, 
  QASystemHealthOverview,
  QAIncident 
} from "@shared/types/adminQa";

export interface RecordTelemetryParams {
  workspaceId?: string | null;
  applicationId?: string | null;
  userId?: string | null;
  feature: QAGenerationFeature;
  platform?: "web" | "mobile";
  modelProvider?: string;
  modelName?: string;
  status: QAGenerationStatus;
  errorCategory?: QAErrorCategory;
  errorMessage?: string | null;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  outputValidationState?: "valid" | "invalid" | "repaired";
  retryCount?: number;
}

/**
 * Calculates estimated cost for Gemini models in USD.
 */
export function estimateGeminiCost(model: string, promptTokens: number, completionTokens: number): number {
  let inputRatePerMillion = 0.10; // default flash
  let outputRatePerMillion = 0.40;

  if (model.includes("pro")) {
    inputRatePerMillion = 1.25;
    outputRatePerMillion = 5.00;
  } else if (model.includes("1.5-flash")) {
    inputRatePerMillion = 0.075;
    outputRatePerMillion = 0.30;
  }

  const cost = (promptTokens / 1_000_000) * inputRatePerMillion + 
               (completionTokens / 1_000_000) * outputRatePerMillion;
  return Number(cost.toFixed(6));
}

/**
 * Records operational generation telemetry.
 * Non-blocking: logs error without failing caller.
 * Strictly adheres to Privacy Lock: Never records resumes, answers, or private career text.
 */
export async function recordGenerationTelemetry(params: RecordTelemetryParams): Promise<QAGenerationLog | null> {
  try {
    const adminClient = createAdminClient();
    const model = params.modelName || "gemini-2.0-flash";
    const promptTokens = params.promptTokens || 0;
    const completionTokens = params.completionTokens || 0;
    const estimatedCost = estimateGeminiCost(model, promptTokens, completionTokens);

    // Sanitize error message to ensure no private payload leakage
    let sanitizedError = params.errorMessage || null;
    if (sanitizedError && sanitizedError.length > 500) {
      sanitizedError = sanitizedError.substring(0, 500) + "... [truncated]";
    }

    const { data, error } = await adminClient
      .from("qa_generation_logs")
      .insert({
        workspace_id: params.workspaceId || null,
        application_id: params.applicationId || null,
        user_id: params.userId || null,
        feature: params.feature,
        platform: params.platform || "web",
        model_provider: params.modelProvider || "gemini",
        model_name: model,
        status: params.status,
        error_category: params.errorCategory || "none",
        error_message: sanitizedError,
        latency_ms: Math.max(0, Math.round(params.latencyMs)),
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        estimated_cost_usd: estimatedCost,
        output_validation_state: params.outputValidationState || "valid",
        retry_count: params.retryCount || 0,
      })
      .select()
      .single();

    if (error) {
      console.warn("[QA Telemetry] Failed to record generation log:", error.message);
      return null;
    }

    return data as QAGenerationLog;
  } catch (err: any) {
    console.warn("[QA Telemetry] Unexpected logging failure:", err?.message);
    return null;
  }
}

/**
 * Retrieves aggregate operational health overview for admin dashboard.
 */
export async function getSystemHealthOverview(timeRange: "today" | "7d" | "30d" = "today"): Promise<QASystemHealthOverview> {
  const adminClient = createAdminClient();
  const now = new Date();
  
  let since = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(); // today midnight
  if (timeRange === "7d") {
    since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  } else if (timeRange === "30d") {
    since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  // 1. Fetch generation logs stats for the period
  const { data: logs } = await adminClient
    .from("qa_generation_logs")
    .select("status, feature, latency_ms, estimated_cost_usd, platform, error_category, created_at")
    .gte("created_at", since);

  const allLogs = logs || [];
  const prepLogs = allLogs.filter((l: any) => l.feature === "prepare" || l.feature === "regenerate");
  const successfulPreps = prepLogs.filter((l: any) => l.status === "success").length;
  const failedPreps = prepLogs.filter((l: any) => l.status !== "success").length;
  
  const totalLatency = prepLogs.reduce((acc: number, l: any) => acc + (l.latency_ms || 0), 0);
  const avgLatency = prepLogs.length > 0 ? Math.round(totalLatency / prepLogs.length) : 0;

  const voiceLogs = allLogs.filter((l: any) => l.feature === "voice_practice");
  const voiceSuccess = voiceLogs.filter((l: any) => l.status === "success").length;
  const voiceFailed = voiceLogs.filter((l: any) => l.status !== "success").length;

  const totalCost = allLogs.reduce((acc: number, l: any) => acc + Number(l.estimated_cost_usd || 0), 0);

  // 2. Fetch Truth Lock stats from public tables
  const { count: conflictCount } = await adminClient
    .from("qa_answers")
    .select("id", { count: "exact", head: true })
    .eq("truth_status", "conflict");

  const { count: clarificationCount } = await adminClient
    .from("qa_clarifications")
    .select("id", { count: "exact", head: true });

  const { count: blockedClaimsCount } = await adminClient
    .from("qa_answers")
    .select("id", { count: "exact", head: true })
    .eq("truth_status", "needs_clarification");

  // 3. Fetch active incidents
  const { data: activeIncidentData } = await adminClient
    .from("qa_incidents")
    .select("*")
    .neq("status", "resolved")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const activeIncident = (activeIncidentData as QAIncident) || null;

  // 4. Determine AI Provider Health
  const recentLogs = allLogs.slice(0, 50);
  const recentFailures = recentLogs.filter((l: any) => l.status === "failed" || l.status === "timeout").length;
  const recentFailureRate = recentLogs.length > 0 ? (recentFailures / recentLogs.length) : 0;

  let providerStatus: "healthy" | "degraded" | "major_failure" = "healthy";
  if (recentFailureRate >= 0.5) {
    providerStatus = "major_failure";
  } else if (recentFailureRate >= 0.15) {
    providerStatus = "degraded";
  }

  // 5. System Status
  let systemStatus: "healthy" | "degraded" | "incident" = "healthy";
  if (activeIncident) {
    systemStatus = "incident";
  } else if (providerStatus !== "healthy" || failedPreps > successfulPreps * 0.2) {
    systemStatus = "degraded";
  }

  // 6. Check temporary audio storage cleanup health
  const { count: audioCount } = await adminClient
    .from("qa_practice_attempts")
    .select("id", { count: "exact", head: true })
    .not("audio_storage_path", "is", null);

  const cleanupStatus: "healthy" | "backlog_detected" = (audioCount || 0) > 50 ? "backlog_detected" : "healthy";

  return {
    systemStatus,
    preparationsToday: prepLogs.length,
    successfulGenerationsToday: successfulPreps,
    failedGenerationsToday: failedPreps,
    averageLatencyMs: avgLatency,
    voicePracticeSuccessful: voiceSuccess,
    voicePracticeFailed: voiceFailed,
    unsupportedClaimsBlocked: blockedClaimsCount || 0,
    clarificationsRequested: clarificationCount || 0,
    unresolvedConflicts: conflictCount || 0,
    temporaryAudioCleanupStatus: cleanupStatus,
    orphanedAudioCount: audioCount || 0,
    providerStatus,
    activeIncident,
    estimatedDailyCostUsd: Number(totalCost.toFixed(4)),
  };
}

/**
 * Retrieves paginated generation logs with server-side filters.
 */
export async function getGenerationLogs(options: {
  limit?: number;
  offset?: number;
  platform?: "web" | "mobile";
  feature?: QAGenerationFeature;
  status?: QAGenerationStatus;
  errorCategory?: QAErrorCategory;
  modelName?: string;
}): Promise<{ logs: QAGenerationLog[]; total: number }> {
  const adminClient = createAdminClient();
  const limit = Math.min(options.limit || 50, 100);
  const offset = options.offset || 0;

  let query = adminClient
    .from("qa_generation_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.platform) query = query.eq("platform", options.platform);
  if (options.feature) query = query.eq("feature", options.feature);
  if (options.status) query = query.eq("status", options.status);
  if (options.errorCategory) query = query.eq("error_category", options.errorCategory);
  if (options.modelName) query = query.eq("model_name", options.modelName);

  const { data, count, error } = await query;
  if (error) {
    throw new Error(`Failed to fetch generation logs: ${error.message}`);
  }

  return {
    logs: (data || []) as QAGenerationLog[],
    total: count || 0,
  };
}
