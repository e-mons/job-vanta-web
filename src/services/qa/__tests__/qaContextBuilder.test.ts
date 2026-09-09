import { 
  buildApplicationQAContext, 
  computeQASourceHash, 
  QAAuthorizationError, 
  QANotFoundError 
} from "../qaContextBuilder";
import { getOrCreateQAWorkspace } from "../qaWorkspaceService";

/**
 * Mock Supabase Client Helper for Unit Testing
 */
function createMockSupabase(mockData: {
  application?: any;
  resume?: any;
  coverLetter?: any;
  workspace?: any;
  stages?: any[];
}) {
  const store = {
    workspaces: mockData.workspace ? [mockData.workspace] : [],
    stages: mockData.stages || [],
  };

  return {
    from: (table: string) => {
      if (table === "job_applications") {
        return {
          select: () => ({
            eq: (col: string, val: string) => ({
              single: async () => {
                if (mockData.application && mockData.application.id === val) {
                  return { data: mockData.application, error: null };
                }
                return { data: null, error: { message: "Not found", code: "PGRST116" } };
              },
            }),
          }),
        };
      }

      if (table === "resumes") {
        return {
          select: () => ({
            eq: (col: string, val: string) => ({
              single: async () => {
                if (mockData.resume && mockData.resume.id === val) {
                  return { data: mockData.resume, error: null };
                }
                return { data: null, error: { message: "Resume not found" } };
              },
            }),
          }),
        };
      }

      if (table === "cover_letters") {
        return {
          select: () => ({
            eq: () => ({
              ilike: () => ({
                limit: () => ({
                  maybeSingle: async () => {
                    return { data: mockData.coverLetter || null, error: null };
                  },
                }),
              }),
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
          insert: (item: any) => ({
            select: () => ({
              single: async () => {
                const created = { id: `ws-${Date.now()}`, ...item, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
                store.workspaces.push(created);
                return { data: created, error: null };
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
            }),
          }),
        };
      }

      if (table === "qa_preparation_stages") {
        return {
          select: () => ({
            eq: (col: string, val: string) => ({
              order: () => Promise.resolve({ data: store.stages.filter((s: any) => s[col] === val), error: null }),
            }),
          }),
          insert: (items: any[]) => ({
            select: async () => {
              const created = items.map((item, idx) => ({ id: `stage-${idx}`, ...item }));
              store.stages.push(...created);
              return { data: created, error: null };
            },
          }),
        };
      }

      return {
        select: () => ({
          eq: () => ({ single: async () => ({ data: null, error: null }) }),
        }),
      };
    },
  };
}

async function runTests() {
  console.log("=========================================");
  console.log("Running QA Domain & Context Builder Tests");
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

  // Test 1: Rejects unauthorized user (IDOR prevention)
  try {
    const mockDb = createMockSupabase({
      application: {
        id: "app-123",
        user_id: "user-owner-999",
        resume_id: "resume-111",
        status: "applied",
        metadata: { title: "Software Engineer", company: "Acme Corp" },
        created_at: new Date().toISOString(),
      },
    });

    try {
      await buildApplicationQAContext("app-123", "attacker-user-000", mockDb);
      assert(false, "Should reject unauthorized user");
    } catch (err: any) {
      assert(err instanceof QAAuthorizationError, "Rejects unauthorized user with QAAuthorizationError");
    }
  } catch (e: any) {
    console.error("Test 1 error:", e);
    failed++;
  }

  // Test 2: Throws QANotFoundError when application does not exist
  try {
    const mockDb = createMockSupabase({});
    try {
      await buildApplicationQAContext("non-existent-app", "user-123", mockDb);
      assert(false, "Should throw QANotFoundError for missing application");
    } catch (err: any) {
      assert(err instanceof QANotFoundError, "Throws QANotFoundError for non-existent application");
    }
  } catch (e: any) {
    console.error("Test 2 error:", e);
    failed++;
  }

  // Test 3: Prioritizes immutable resume_snapshot over live resume
  try {
    const mockDb = createMockSupabase({
      application: {
        id: "app-snap-1",
        user_id: "user-1",
        resume_id: "resume-live-1",
        status: "applied",
        metadata: { title: "Senior AI Engineer", company: "DeepMind" },
        resume_snapshot: {
          personalInfo: { fullName: "Jane Doe (Submitted Version)", email: "jane@example.com" },
          skills: ["PyTorch", "Next.js", "TypeScript"],
          experience: [{ company: "Google", role: "AI Researcher", dates: "2024 - Present", bullets: ["Built scalable systems"] }],
          education: [{ school: "MIT", degree: "B.S. CS", year: "2024" }],
        },
        created_at: new Date().toISOString(),
      },
      resume: {
        id: "resume-live-1",
        title: "Live Resume Title",
        content: {
          personalInfo: { fullName: "Jane Doe (Edited Later)", email: "jane_new@example.com" },
          skills: ["Different Skills"],
        },
      },
    });

    const ctx = await buildApplicationQAContext("app-snap-1", "user-1", mockDb);
    assert(ctx.resume?.isSnapshot === true, "Resume marks isSnapshot as true");
    assert(ctx.resume?.personalInfo.fullName === "Jane Doe (Submitted Version)", "Resume uses snapshot personalInfo instead of live edits");
    assert(ctx.resume?.skills.includes("PyTorch") === true, "Resume uses snapshot skills");
    assert(ctx.job.company === "DeepMind", "Extracts correct company from metadata");
  } catch (e: any) {
    console.error("Test 3 error:", e);
    failed++;
  }

  // Test 4: Gracefully handles legacy applications with missing fields
  try {
    const mockDb = createMockSupabase({
      application: {
        id: "app-legacy-1",
        user_id: "user-1",
        resume_id: null,
        status: "applied",
        metadata: {}, // Empty metadata
        resume_snapshot: null,
        created_at: new Date().toISOString(),
      },
    });

    const ctx = await buildApplicationQAContext("app-legacy-1", "user-1", mockDb);
    assert(ctx.applicationId === "app-legacy-1", "Extracts legacy application ID");
    assert(ctx.resume === null, "Handles null resume gracefully");
    assert(ctx.job.title === "Target Role", "Provides safe fallback for missing job title");
    assert(ctx.job.company === "Hiring Company", "Provides safe fallback for missing company");
    assert(typeof ctx.sourceHash === "string" && ctx.sourceHash.length === 64, "Computes valid SHA-256 sourceHash even with partial legacy data");
  } catch (e: any) {
    console.error("Test 4 error:", e);
    failed++;
  }

  // Test 5: Hash determinism
  try {
    const payloadA = { a: 1, b: "hello", c: [1, 2, 3] };
    const payloadB = { b: "hello", a: 1, c: [1, 2, 3] }; // different key order
    const hashA = computeQASourceHash(payloadA);
    const hashB = computeQASourceHash(payloadB);
    assert(hashA === hashB, "Source hash is deterministic regardless of key order");
  } catch (e: any) {
    console.error("Test 5 error:", e);
    failed++;
  }

  // Test 6: Idempotently creates QA workspace and initializes default stages
  try {
    const mockDb = createMockSupabase({
      application: {
        id: "app-ws-test",
        user_id: "user-ws-1",
        status: "applied",
        metadata: { title: "Lead Frontend Engineer", company: "Stripe" },
        created_at: new Date().toISOString(),
      },
    });

    const result1 = await getOrCreateQAWorkspace("app-ws-test", "user-ws-1", mockDb);
    assert(result1.isNew === true, "First workspace creation returns isNew: true");
    assert(result1.workspace.status === "not_prepared", "Initial status is 'not_prepared'");
    assert(result1.stages.length === 4, "Initializes exactly 4 standard preparation stages");

    // Second call with same application
    const result2 = await getOrCreateQAWorkspace("app-ws-test", "user-ws-1", mockDb);
    assert(result2.isNew === false, "Second call returns existing workspace with isNew: false");
    assert(result2.workspace.id === result1.workspace.id, "Second call preserves exact workspace ID");
  } catch (e: any) {
    console.error("Test 6 error:", e);
    failed++;
  }

  // Test 7: Stale context detection on existing workspace
  try {
    const mockDb = createMockSupabase({
      application: {
        id: "app-stale-test",
        user_id: "user-stale-1",
        status: "applied",
        metadata: { title: "Original Role Title", company: "Meta" },
        created_at: new Date().toISOString(),
      },
      workspace: {
        id: "ws-existing-1",
        application_id: "app-stale-test",
        user_id: "user-stale-1",
        status: "ready",
        source_hash: "old-outdated-hash-12345",
        is_stale: false,
        created_at: new Date().toISOString(),
      },
      stages: [],
    });

    const result = await getOrCreateQAWorkspace("app-stale-test", "user-stale-1", mockDb);
    assert(result.workspace.is_stale === true, "Flags workspace as stale when source hash changes");
  } catch (e: any) {
    console.error("Test 7 error:", e);
    failed++;
  }

  console.log("\n=========================================");
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log("=========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Unhandled test runner exception:", err);
  process.exit(1);
});
