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

    // Verify ownership
    await buildApplicationQAContext(applicationId, user.id, supabase);

    const { data: workspace } = await supabase
      .from("application_qa_workspaces")
      .select("id")
      .eq("application_id", applicationId)
      .maybeSingle();

    if (!workspace) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const { data: clarifications, error: clarErr } = await supabase
      .from("qa_clarifications")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false });

    if (clarErr) {
      throw new Error(`Failed to load clarifications: ${clarErr.message}`);
    }

    return NextResponse.json({
      success: true,
      data: clarifications || [],
    });
  } catch (err: any) {
    console.error("[API /api/qa/[applicationId]/clarifications Error]:", err);

    if (err instanceof QAAuthorizationError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof QANotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: err.message || "Failed to load clarifications" },
      { status: 500 }
    );
  }
}
