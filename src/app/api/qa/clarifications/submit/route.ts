import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { submitClarification } from "@/services/qa/qaClarificationService";
import { QAAuthorizationError, QANotFoundError } from "@/services/qa/qaContextBuilder";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { clarificationId, responseValue, scope } = body;

    if (!clarificationId || typeof clarificationId !== "string") {
      return NextResponse.json({ error: "Missing or invalid clarificationId" }, { status: 400 });
    }

    if (responseValue === undefined || responseValue === null || typeof responseValue !== "string") {
      return NextResponse.json({ error: "Missing or invalid responseValue" }, { status: 400 });
    }

    const result = await submitClarification(clarificationId, responseValue, user.id, {
      scope: scope === "global" ? "global" : "application",
      supabaseClient: supabase,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("[API /api/qa/clarifications/submit Error]:", err);

    if (err instanceof QAAuthorizationError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof QANotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: err.message || "Failed to submit clarification" },
      { status: 400 }
    );
  }
}
