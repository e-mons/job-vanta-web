import { createAdminClient } from "@/utils/supabase/admin";
import type { 
  ExecutiveFinancialOverview, 
  AdminSubscriptionRecord, 
  AdminUserRecord, 
  AICostTelemetry, 
  SystemQuotas, 
  PromoCode 
} from "@shared/types";

export class AdminFinancialService {
  /**
   * Retrieves high-level financial & conversion pulse for the Super Admin
   */
  static async getExecutiveOverview(): Promise<ExecutiveFinancialOverview> {
    const adminClient = createAdminClient();

    // 1. Fetch all subscriptions
    const { data: subsData } = await adminClient
      .from("subscriptions")
      .select("*");

    const allSubs = subsData || [];
    const activeSubs = allSubs.filter((s) => s.status === "active" || s.status === "trialing");

    let proCount = 0;
    let unlimitedCount = 0;
    let mrr = 0;

    activeSubs.forEach((s) => {
      const plan = (s.plan_id || "").toLowerCase();
      if (plan.includes("unlimited")) {
        unlimitedCount++;
        mrr += 99;
      } else if (plan.includes("pro")) {
        proCount++;
        mrr += 29;
      }
    });

    const arr = mrr * 12;

    // 2. Fetch profiles count
    const { count: totalProfilesCount } = await adminClient
      .from("profiles")
      .select("id", { count: "exact", head: true });

    const totalUsers = totalProfilesCount || allSubs.length || 1;
    const activeSubscribersCount = activeSubs.length;
    const freeUsersCount = Math.max(0, totalUsers - activeSubscribersCount);
    const conversionRate = totalUsers > 0 
      ? Number(((activeSubscribersCount / totalUsers) * 100).toFixed(1)) 
      : 0;

    // 3. Fetch token generation logs for AI cost estimation from real logs
    const { data: qaLogs } = await adminClient
      .from("qa_generation_logs")
      .select("prompt_tokens, completion_tokens, estimated_cost_usd, created_at")
      .limit(2000);

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let calculatedAiCost = 0;

    (qaLogs || []).forEach((log) => {
      const pTokens = log.prompt_tokens || 0;
      const cTokens = log.completion_tokens || 0;
      totalInputTokens += pTokens;
      totalOutputTokens += cTokens;
      
      const rowCost = log.estimated_cost_usd 
        ? Number(log.estimated_cost_usd) 
        : ((pTokens / 1_000_000) * 0.10 + (cTokens / 1_000_000) * 0.40);
      calculatedAiCost += rowCost;
    });

    const totalAiCostThisMonth = Number(calculatedAiCost.toFixed(4));
    const grossRevenueThisMonth = mrr;
    const grossRevenueToday = Number((mrr / 30).toFixed(2));
    const netProfitMargin = grossRevenueThisMonth > 0
      ? Number((((grossRevenueThisMonth - totalAiCostThisMonth) / grossRevenueThisMonth) * 100).toFixed(1))
      : 0;

    // 4. Paywall Hitters: Free users who reached or exceeded daily limits today
    const activeSubscriberUserIds = new Set(activeSubs.map((s) => s.user_id));
    const today = new Date().toISOString().split("T")[0];
    const { data: usageData } = await adminClient
      .from("user_daily_usage")
      .select("user_id, ai_applies_count, resumes_created_count, updated_at")
      .eq("usage_date", today)
      .gte("ai_applies_count", 2)
      .limit(20);

    // Only surface actual free-tier candidates who hit the quota
    const truePaywallHitters = (usageData || []).filter(
      (u) => !activeSubscriberUserIds.has(u.user_id)
    );

    const paywallUserIds = truePaywallHitters.map((u) => u.user_id);
    let userEmailMap = new Map<string, string>();
    if (paywallUserIds.length > 0) {
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, full_name, email")
        .in("id", paywallUserIds);

      (profiles || []).forEach((p) => {
        userEmailMap.set(p.id, p.email || p.full_name || "Candidate");
      });
    }

    const paywallHitters = truePaywallHitters.slice(0, 10).map((u) => ({
      userId: u.user_id,
      email: userEmailMap.get(u.user_id) || `User (${u.user_id.slice(0, 6)}...)`,
      appliesCount: u.ai_applies_count,
      resumesCount: u.resumes_created_count || 1,
      lastActive: u.updated_at,
    }));

    // 5. Recent transactions from real customer subscription records
    const recentSubUserIds = allSubs.slice(0, 8).map((s) => s.user_id);
    let subProfileMap = new Map<string, { email?: string; full_name?: string }>();
    if (recentSubUserIds.length > 0) {
      const { data: subProfiles } = await adminClient
        .from("profiles")
        .select("id, full_name, email")
        .in("id", recentSubUserIds);

      (subProfiles || []).forEach((p) => {
        subProfileMap.set(p.id, { email: p.email, full_name: p.full_name });
      });
    }

    const recentTransactions = allSubs.slice(0, 8).map((s) => {
      const profile = subProfileMap.get(s.user_id);
      const lastPayment = s.last_payment_details as any;
      const customerEmail = lastPayment?.customer?.email || profile?.email || s.dodo_customer_id || `Customer (${s.user_id.slice(0, 6)}...)`;
      const isUnlimited = (s.plan_id || "").toLowerCase().includes("unlimited");

      return {
        id: s.id,
        userEmail: customerEmail,
        plan: s.plan_id?.toUpperCase() || (isUnlimited ? "UNLIMITED" : "PRO"),
        amount: isUnlimited ? 99 : 29,
        status: s.status,
        date: s.created_at,
      };
    });

    return {
      mrr,
      arr,
      grossRevenueThisMonth,
      grossRevenueToday,
      activeSubscribersCount,
      proCount,
      unlimitedCount,
      freeUsersCount,
      conversionRate,
      totalAiCostThisMonth,
      netProfitMargin,
      recentTransactions,
      paywallHitters,
    };
  }

