"use client";

import { useEffect } from "react";
import { useSubscriptionStore } from "@/store/useSubscription";

/**
 * AppInitializer runs once on app load to fetch global state
 * like the user's subscription status. This prevents premium
 * features from randomly deactivating on page refreshes.
 */
export default function AppInitializer() {
  const fetchSubscription = useSubscriptionStore((state) => state.fetchSubscription);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return null;
}
