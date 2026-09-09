"use client";

import { create } from "zustand";
import { Job } from "./useJobStore";
import { UserResume } from "./useResumeStore";
import { FormFieldDefinition, CanonicalApplicationStatus, mapToCanonicalStatus } from "@/services/automation/types";

export type AgentStepStatus =
  | CanonicalApplicationStatus
  | "idle"
  | "detecting_fields"
  | "missing_info"
  | "ready_to_submit"
  | "submitting";

export interface AgentLogEntry {
  id: string;
  timestamp: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
}

interface AgentTrackerState {
  activeApplicationId: string | null;
  activeJob: Job | null;
  activeResume: UserResume | null;
  status: CanonicalApplicationStatus | "idle";
  currentStepIndex: number; // 0 to 4
  logs: AgentLogEntry[];
  missingFields: FormFieldDefinition[];
  error: string | null;
  isModalOpen: boolean;
  isMinimized: boolean;

  // Actions
  startTracking: (params: { applicationId: string; job: Job; resume?: UserResume | null }) => void;
  updateStatus: (status: AgentStepStatus, extra?: { missingFields?: FormFieldDefinition[]; error?: string | null }) => void;
  addLog: (message: string, type?: "info" | "success" | "warning" | "error") => void;
  openModal: () => void;
  closeModal: () => void;
  minimize: () => void;
  restore: () => void;
  reset: () => void;
}

export const getStepIndexForStatus = (status: CanonicalApplicationStatus | "idle"): number => {
  switch (status) {
    case "checking":
      return 0;
    case "needs_info":
      return 1;
    case "queued":
      return 2;
    case "applying":
      return 3;
    case "submitted":
      return 4;
    case "action_required":
      return 1;
    case "failed":
      return -1;
    default:
      return 0;
  }
};

const formatTime = () => {
  const d = new Date();
  return d.toTimeString().split(" ")[0];
};

export const useAgentTrackerStore = create<AgentTrackerState>((set, get) => ({
  activeApplicationId: null,
  activeJob: null,
  activeResume: null,
  status: "idle",
  currentStepIndex: 0,
  logs: [],
  missingFields: [],
  error: null,
  isModalOpen: false,
  isMinimized: false,

  startTracking: ({ applicationId, job, resume = null }) => {
    const initialLog: AgentLogEntry = {
      id: `log_${Date.now()}_0`,
      timestamp: formatTime(),
      message: `Checking application requirements for "${job.title}" at ${job.company}...`,
      type: "info",
    };

    set({
      activeApplicationId: applicationId,
      activeJob: job,
      activeResume: resume || null,
      status: "checking",
      currentStepIndex: 0,
      logs: [initialLog],
      missingFields: [],
      error: null,
      isModalOpen: true,
      isMinimized: false,
    });
  },

  updateStatus: (rawStatus, extra) => {
    const canonical = rawStatus === "idle" ? "idle" : mapToCanonicalStatus(rawStatus);
    const stepIdx = getStepIndexForStatus(canonical);

    let logMessage = "";
    let logType: AgentLogEntry["type"] = "info";

    switch (canonical) {
      case "checking":
        logMessage = "Inspecting application form requirements and screening questions...";
        logType = "info";
        break;
      case "needs_info":
        logMessage = `Required details needed from candidate (${extra?.missingFields?.length || 0} fields).`;
        logType = "warning";
        break;
      case "queued":
        logMessage = "Application verified and queued for cloud browser execution.";
        logType = "info";
        break;
      case "applying":
        logMessage = "Jobvanta is completing the application now in cloud browser...";
        logType = "info";
        break;
      case "action_required":
        logMessage = extra?.error || "Additional manual action required on employer page.";
        logType = "warning";
        break;
      case "submitted":
        logMessage = "Application submitted successfully! Preparation workspace unlocked.";
        logType = "success";
        break;
      case "failed":
        logMessage = extra?.error || "Application submission could not be completed.";
        logType = "error";
        break;
    }

    set((state) => {
      const newLogs = logMessage
        ? [
            ...state.logs,
            {
              id: `log_${Date.now()}_${state.logs.length}`,
              timestamp: formatTime(),
              message: logMessage,
              type: logType,
            },
          ]
        : state.logs;

      return {
        status: canonical,
        currentStepIndex: stepIdx,
        missingFields: extra?.missingFields ?? state.missingFields,
        error: extra?.error !== undefined ? extra.error : state.error,
        logs: newLogs,
      };
    });
  },

  addLog: (message, type = "info") => {
    set((state) => ({
      logs: [
        ...state.logs,
        {
          id: `log_${Date.now()}_${state.logs.length}`,
          timestamp: formatTime(),
          message,
          type,
        },
      ],
    }));
  },

  openModal: () => set({ isModalOpen: true, isMinimized: false }),
  closeModal: () => set({ isModalOpen: false }),
  minimize: () => set({ isModalOpen: false, isMinimized: true }),
  restore: () => set({ isModalOpen: true, isMinimized: false }),
  reset: () =>
    set({
      activeApplicationId: null,
      activeJob: null,
      activeResume: null,
      status: "idle",
      currentStepIndex: 0,
      logs: [],
      missingFields: [],
      error: null,
      isModalOpen: false,
      isMinimized: false,
    }),
}));
