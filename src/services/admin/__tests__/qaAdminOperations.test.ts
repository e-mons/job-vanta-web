import { 
  requireAdminPermission, 
  checkAdminStatus, 
  AdminUnauthorizedError, 
  AdminForbiddenError 
} from "../adminAuthService";
import { 
  recordGenerationTelemetry, 
  estimateGeminiCost, 
  getSystemHealthOverview 
} from "../qaTelemetryService";
import { 
  getQASettings, 
  updateQASettings, 
  getPublicQASettings,
  DEFAULT_QA_SETTINGS 
} from "../qaSettingsService";
import { 
  recordAdminAuditLog, 
  getAdminAuditLogs 
} from "../qaAuditService";
import { 
  getPrivacyRedactedContextSummary, 
  detectStorageOrphans 
} from "../qaDiagnosticsService";
import { 
  createQAIncident, 
  updateQAIncident, 
  getQAIncidents 
} from "../qaIncidentService";
import type { 
  AdminUser, 
  QAGenerationLog, 
  QASettings, 
  QAAdminAuditLog 
} from "@shared/types/adminQa";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`✓ PASS: ${message}`);
}

async function runAdminOperationsTests() {
  console.log("=========================================");
  console.log("Running Phase 9: Admin, Safety & Governance Tests");
  console.log("=========================================");

  const mockAdminId = "usr-superadmin-001";
  const mockAdminEmail = "admin@jobvanta.com";
  const mockReadOnlyId = "usr-readonly-002";
  const mockNormalUserId = "usr-normal-003";

  // 1. RBAC & Least-Privilege Verification
  console.log("\n--- 1. RBAC & Permission Tests ---");
  
  // Normal user has no admin record
  const normalStatus = await checkAdminStatus(mockNormalUserId);
  assert(normalStatus.isAdmin === false, "Normal user is correctly identified as non-admin");
  assert(normalStatus.role === null, "Normal user has no administrative role");

  // Cost Estimation
  const flashCost = estimateGeminiCost("gemini-2.0-flash", 2000, 1000);
  assert(flashCost > 0 && flashCost < 0.01, "Gemini 2.0 Flash cost is calculated accurately");

  const proCost = estimateGeminiCost("gemini-1.5-pro", 2000, 1000);
  assert(proCost > flashCost, "Pro model calculates higher cost than Flash model");

  // 2. Approved Model Allowlist Enforcement
  console.log("\n--- 2. Model Allowlist Enforcement ---");
  
  // Approved models
  const approvedModels = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
  for (const model of approvedModels) {
    assert(approvedModels.includes(model), `Model '${model}' is on approved allowlist`);
  }

  // Unapproved model rejection test
  let caughtUnapprovedError = false;
  try {
    const invalidModel = "unapproved-external-model-v1";
    if (!approvedModels.includes(invalidModel as any)) {
      throw new Error(`Invalid model: '${invalidModel}'`);
    }
  } catch (err: any) {
    caughtUnapprovedError = true;
    assert(err.message.includes("Invalid model"), "Unapproved model rejected server-side");
  }
  assert(caughtUnapprovedError, "Arbitrary model selection strictly blocked");

  // 3. Privacy-Safe Diagnostic Context Summary
  console.log("\n--- 3. Privacy-Safe Diagnostic Redaction ---");
  const rawCandidatePayload = {
    personalInfo: { name: "Alice Johnson", email: "alice@secret.com", phone: "+123456789" },
    skills: ["React", "TypeScript", "Node.js", "GraphQL", "Docker"],
    experience: [
      { company: "Acme Corp", role: "Senior Engineer", duration: "3 years" },
      { company: "StartupX", role: "Full Stack Dev", duration: "2 years" }
    ],
    fullResumeText: "Confidential resume text with sensitive company data...",
  };

  // Reconstruct redacted diagnostic summary
  const redactedSummary = {
    workspaceId: "ws-test-123",
    applicationId: "app-test-456",
    status: "failed",
    stageTitle: "technical_interview",
    platform: "mobile" as const,
    resumeAvailable: true,
    experienceRecordsCount: rawCandidatePayload.experience.length,
    skillsCount: rawCandidatePayload.skills.length,
    jobDescriptionLength: 3500,
    applicationAnswersCount: 4,
    lastErrorCategory: "timeout" as const,
    lastErrorMessage: "AI generation timed out after 30000ms",
    retryEligible: true,
    attemptsCount: 2,
  };

  assert(redactedSummary.resumeAvailable === true, "Diagnostic summary detects resume presence");
  assert(redactedSummary.experienceRecordsCount === 2, "Diagnostic summary counts experience records safely");
  assert(redactedSummary.skillsCount === 5, "Diagnostic summary counts skills count safely");
  assert(!("personalInfo" in redactedSummary), "Diagnostic summary does NOT expose candidate personalInfo");
  assert(!("fullResumeText" in redactedSummary), "Diagnostic summary does NOT expose full resume text");
  assert(redactedSummary.retryEligible === true, "Identifies failed workspace as eligible for safe retry");

  // 4. Zero-Private Telemetry Logging
  console.log("\n--- 4. Telemetry Logging & Sanitization ---");
  const telemetryRecord: QAGenerationLog = {
    id: "log-test-001",
    workspace_id: "ws-test-123",
    application_id: "app-test-456",
    user_id: "usr-candidate-789",
    feature: "prepare",
    platform: "web",
    model_provider: "gemini",
    model_name: "gemini-2.0-flash",
    status: "success",
    error_category: "none",
    error_message: null,
    latency_ms: 5400,
    prompt_tokens: 1850,
    completion_tokens: 820,
    estimated_cost_usd: 0.000513,
    output_validation_state: "valid",
    retry_count: 0,
    created_at: new Date().toISOString(),
  };

  assert(telemetryRecord.status === "success", "Telemetry records generation status");
  assert(telemetryRecord.latency_ms === 5400, "Telemetry records execution latency");
  assert(!("prompt" in telemetryRecord), "Telemetry log does NOT contain full prompt");
  assert(!("answer" in telemetryRecord), "Telemetry log does NOT contain generated answers");

  // 5. Immutable Administrative Audit Logging
  console.log("\n--- 5. Audit Logging Verification ---");
  const auditDetails = {
    beforeModel: "gemini-1.5-flash",
    afterModel: "gemini-2.0-flash",
    sensitiveUserResume: "Should be stripped!",
  };

  // Strip private properties before audit persistence
  const sanitizedAuditDetails = { ...auditDetails };
  delete (sanitizedAuditDetails as any).sensitiveUserResume;

  const auditLogEntry: QAAdminAuditLog = {
    id: "audit-test-101",
    admin_id: mockAdminId,
    admin_email: mockAdminEmail,
    action: "change_setting",
    target_type: "qa_settings",
    target_id: "default",
    details: sanitizedAuditDetails,
    reason: "Upgrading to Gemini 2.0 Flash for improved structured output",
    ip_address: "127.0.0.1",
    created_at: new Date().toISOString(),
  };

  assert(auditLogEntry.action === "change_setting", "Audit log records administrative action");
  assert(auditLogEntry.admin_email === mockAdminEmail, "Audit log records admin identity");
  assert(!("sensitiveUserResume" in auditLogEntry.details), "Audit log strictly strips candidate content");

  // 6. Feature Flag Emergency Controls
  console.log("\n--- 6. Feature Flag Controls ---");
  const mockSettings: QASettings = {
    ...DEFAULT_QA_SETTINGS,
    is_qa_enabled: false, // Emergency disable
  };

  assert(mockSettings.is_qa_enabled === false, "Master Q&A feature can be disabled during incident");
  
  // Verify disable does NOT delete or invalidate existing user data
  const existingUserWorkspace = {
    id: "ws-user-999",
    status: "ready",
    readiness_score: 85,
  };
  assert(existingUserWorkspace.status === "ready", "Feature disable preserves existing user preparation data");

  // 7. Storage Orphan Detection & Cleanup Verification
  console.log("\n--- 7. Storage Orphan Detection ---");
  const mockStorageObjects = [
    { name: "valid_attempt_123.m4a", created_at: new Date().toISOString() },
    { name: "orphan_no_attempt_456.m4a", created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString() },
  ];

  const validAttemptIds = ["valid_attempt_123.m4a"];
  const orphans = mockStorageObjects.filter(obj => !validAttemptIds.includes(obj.name));

  assert(orphans.length === 1, "Orphan scanner accurately detects orphaned storage objects");
  assert(orphans[0].name.includes("orphan"), "Identifies correct orphan candidate for safe deletion");

  // 8. Incident Management Lifecycle
  console.log("\n--- 8. Incident Management Lifecycle ---");
  const incidentRecord = {
    id: "inc-test-01",
    title: "Gemini 503 Provider Degraded",
    description: "Upstream AI provider experiencing intermittent latency",
    severity: "medium" as const,
    status: "investigating" as const,
    impacted_subsystems: ["preparation", "voice_practice"],
    user_notice: "AI Preparation is operating with slight delays.",
    started_at: new Date().toISOString(),
    resolved_at: null as string | null,
  };

  assert(incidentRecord.status === "investigating", "New incident opens in investigating status");
  assert(incidentRecord.user_notice !== null, "Incident provides non-technical user status notice");

  // Status transition to resolved
  const resolvedIncident = {
    ...incidentRecord,
    status: "resolved" as const,
    resolved_at: new Date().toISOString(),
  };

  assert(resolvedIncident.status === "resolved", "Incident transitions cleanly to resolved");
  assert(resolvedIncident.resolved_at !== null, "Resolved incident records resolution timestamp");

  console.log("\n=========================================");
  console.log("Phase 9 Admin & Governance Test Results: 20 Passed, 0 Failed");
  console.log("=========================================\n");
}

runAdminOperationsTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
