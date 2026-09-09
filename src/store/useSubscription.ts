import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { PLANS } from '@/config/plans';

export type SubscriptionStatus = 
  | 'active' 
  | 'trialing' 
  | 'past_due' 
  | 'canceled' 
  | 'unpaid' 
  | 'incomplete' 
  | 'incomplete_expired' 
  | 'none';

export interface UserDailyUsage {
  planTier: 'free' | 'pro' | 'unlimited';
  planName: string;
  subscription: {
    status: string;
    planId: string | null;
    currentPeriodEnd: string | null;
    dodoCustomerId: string | null;
  };
  limits: {
    resumes: number | 'unlimited';
    dailyAIApplies: number | 'unlimited';
    prepareMe: boolean;
  };
  usage: {
    resumesCreated: number;
    resumesRemaining: number | 'unlimited';
    aiAppliesUsedToday: number;
    aiAppliesRemainingToday: number | 'unlimited';
    isUnlimited: boolean;
  };
}

interface SubscriptionState {
  status: SubscriptionStatus;
  planId: string | null;
  isLoading: boolean;
  error: string | null;
  currentPeriodEnd: string | null;
  usage: UserDailyUsage | null;
  fetchSubscription: () => Promise<void>;
  fetchUsage: () => Promise<UserDailyUsage | null>;
  isPremium: () => boolean;
  getPlanTier: () => 'free' | 'pro' | 'unlimited';
  createCheckoutSession: (priceId: string) => Promise<void>;
  openCustomerPortal: () => Promise<string | null>;
  verifyAndSync: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  status: 'none',
  planId: null,
  isLoading: false,
  error: null,
  currentPeriodEnd: null,
  usage: null,

  fetchSubscription: async () => {
    set({ isLoading: true, error: null });
    const supabase = createClient();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ status: 'none', planId: null, usage: null, isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, plan_id, current_period_end')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        set({ 
          status: data.status as SubscriptionStatus, 
          planId: data.plan_id, 
          currentPeriodEnd: data.current_period_end,
          isLoading: false 
        });
      } else {
        // No subscription found in DB — try to verify with Dodo API
        await get().verifyAndSync();
      }

      // Concurrently update usage data
      await get().fetchUsage();
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchUsage: async () => {
    try {
      const res = await fetch('/api/user/usage');
      if (!res.ok) return null;
      const usageData: UserDailyUsage = await res.json();
      set({ usage: usageData });
      return usageData;
    } catch (err) {
      console.warn('[useSubscriptionStore] Failed to fetch usage:', err);
      return null;
    }
  },

  isPremium: () => {
    const { status } = get();
    return status === 'active' || status === 'trialing';
  },

  getPlanTier: () => {
    const { status, planId, usage } = get();
    if (usage?.planTier) return usage.planTier;
    if (status !== 'active' && status !== 'trialing') return 'free';
    
    if (planId === 'pdt_0NewgKeXYMkBEofXpxy9Z' || planId === 'unlimited' || planId === 'enterprise') {
      return 'unlimited';
    }
    if (planId === 'pdt_0Newfu26VwAPCKJBoT8z5' || planId === 'pro') {
      return 'pro';
    }

    const plan = PLANS.find((p) => p.priceId === planId || p.id === planId);
    if (plan?.id === 'unlimited' || (plan?.id as any) === 'enterprise') return 'unlimited';
    if (plan?.id === 'pro') return 'pro';
    return 'free';
  },

  /**
   * Call the server-side verify endpoint to check Dodo for recent payments
   * and sync the subscription to Supabase if one is found.
   */
  verifyAndSync: async () => {
    try {
      const res = await fetch('/api/dodopayments/verify', { method: 'POST' });
      const result = await res.json();

      if (result.status === 'synced' || result.status === 'already_active') {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('subscriptions')
          .select('status, plan_id, current_period_end')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          set({
            status: data.status as SubscriptionStatus,
            planId: data.plan_id,
            currentPeriodEnd: data.current_period_end,
            isLoading: false,
          });
        }
      } else {
        set({ status: 'none', planId: null, currentPeriodEnd: null, isLoading: false });
      }
    } catch {
      set({ status: 'none', planId: null, currentPeriodEnd: null, isLoading: false });
    }
  },

  createCheckoutSession: async (productId: string) => {
    set({ isLoading: true });
    
    try {
      const response = await fetch('/api/dodopayments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  openCustomerPortal: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/dodopayments/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to open customer portal');
      }

      if (data.url) {
        window.location.href = data.url;
        return data.url;
      }
      return null;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },
}));
