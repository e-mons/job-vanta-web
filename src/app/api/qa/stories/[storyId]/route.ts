import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { deleteCareerStory } from "@/services/qa/qaStoryBankService";
import { QAAuthorizationError, QANotFoundError } from "@/services/qa/qaContextBuilder";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, situation, action, result, supportedCompetencies, isFavorite } = body;

    const updates: any = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (situation !== undefined) updates.situation = situation;
    if (action !== undefined) updates.action = action;
    if (result !== undefined) updates.result = result;
    if (supportedCompetencies !== undefined) updates.supported_competencies = supportedCompetencies;
    if (isFavorite !== undefined) updates.is_favorite = isFavorite;

    const { data: updated, error } = await supabase
      .from("user_career_stories")
      .update(updates)
      .eq("id", storyId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !updated) {
      throw new Error(`Failed to update story: ${error?.message}`);
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err: any) {
    console.error("[API /api/qa/stories/[storyId] PUT Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to update story" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteCareerStory(storyId, user.id, supabase);

    return NextResponse.json({
      success: true,
      message: "Career story deleted successfully",
    });
  } catch (err: any) {
    console.error("[API /api/qa/stories/[storyId] DELETE Error]:", err);

    if (err instanceof QAAuthorizationError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof QANotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    return NextResponse.json({ error: err.message || "Failed to delete story" }, { status: 500 });
  }
}
