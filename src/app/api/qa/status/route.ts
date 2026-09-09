import { NextResponse } from "next/server";
import { getPublicQASettings } from "@/services/admin/qaSettingsService";

export async function GET() {
  try {
    const publicSettings = await getPublicQASettings();
    return NextResponse.json({ success: true, data: publicSettings });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      data: {
        is_qa_enabled: true,
        is_voice_practice_enabled: true,
        is_5min_refresh_enabled: true,
        is_story_bank_enabled: true,
        is_interview_learning_enabled: true,
        active_incident_notice: null,
      }
    });
  }
}
