import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Notification {
  id: string;
  type: "job_saved" | "status_change" | "resume_created" | "resume_optimized" | "subscription" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  filter: "all" | "unread" | "job_saved" | "status_change" | "resume_created" | "system";

  // Actions
  setFilter: (filter: NotificationState["filter"]) => void;
  pushNotification: (notif: Omit<Notification, "id" | "read" | "createdAt">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      filter: "all",

      setFilter: (filter) => set({ filter }),

      pushNotification: (notif) => {
        const newNotif: Notification = {
          ...notif,
          id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          read: false,
          createdAt: new Date().toISOString(),
        };
        const updated = [newNotif, ...get().notifications].slice(0, 100); // cap at 100
        set({
          notifications: updated,
          unreadCount: updated.filter((n) => !n.read).length,
        });
      },

      markAsRead: (id) => {
        const updated = get().notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        set({
          notifications: updated,
          unreadCount: updated.filter((n) => !n.read).length,
        });
      },

      markAllAsRead: () => {
        const updated = get().notifications.map((n) => ({ ...n, read: true }));
        set({ notifications: updated, unreadCount: 0 });
      },

      deleteNotification: (id) => {
        const updated = get().notifications.filter((n) => n.id !== id);
        set({
          notifications: updated,
          unreadCount: updated.filter((n) => !n.read).length,
        });
      },

      clearAll: () => set({ notifications: [], unreadCount: 0 }),
    }),
    {
      name: "jobvanta-notifications",
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
);

// ─── Helper functions to push notifications from other stores ───

export function notifyJobSaved(jobTitle: string, company: string) {
  useNotificationStore.getState().pushNotification({
    type: "job_saved",
    title: "Job Saved Successfully",
    message: `You saved "${jobTitle}" at ${company} to your pipeline. Track your progress from Saved Jobs.`,
    actionUrl: "/jobs/saved",
    metadata: { jobTitle, company },
  });
}

export function notifyStatusChange(jobTitle: string, company: string, newStatus: string) {
  const statusLabels: Record<string, string> = {
    saved: "Saved",
    applied: "Applied",
    interviewing: "Interviewing",
    offered: "Offered",
    rejected: "Rejected",
  };
  const label = statusLabels[newStatus] || newStatus;
  useNotificationStore.getState().pushNotification({
    type: "status_change",
    title: `Application Status → ${label}`,
    message: `Your application for "${jobTitle}" at ${company} has been updated to "${label}".`,
    actionUrl: "/jobs/saved",
    metadata: { jobTitle, company, status: newStatus },
  });
}

export function notifyResumeCreated(resumeTitle: string) {
  useNotificationStore.getState().pushNotification({
    type: "resume_created",
    title: "New Resume Created",
    message: `Your resume "${resumeTitle}" has been created. Open the editor to customize it further.`,
    actionUrl: "/builder",
    metadata: { resumeTitle },
  });
}

export function notifyResumeOptimized(resumeTitle: string) {
  useNotificationStore.getState().pushNotification({
    type: "resume_optimized",
    title: "Resume Optimized with AI",
    message: `"${resumeTitle}" has been optimized by our AI engine for higher ATS scores.`,
    actionUrl: "/builder",
    metadata: { resumeTitle },
  });
}

export function notifySubscriptionChange(status: string) {
  const messages: Record<string, { title: string; message: string }> = {
    active: {
      title: "Premium Activated",
      message: "Your Premium subscription is now active. You have full access to all AI-powered features.",
    },
    trialing: {
      title: "Free Trial Started",
      message: "Your free trial has started. Explore all Premium features and decide if it's right for you.",
    },
    canceled: {
      title: "Subscription Canceled",
      message: "Your subscription has been canceled. You'll retain access until the end of your billing period.",
    },
    past_due: {
      title: "Payment Past Due",
      message: "Your last payment failed. Please update your payment method to avoid service interruption.",
    },
  };
  const info = messages[status];
  if (info) {
    useNotificationStore.getState().pushNotification({
      type: "subscription",
      title: info.title,
      message: info.message,
      actionUrl: "/dashboard/settings",
      metadata: { status },
    });
  }
}
