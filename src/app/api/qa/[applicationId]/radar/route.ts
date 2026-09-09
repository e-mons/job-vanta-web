import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { buildApplicationQAContext, QAAuthorizationError, QANotFoundError } from "@/services/qa/qaContextBuilder";
import { summarizeRiskRadar } from "@/services/qa/questionRiskRadarService";
import { buildApplicationMemory } from "@/services/qa/applicationMemoryService";
import { mapApplicationStatusToStageType } from "@/services/qa/qaStageMapper";
import type { QAQuestion, QAAnswer } from "@shared/types/qa";

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

    // 1. Authoritative context check
    const context = await buildApplicationQAContext(applicationId, user.id, supabase);

    // 2. Fetch Workspace
    const { data: workspace } = await supabase
      .from("application_qa_workspaces")
      .select("id")
      .eq("application_id", applicationId)
      .maybeSingle();

    if (!workspace) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    // 3. Resolve active stage type
    const stageType = mapApplicationStatusToStageType(context.status);

    // 4. Fetch questions and answers
    const { data: rawQuestions } = await supabase
      .from("qa_questions")
      .select(`
        *,
        answer:qa_answers(*)
      `)
      .eq("workspace_id", workspace.id)
      .order("order_index", { ascending: true });

    const questionsWithAnswers: (QAQuestion & { answer: QAAnswer | null })[] = (rawQuestions || []).map((q: any) => ({
      ...q,
      answer: Array.isArray(q.answer) ? q.answer[0] || null : q.answer || null,
    }));

    // 5. Load memory for background context
    let memory = null;
    try {
      memory = await buildApplicationMemory(applicationId, user.id, supabase);
    } catch {}

    const radarSummary = summarizeRiskRadar(questionsWithAnswers, workspace.id, stageType, memory);

    return NextResponse.json({
      success: true,
      data: radarSummary,
    });
  } catch (err: any) {
    console.error("[API /api/qa/[applicationId]/radar Error]:", err);

    if (err instanceof QAAuthorizationError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof QANotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: err.message || "Failed to load Question Risk Radar" },
      { status: 500 }
    );
  }
}
