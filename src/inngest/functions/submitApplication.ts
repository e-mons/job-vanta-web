import { inngest } from "@/inngest/client";
import { createClient } from "@supabase/supabase-js";
import { fillAndSubmitApplication } from "@/services/automation/browserbaseService";

export const submitJobApplicationFunction = inngest.createFunction(
  {
    id: "submit-job-application",
    triggers: [{ event: "job.application.submit" }],
    concurrency: [{
      limit: 1,
      key: "event.data.userId",
    }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { applicationId, jobUrl, resumeId, userId, sessionId, filledFields = {} } = event.data;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    try {
      // Step 1: Mark status as applying
      await step.run("mark-status-applying", async () => {
        await supabase
          .from("job_applications")
          .update({
            status: "applying",
            updated_at: new Date().toISOString(),
          })
          .eq("id", applicationId);

        await supabase
          .from("jobs")
          .update({ applied_status: "applying" })
          .eq("user_id", userId)
          .eq("job_url", jobUrl);
      });

      // Step 2: Fetch resume and user application details
      const { resumeData, userAppDetails } = await step.run("fetch-candidate-context", async () => {
        let resumeContent: any = {};
        if (resumeId) {
          const { data: resume } = await supabase
            .from("resumes")
            .select("content")
            .eq("id", resumeId)
            .single();
          resumeContent = resume?.content || {};
        }

        const { data: appDetails } = await supabase
          .from("user_application_details")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        return {
          resumeData: resumeContent,
          userAppDetails: appDetails || null,
        };
      });

      // Step 3: Execute Browserbase form fill and submit
      const submitResult = await step.run("execute-application-submission", async () => {
        try {
          return await fillAndSubmitApplication({
            jobUrl,
            sessionId,
            resumeData,
            userAppDetails,
            filledFields,
            applicationId,
          });
        } catch (err: any) {
          return {
            success: false,
            sessionId: sessionId || "",
            error: err.message || "Failed to complete form submission",
          };
        }
      });

      // Step 4: Finalize database status
      await step.run("finalize-application-status", async () => {
        if (submitResult.success) {
          await supabase
            .from("job_applications")
            .update({
              status: "submitted",
              browserbase_session_id: submitResult.sessionId,
              filled_fields: filledFields,
              error_message: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", applicationId);

          // Update jobs table
          await supabase
            .from("jobs")
            .update({ applied_status: "submitted" })
            .eq("user_id", userId)
            .eq("job_url", jobUrl);

          // Atomically update user's daily usage count in database
          try {
            const { data: newDailyCount, error: countErr } = await supabase.rpc("increment_daily_ai_apply", {
              p_user_id: userId,
            });
            if (countErr) {
              console.warn("[Inngest Submit] Warning incrementing daily usage:", countErr.message);
            } else {
              console.log(`[Inngest Submit] Updated daily usage count for user ${userId}: ${newDailyCount}`);
            }
          } catch (rpcErr: any) {
            console.warn("[Inngest Submit] Error calling increment_daily_ai_apply:", rpcErr.message);
          }
        } else if (submitResult.actionRequired) {
          await supabase
            .from("job_applications")
            .update({
              status: "action_required",
              browserbase_session_id: submitResult.sessionId,
              error_message: submitResult.actionRequiredReason || "Action required to complete application.",
              updated_at: new Date().toISOString(),
            })
            .eq("id", applicationId);

          await supabase
            .from("jobs")
            .update({ applied_status: "action_required" })
            .eq("user_id", userId)
            .eq("job_url", jobUrl);
        } else {
          await supabase
            .from("job_applications")
            .update({
              status: "failed",
              browserbase_session_id: submitResult.sessionId,
              error_message: submitResult.error || "Application submission could not be completed.",
              updated_at: new Date().toISOString(),
            })
            .eq("id", applicationId);

          await supabase
            .from("jobs")
            .update({ applied_status: "failed" })
            .eq("user_id", userId)
            .eq("job_url", jobUrl);
        }
      });

      return { success: submitResult.success, applicationId };
    } catch (err: any) {
      console.error("[Inngest SubmitApplication] Unhandled error:", err.message || err);
      try {
        await supabase
          .from("job_applications")
          .update({
            status: "failed",
            error_message: err.message || "Submission failed unexpectedly",
            updated_at: new Date().toISOString(),
          })
          .eq("id", applicationId);

        await supabase
          .from("jobs")
          .update({ applied_status: "failed" })
          .eq("user_id", userId)
          .eq("job_url", jobUrl);
      } catch (innerErr: any) {
        console.warn("[Inngest SubmitApplication] Could not record failed status:", innerErr.message);
      }

      throw err;
    }
  }
);
