import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { 
  evaluateSpokenPractice, 
  evaluateTypedPractice, 
  recordPracticeAttempt 
} from "@/services/qa/qaPracticeService";
import { buildApplicationMemory } from "@/services/qa/applicationMemoryService";
import { QAAuthorizationError, QANotFoundError } from "@/services/qa/qaContextBuilder";
import type { QAQuestion, QAAnswer } from "@shared/types/qa";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";

    let questionId = "";
    let durationSeconds = 45;
    let mode: "voice" | "text" = "text";
    let typedText = "";
    let audioBuffer: Buffer | null = null;
    let mimeType = "audio/webm";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      questionId = (formData.get("questionId") as string) || "";
      durationSeconds = parseInt((formData.get("durationSeconds") as string) || "45", 10);
      mode = "voice";

      const file = formData.get("audio") as File | null;
      if (!file) {
        return NextResponse.json({ error: "Missing audio file in form data" }, { status: 400 });
      }

      mimeType = file.type || "audio/webm";
      const arrayBuffer = await file.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuffer);
    } else {
      const jsonBody = await req.json().catch(() => ({}));
      questionId = jsonBody.questionId || "";
      durationSeconds = jsonBody.durationSeconds || 45;
      mode = jsonBody.mode || "text";
      typedText = jsonBody.typedText || "";

      if (jsonBody.audioBase64) {
        mode = "voice";
        const cleaned = jsonBody.audioBase64.includes(",") ? jsonBody.audioBase64.split(",")[1] : jsonBody.audioBase64;
        audioBuffer = Buffer.from(cleaned, "base64");
        mimeType = jsonBody.mimeType || "audio/m4a";
      } else if (!typedText.trim()) {
        return NextResponse.json({ error: "Missing practice response" }, { status: 400 });
      }
    }

    if (!questionId) {
      return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
    }

    // 1. Fetch Question, Answer, and Workspace Context
    const { data: question, error: qErr } = await supabase
      .from("qa_questions")
      .select("*, answer:qa_answers(*), workspace:application_qa_workspaces(application_id)")
      .eq("id", questionId)
      .single();

    if (qErr || !question) {
      throw new QANotFoundError(`Question ${questionId} not found`);
    }

    if (question.user_id !== user.id) {
      throw new QAAuthorizationError("You are not authorized to practice this question");
    }

    const applicationId = question.workspace?.application_id;
    const answer: QAAnswer | null = Array.isArray(question.answer) ? question.answer[0] || null : question.answer || null;

    // 2. Fetch Application Memory for Truth Lock checks
    const memory = await buildApplicationMemory(applicationId, user.id, supabase);

    // 3. Fetch latest previous attempt for comparison
    const { data: prevAttempts } = await supabase
      .from("qa_practice_attempts")
      .select("*")
      .eq("question_id", questionId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const previousAttempt = prevAttempts && prevAttempts.length > 0 ? prevAttempts[0] : null;

    // 4. Run Speech / Text Evaluation
    let evaluationResult;
    let audioStoragePath: string | null = null;

    if (mode === "voice" && audioBuffer) {
      evaluationResult = await evaluateSpokenPractice({
        audioBuffer,
        mimeType,
        question: question as QAQuestion,
        answer,
        memory,
        durationSeconds,
        previousAttempt,
      });
    } else {
      evaluationResult = await evaluateTypedPractice({
        typedText,
        question: question as QAQuestion,
        answer,
        memory,
        durationSeconds,
        previousAttempt,
      });
    }

    // 5. Persist Practice Attempt
    const attempt = await recordPracticeAttempt({
      questionId,
      userId: user.id,
      stageId: question.stage_id,
      mode,
      userResponse: mode === "voice" ? evaluationResult.transcript : typedText,
      transcript: evaluationResult.transcript,
      audioStoragePath,
      score: evaluationResult.score,
      feedback: evaluationResult.feedback,
      durationSeconds,
      truthStatus: evaluationResult.truthStatus,
      clientSupabase: supabase,
    });

    return NextResponse.json({
      success: true,
      data: {
        attempt,
        feedback: evaluationResult.feedback,
        transcript: evaluationResult.transcript,
        score: evaluationResult.score,
        truthStatus: evaluationResult.truthStatus,
      },
    });
  } catch (err: any) {
    console.error("[API /api/qa/practice/submit Error]:", err);

    if (err instanceof QAAuthorizationError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof QANotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: err.message || "Failed to process practice attempt" },
      { status: 500 }
    );
  }
}
