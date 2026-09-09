import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { inngest } from "@/inngest/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      applicationId,
      missingFieldValues = {},
      updateResume = true,
    } = body;

    if (!applicationId) {
      return NextResponse.json({ error: "Missing applicationId" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the application
    const { data: application, error: appErr } = await supabase
      .from("job_applications")
      .select("*, resumes(*)")
      .eq("id", applicationId)
      .eq("user_id", user.id)
      .single();

    if (appErr || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // 1. Save reusable answers to user_application_details (Upsert)
    const reusableUpdates: any = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    if (missingFieldValues.workAuthorization) {
      reusableUpdates.work_authorization = missingFieldValues.workAuthorization;
    }
    if (missingFieldValues.sponsorship) {
      reusableUpdates.requires_sponsorship = missingFieldValues.sponsorship;
    }
    if (missingFieldValues.noticePeriod) {
      reusableUpdates.notice_period = missingFieldValues.noticePeriod;
    }
    if (missingFieldValues.salaryExpectation) {
      reusableUpdates.salary_expectation = missingFieldValues.salaryExpectation;
    }
    if (missingFieldValues.willingToRelocate) {
      reusableUpdates.willing_to_relocate = missingFieldValues.willingToRelocate;
    }

    try {
      await supabase
        .from("user_application_details")
        .upsert(reusableUpdates, { onConflict: "user_id" });
    } catch (upsertErr) {
      console.warn("[MissingFields] Could not upsert user_application_details:", upsertErr);
    }

    // 2. Optionally update candidate's resume personal info if missing
    if (updateResume && application.resume_id && application.resumes?.content) {
      const content = { ...application.resumes.content };
      const personal = { ...(content.personalInfo || {}) };

      if (missingFieldValues.phone && !personal.phone) personal.phone = missingFieldValues.phone;
      if (missingFieldValues.location && !personal.location) personal.location = missingFieldValues.location;
      if (missingFieldValues.linkedin && !personal.website) personal.website = missingFieldValues.linkedin;
      if (missingFieldValues.portfolio && !personal.website) personal.website = missingFieldValues.portfolio;

      content.personalInfo = personal;

      await supabase
        .from("resumes")
        .update({
          content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", application.resume_id)
        .eq("user_id", user.id);
    }

    // 3. Update job_applications filled_fields, clear missing_fields & set status to queued
    const updatedFilled = {
      ...(application.filled_fields || {}),
      ...missingFieldValues,
    };

    await supabase
      .from("job_applications")
      .update({
        status: "queued",
        filled_fields: updatedFilled,
        missing_fields: [],
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    // Update jobs table
    const applyUrl = application.metadata?.applyLink || application.metadata?.job_url;
    if (applyUrl) {
      await supabase
        .from("jobs")
        .update({ applied_status: "queued" })
        .eq("user_id", user.id)
        .eq("job_url", applyUrl);
    }

    // 4. Trigger Inngest submission
    try {
      await inngest.send({
        name: "job.application.submit",
        data: {
          applicationId: application.id,
          jobUrl: applyUrl,
          resumeId: application.resume_id,
          userId: user.id,
          sessionId: application.browserbase_session_id,
          filledFields: updatedFilled,
        },
      });
      console.log(`[JobApply] Dispatched submission event for application ${applicationId}`);
    } catch (inngestErr: any) {
      console.warn("[JobApply] Inngest submit dispatch warning:", inngestErr.message);
    }

    return NextResponse.json({
      success: true,
      status: "queued",
      message: "Information saved successfully. Submitting your application...",
    });
  } catch (err: any) {
    console.error("[JobApply MissingFields Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to update missing fields." }, { status: 500 });
  }
}
