"use client";

import { useEffect, useRef } from "react";
import { useSubscriptionStore } from "@/store/useSubscription";
import { toast } from "sonner";

/**
 * AppInitializer runs once on app load to fetch global state
 * like the user's subscription status. This prevents premium
 * features from randomly deactivating on page refreshes, and
 * seamlessly detects returns from payment checkouts to hydrate
 * the newly upgraded plan and show celebration feedback.
 */
export default function AppInitializer() {
  const fetchSubscription = useSubscriptionStore((state) => state.fetchSubscription);
  const fetchUsage = useSubscriptionStore((state) => state.fetchUsage);
  const hasHandledPayment = useRef(false);

  useEffect(() => {
    // Initial fetch of current subscription
    fetchSubscription();

    // Check for payment=success query parameter in browser address bar
    if (typeof window !== "undefined" && !hasHandledPayment.current) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("payment") === "success") {
        hasHandledPayment.current = true;

        (async () => {
          try {
            await fetchSubscription();
            const usage = await fetchUsage();
            const rawPlanName = usage?.planName || "Pro";
            const capitalizedPlan = rawPlanName.charAt(0).toUpperCase() + rawPlanName.slice(1);

            toast.success(`Plan upgraded successfully! Welcome to JobVanta ${capitalizedPlan}.`, {
              duration: 5000,
            });
          } catch (err) {
            console.warn("[AppInitializer] Post-payment hydration warning:", err);
          } finally {
            // Clean ?payment=success from URL address bar without reloading
            try {
              urlParams.delete("payment");
              const newSearch = urlParams.toString();
              const cleanUrl =
                window.location.pathname +
                (newSearch ? `?${newSearch}` : "") +
                window.location.hash;
              window.history.replaceState({}, "", cleanUrl);
            } catch {}
          }
        })();
      }
    }
  }, [fetchSubscription, fetchUsage]);

  return null;
}