  /**
   * Lists all subscriber accounts with details
   */
  static async listSubscriptions(filters: {
    status?: string;
    search?: string;
  }): Promise<AdminSubscriptionRecord[]> {
    const adminClient = createAdminClient();

    let query = adminClient
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    const { data: subs, error } = await query;
    if (error) {
      throw new Error(`Failed to list subscriptions: ${error.message}`);
    }

    const userIds = (subs || []).map((s) => s.user_id);
    let profileMap = new Map<string, { email?: string; full_name?: string }>();

    if (userIds.length > 0) {
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      (profiles || []).forEach((p) => {
        profileMap.set(p.id, { email: p.email, full_name: p.full_name });
      });
    }

    return (subs || []).map((s) => {
      const profile = profileMap.get(s.user_id);
      const isUnlimited = (s.plan_id || "").toLowerCase().includes("unlimited");
      return {
        id: s.id,
        userId: s.user_id,
        userEmail: profile?.email || profile?.full_name || s.dodo_customer_id || s.user_id,
        userName: profile?.full_name || "JobVanta Candidate",
        planId: isUnlimited ? "unlimited" : "pro",
        status: s.status,
        amountMonthly: isUnlimited ? 99 : 29,
        currentPeriodEnd: s.current_period_end,
        dodoSubscriptionId: s.dodo_subscription_id,
        dodoPaymentId: s.dodo_payment_id,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      };
    });
  }

