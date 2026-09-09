import { 
  calculateTotalExperienceYears, 
  buildApplicationMemory 
} from "../applicationMemoryService";
import { 
  extractClaimsFromAnswer, 
  verifyAnswerClaims, 
  formatTruthfulSkillAnswer,
  adaptApplicationAnswerForInterview 
} from "../truthLockService";
import { 
  validateClarificationResponse, 
  submitClarification 
} from "../qaClarificationService";
import type { ApplicationMemory } from "../../../../../shared/types/qa";

/**
 * Mock database creator for Truth Lock tests
 */
function createMockSupabaseForTruthLock(initialData: {
  application?: any;
  resume?: any;
  latestResume?: any;
  confirmations?: any[];
  clarifications?: any[];
  answers?: any[];
  questions?: any[];
}) {
  const store = {
    confirmations: initialData.confirmations ? [...initialData.confirmations] : [],
    clarifications: initialData.clarifications ? [...initialData.clarifications] : [],
    answers: initialData.answers ? [...initialData.answers] : [],
    questions: initialData.questions ? [...initialData.questions] : [],
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
                return { data: null, error: { message: "Application not found" } };
              },
            }),
          }),
        };
      }

      if (table === "resumes") {
        return {
          select: () => ({
            eq: (col: string, val: string) => ({
              order: () => ({
                limit: async () => ({
                  data: initialData.latestResume ? [initialData.latestResume] : [],
                  error: null,
                }),
              }),
              single: async () => {
                if (initialData.resume && initialData.resume.id === val) {
                  return { data: initialData.resume, error: null };
                }
                return { data: null, error: { message: "Resume not found" } };
              },
            }),
          }),
        };
      }

      if (table === "user_career_confirmations") {
        return {
          select: () => ({
            eq: (col: string, val: string) => ({
              order: async () => ({
                data: store.confirmations.filter((c: any) => c.user_id === val),
                error: null,
              }),
            }),
          }),
          upsert: async (item: any) => {
            const idx = store.confirmations.findIndex(c => c.user_id === item.user_id && c.topic === item.topic);
            if (idx !== -1) {
              store.confirmations[idx] = { ...store.confirmations[idx], ...item };
            } else {
              store.confirmations.push({ id: `conf-${Date.now()}`, ...item });
            }
            return { error: null };
          },
        };
      }

      if (table === "qa_clarifications") {
        return {
          select: () => ({
            eq: (col: string, val: string) => ({
              single: async () => {
                const found = store.clarifications.find(c => c.id === val);
                return { data: found || null, error: found ? null : { message: "Not found" } };
              },
              order: async () => ({
                data: store.clarifications.filter(c => c.workspace_id === val),
                error: null,
              }),
            }),
          }),
          update: (updates: any) => ({
            eq: (col: string, val: string) => ({
              select: () => ({
                single: async () => {
                  const idx = store.clarifications.findIndex(c => c.id === val);
                  if (idx !== -1) {
                    store.clarifications[idx] = { ...store.clarifications[idx], ...updates };
                    return { data: store.clarifications[idx], error: null };
                  }
                  return { data: null, error: { message: "Not found" } };
                },
              }),
            }),
          }),
        };
      }

      if (table === "qa_answers") {
        return {
          select: () => ({
            eq: (col: string, val: string) => ({
              maybeSingle: async () => {
                const found = store.answers.find(a => a.question_id === val);
                return { data: found || null, error: null };
              },
            }),
          }),
          update: (updates: any) => ({
            eq: (col: string, val: string) => ({
              select: () => ({
                single: async () => {
                  const idx = store.answers.findIndex(a => a.id === val);
                  if (idx !== -1) {
                    store.answers[idx] = { ...store.answers[idx], ...updates };
                    return { data: store.answers[idx], error: null };
                  }
                  return { data: null, error: { message: "Not found" } };
                },
              }),
            }),
          }),
        };
      }

      return {
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
      };
    },
  };
}

