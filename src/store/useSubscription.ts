import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

export type SubscriptionStatus = 
  | 'active' 
  | 'trialing' 
  | 'past_due' 
  | 'canceled' 
  | 'unpaid' 
  | 'incomplete' 
  | 'incomplete_expired' 
  | 'none';

interface SubscriptionState {
  status: SubscriptionStatus;
  planId: string | null;
  isLoading: boolean;
  error: string | null;
  currentPeriodEnd: string | null;
  fetchSubscription: () => Promise<void>;
  isPremium: () => boolean;
  createCheckoutSession: (priceId: string) => Promise<void>;
  verifyAndSync: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  status: 'none',
  planId: null,
  isLoading: false,
  error: null,
  currentPeriodEnd: null,

  fetchSubscription: async () => {
    set({ isLoading: true, error: null });
    const supabase = createClient();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ status: 'none', planId: null, isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, plan_id, current_period_end')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "No rows found"

      if (data) {
        set({ 
          status: data.status as SubscriptionStatus, 
          planId: data.plan_id, 
          currentPeriodEnd: data.current_period_end,
          isLoading: false 
        });
      } else {
        // No subscription found in DB — try to verify with Dodo API
        // This handles the case where the user just completed checkout
        // but the webhook hasn't arrived (e.g. localhost development)
        await get().verifyAndSync();
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  isPremium: () => {
    const { status } = get();
    return status === 'active' || status === 'trialing';
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
        // Re-fetch from Supabase to get the canonical data
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('subscriptions')
          .select('status, plan_id, current_period_end')
          .eq('user_id', user.id)
          .single();

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
}));
