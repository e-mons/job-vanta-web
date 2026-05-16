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
  fetchSubscription: () => Promise<void>;
  isPremium: () => boolean;
  createCheckoutSession: (priceId: string) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  status: 'none',
  planId: null,
  isLoading: false,
  error: null,

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
        .select('status, plan_id')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "No rows found"

      if (data) {
        set({ status: data.status as SubscriptionStatus, planId: data.plan_id, isLoading: false });
      } else {
        set({ status: 'none', planId: null, isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  isPremium: () => {
    const { status } = get();
    return status === 'active' || status === 'trialing';
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