async function runTruthLockTests() {
  console.log("=========================================");
  console.log("Running Phase 3: Truth Lock & Application Memory Tests");
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

  // Test 1: Date arithmetic & overlapping interval resolution
  try {
    const dates = [
      { dates: "2019 - 2021" }, // 2 years
      { dates: "2020 - 2023" }, // overlaps 2020-2021 -> expands 2019-2023 (4 years)
      { dates: "2024 - Present" }, // 2024 - 2026 (2 years)
    ];
    const totalYears = calculateTotalExperienceYears(dates);
    assert(totalYears >= 6, `Calculates merged experience correctly (${totalYears} years)`);
  } catch (e: any) {
    console.error("Test 1 error:", e);
    failed++;
  }

  // Test 2: Application Memory Historical Snapshot vs Live Profile
  try {
    const mockDb = createMockSupabaseForTruthLock({
      application: {
        id: "app-memory-1",
        user_id: "user-alice",
        created_at: "2025-01-10T10:00:00Z",
        metadata: {
          company: "Acme Corp",
          title: "Senior Product Manager",
          salary: "₦1,200,000/month",
          notice_period: "30 days",
          application_answers: {
            "why_acme": "I admire your customer-centric developer tools.",
          },
        },
        resume_snapshot: {
          title: "PM Resume v1",
          skills: ["Agile", "SQL", "Product Strategy"],
          experience: [
            { company: "StartupX", role: "Product Manager", dates: "2021 - 2024" }, // 3 years
          ],
        },
      },
      latestResume: {
        title: "PM Resume v2 (Updated 2026)",
        content: {
          skills: ["Agile", "SQL", "Product Strategy", "AI Prompting", "Go"],
          experience: [
            { company: "StartupX", role: "Product Manager", dates: "2021 - 2024" },
            { company: "BigTech", role: "Lead PM", dates: "2024 - Present" }, // +2 years
          ],
        },
      },
    });

    const memory = await buildApplicationMemory("app-memory-1", "user-alice", mockDb);

    assert(memory.applicationTruth.submittedExperienceYears === 3, "Application Truth preserves 3 years from snapshot");
    assert(memory.careerTruth.currentExperienceYears >= 5, "Career Truth reflects updated 5+ years");
    assert(memory.applicationTruth.statedSalaryExpectation === "₦1,200,000/month", "Extracts stated salary expectation");
    assert(memory.applicationTruth.statedNoticePeriod === "30 days", "Extracts stated notice period");
    assert(memory.divergences.newSkillsAddedSinceSubmission.includes("AI Prompting"), "Identifies new skills added to profile since application");
  } catch (e: any) {
    console.error("Test 2 error:", e);
    failed++;
  }

  // Test 3: Claim Extraction from generated answer
  try {
    const sampleAnswer = "During my 4 years of experience at StartupX, I managed a team of 6 engineers and improved deployment velocity by 35%. My salary expectation is ₦1,200,000 and I have 30 days notice.";
    const claims = extractClaimsFromAnswer(sampleAnswer);

    assert(claims.some(c => c.claimType === "years_of_experience" && c.claimedValue === 4), "Extracts years of experience claim (4 years)");
    assert(claims.some(c => c.claimType === "team_size" && c.claimedValue === 6), "Extracts team size claim (6 engineers)");
    assert(claims.some(c => c.claimType === "metric" && c.claimedValue === "35%"), "Extracts percentage improvement claim (35%)");
    assert(claims.some(c => c.claimType === "salary_expectation"), "Extracts salary expectation claim");
    assert(claims.some(c => c.claimType === "notice_period"), "Extracts notice period claim");
  } catch (e: any) {
    console.error("Test 3 error:", e);
    failed++;
  }

  // Test 4: Strict Metric & Contradiction Verification
  try {
    const mockMemory: ApplicationMemory = {
      applicationId: "app-1",
      userId: "user-1",
      companyName: "Acme Corp",
      jobTitle: "Senior PM",
      appliedAt: "2025-01-01",
      applicationTruth: {
        hasSubmittedSnapshot: true,
        submittedResumeTitle: "Resume",
        statedSalaryExpectation: "₦1,200,000",
        statedAvailability: "30 days",
        statedNoticePeriod: "30 days",
        statedRelocation: "No",
        statedWorkAuthorization: "Yes",
        submittedSkills: ["Agile", "SQL"],
        submittedExperienceYears: 4,
        submittedExperienceRoles: [
          { company: "StartupX", role: "PM", dates: "2020 - 2024" },
        ],
        submittedApplicationAnswers: {},
      },
      careerTruth: {
        currentResumeTitle: "Resume",
        currentSkills: ["Agile", "SQL"],
        currentExperienceYears: 4,
        currentExperienceRoles: [],
        activeConfirmations: [
          { id: "conf-1", user_id: "user-1", topic: "Salesforce", claim_type: "skill", confirmation_value: "no", source_clarification_id: null, created_at: "", updated_at: "" },
        ],
      },
      divergences: {
        experienceYearsDiff: 0,
        newSkillsAddedSinceSubmission: [],
        rolesModifiedSinceSubmission: [],
        salaryRangeChanged: false,
      },
      provenance: { sourceSnapshotId: null, isHistoricalImmutable: true, reconstructedAt: "" },
    };

    // Case A: 4 years experience matches snapshot -> verified
    const answerA = "I bring 4 years of experience leading agile sprint teams with SQL analytics.";
    const resultA = verifyAnswerClaims(answerA, mockMemory);
    assert(resultA.overallStatus === "verified", "Verifies claim within snapshot duration");

    // Case B: Contradicting years (claims 8 years when snapshot has 4) -> conflict
    const answerB = "I bring over 8 years of experience in product management.";
    const resultB = verifyAnswerClaims(answerB, mockMemory);
    assert(resultB.overallStatus === "conflict", "Flags conflict when claimed years (8) exceeds verified career (4)");

    // Case C: Fabricated metric without resume evidence -> unverified
    const answerC = "I grew quarterly active users by 85% across all cohorts.";
    const resultC = verifyAnswerClaims(answerC, mockMemory);
    assert(resultC.unverifiedClaimsCount > 0, "Flags unverified on fabricated metric (85%)");

    // Case D: Salary contradiction (answers $2,500,000 when stated ₦1,200,000)
    const answerD = "My expectation is around $2,500,000 annually.";
    const resultD = verifyAnswerClaims(answerD, mockMemory);
    assert(resultD.conflictCount > 0, "Flags conflict on salary expectation contradiction");

    // Case E: Tool conflict with user confirmation (User said 'No' to Salesforce)
    const answerE = "I have extensive daily experience using Salesforce for CRM tracking.";
    const resultE = verifyAnswerClaims(answerE, mockMemory);
    assert(resultE.conflictCount > 0, "Flags conflict when answer claims expertise in tool user confirmed 'No' to");
  } catch (e: any) {
    console.error("Test 4 error:", e);
    failed++;
  }

  // Test 5: Clarification Input Validation
  try {
    assert(validateClarificationResponse("yes_no_little", "Yes") === "yes", "Normalizes 'Yes' to 'yes'");
    assert(validateClarificationResponse("yes_no_little", "A Little") === "a_little", "Normalizes 'A Little' to 'a_little'");
    assert(validateClarificationResponse("number", "6") === "6", "Validates numeric response");
    assert(validateClarificationResponse("choice", "Option B", ["Option A", "Option B"]) === "Option B", "Validates choice option");

    try {
      validateClarificationResponse("yes_no_little", "expert");
      assert(false, "Should reject invalid option");
    } catch {
      assert(true, "Rejects invalid option for yes_no_little");
    }
  } catch (e: any) {
    console.error("Test 5 error:", e);
    failed++;
  }

  // Test 6: Clarification Submission & Global Scope Persistence
  try {
    const mockDb = createMockSupabaseForTruthLock({
      clarifications: [
        {
          id: "clar-test-1",
          workspace_id: "ws-1",
          question_id: "q-1",
          user_id: "user-bob",
          topic: "Kubernetes",
          clarification_type: "yes_no_little",
          scope: "global",
          status: "pending",
        },
      ],
      answers: [
        {
          id: "ans-1",
          question_id: "q-1",
          user_id: "user-bob",
          suggested_quick: null,
          suggested_normal: null,
          truth_status: "needs_clarification",
        },
      ],
    });

    const result = await submitClarification("clar-test-1", "a_little", "user-bob", {
      scope: "global",
      supabaseClient: mockDb,
    });

    assert(result.clarification.status === "resolved", "Transitions clarification to resolved");
    assert(result.savedGlobalConfirmation === true, "Persists confirmation globally");
    assert(result.updatedAnswer?.truth_status === "confirmed_by_user", "Updates answer truth status to confirmed_by_user");
    assert(Boolean(result.updatedAnswer?.suggested_normal?.includes("some exposure to Kubernetes")), "Formats truthful limited exposure framing for 'a_little'");
    assert(mockDb._store.confirmations.some(c => c.topic === "Kubernetes" && c.confirmation_value === "a_little"), "Stored in user_career_confirmations table");
  } catch (e: any) {
    console.error("Test 6 error:", e);
    failed++;
  }

  // Test 7: Truthful Fallback Formats & Answer Continuity
  try {
    const noAnswer = formatTruthfulSkillAnswer("Docker", "no", "Kubernetes");
    assert(noAnswer.normal.includes("haven't had hands-on production experience with Docker"), "Truthful 'No' admits lack of direct experience without hallucination");

    const littleAnswer = formatTruthfulSkillAnswer("Salesforce", "a_little");
    assert(littleAnswer.normal.includes("some exposure to Salesforce"), "Truthful 'A Little' avoids inflating to expert");

    const continuity = adaptApplicationAnswerForInterview("I want to work at Stripe because of your high engineering standards.", "Motivation");
    assert(continuity.includes("When I applied, I noted that i want to work at Stripe"), "Preserves application answer in spoken delivery");
  } catch (e: any) {
    console.error("Test 7 error:", e);
    failed++;
  }

  console.log("\n=========================================");
  console.log(`Phase 3 Truth Lock Test Results: ${passed} Passed, ${failed} Failed`);
  console.log("=========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTruthLockTests().catch((err) => {
  console.error("Unhandled test runner exception:", err);
  process.exit(1);
});
