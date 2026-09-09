import { 
  mapApplicationStatusToStageType, 
  isApplicationActive, 
  STAGE_DEFINITIONS 
} from "../qaStageMapper";
import { 
  evaluateQuestionRisk, 
  selectTopQuestionsToPrepare, 
  buildFiveMinuteRefresh, 
  summarizeRiskRadar 
} from "../questionRiskRadarService";
import { calculateApplicationQAReadiness } from "../qaReadinessService";
import { 
  getStageJourneySummary, 
  transitionStage, 
  toggleQuestionReview 
} from "../qaJourneyService";
import type { QAQuestion, QAAnswer, QAWorkspace, QAStage } from "../../../../../shared/types/qa";

/**
 * Mock Supabase Database Helper for Journey and Radar tests
 */
function createMockSupabaseForJourney(initialData: {
  application?: any;
  workspace?: any;
  stages?: any[];
  questions?: any[];
  answers?: any[];
}) {
  const store = {
    workspaces: initialData.workspace ? [{ ...initialData.workspace }] : [],
    stages: initialData.stages ? [...initialData.stages] : [],
    questions: initialData.questions ? [...initialData.questions] : [],
    answers: initialData.answers ? [...initialData.answers] : [],
  };

  return {
    _store: store,
    from: (table: string) => {
      if (table === "job_applications") {
        return {
          select: () => ({
            eq: (col: string, val: string) => ({
              single: async () => {
                if (initialData.application && initialData.application.id === val) {
                  return { data: initialData.application, error: null };
                }
                return { data: null, error: { message: "Not found" } };
              },
            }),
          }),
        };
      }

      if (table === "application_qa_workspaces") {
        return {
          select: () => ({
            eq: (col: string, val: string) => ({
              maybeSingle: async () => {
                const found = store.workspaces.find((w: any) => w[col] === val);
                return { data: found || null, error: null };
              },
              single: async () => {
                const found = store.workspaces.find((w: any) => w[col] === val);
                return { data: found || null, error: found ? null : { message: "Not found" } };
              },
            }),
          }),
          update: (updates: any) => ({
            eq: (col: string, val: string) => ({
              select: () => ({
                single: async () => {
                  const idx = store.workspaces.findIndex((w: any) => w[col] === val);
                  if (idx !== -1) {
                    store.workspaces[idx] = { ...store.workspaces[idx], ...updates };
                    return { data: store.workspaces[idx], error: null };
                  }
                  return { data: null, error: { message: "Not found" } };
                },
              }),
              then: (res: any) => {
                const idx = store.workspaces.findIndex((w: any) => w[col] === val);
                if (idx !== -1) store.workspaces[idx] = { ...store.workspaces[idx], ...updates };
                return Promise.resolve(res ? res({ error: null }) : { error: null });
              },
            }),
          }),
        };
      }

      if (table === "qa_preparation_stages") {
        return {
          select: () => ({
            eq: (col1: string, val1: string) => ({
              eq: (col2: string, val2: any) => ({
                maybeSingle: async () => {
                  const found = store.stages.find((s: any) => s[col1] === val1 && s[col2] === val2);
                  return { data: found || null, error: null };
                },
              }),
              order: () => Promise.resolve({
                data: store.stages.filter((s: any) => s[col1] === val1),
                error: null,
              }),
            }),
          }),
          update: (updates: any) => ({
            eq: (col: string, val: string) => ({
              select: () => ({
                single: async () => {
                  const idx = store.stages.findIndex((s: any) => s[col] === val);
                  if (idx !== -1) {
                    store.stages[idx] = { ...store.stages[idx], ...updates };
                    return { data: store.stages[idx], error: null };
                  }
                  return { data: null, error: { message: "Not found" } };
                },
              }),
              then: (res: any) => {
                store.stages.forEach((s: any) => {
                  if (s[col] === val) Object.assign(s, updates);
                });
                return Promise.resolve(res ? res({ error: null }) : { error: null });
              },
            }),
          }),
          insert: (items: any | any[]) => {
            const arr = Array.isArray(items) ? items : [items];
            const created = arr.map((item, idx) => ({ id: `stage-${Date.now()}-${idx}`, ...item }));
            store.stages.push(...created);
            return {
              select: () => ({
                single: async () => ({ data: created[0], error: null }),
              }),
            };
          },
        };
      }

      if (table === "qa_questions") {
        return {
          select: () => ({
            eq: (col: string, val: string) => ({
              single: async () => {
                const found = store.questions.find((q: any) => q[col] === val);
                return { data: found || null, error: found ? null : { message: "Not found" } };
              },
              order: () => {
                const filtered = store.questions.filter((q: any) => q[col] === val);
                return Promise.resolve({
                  data: filtered.map(q => ({
                    ...q,
                    answer: store.answers.filter((a: any) => a.question_id === q.id),
                  })),
                  error: null,
                });
              },
            }),
            single: async () => {
              const found = store.questions[0];
              return { data: found || null, error: found ? null : { message: "Not found" } };
            },
          }),
          update: (updates: any) => ({
            eq: (col: string, val: string) => ({
              select: () => ({
                single: async () => {
                  const idx = store.questions.findIndex((q: any) => q[col] === val);
                  if (idx !== -1) {
                    store.questions[idx] = { ...store.questions[idx], ...updates };
                    return { data: store.questions[idx], error: null };
                  }
                  return { data: null, error: { message: "Not found" } };
                },
              }),
            }),
          }),
          delete: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
          insert: (items: any[]) => ({
            select: async () => {
              const created = items.map((item, idx) => ({ id: `q-${Date.now()}-${idx}`, ...item }));
              store.questions.push(...created);
              return { data: created, error: null };
            },
          }),
        };
      }

      if (table === "qa_answers") {
        return {
          insert: (items: any[]) => ({
            select: async () => {
              const created = items.map((item, idx) => ({ id: `ans-${Date.now()}-${idx}`, ...item }));
              store.answers.push(...created);
              return { data: created, error: null };
            },
          }),
        };
      }

      if (table === "qa_clarifications") {
        return {
          select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
          insert: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        };
      }

      if (table === "cover_letters") {
        return {
          select: () => ({
            eq: () => ({
              ilike: () => ({
                limit: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
            }),
          }),
        };
      }

      if (table === "resumes") {
        return {
          select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
        };
      }

      return {
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
      };
    },
  };
}

async function runStageAndRadarTests() {
  console.log("=========================================");
  console.log("Running Phase 4: Stage-Aware Journey & Risk Radar Tests");
  console.log("=========================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName}`);
      failed++;
    }
  }

  // Test 1: Canonical Application Status Mapping
  try {
    assert(mapApplicationStatusToStageType("applied") === "application", "Maps 'applied' to 'application'");
    assert(mapApplicationStatusToStageType("screening") === "recruiter_screening", "Maps 'screening' to 'recruiter_screening'");
    assert(mapApplicationStatusToStageType("technical_interview") === "technical_interview", "Maps 'technical_interview' to 'technical_interview'");
    assert(mapApplicationStatusToStageType("hiring_manager") === "hiring_manager", "Maps 'hiring_manager' to 'hiring_manager'");
    assert(mapApplicationStatusToStageType("final_round") === "final_interview", "Maps 'final_round' to 'final_interview'");
    assert(mapApplicationStatusToStageType("offer_stage") === "offer_discussion", "Maps 'offer_stage' to 'offer_discussion'");
    assert(isApplicationActive("applied") === true, "Identifies 'applied' as active");
    assert(isApplicationActive("rejected") === false, "Identifies 'rejected' as inactive");
  } catch (e: any) {
    console.error("Test 1 error:", e);
    failed++;
  }

  // Test 2: Question Risk Radar 3-Tier Classification
  try {
    const q1: QAQuestion = {
      id: "q-1",
      stage_id: "s-1",
      workspace_id: "ws-1",
      user_id: "u-1",
      question_text: "Tell me about managing Kubernetes in production.",
      category: "technical",
      priority: "high",
      risk_level: "high",
      what_employer_means: "Checking container orchestration mastery",
      order_index: 1,
      is_user_reported: false,
      source_provenance: null,
      created_at: "",
      updated_at: "",
    };
    const a1: QAAnswer = {
      id: "a-1",
      question_id: "q-1",
      user_id: "u-1",
      suggested_quick: "...",
      suggested_normal: "...",
      suggested_detailed: "...",
      user_edited_answer: null,
      active_version: "normal",
      answer_anchors: [],
      truth_status: "needs_clarification",
      verification_details: null,
      claims_payload: null,
      provenance: null,
      created_at: "",
      updated_at: "",
    };

    const evaluated1 = evaluateQuestionRisk(q1, a1);
    assert(evaluated1.riskGroup === "important", "Classifies missing evidence / clarification as 🔴 Important To Prepare");
    assert(evaluated1.preparationPriority === "prepare_first", "Sets preparation priority to 'prepare_first'");

    const q2: QAQuestion = {
      ...q1,
      id: "q-2",
      question_text: "How do you handle team disagreements on technical choices?",
      category: "behavioral",
      priority: "high",
      risk_level: "medium",
    };
    const a2: QAAnswer = {
      ...a1,
      id: "a-2",
      question_id: "q-2",
      truth_status: "verified",
    };

    const evaluated2 = evaluateQuestionRisk(q2, a2);
    assert(evaluated2.riskGroup === "prepare", "Classifies medium risk competency as 🟡 Prepare Carefully");

    const q3: QAQuestion = {
      ...q1,
      id: "q-3",
      question_text: "Tell me about your experience building web apps in React.",
      category: "technical",
      priority: "medium",
      risk_level: "low",
    };
    const a3: QAAnswer = {
      ...a1,
      id: "a-3",
      question_id: "q-3",
      truth_status: "verified",
    };

    const evaluated3 = evaluateQuestionRisk(q3, a3);
    assert(evaluated3.riskGroup === "strong", "Classifies verified low risk as 🟢 Strong Area");
  } catch (e: any) {
    console.error("Test 2 error:", e);
    failed++;
  }

  // Test 3: Top 3 Questions Selector & 5-Minute Refresh
  try {
    const questionsWithAnswers: any[] = [
      {
        id: "q-strong",
        questionText: "Strong React Question",
        category: "technical",
        priority: "low",
        risk_level: "low",
        is_reviewed: true,
        answer: { truth_status: "verified" },
      },
      {
        id: "q-prepare",
        questionText: "Prepare Leadership Question",
        category: "behavioral",
        priority: "high",
        risk_level: "medium",
        is_reviewed: false,
        answer: { truth_status: "verified" },
      },
      {
        id: "q-important",
        questionText: "Important Kubernetes Question",
        category: "technical",
        priority: "high",
        risk_level: "high",
        is_reviewed: false,
        answer: { truth_status: "needs_clarification" },
      },
    ];

    const summary = summarizeRiskRadar(questionsWithAnswers, "ws-1", "technical_interview");
    assert(summary.strongCount === 1, "Correct strong count (1)");
    assert(summary.prepareCount === 1, "Correct prepare count (1)");
    assert(summary.importantCount === 1, "Correct important count (1)");
    assert(summary.topThreeQuestions[0].questionId === "q-important", "Ranks 🔴 Important question first in top 3 selector");
    assert(summary.fiveMinuteRefresh.topThreeQuestions.length === 3, "Assembles top 3 questions in 5-Minute Refresh");
  } catch (e: any) {
    console.error("Test 3 error:", e);
    failed++;
  }

  // Test 4: Interview Readiness Calculation
  try {
    const ws: QAWorkspace = {
      id: "ws-1",
      application_id: "app-1",
      user_id: "u-1",
      status: "ready",
      readiness_score: 0,
      is_stale: false,
      stale_reason: null,
      source_hash: "hash",
      last_prepared_at: null,
      created_at: "",
      updated_at: "",
    };

    // 4 verified questions, 2 reviewed
    const questions: any[] = [
      { id: "1", priority: "high", risk_level: "low", is_reviewed: true, answer: { truth_status: "verified" } },
      { id: "2", priority: "high", risk_level: "low", is_reviewed: true, answer: { truth_status: "verified" } },
      { id: "3", priority: "medium", risk_level: "medium", is_reviewed: false, answer: { truth_status: "verified" } },
      { id: "4", priority: "medium", risk_level: "low", is_reviewed: false, answer: { truth_status: "verified" } },
    ];

    const readiness = calculateApplicationQAReadiness(ws, [], questions, "technical_interview");
    assert(readiness.readinessScore >= 80, `Calculates high readiness score (${readiness.readinessScore})`);
    assert(readiness.readinessLevel === "Nearly Ready" || readiness.readinessLevel === "Ready", "Readiness level matches score bracket");
    assert(readiness.reviewedCount === 2, "Counts 2 reviewed questions");

    // Adding a Truth Lock conflict lowers readiness
    const questionsWithConflict = [
      ...questions,
      { id: "5", priority: "high", risk_level: "high", is_reviewed: false, answer: { truth_status: "conflict" } },
    ];

    const readinessWithConflict = calculateApplicationQAReadiness(ws, [], questionsWithConflict, "technical_interview");
    assert(readinessWithConflict.readinessScore < readiness.readinessScore, "Conflict lowers readiness score");
    assert(readinessWithConflict.unresolvedTruthCount === 1, "Detects 1 unresolved truth issue");
  } catch (e: any) {
    console.error("Test 4 error:", e);
    failed++;
  }

  // Test 5: Stage Journey Summary & Stage Transition
  try {
    const mockDb = createMockSupabaseForJourney({
      application: {
        id: "app-journey-1",
        user_id: "user-1",
        status: "applied",
        created_at: new Date().toISOString(),
        metadata: { title: "Lead Frontend Engineer", company: "Stripe" },
      },
      workspace: {
        id: "ws-journey-1",
        application_id: "app-journey-1",
        user_id: "user-1",
        status: "ready",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      stages: [
        {
          id: "stage-app-1",
          workspace_id: "ws-journey-1",
          user_id: "user-1",
          stage_type: "application",
          stage_order: 1,
          title: "Application Review",
          status: "in_progress",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      questions: [
        {
          id: "q-app-1",
          stage_id: "stage-app-1",
          workspace_id: "ws-journey-1",
          user_id: "user-1",
          question_text: "Why do you want to work at Stripe?",
          category: "general",
          priority: "high",
          risk_level: "low",
          is_reviewed: false,
        },
      ],
      answers: [
        {
          id: "ans-app-1",
          question_id: "q-app-1",
          user_id: "user-1",
          truth_status: "verified",
        },
      ],
    });

    const summary = await getStageJourneySummary("app-journey-1", "user-1", mockDb);
    assert(summary.activeStage.stage_type === "application", "Identifies active stage as 'application'");
    assert(summary.readiness.totalQuestions === 1, "Includes questions count in readiness");

    // Test toggleQuestionReview
    const reviewed = await toggleQuestionReview("q-app-1", true, "user-1", mockDb);
    assert(reviewed.is_reviewed === true, "Marks question as reviewed");
  } catch (e: any) {
    console.error("Test 5 error:", e);
    failed++;
  }

  console.log("\n=========================================");
  console.log(`Phase 4 Stage & Radar Test Results: ${passed} Passed, ${failed} Failed`);
  console.log("=========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runStageAndRadarTests().catch((err) => {
  console.error("Unhandled test runner exception:", err);
  process.exit(1);
});
