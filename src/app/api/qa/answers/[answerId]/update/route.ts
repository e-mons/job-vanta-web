import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyAnswerClaims } from "@/services/qa/truthLockService";
import { buildApplicationMemory } from "@/services/qa/applicationMemoryService";
import { QAAuthorizationError, QANotFoundError } from "@/services/qa/qaContextBuilder";
import type { QAAnswer, QATruthStatus } from "@shared/types/qa";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ answerId: string }> }
) {
  try {
    const { answerId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!answerId) {
      return NextResponse.json({ error: "Missing answerId" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { userEditedAnswer, activeVersion, toneAdjustment } = body;

    // 1. Fetch current answer & verify ownership
    const { data: currentAnswer, error: fetchErr } = await supabase
      .from("qa_answers")
      .select("*, question:qa_questions(workspace_id, stage_id, workspace:application_qa_workspaces(application_id))")
      .eq("id", answerId)
      .single();

    if (fetchErr || !currentAnswer) {
      throw new QANotFoundError(`Answer ${answerId} not found`);
    }

    if (currentAnswer.user_id !== user.id) {
      throw new QAAuthorizationError("You are not authorized to update this answer");
    }

    const applicationId = currentAnswer.question?.workspace?.application_id;
    let truthStatus: QATruthStatus = currentAnswer.truth_status;
    let verificationDetails = currentAnswer.verification_details;
    let claimsPayload = currentAnswer.claims_payload;

    // 2. If user edited the answer text, validate via Truth Lock
    const finalAnswerText = typeof userEditedAnswer === "string" ? userEditedAnswer.trim() : null;

    if (finalAnswerText && applicationId) {
      try {
        const memory = await buildApplicationMemory(applicationId, user.id, supabase);
        const verification = verifyAnswerClaims(finalAnswerText, memory);
        verificationDetails = verification;
        claimsPayload = verification.claims;
        if (verification.overallStatus === "conflict" || verification.overallStatus === "needs_clarification") {
          truthStatus = verification.overallStatus;
        } else {
          truthStatus = "confirmed_by_user";
        }
      } catch (err) {
        console.warn("[Answer Update] Truth Lock check warning:", err);
      }
    }

    // 3. Persist update
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (finalAnswerText !== null) {
      updatePayload.user_edited_answer = finalAnswerText;
      updatePayload.truth_status = truthStatus;
      updatePayload.verification_details = verificationDetails;
      updatePayload.claims_payload = claimsPayload;
      if (activeVersion) updatePayload.active_version = activeVersion;
    } else if (activeVersion) {
      updatePayload.active_version = activeVersion;
    }

    const { data: updated, error: updateErr } = await supabase
      .from("qa_answers")
      .update(updatePayload)
      .eq("id", answerId)
      .select()
      .single();

    if (updateErr || !updated) {
      throw new Error(`Failed to update answer: ${updateErr?.message}`);
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err: any) {
    console.error("[API /api/qa/answers/[answerId]/update Error]:", err);

    if (err instanceof QAAuthorizationError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof QANotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: err.message || "Failed to update answer" },
      { status: 500 }
    );
  }
}
