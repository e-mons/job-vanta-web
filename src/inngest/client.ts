import { Inngest } from "inngest";

const isDev = process.env.NODE_ENV === "development" || process.env.INNGEST_DEV === "1";
const rawEventKey = process.env.INNGEST_EVENT_KEY?.trim();
const eventKey = (!rawEventKey || rawEventKey === "your_inngest_event_key" || isDev) ? "local" : rawEventKey;

// Initialize the Inngest client for background job processing
export const inngest = new Inngest({
  id: "jobvanta",
  eventKey,
  isDev,
});

