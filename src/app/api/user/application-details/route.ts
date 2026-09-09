import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("user_application_details")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || null,
    });
  } catch (err: any) {
    console.error("[GET /api/user/application-details Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to load application details" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      work_authorization,
      requires_sponsorship,
      notice_period,
      salary_expectation,
      willing_to_relocate,
      custom_answers,
    } = body;

    const updates: any = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    if (work_authorization !== undefined) updates.work_authorization = work_authorization;
    if (requires_sponsorship !== undefined) updates.requires_sponsorship = requires_sponsorship;
    if (notice_period !== undefined) updates.notice_period = notice_period;
    if (salary_expectation !== undefined) updates.salary_expectation = salary_expectation;
    if (willing_to_relocate !== undefined) updates.willing_to_relocate = willing_to_relocate;
    if (custom_answers !== undefined) updates.custom_answers = custom_answers;

    const { data, error } = await supabase
      .from("user_application_details")
      .upsert(updates, { onConflict: "user_id" })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error("[POST /api/user/application-details Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to save application details" }, { status: 500 });
  }
}
