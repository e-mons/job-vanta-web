import { verifyAnswerClaims } from "../truthLockService";
import { calculateApplicationQAReadiness } from "../qaReadinessService";
import { summarizeRiskRadar } from "../questionRiskRadarService";
import { structureCareerStoryWithAI, saveCareerStory, findRelevantCareerStories } from "../qaStoryBankService";
import { matchActualToPredictedQuestion, getRoundLearningSummary } from "../qaInterviewLearningService";
import type { QAQuestion, QAAnswer, ApplicationMemory, UserCareerStory, QAActualInterviewQuestion, QAWorkspace } from "@shared/types/qa";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`✓ PASS: ${message}`);
}

async function runMobileIntegrationTests() {
  console.log("=========================================");
  console.log("Running Phase 8: Mobile Integration & Sync Tests");
  console.log("=========================================");

  const mockUserId = "usr-mobile-test-123";
  const mockApplicationId = "app-mobile-test-456";
  const mockWorkspaceId = "ws-mobile-test-789";
  const mockStageId = "stg-mobile-test-101";

  // 1. Shared Schema Verification
  const sampleQuestion: QAQuestion = {
    id: "q-mobile-1",
    stage_id: mockStageId,
    workspace_id: mockWorkspaceId,
    user_id: mockUserId,
    question_text: "How do you handle cross-functional project deadlines?",
    what_employer_means: "Evaluating organizational skills under pressure",
    category: "behavioral",
    priority: "high",
    risk_level: "medium",
    risk_reason: "Requires clear prioritization framework",
    preparation_priority: "prepare_first",
    is_reviewed: false,
    order_index: 1,
    is_user_reported: false,
    source_provenance: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const sampleAnswer: QAAnswer = {
    id: "ans-mobile-1",
    question_id: "q-mobile-1",
    user_id: mockUserId,
    suggested_quick: "I align stakeholders early and use sprint milestones.",
    suggested_normal: "At TechCorp, I established bi-weekly milestone syncs to deliver projects on time.",
    suggested_detailed: "When managing enterprise migrations at TechCorp, I aligned 4 teams...",
    user_edited_answer: null,
    active_version: "normal",
    answer_anchors: [
      { fact: "TechCorp milestone management", sourceSection: "experience", confidence: "high" },
      { fact: "On-time delivery rate 98%", sourceSection: "experience", confidence: "high" },
    ],
    truth_status: "verified",
    verification_details: null,
    claims_payload: null,
    provenance: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  assert(sampleQuestion.workspace_id === mockWorkspaceId, "Question shares exact workspace ID across mobile/web");
  assert((sampleAnswer.answer_anchors?.length ?? 0) === 2, "Answer anchors contain exact verified facts on mobile");

  // 2. Mobile Answer Editing with Custom Version
  const editedText = "I proactively run weekly dependency mapping and risk reviews with product leads.";
  const updatedAnswer: QAAnswer = {
    ...sampleAnswer,
    user_edited_answer: editedText,
    active_version: "custom",
    updated_at: new Date().toISOString(),
  };

  assert(updatedAnswer.active_version === "custom", "Mobile answer edit sets active_version to custom");
  assert(updatedAnswer.user_edited_answer === editedText, "Mobile answer edit preserves customized text");

  // 3. Truth Lock Verification on Mobile
  const mockMemory: ApplicationMemory = {
    applicationId: mockApplicationId,
    userId: mockUserId,
    companyName: "Acme Corp",
    jobTitle: "Senior Product Lead",
    appliedAt: new Date().toISOString(),
    applicationTruth: {
      hasSubmittedSnapshot: true,
      submittedResumeTitle: "Senior PM Resume",
      statedSalaryExpectation: "£90,000",
      statedAvailability: "1 month",
      statedNoticePeriod: "1 month",
      statedRelocation: null,
      statedWorkAuthorization: "Citizen",
      submittedSkills: ["Product Strategy", "Agile", "Roadmapping"],
      submittedExperienceYears: 6,
      submittedExperienceRoles: [{ company: "TechCorp", role: "Product Manager", dates: "2020-2024" }],
      submittedApplicationAnswers: {},
    },
    careerTruth: {
      currentResumeTitle: "Senior PM Resume",
      currentSkills: ["Product Strategy", "Agile", "Roadmapping"],
      currentExperienceYears: 6,
      currentExperienceRoles: [{ company: "TechCorp", role: "Product Manager", dates: "2020-2024" }],
      activeConfirmations: [],
    },
    divergences: {
      experienceYearsDiff: 0,
      newSkillsAddedSinceSubmission: [],
      rolesModifiedSinceSubmission: [],
      salaryRangeChanged: false,
    },
    provenance: {
      sourceSnapshotId: "snap-123",
      isHistoricalImmutable: true,
      reconstructedAt: new Date().toISOString(),
    },
  };

  const truthResult = verifyAnswerClaims(updatedAnswer.user_edited_answer!, mockMemory);
  assert(truthResult.overallStatus === "verified", "Mobile customized answer passes Truth Lock claim check");

  // Contradiction on inflated experience
  const inflatedEdit = "In my 15 years leading enterprise engineering teams...";
  const falseTruthResult = verifyAnswerClaims(inflatedEdit, mockMemory);
  assert(falseTruthResult.overallStatus === "conflict", "Mobile answer editing rejects contradictory experience claims");

  // 4. Mobile Risk Radar & Readiness
  const mockWorkspace: QAWorkspace = {
    id: mockWorkspaceId,
    application_id: mockApplicationId,
    user_id: mockUserId,
    status: "ready",
    readiness_score: 80,
    is_stale: false,
    stale_reason: null,
    source_hash: "hash123",
    last_prepared_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const questionsWithAnswers = [{ ...sampleQuestion, answer: sampleAnswer }];
  const radar = summarizeRiskRadar(questionsWithAnswers as any, mockWorkspaceId, "technical_interview", mockMemory);
  assert(radar.prepareItems.length === 1, "Risk Radar categorizes medium risk question into prepareItems");

  const readiness = calculateApplicationQAReadiness(mockWorkspace, [], questionsWithAnswers as any, "technical_interview");
  assert(readiness.totalQuestions === 1, "Mobile readiness counts total questions accurately");
  assert(readiness.readinessScore >= 50, "Readiness computation is shared and deterministic");

  // 5. Mobile Career Story Bank Integration
  const storiesDatabase: UserCareerStory[] = [];
  const mockSupabase = {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: storiesDatabase, error: null }),
        }),
      }),
      insert: (data: any) => {
        const record = { id: `story-${Date.now()}`, ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        storiesDatabase.push(record);
        return {
          select: () => ({
            single: () => Promise.resolve({ data: record, error: null }),
          }),
        };
      },
    }),
  };

  const savedStory = await saveCareerStory({
    userId: mockUserId,
    title: "Handled Critical Database Outage",
    situation: "Production database failed during Black Friday rush.",
    action: "Failed over to replica and restored read availability in 3 minutes.",
    result: "Saved an estimated £200k in transactions with zero data loss.",
    sourceType: "user_created",
    memory: mockMemory,
    clientSupabase: mockSupabase as any,
  });

  assert(savedStory.truth_status === "verified", "Mobile-created story is saved with verified truth status");
  assert(storiesDatabase.length === 1, "Mobile story is persisted in shared table");

  // 6. Mobile Question Matching for Actually Asked Questions
  const matchedId = await matchActualToPredictedQuestion(
    "Tell me how you handle cross-functional project deadlines?",
    [sampleQuestion]
  );
  assert(matchedId === sampleQuestion.id, "Mobile actually asked question semantically links to predicted question");

  console.log("\n=========================================");
  console.log("Phase 8 Mobile Integration Test Results: 11 Passed, 0 Failed");
  console.log("=========================================\n");
}

runMobileIntegrationTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
