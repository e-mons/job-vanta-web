import { 
  saveCareerStory, 
  findRelevantCareerStories, 
  recordStoryUsage, 
  deleteCareerStory,
  structureCareerStoryWithAI 
} from "../qaStoryBankService";
import { 
  matchActualToPredictedQuestion, 
  recordActualInterviewQuestion, 
  recordInterviewCheckin, 
  getRoundLearningSummary 
} from "../qaInterviewLearningService";
import { QAAuthorizationError } from "../qaContextBuilder";
import type { ApplicationMemory, QAQuestion, UserCareerStory } from "@shared/types/qa";

console.log("=========================================");
console.log("Running Phase 7: Career Story Bank & Interview Learning Tests");
console.log("=========================================");

let passedTests = 0;
function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✓ PASS: ${message}`);
  passedTests++;
}

async function runTests() {
  const mockUserId = "user-123";
  const mockApplicationId = "app-789";

  const mockMemory: ApplicationMemory = {
    applicationId: mockApplicationId,
    userId: mockUserId,
    companyName: "Acme Corp",
    jobTitle: "Senior Full-Stack Engineer",
    appliedAt: "2026-08-01T10:00:00Z",
    applicationTruth: {
      hasSubmittedSnapshot: true,
      submittedResumeTitle: "Senior Engineer",
      statedSalaryExpectation: "120k",
      statedAvailability: "immediate",
      statedNoticePeriod: "1 month",
      statedRelocation: "no",
      statedWorkAuthorization: "citizen",
      submittedSkills: ["TypeScript", "React", "PostgreSQL", "Docker"],
      submittedExperienceYears: 6,
      submittedExperienceRoles: [
        { company: "TechCorp", role: "Senior Engineer", dates: "2020 - 2026" }
      ],
      submittedApplicationAnswers: {},
    },
    careerTruth: {
      currentResumeTitle: "Senior Engineer",
      currentSkills: ["TypeScript", "React", "PostgreSQL", "Docker"],
      currentExperienceYears: 6,
      currentExperienceRoles: [
        { company: "TechCorp", role: "Senior Engineer", dates: "2020 - 2026" }
      ],
      activeConfirmations: [],
    },
    divergences: {
      experienceYearsDiff: 0,
      newSkillsAddedSinceSubmission: [],
      rolesModifiedSinceSubmission: [],
      salaryRangeChanged: false,
    },
    provenance: {
      sourceSnapshotId: "snap-1",
      isHistoricalImmutable: true,
      reconstructedAt: new Date().toISOString(),
    },
  };

  const storiesTable: UserCareerStory[] = [];
  const usageTable: any[] = [];
  const actualQuestionsTable: any[] = [];
  const checkinsTable: any[] = [];

  const mockSupabase: any = {
    from: (table: string) => {
      const createQueryBuilder = (currentData: any[]) => {
        const builder: any = {
          data: currentData,
          error: null,
          select: () => builder,
          eq: (col: string, val: any) => {
            const filtered = currentData.filter((r: any) => r[col] === val);
            return createQueryBuilder(filtered);
          },
          order: () => builder,
          limit: () => builder,
          maybeSingle: async () => ({
            data: currentData[0] || null,
            error: null,
          }),
          single: async () => ({
            data: currentData[0] || null,
            error: currentData[0] ? null : { message: "Not found" },
          }),
        };
        return builder;
      };

      return {
        select: (cols = "*") => {
          let targetData: any[] = [];
          if (table === "user_career_stories") targetData = storiesTable;
          if (table === "qa_story_usage") targetData = usageTable;
          if (table === "qa_actual_interview_questions") targetData = actualQuestionsTable;
          if (table === "qa_interview_checkins") targetData = checkinsTable;
          return createQueryBuilder(targetData);
        },
        insert: (record: any) => ({
          select: () => ({
            single: async () => {
              const row = { id: `id-${Date.now()}-${Math.random()}`, ...record };
              if (table === "user_career_stories") storiesTable.push(row);
              if (table === "qa_story_usage") usageTable.push(row);
              if (table === "qa_actual_interview_questions") actualQuestionsTable.push(row);
              if (table === "qa_interview_checkins") checkinsTable.push(row);
              return { data: row, error: null };
            },
          }),
        }),
        update: (updates: any) => ({
          eq: (col: string, val: any) => {
            const idx = storiesTable.findIndex((s) => s[col as keyof UserCareerStory] === val);
            if (idx >= 0) {
              storiesTable[idx] = { ...storiesTable[idx], ...updates };
            }
            const resObj: any = {
              data: idx >= 0 ? storiesTable[idx] : null,
              error: idx >= 0 ? null : { message: "Not found" },
              select: () => ({
                single: async () => ({
                  data: idx >= 0 ? storiesTable[idx] : null,
                  error: idx >= 0 ? null : { message: "Not found" },
                }),
              }),
              then: (resolve: any) => resolve({ data: idx >= 0 ? storiesTable[idx] : null, error: null }),
            };
            return resObj;
          },
        }),
        delete: () => ({
          eq: (col: string, val: any) => {
            const idx = storiesTable.findIndex((s) => s.id === val);
            if (idx >= 0) storiesTable.splice(idx, 1);
            return { error: null };
          },
        }),
      };
    },
  };

  // 1. Create a Career Story
  const story1 = await saveCareerStory({
    userId: mockUserId,
    title: "Resolved Delayed Customer Order",
    situation: "A high-tier enterprise customer was blocked by an API timeout during Black Friday.",
    action: "I profiled slow database queries, introduced Redis caching, and restored endpoint latency under 150ms.",
    result: "The customer resumed operations without data loss and retained their annual contract.",
    supportedCompetencies: ["Problem Solving", "Customer Communication", "System Architecture"],
    memory: mockMemory,
    clientSupabase: mockSupabase,
  });

  assert(story1.title === "Resolved Delayed Customer Order", "Saves Career Story with correct title");
  assert(story1.truth_status === "verified", "Marks story truth_status as verified when claims pass Truth Lock");
  assert(storiesTable.length === 1, "Exactly one story stored in table");

  // 2. Duplicate Detection: Attempting to save the same event merges/updates rather than duplicating
  const duplicateAttempt = await saveCareerStory({
    userId: mockUserId,
    title: "Resolved Delayed Customer Order", // Same title
    situation: "A high-tier enterprise customer was blocked by an API timeout during Black Friday.",
    action: "I profiled slow database queries, introduced Redis caching, and restored endpoint latency under 150ms.",
    result: "The customer resumed operations without data loss.",
    supportedCompetencies: ["Performance Optimization"],
    clientSupabase: mockSupabase,
  });

  assert(duplicateAttempt.id === story1.id, "Duplicate detection identifies existing story and reuses same ID");
  assert(storiesTable.length === 1, "Does not insert duplicate row into database");
  assert(
    duplicateAttempt.supported_competencies.includes("Performance Optimization"),
    "Merges new competencies into existing story"
  );

  // 3. Truth Lock Claim Conflict on Unverified Number
  const conflictStory = await saveCareerStory({
    userId: mockUserId,
    title: "Managed Massive Team",
    situation: "I worked as an individual contributor.",
    action: "I have 18 years of experience managing 45 engineers.", // Exceeds 6 verified years
    result: "Delivered product on time.",
    memory: mockMemory,
    clientSupabase: mockSupabase,
  });

  assert(conflictStory.truth_status === "conflict", "Flags truth_status as conflict on contradictory experience claim");

  // 4. Story Ranking & Recommendation
  story1.is_favorite = true; // Favorite bonus
  const recommended = await findRelevantCareerStories({
    userId: mockUserId,
    category: "problem_solving",
    questionText: "Tell me about a time you solved an unexpected technical problem.",
    clientSupabase: mockSupabase,
    limit: 3,
  });

  assert(recommended.length > 0, "Returns recommended stories for problem-solving question");
  assert(recommended[0].id === story1.id, "Ranks top matching story first");

  // 5. Record Story Usage
  const usage = await recordStoryUsage({
    storyId: story1.id,
    userId: mockUserId,
    applicationId: mockApplicationId,
    questionId: "q-101",
    clientSupabase: mockSupabase,
  });

  assert(usage.story_id === story1.id, "Records story usage successfully");
  const updatedInDb = storiesTable.find((s) => s.id === story1.id);
  assert(updatedInDb?.times_used === 1, "Increments times_used count on story");

  // 6. Delete Story with Authorization Check
  try {
    await deleteCareerStory(story1.id, "unauthorized-user", mockSupabase);
    assert(false, "Should have thrown QAAuthorizationError for wrong user");
  } catch (err: any) {
    assert(err instanceof QAAuthorizationError, "Throws QAAuthorizationError on unauthorized delete attempt");
  }

  // 7. Semantic Matching for Predicted vs Actual Interview Questions
  const predictedQuestions: QAQuestion[] = [
    {
      id: "pred-q1",
      stage_id: "s1",
      workspace_id: "ws1",
      user_id: mockUserId,
      question_text: "Why do you want to work at Acme Corp?",
      category: "culture_fit",
      priority: "high",
      risk_level: "low",
      what_employer_means: "Evaluating candidate mission alignment",
      order_index: 0,
      is_reviewed: false,
      is_user_reported: false,
      source_provenance: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "pred-q2",
      stage_id: "s1",
      workspace_id: "ws1",
      user_id: mockUserId,
      question_text: "Tell me about a time you handled a difficult customer escalation.",
      category: "behavioral",
      priority: "high",
      risk_level: "medium",
      what_employer_means: "Evaluating conflict resolution under pressure",
      order_index: 1,
      is_reviewed: false,
      is_user_reported: false,
      source_provenance: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const matchedId = await matchActualToPredictedQuestion(
    "What attracted you to work at Acme Corp?",
    predictedQuestions
  );
  assert(matchedId === "pred-q1", "Semantically matches actual question to predicted question");

  // 8. Record Actually Asked Interview Question
  const actualQ = await recordActualInterviewQuestion({
    applicationId: mockApplicationId,
    userId: mockUserId,
    questionText: "How do you handle database failover in production?",
    difficultyRating: "struggled",
    notes: "Review replication lag formulas",
    clientSupabase: mockSupabase,
  });

  assert(actualQ.question_text.includes("database failover"), "Records actual question accurately");
  assert(actualQ.difficulty_rating === "struggled", "Records difficulty rating");

  // 9. Record Post-Interview Check-In
  const checkin = await recordInterviewCheckin({
    applicationId: mockApplicationId,
    userId: mockUserId,
    feeling: "okay",
    notes: "Went well overall, technical part had deep questions on caching",
    clientSupabase: mockSupabase,
  });

  assert(checkin.feeling === "okay", "Records interview check-in feeling");

  // 10. Round Learning Summary
  const summary = await getRoundLearningSummary(mockApplicationId, mockUserId, mockSupabase);
  assert(summary !== null, "Generates Round Learning Summary");
  assert(summary?.struggledTopics.length === 1, "Identifies struggled topics for next round focus");
  assert(
    summary?.nextRoundPriorities.length ? summary.nextRoundPriorities.length > 0 : false,
    "Generates actionable next round preparation priorities"
  );

  console.log("\n=========================================");
  console.log(`Phase 7 Story Bank & Learning Test Results: ${passedTests} Passed, 0 Failed`);
  console.log("=========================================\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
