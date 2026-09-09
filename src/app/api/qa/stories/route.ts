import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { saveCareerStory, structureCareerStoryWithAI } from "@/services/qa/qaStoryBankService";
import { buildApplicationMemory } from "@/services/qa/applicationMemoryService";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: stories, error } = await supabase
      .from("user_career_stories")
      .select("*")
      .eq("user_id", user.id)
      .order("is_favorite", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to load stories: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: stories || [],
    });
  } catch (err: any) {
    console.error("[API /api/qa/stories GET Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch career stories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      situation,
      action,
      result,
      rawDraft,
      supportedCompetencies,
      evidenceReferences,
      metrics,
      sourceType,
      sourceId,
      applicationId,
    } = body;

    let finalTitle = title;
    let finalSituation = situation;
    let finalAction = action;
    let finalResult = result;
    let finalCompetencies = supportedCompetencies || [];

    // If raw draft provided, structure it with AI first
    if (rawDraft && (!situation || !action || !result)) {
      const structured = await structureCareerStoryWithAI(rawDraft);
      finalTitle = finalTitle || structured.title;
      finalSituation = structured.situation;
      finalAction = structured.action;
      finalResult = structured.result;
      finalCompetencies = Array.from(new Set([...finalCompetencies, ...structured.supportedCompetencies]));
    }

    if (!finalTitle || !finalSituation || !finalAction || !finalResult) {
      return NextResponse.json(
        { error: "Title, Situation, Action, and Result are required" },
        { status: 400 }
      );
    }

    // Optional Application Memory for Truth Lock check
    let memory = null;
    if (applicationId) {
      memory = await buildApplicationMemory(applicationId, user.id, supabase).catch(() => null);
    }

    const story = await saveCareerStory({
      userId: user.id,
      title: finalTitle,
      situation: finalSituation,
      action: finalAction,
      result: finalResult,
      supportedCompetencies: finalCompetencies,
      evidenceReferences: evidenceReferences || [],
      metrics: metrics || [],
      sourceType: sourceType || "user_created",
      sourceId: sourceId || null,
      memory,
      clientSupabase: supabase,
    });

    return NextResponse.json({
      success: true,
      data: story,
    });
  } catch (err: any) {
    console.error("[API /api/qa/stories POST Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to save career story" }, { status: 500 });
  }
}
