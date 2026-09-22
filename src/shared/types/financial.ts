export interface ExecutiveFinancialOverview {
  mrr: number;
  arr: number;
  grossRevenueThisMonth: number;
  grossRevenueToday: number;
  activeSubscribersCount: number;
  proCount: number;
  unlimitedCount: number;
  freeUsersCount: number;
  conversionRate: number; // e.g. 4.8%
  totalAiCostThisMonth: number;
  netProfitMargin: number; // e.g. 84.5%
  recentTransactions: Array<{
    id: string;
    userEmail: string;
    plan: string;
    amount: number;
    status: string;
    date: string;
  }>;
  paywallHitters: Array<{
    userId: string;
    email: string;
    appliesCount: number;
    resumesCount: number;
    lastActive: string;
  }>;
}

export interface AdminSubscriptionRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  planId: 'free' | 'pro' | 'unlimited' | string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | string;
  amountMonthly: number;
  currentPeriodEnd?: string | null;
  dodoSubscriptionId?: string | null;
  dodoPaymentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserRecord {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  plan: string;
  isSubscriber: boolean;
  resumesCount: number;
  avgAtsScore: number;
  applicationsCount: number;
  todayAppliesCount: number;
  supportTicketsCount: number;
}

export interface AICostTelemetry {
  totalEstimatedCost: number;
  totalTokensConsumed: number;
  byFeature: {
    resumeOptimization: number;
    coverLetters: number;
    interviewQa: number;
    voicePractice: number;
  };
  negativeMarginUsers: Array<{
    userId: string;
    email: string;
    plan: string;
    monthlyFee: number;
    estimatedAiCost: number;
    margin: number;
  }>;
}

export interface SystemQuotas {
  id: string;
  free_daily_ai_applies: number;
  pro_daily_ai_applies: number;
  unlimited_daily_ai_applies: number;
  free_max_resumes: number;
  pro_max_resumes: number;
  ai_kill_switch: boolean;
  updated_at: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  plan_id: 'all' | 'pro' | 'unlimited' | string;
  max_redemptions: number | null;
  redemptions_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}
