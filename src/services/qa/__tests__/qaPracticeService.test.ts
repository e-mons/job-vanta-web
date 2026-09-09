import assert from "node:assert/strict";
import { 
  evaluateTypedPractice, 
  recordPracticeAttempt, 
  deletePracticeAttempt 
} from "../qaPracticeService";
import { 
  generateStageEmployerQuestions, 
  buildFiveMinuteRefreshPayload, 
  buildNervousModePayload 
} from "../qaRefreshService";
import { QAAuthorizationError, QANotFoundError } from "../qaContextBuilder";
import type { 
  QAQuestion, 
  QAAnswer, 
  ApplicationMemory, 
  QAPracticeAttempt 
} from "@shared/types/qa";

const mockQuestion: QAQuestion = {
  id: "q-test-1",
  stage_id: "stage-1",
  workspace_id: "ws-1",
  user_id: "user-1",
  question_text: "Tell me about a time you handled a difficult production incident.",
  category: "behavioral",
  priority: "high",
  risk_level: "medium",
  what_employer_means: "Interviewers want to see how you stay calm, diagnose root causes, and communicate under pressure.",
  order_index: 1,
  is_user_reported: false,
  source_provenance: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockAnswer: QAAnswer = {
  id: "ans-test-1",
  question_id: "q-test-1",
  user_id: "user-1",
  suggested_quick: "Quick incident summary.",
  suggested_normal: "Normal incident summary.",
  suggested_detailed: "Detailed incident summary.",
  user_edited_answer: null,
  active_version: "normal",
  answer_anchors: [
    { fact: "Production database CPU spiked to 100%", sourceSection: "experience", confidence: "high" },
    { fact: "Identified unindexed query and rolled out temporary hotfix", sourceSection: "experience", confidence: "high" },
    { fact: "Reduced p99 latency back down to 45ms", sourceSection: "experience", confidence: "high" },
  ],
  truth_status: "verified",
  verification_details: null,
  claims_payload: null,
  provenance: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockMemory: ApplicationMemory = {
  applicationId: "app-test-1",
  userId: "user-1",
  jobTitle: "Senior Backend Engineer",
  companyName: "Acme Cloud",
  appliedAt: new Date().toISOString(),
  applicationTruth: {
    hasSubmittedSnapshot: true,
    submittedResumeTitle: "Senior Backend Resume",
    submittedSkills: ["PostgreSQL", "Node.js", "Redis", "TypeScript"],
    submittedExperienceYears: 5,
    submittedExperienceRoles: [
      { role: "Backend Engineer", company: "Acme Cloud", dates: "2021 - Present" },
    ],
    statedSalaryExpectation: "$140,000",
    statedAvailability: "Immediate",
    statedNoticePeriod: "2 weeks",
    statedRelocation: null,
    statedWorkAuthorization: "Citizen",
    submittedApplicationAnswers: {},
  },
  careerTruth: {
    currentResumeTitle: "Senior Backend Resume",
    currentSkills: ["PostgreSQL", "Node.js", "Redis", "TypeScript", "Go"],
    currentExperienceYears: 6,
    currentExperienceRoles: [
      { role: "Backend Engineer", company: "Acme Cloud", dates: "2021 - Present" },
    ],
    activeConfirmations: [],
  },
  divergences: {
    experienceYearsDiff: 1,
    newSkillsAddedSinceSubmission: ["Go"],
    rolesModifiedSinceSubmission: [],
    salaryRangeChanged: false,
  },
  provenance: {
    sourceSnapshotId: "snap-1",
    isHistoricalImmutable: true,
    reconstructedAt: new Date().toISOString(),
  },
};

function createMockSupabase(initialAttempts: any[] = []) {
  const attempts = [...initialAttempts];
  const storageDeleted: string[] = [];
  let questionReviewed = false;

  return {
    from: (table: string) => {
      if (table === "qa_practice_attempts") {
        return {
          select: (fields: string, opts?: any) => ({
            eq: (col1: string, val1: string) => ({
              eq: (col2: string, val2: string) => {
                const filtered = attempts.filter(a => a[col1] === val1 && a[col2] === val2);
                return {
                  count: filtered.length,
                  order: () => ({
                    limit: (num: number) => Promise.resolve({ data: filtered.slice(0, num), error: null }),
                  }),
                };
              },
              single: () => {
                const found = attempts.find(a => a[col1] === val1);
                return Promise.resolve({ data: found || null, error: found ? null : { message: "Not found" } });
              },
            }),
          }),
          insert: (record: any) => ({
            select: () => ({
              single: () => {
                const created = { id: `att-${Date.now()}`, ...record };
                attempts.push(created);
                return Promise.resolve({ data: created, error: null });
              },
            }),
          }),
          delete: () => ({
            eq: (col: string, val: string) => {
              const idx = attempts.findIndex(a => a[col] === val);
              if (idx !== -1) attempts.splice(idx, 1);
              return Promise.resolve({ error: null });
            },
          }),
        };
      }

      if (table === "qa_questions") {
        return {
          update: (fields: any) => ({
            eq: (col: string, val: string) => {
              if (fields.is_reviewed) questionReviewed = true;
              return Promise.resolve({ error: null });
            },
          }),
        };
      }

      return {};
    },
    storage: {
      from: (bucket: string) => ({
        remove: (paths: string[]) => {
          storageDeleted.push(...paths);
          return Promise.resolve({ error: null });
        },
      }),
    },
    getAttempts: () => attempts,
    getStorageDeleted: () => storageDeleted,
    isQuestionReviewed: () => questionReviewed,
  };
}

async function runTests() {
  console.log("=========================================");
  console.log("Running Phase 6: Voice Practice & Refresh Tests");
  console.log("=========================================");

  // 1. evaluateTypedPractice Structure
  {
    const result = await evaluateTypedPractice({
      typedText: "During a major launch, our database CPU spiked to 100%. I diagnosed an unindexed query, rolled out a temporary hotfix within 15 minutes, and reduced p99 latency back down to 45ms.",
      question: mockQuestion,
      answer: mockAnswer,
      memory: mockMemory,
      durationSeconds: 45,
    });

    assert.ok(result.transcript.includes("database CPU spiked"), "Transcript includes spoken content");
    assert.ok(result.feedback.strengths.length >= 1, "Provides at least 1 strength");
    assert.ok(result.feedback.improvements.length >= 1, "Provides actionable improvement");
    assert.ok(result.feedback.structureFeedback.length > 0, "Provides structure feedback");
    assert.strictEqual(result.truthStatus, "verified", "Validates truthful answer against memory");
    console.log("✓ PASS: Evaluates typed practice structure & strengths");
  }

  // 2. Spoken Truth Lock Contradiction Flagging
  {
    const contradictoryText = "I have been working in backend development for 12 years and led a team of 45 engineers.";
    const result = await evaluateTypedPractice({
      typedText: contradictoryText,
      question: mockQuestion,
      answer: mockAnswer,
      memory: mockMemory,
    });

    assert.strictEqual(result.truthStatus, "conflict", "Flags conflict when years of experience (12) exceeds verified memory (5)");
    assert.ok(result.feedback.truthCheck.warning, "Provides truthful consistency warning to candidate");
    console.log("✓ PASS: Truth Lock detects unsupported spoken claim in practice");
  }

  // 3. recordPracticeAttempt Persistence & Attempt Incrementing
  {
    const mockSupabase = createMockSupabase();

    const attempt1 = await recordPracticeAttempt({
      questionId: mockQuestion.id,
      userId: "user-1",
      stageId: "stage-1",
      mode: "voice",
      userResponse: "Spoken transcript test 1",
      transcript: "Spoken transcript test 1",
      score: 75,
      feedback: {
        strengths: ["Clear tone"],
        improvements: ["State result faster"],
        anchorCoverage: { coveredAnchors: [], missedAnchors: [] },
        structureFeedback: "Good opening",
        durationFeedback: "30s duration",
        truthCheck: { status: "verified" },
        overallVerdict: "nearly_ready",
      },
      durationSeconds: 30,
      truthStatus: "verified",
      clientSupabase: mockSupabase,
    });

    assert.strictEqual(attempt1.attempt_number, 1, "First attempt has attempt_number 1");
    assert.strictEqual(attempt1.mode, "voice", "Records voice mode");
    assert.strictEqual(mockSupabase.isQuestionReviewed(), false, "Nearly ready verdict does not auto-complete review");

    // Second attempt ready
    const attempt2 = await recordPracticeAttempt({
      questionId: mockQuestion.id,
      userId: "user-1",
      stageId: "stage-1",
      mode: "voice",
      userResponse: "Spoken transcript test 2 with clear result",
      transcript: "Spoken transcript test 2 with clear result",
      score: 95,
      feedback: {
        strengths: ["Great result", "Clear pacing"],
        improvements: ["Keep it up"],
        anchorCoverage: { coveredAnchors: ["CPU spiked"], missedAnchors: [] },
        structureFeedback: "Complete STAR structure",
        durationFeedback: "45s duration",
        truthCheck: { status: "verified" },
        overallVerdict: "ready",
      },
      durationSeconds: 45,
      truthStatus: "verified",
      clientSupabase: mockSupabase,
    });

    assert.strictEqual(attempt2.attempt_number, 2, "Second attempt has attempt_number 2");
    assert.strictEqual(attempt2.is_best_attempt, true, "Ready verdict marks is_best_attempt = true");
    assert.strictEqual(mockSupabase.isQuestionReviewed(), true, "Ready verdict automatically marks question as reviewed");
    console.log("✓ PASS: Increments attempt numbers and updates review state on ready verdict");
  }

  // 4. deletePracticeAttempt with Storage Cleanup
  {
    const initialAttempts = [
      {
        id: "att-to-del",
        question_id: "q-test-1",
        user_id: "user-1",
        audio_storage_path: "user-1/app-test-1/att-to-del/source.webm",
      },
    ];

    const mockSupabase = createMockSupabase(initialAttempts);

    // Delete existing attempt
    const success = await deletePracticeAttempt("att-to-del", "user-1", mockSupabase);
    assert.strictEqual(success, true, "Returns true on successful deletion");
    assert.strictEqual(mockSupabase.getAttempts().length, 0, "Removes attempt from database");
    assert.deepStrictEqual(mockSupabase.getStorageDeleted(), ["user-1/app-test-1/att-to-del/source.webm"], "Cleans up audio file from Supabase storage");

    // Unauthorized delete attempt
    const unauthorizedSupabase = createMockSupabase([{ id: "att-other", user_id: "user-2" }]);
    await assert.rejects(
      async () => {
        await deletePracticeAttempt("att-other", "user-1", unauthorizedSupabase);
      },
      QAAuthorizationError,
      "Rejects deletion of other user's practice attempt"
    );

    console.log("✓ PASS: deletePracticeAttempt deletes record, cleans up storage, and enforces authorization");
  }

  // 5. generateStageEmployerQuestions
  {
    const recruiterQs = generateStageEmployerQuestions("Acme", "Backend Engineer", "recruiter_screening");
    assert.ok(recruiterQs.some(q => q.includes("first 90 days")), "Includes milestones question for recruiter screening");

    const techQs = generateStageEmployerQuestions("Acme", "Backend Engineer", "technical_interview");
    assert.ok(techQs.some(q => q.includes("technical or operational challenges")), "Includes tech challenge question for tech round");

    const hmQs = generateStageEmployerQuestions("Acme", "Backend Engineer", "hiring_manager");
    assert.ok(hmQs.some(q => q.includes("measure success and impact")), "Includes success measurement question for HM round");

    console.log("✓ PASS: Generates stage-tailored employer questions for each round");
  }

  console.log("\n=========================================");
  console.log("Phase 6 Practice Test Results: All Passed!");
  console.log("=========================================\n");
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
