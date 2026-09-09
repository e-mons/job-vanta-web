import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { detectJobApplicationFieldsFunction } from "@/inngest/functions/detectFields";
import { submitJobApplicationFunction } from "@/inngest/functions/submitApplication";

// Inngest serve handler for Next.js App Router
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    detectJobApplicationFieldsFunction,
    submitJobApplicationFunction,
  ],
});
