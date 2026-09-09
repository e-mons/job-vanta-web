import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { buildApplicationQAContext, QAAuthorizationError, QANotFoundError } from "@/services/qa/qaContextBuilder";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!applicationId) {
      return NextResponse.json({ error: "Missing applicationId" }, { status: 400 });
    }

    // 1. Authoritative ownership & context check
    const context = await buildApplicationQAContext(applicationId, user.id, supabase);

    const applicationMeta = {
      title: context.job.title,
      company: context.job.company,
      location: context.job.location,
      status: context.status,
    };

    // 2. Fetch Workspace
    const { data: workspace } = await supabase
      .from("application_qa_workspaces")
      .select("*")
      .eq("application_id", applicationId)
      .maybeSingle();

    if (!workspace) {
      return NextResponse.json({
        success: true,
        data: {
          workspace: null,
          stages: [],
          activeStage: null,
          applicationMeta,
          questions: [],
          questionsWithAnswers: [],
          clarifications: [],
          status: "not_prepared",
        },
      });
    }

    // 3. Fetch Stages
    const { data: stages } = await supabase
      .from("qa_preparation_stages")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("stage_order", { ascending: true });

    const activeStage = (stages || []).find((s: any) => s.is_current_stage) || stages?.[0] || null;

    // 4. Fetch Questions with joined Answers
    const { data: questions } = await supabase
      .from("qa_questions")
      .select(`
        *,
        answer:qa_answers(*)
      `)
      .eq("workspace_id", workspace.id)
      .order("order_index", { ascending: true });

    const mappedQuestions = (questions || []).map((q: any) => ({
      ...q,
      answer: Array.isArray(q.answer) ? q.answer[0] || null : q.answer || null,
    }));

    // 5. Fetch Clarifications
    const { data: clarifications } = await supabase
      .from("qa_clarifications")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      success: true,
      data: {
        workspace,
        stages: stages || [],
        activeStage,
        applicationMeta,
        questions: mappedQuestions,
        questionsWithAnswers: mappedQuestions,
        clarifications: clarifications || [],
      },
    });
  } catch (err: any) {
    console.error("[API /api/qa/[applicationId] Error]:", err);

    if (err instanceof QAAuthorizationError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof QANotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: err.message || "Failed to load Q&A workspace" },
      { status: 500 }
    );
  }
}