  /**
   * Super Admin manual override: gift Pro, change plan, or activate subscription
   */
  static async overrideUserSubscription(params: {
    userId: string;
    planId: "free" | "pro" | "unlimited";
    status: "active" | "canceled" | "past_due";
    durationDays?: number;
    reason?: string;
    adminUserId: string;
  }): Promise<void> {
    const adminClient = createAdminClient();

    const periodEnd = new Date(
      Date.now() + (params.durationDays || 30) * 24 * 60 * 60 * 1000
    ).toISOString();

    // Upsert subscription
    const { error } = await adminClient
      .from("subscriptions")
      .upsert({
        user_id: params.userId,
        plan_id: params.planId,
        status: params.status,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (error) {
      throw new Error(`Failed to override subscription: ${error.message}`);
    }

    // Log admin mutation
    await adminClient.from("qa_admin_audit_logs").insert({
      admin_user_id: params.adminUserId,
      action: "override_subscription",
      target_type: "user",
      target_id: params.userId,
      details: {
        planId: params.planId,
        status: params.status,
        durationDays: params.durationDays || 30,
        reason: params.reason || "Manual super admin override",
      },
    });
  }

  /**
   * Resets a user's daily usage counters for today (giving them fresh quota)
   */
  static async resetUserDailyUsage(userId: string, adminUserId: string): Promise<void> {
    const adminClient = createAdminClient();
    const today = new Date().toISOString().split("T")[0];

    await adminClient
      .from("user_daily_usage")
      .upsert({
        user_id: userId,
        usage_date: today,
        ai_applies_count: 0,
        resumes_created_count: 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,usage_date" });

    await adminClient.from("qa_admin_audit_logs").insert({
      admin_user_id: adminUserId,
      action: "reset_daily_usage",
      target_type: "user",
      target_id: userId,
      details: { date: today, reason: "Manual quota refresh" },
    });
  }

  /**
   * Lists candidate users with aggregated intelligence
   */
  static async listCandidateUsers(params: {
    search?: string;
    limit?: number;
  }): Promise<AdminUserRecord[]> {
    const adminClient = createAdminClient();

    let query = adminClient
      .from("profiles")
      .select("id, full_name, email, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(params.limit || 50);

    if (params.search?.trim()) {
      const term = params.search.trim();
      query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
    }

    const { data: profiles, error } = await query;
    if (error) {
      throw new Error(`Failed to list candidate users: ${error.message}`);
    }

    const userIds = (profiles || []).map((p) => p.id);
    if (userIds.length === 0) return [];

    // Fetch related counts in parallel
    const today = new Date().toISOString().split("T")[0];
    const [subsRes, resumesRes, appsRes, usageRes, ticketsRes] = await Promise.all([
      adminClient.from("subscriptions").select("user_id, plan_id, status").in("user_id", userIds),
      adminClient.from("resumes").select("user_id, ats_score").in("user_id", userIds),
      adminClient.from("job_applications").select("user_id").in("user_id", userIds),
      adminClient.from("user_daily_usage").select("user_id, ai_applies_count").eq("usage_date", today).in("user_id", userIds),
      adminClient.from("support_tickets").select("user_id").in("user_id", userIds),
    ]);

    const subMap = new Map<string, { plan: string; status: string }>();
    (subsRes.data || []).forEach((s) => subMap.set(s.user_id, { plan: s.plan_id, status: s.status }));

    const resumeCountMap = new Map<string, { count: number; totalAts: number }>();
    (resumesRes.data || []).forEach((r) => {
      const prev = resumeCountMap.get(r.user_id) || { count: 0, totalAts: 0 };
      resumeCountMap.set(r.user_id, {
        count: prev.count + 1,
        totalAts: prev.totalAts + (r.ats_score || 70),
      });
    });

    const appCountMap = new Map<string, number>();
    (appsRes.data || []).forEach((a) => {
      appCountMap.set(a.user_id, (appCountMap.get(a.user_id) || 0) + 1);
    });

    const usageMap = new Map<string, number>();
    (usageRes.data || []).forEach((u) => {
      usageMap.set(u.user_id, u.ai_applies_count || 0);
    });

    const ticketCountMap = new Map<string, number>();
    (ticketsRes.data || []).forEach((t) => {
      ticketCountMap.set(t.user_id, (ticketCountMap.get(t.user_id) || 0) + 1);
    });

    return (profiles || []).map((p) => {
      const sub = subMap.get(p.id);
      const isSub = sub?.status === "active";
      const resumeStat = resumeCountMap.get(p.id) || { count: 0, totalAts: 0 };
      const avgAts = resumeStat.count > 0 ? Math.round(resumeStat.totalAts / resumeStat.count) : 0;

      return {
        id: p.id,
        email: p.email || (p.full_name ? `${p.full_name.toLowerCase().replace(/\s+/g, '.')}@candidate.com` : `candidate-${p.id.slice(0, 6)}@jobvanta.com`),
        fullName: p.full_name || "JobVanta User",
        createdAt: p.created_at || p.updated_at || new Date().toISOString(),
        plan: isSub ? (sub?.plan || "pro").toUpperCase() : "FREE",
        isSubscriber: isSub,
        resumesCount: resumeStat.count,
        avgAtsScore: avgAts,
        applicationsCount: appCountMap.get(p.id) || 0,
        todayAppliesCount: usageMap.get(p.id) || 0,
        supportTicketsCount: ticketCountMap.get(p.id) || 0,
      };
    });
  }

  /**
   * Retrieves AI Token & Cost Telemetry from real qa_generation_logs
   */
  static async getAICostTelemetry(): Promise<AICostTelemetry> {
    const adminClient = createAdminClient();

    const { data: logs } = await adminClient
      .from("qa_generation_logs")
      .select("prompt_tokens, completion_tokens, feature, estimated_cost_usd, model_name, user_id, created_at")
      .limit(2000);

    let totalInput = 0;
    let totalOutput = 0;
    let totalRealCost = 0;
    const userUsageMap = new Map<string, number>();

    let resumeCost = 0;
    let coverLetterCost = 0;
    let interviewQaCost = 0;
    let voicePracticeCost = 0;

    (logs || []).forEach((l) => {
      const pTokens = l.prompt_tokens || 0;
      const cTokens = l.completion_tokens || 0;
      totalInput += pTokens;
      totalOutput += cTokens;

      const rowCost = l.estimated_cost_usd 
        ? Number(l.estimated_cost_usd) 
        : ((pTokens / 1_000_000) * 0.10 + (cTokens / 1_000_000) * 0.40);

      totalRealCost += rowCost;

      const feat = (l.feature || "").toLowerCase();
      if (feat.includes("resume") || feat.includes("analyze") || feat.includes("optimize") || feat.includes("ats")) {
        resumeCost += rowCost;
      } else if (feat.includes("cover") || feat.includes("letter")) {
        coverLetterCost += rowCost;
      } else if (feat.includes("voice") || feat.includes("audio") || feat.includes("speech") || feat.includes("practice")) {
        voicePracticeCost += rowCost;
      } else {
        // default to interview Q&A / prepare
        interviewQaCost += rowCost;
      }

      if (l.user_id) {
        userUsageMap.set(l.user_id, (userUsageMap.get(l.user_id) || 0) + rowCost);
      }
    });

    const negativeMarginUsers: AICostTelemetry["negativeMarginUsers"] = [];
    if (userUsageMap.size > 0) {
      const userIds = Array.from(userUsageMap.keys());
      const [{ data: userSubs }, { data: userProfiles }] = await Promise.all([
        adminClient.from("subscriptions").select("user_id, plan_id, status").in("user_id", userIds),
        adminClient.from("profiles").select("id, full_name, email").in("user_id", userIds),
      ]);

      const subMap = new Map((userSubs || []).map((s) => [s.user_id, s]));
      const profMap = new Map((userProfiles || []).map((p) => [p.id, p]));

      userIds.forEach((uid) => {
        const cost = userUsageMap.get(uid) || 0;
        const sub = subMap.get(uid);
        const isSub = sub?.status === "active";
        const isUnl = (sub?.plan_id || "").toLowerCase().includes("unlimited");
        const monthlyFee = isSub ? (isUnl ? 99 : 29) : 0;
        const margin = monthlyFee - cost;

        // If cost exceeds fee, it's negative margin (e.g. Free user generating costs)
        if (cost > 0 && margin < 0) {
          const prof = profMap.get(uid);
          negativeMarginUsers.push({
            userId: uid,
            email: prof?.email || prof?.full_name || `User (${uid.slice(0, 6)}...)`,
            plan: isSub ? (sub?.plan_id?.toUpperCase() || "PRO") : "FREE",
            monthlyFee,
            estimatedAiCost: Number(cost.toFixed(4)),
            margin: Number(margin.toFixed(4)),
          });
        }
      });
    }

    return {
      totalEstimatedCost: Number(totalRealCost.toFixed(4)),
      totalTokensConsumed: totalInput + totalOutput,
      byFeature: {
        resumeOptimization: Number(resumeCost.toFixed(4)),
        coverLetters: Number(coverLetterCost.toFixed(4)),
        interviewQa: Number(interviewQaCost.toFixed(4)),
        voicePractice: Number(voicePracticeCost.toFixed(4)),
      },
      negativeMarginUsers,
    };
  }

  /**
   * System Quotas
   */
  static async getSystemQuotas(): Promise<SystemQuotas> {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("system_quotas")
      .select("*")
      .eq("id", "global")
      .single();

    if (error || !data) {
      return {
        id: "global",
        free_daily_ai_applies: 2,
        pro_daily_ai_applies: 25,
        unlimited_daily_ai_applies: 100,
        free_max_resumes: 1,
        pro_max_resumes: 5,
        ai_kill_switch: false,
        updated_at: new Date().toISOString(),
      };
    }

    return data as SystemQuotas;
  }

  static async updateSystemQuotas(quotas: Partial<SystemQuotas>): Promise<SystemQuotas> {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("system_quotas")
      .update({
        ...quotas,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "global")
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update system quotas: ${error.message}`);
    }

    return data as SystemQuotas;
  }

  /**
   * Promo Codes
   */
  static async listPromoCodes(): Promise<PromoCode[]> {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list promo codes: ${error.message}`);
    }

    return (data || []) as PromoCode[];
  }

  static async createPromoCode(data: {
    code: string;
    discountType: "percentage" | "fixed_amount";
    discountValue: number;
    planId?: string;
    maxRedemptions?: number | null;
    expiresAt?: string | null;
    adminUserId: string;
  }): Promise<PromoCode> {
    const adminClient = createAdminClient();
    const cleanCode = data.code.trim().toUpperCase();

    const { data: created, error } = await adminClient
      .from("promo_codes")
      .insert({
        code: cleanCode,
        discount_type: data.discountType,
        discount_value: data.discountValue,
        plan_id: data.planId || "all",
        max_redemptions: data.maxRedemptions || null,
        expires_at: data.expiresAt || null,
        created_by: data.adminUserId,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create promo code: ${error.message}`);
    }

    return created as PromoCode;
  }

  static async togglePromoCode(id: string, isActive: boolean): Promise<void> {
    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from("promo_codes")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to toggle promo code: ${error.message}`);
    }
  }
}
