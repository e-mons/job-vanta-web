import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/services/admin/adminAuthService";
import { createAdminClient } from "@/utils/supabase/admin";
import type { QAQualityReport } from "@shared/types/adminQa";

export async function GET(req: NextRequest) {
  try {
    await requireAdminPermission("qa.view_quality_samples");
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "open";

    const adminClient = createAdminClient();
    const { data: reports, error } = await adminClient
      .from("qa_quality_reports")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`Failed to fetch quality reports: ${error.message}`);
    }

    // Calculate aggregated feedback signals
    const { data: allReports } = await adminClient
      .from("qa_quality_reports")
      .select("report_type");

    const reasonCounts: Record<string, number> = {};
    (allReports || []).forEach((r: any) => {
      reasonCounts[r.report_type] = (reasonCounts[r.report_type] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        reports: (reports || []) as QAQualityReport[],
        reasonBreakdown: reasonCounts,
        totalReports: (allReports || []).length,
      },
    });
  } catch (err: any) {
    const status = err.name === "AdminUnauthorizedError" ? 401 : err.name === "AdminForbiddenError" ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
