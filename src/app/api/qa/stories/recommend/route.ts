import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { findRelevantCareerStories } from "@/services/qa/qaStoryBankService";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "general";
    const questionText = searchParams.get("questionText") || "";

    const stories = await findRelevantCareerStories({
      userId: user.id,
      category,
      questionText,
      clientSupabase: supabase,
      limit: 3,
    });

    return NextResponse.json({
      success: true,
      data: stories,
    });
  } catch (err: any) {
    console.error("[API /api/qa/stories/recommend GET Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to find stories" }, { status: 500 });
  }
}
