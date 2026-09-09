import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { inngest } from "@/inngest/client";
import { detectPlatform } from "@/services/automation/browserbaseService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      jobId,
      resumeId,
      applicationType = "manual", // "manual" | "automated"
      jobMetadata = {},
    } = body;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in to apply." }, { status: 401 });
    }

    const applyUrl = jobMetadata.applyLink || jobMetadata.job_url || "";
    if (!applyUrl) {
      return NextResponse.json({ error: "No valid job URL provided." }, { status: 400 });
    }

    // Fetch resume snapshot if resumeId provided
    let resumeSnapshot: any = null;
    if (resumeId) {
      const { data: resume } = await supabase
        .from("resumes")
        .select("content")
        .eq("id", resumeId)
        .eq("user_id", user.id)
        .single();
      resumeSnapshot = resume?.content || null;
    }

    const platform = detectPlatform(applyUrl);

    if (applicationType === "manual") {
      // 1. Manual Application Flow
      // Check if existing record exists to prevent duplicates
      const { data: existingApp } = await supabase
        .from("job_applications")
        .select("id")
        .eq("user_id", user.id)
        .eq("metadata->>applyLink", applyUrl)
        .maybeSingle();

      let applicationId = existingApp?.id;

      if (existingApp) {
        await supabase
          .from("job_applications")
          .update({
            status: "submitted",
            application_type: "manual",
            resume_id: resumeId || null,
            resume_snapshot: resumeSnapshot,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingApp.id);
      } else {
        const { data: application, error: appError } = await supabase
          .from("job_applications")
          .insert({
            user_id: user.id,
            resume_id: resumeId || null,
            status: "submitted",
            application_type: "manual",
            metadata: {
              ...jobMetadata,
              platform,
              applyLink: applyUrl,
            },
            resume_snapshot: resumeSnapshot,
          })
          .select()
          .single();

        if (appError) {
          console.error("[JobApply] Error creating manual application:", appError.message);
          return NextResponse.json({ error: appError.message }, { status: 500 });
        }
        applicationId = application.id;
      }

      // Update jobs table
      if (jobId) {
        await supabase
          .from("jobs")
          .update({ applied_status: "submitted" })
          .eq("id", jobId)
          .eq("user_id", user.id);
      }

      return NextResponse.json({
        success: true,
        applicationId,
        status: "submitted",
        redirectUrl: applyUrl,
      });
    } else {
      // 2. Automated AI Agent Application Flow - Enforce Subscription & Daily Usage Rules
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("status, plan_id, daily_ai_applies_count, daily_usage_date")
        .eq("user_id", user.id)
        .maybeSingle();

      const isActive = subData?.status === "active" || subData?.status === "trialing";
      let tier: "free" | "pro" | "unlimited" = "free";
      if (isActive) {
        if (
          subData?.plan_id === "pdt_0NewgKeXYMkBEofXpxy9Z" ||
          subData?.plan_id === "unlimited" ||
          subData?.plan_id === "enterprise"
        ) {
          tier = "unlimited";
        } else if (
          subData?.plan_id === "pdt_0Newfu26VwAPCKJBoT8z5" ||
          subData?.plan_id === "pro"
        ) {
          tier = "pro";
        }
      }

      // Check 1: Resume creation limits
      const { count: userResumeCount } = await supabase
        .from("resumes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      const totalResumes = userResumeCount || 0;
      if (tier === "free" && totalResumes > 1) {
        return NextResponse.json({
          error: "You have exceeded the 1 resume limit on the Free plan. Please upgrade to Pro Plan to continue with AI applies.",
          code: "RESUME_LIMIT_EXCEEDED",
          requiredTier: "pro"
        }, { status: 403 });
      }
      if (tier === "pro" && totalResumes > 5) {
        return NextResponse.json({
          error: "You have exceeded the 5 resume limit on the Pro plan. Please upgrade to Unlimited Plan to continue with AI applies.",
          code: "RESUME_LIMIT_EXCEEDED",
          requiredTier: "unlimited"
        }, { status: 403 });
      }

      // Check 2: Daily AI Apply limits
      const today = new Date().toISOString().split("T")[0];
      const usageDateStr = subData?.daily_usage_date ? String(subData.daily_usage_date).split("T")[0] : null;
      const appliesUsedToday = (usageDateStr === today && typeof subData?.daily_ai_applies_count === "number")
        ? subData.daily_ai_applies_count
        : 0;

      if (tier === "free" && appliesUsedToday >= 2) {
        return NextResponse.json({
          error: "You have reached your daily limit of 2 AI applications on the Free plan. Please upgrade to Pro Plan for 25 applications per day!",
          code: "DAILY_LIMIT_EXCEEDED",
          requiredTier: "pro"
        }, { status: 403 });
      }

      if (tier === "pro" && appliesUsedToday >= 25) {
        return NextResponse.json({
          error: "You have reached your daily limit of 25 AI applications on the Pro plan. Please upgrade to Unlimited Plan for unlimited applications!",
          code: "DAILY_LIMIT_EXCEEDED",
          requiredTier: "unlimited"
        }, { status: 403 });
      }

      // Check 3: Idempotency & Duplicate Protection
      const { data: existingApp } = await supabase
        .from("job_applications")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("metadata->>applyLink", applyUrl)
        .maybeSingle();

      let application: any = null;

      if (existingApp) {
        if (existingApp.status === "submitted") {
          return NextResponse.json({
            success: true,
            applicationId: existingApp.id,
            status: "submitted",
            message: "You have already applied for this job.",
          });
        }

        // Retry / re-check existing application
        const { data: updatedApp, error: updateErr } = await supabase
          .from("job_applications")
          .update({
            status: "checking",
            resume_id: resumeId || null,
            resume_snapshot: resumeSnapshot,
            error_message: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingApp.id)
          .select()
          .single();

        if (updateErr) throw updateErr;
        application = updatedApp;
      } else {
        const { data: newApp, error: appError } = await supabase
          .from("job_applications")
          .insert({
            user_id: user.id,
            resume_id: resumeId || null,
            status: "checking",
            application_type: "automated",
            metadata: {
              ...jobMetadata,
              platform,
              applyLink: applyUrl,
            },
            resume_snapshot: resumeSnapshot,
          })
          .select()
          .single();

        if (appError) {
          console.error("[JobApply] Error creating automated application:", appError.message);
          return NextResponse.json({ error: appError.message }, { status: 500 });
        }
        application = newApp;
      }

      // Update jobs table
      if (jobId) {
        await supabase
          .from("jobs")
          .update({ applied_status: "checking" })
          .eq("id", jobId)
          .eq("user_id", user.id);
      }

      // Trigger background Inngest field detection event
      try {
        await inngest.send({
          name: "job.application.detect_fields",
          data: {
            applicationId: application.id,
            jobUrl: applyUrl,
            resumeId: resumeId || null,
            userId: user.id,
          },
        });
        console.log(`[JobApply] Dispatched Inngest detection event for application ${application.id}`);
      } catch (inngestErr: any) {
        console.warn("[JobApply] Inngest dispatch warning:", inngestErr.message);
      }

      return NextResponse.json({
        success: true,
        applicationId: application.id,
        status: "checking",
        platform,
      });
    }
  } catch (err: any) {
    console.error("[JobApply] Handler error:", err);
    return NextResponse.json({ error: err.message || "Failed to initiate job application." }, { status: 500 });
  }
}
