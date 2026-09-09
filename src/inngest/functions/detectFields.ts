import { inngest } from "@/inngest/client";
import { createClient } from "@supabase/supabase-js";
import { detectApplicationFormFields } from "@/services/automation/browserbaseService";

export const detectJobApplicationFieldsFunction = inngest.createFunction(
  {
    id: "detect-job-application-fields",
    triggers: [{ event: "job.application.detect_fields" }],
    concurrency: [{
      limit: 1,
      key: "event.data.userId",
    }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { applicationId, jobUrl, resumeId, userId, filledFields = {} } = event.data;

    // Use service role client for background Inngest execution
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    try {
      // Step 1: Mark as checking application
      await step.run("mark-status-checking", async () => {
        await supabase
          .from("job_applications")
          .update({
            status: "checking",
            updated_at: new Date().toISOString(),
          })
          .eq("id", applicationId);
      });

      // Step 2: Fetch resume and reusable user application details
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

      // Step 3: Execute Browserbase / Stagehand Field Detection
      const detectionResult = await step.run("detect-form-fields", async () => {
        return await detectApplicationFormFields({
          jobUrl,
          resumeData,
          userAppDetails,
          filledFields,
        });
      });

      // Step 4: Persist findings and branch flow
      await step.run("update-database-results", async () => {
        const { sessionId, detectedFields, missingFields, readyToSubmit, actionRequiredReason } = detectionResult;

        if (actionRequiredReason) {
          await supabase
            .from("job_applications")
            .update({
              status: "action_required",
              browserbase_session_id: sessionId,
              error_message: actionRequiredReason,
              updated_at: new Date().toISOString(),
            })
            .eq("id", applicationId);

          await supabase
            .from("jobs")
            .update({ applied_status: "action_required" })
            .eq("user_id", userId)
            .eq("job_url", jobUrl);

          return { status: "action_required", reason: actionRequiredReason };
        }

        if (!readyToSubmit && missingFields.length > 0) {
          // Missing required candidate information
          await supabase
            .from("job_applications")
            .update({
              status: "needs_info",
              browserbase_session_id: sessionId,
              detected_fields: detectedFields,
              missing_fields: missingFields,
              updated_at: new Date().toISOString(),
            })
            .eq("id", applicationId);

          await supabase
            .from("jobs")
            .update({ applied_status: "needs_info" })
            .eq("user_id", userId)
            .eq("job_url", jobUrl);

          return { status: "needs_info", missingCount: missingFields.length };
        } else {
          // All fields verified, ready to queue & submit
          await supabase
            .from("job_applications")
            .update({
              status: "queued",
              browserbase_session_id: sessionId,
              detected_fields: detectedFields,
              missing_fields: [],
              updated_at: new Date().toISOString(),
            })
            .eq("id", applicationId);

          // Auto trigger submission step
          await inngest.send({
            name: "job.application.submit",
            data: {
              applicationId,
              jobUrl,
              resumeId,
              userId,
              sessionId,
              filledFields,
            },
          });

          return { status: "queued" };
        }
      });

      return { success: true, applicationId };
    } catch (err: any) {
      console.error("[Inngest DetectFields] Unhandled detection error:", err.message || err);
      try {
        await supabase
          .from("job_applications")
          .update({
            status: "failed",
            error_message: err.message || "Failed during field detection",
            updated_at: new Date().toISOString(),
          })
          .eq("id", applicationId);

        await supabase
          .from("jobs")
          .update({ applied_status: "failed" })
          .eq("user_id", userId)
          .eq("job_url", jobUrl);
      } catch (innerErr: any) {
        console.warn("[Inngest DetectFields] Could not record failed status:", innerErr.message);
      }

      throw err;
    }
  }
);
