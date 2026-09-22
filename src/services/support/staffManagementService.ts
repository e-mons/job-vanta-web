import { createAdminClient } from "@/utils/supabase/admin";
import type { SupportStaffProfile, AdminRole } from "@shared/types";

export class StaffManagementService {
  /**
   * Super Admin: List all staff members with their role, email, status, and active ticket metrics.
   */
  static async listStaff(): Promise<SupportStaffProfile[]> {
    const adminClient = createAdminClient();

    // Query staff profiles
    const { data: profiles, error: pError } = await adminClient
      .from("support_staff_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (pError) {
      throw new Error(`Failed to list staff profiles: ${pError.message}`);
    }

    // Query admin_users to get role
    const { data: adminRecords } = await adminClient
      .from("admin_users")
      .select("user_id, email, role");

    const adminMap = new Map((adminRecords || []).map((a) => [a.user_id, a]));

    // Query open tickets count per agent
    const { data: ticketCounts } = await adminClient
      .from("support_tickets")
      .select("assigned_agent_id")
      .in("status", ["open", "in_progress", "waiting_user"]);

    const countMap = new Map<string, number>();
    (ticketCounts || []).forEach((t) => {
      if (t.assigned_agent_id) {
        countMap.set(t.assigned_agent_id, (countMap.get(t.assigned_agent_id) || 0) + 1);
      }
    });

    return (profiles || []).map((p) => {
      const adminInfo = adminMap.get(p.id);
      return {
        ...p,
        email: adminInfo?.email || "staff@jobvanta.com",
        role: adminInfo?.role || "support_agent",
        active_tickets_count: countMap.get(p.id) || 0,
      };
    });
  }

  /**
   * Super Admin: Invite / create a new staff member.
   */
  static async inviteStaffMember(params: {
    email: string;
    displayName: string;
    role: AdminRole;
    temporaryPassword?: string;
  }): Promise<{ user: any; temporaryPassword: string }> {
    const adminClient = createAdminClient();
    const tempPassword = params.temporaryPassword || `JobvantaStaff#${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Check if user already exists in auth.users
    const { data: usersData } = await adminClient.auth.admin.listUsers();
    let existingUser = usersData?.users?.find(
      (u) => u.email?.toLowerCase() === params.email.toLowerCase()
    );

    let userId: string;
    if (existingUser) {
      userId = existingUser.id;
      // Update password so staff can log in
      await adminClient.auth.admin.updateUserById(userId, {
        password: tempPassword,
        email_confirm: true,
      });
    } else {
      // Attempt invite email via Supabase Auth
      try {
        const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
          params.email,
          {
            data: {
              full_name: params.displayName,
              is_staff: true,
            },
          }
        );
        if (!inviteError && inviteData?.user) {
          userId = inviteData.user.id;
          // Set their temporary password so they can log in immediately as well
          await adminClient.auth.admin.updateUserById(userId, { password: tempPassword });
        } else {
          throw inviteError || new Error("Invite email fallback");
        }
      } catch {
        // Create new user in auth.users directly
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email: params.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name: params.displayName,
            is_staff: true,
          },
        });

        if (createError || !newUser?.user) {
          throw new Error(`Failed to create staff user: ${createError?.message}`);
        }
        userId = newUser.user.id;
      }
    }

    // 2. Upsert admin_users record with designated role
    const permissions = [
      "support.manage_tickets",
      "support.view_analytics",
    ];
    if (params.role === "super_admin" || params.role === "support_manager" || params.role === "support_lead") {
      permissions.push("support.manage_staff");
    }

    await adminClient.from("admin_users").upsert(
      {
        user_id: userId,
        email: params.email,
        role: params.role,
        permissions,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    // 3. Upsert support_staff_profiles
    await adminClient.from("support_staff_profiles").upsert(
      {
        id: userId,
        display_name: params.displayName,
        is_active: true,
        is_online: false,
        max_concurrent_tickets: 5,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    return {
      user: { id: userId, email: params.email, displayName: params.displayName, role: params.role },
      temporaryPassword: tempPassword,
    };
  }

  /**
   * Super Admin: Toggle staff status or change role.
   */
  static async updateStaffMember(params: {
    staffId: string;
    isActive?: boolean;
    role?: AdminRole;
    displayName?: string;
  }): Promise<void> {
    const adminClient = createAdminClient();

    if (params.isActive !== undefined || params.displayName) {
      const updateData: any = { updated_at: new Date().toISOString() };
      if (params.isActive !== undefined) updateData.is_active = params.isActive;
      if (params.displayName) updateData.display_name = params.displayName;

      await adminClient
        .from("support_staff_profiles")
        .update(updateData)
        .eq("id", params.staffId);
    }

    if (params.role) {
      await adminClient
        .from("admin_users")
        .update({ role: params.role, updated_at: new Date().toISOString() })
        .eq("user_id", params.staffId);
    }
  }

  /**
   * Support analytics & performance overview.
   */
  static async getSupportMetrics(): Promise<{
    openTickets: number;
    inProgressTickets: number;
    unassignedTickets: number;
    resolvedToday: number;
    averageRating: number;
    totalRatingsCount: number;
  }> {
    const adminClient = createAdminClient();

    const [allActiveRes, resolvedRes] = await Promise.all([
      adminClient
        .from("support_tickets")
        .select("id, status, assigned_agent_id")
        .in("status", ["open", "in_progress", "waiting_user"]),
      adminClient
        .from("support_tickets")
        .select("id, status, resolved_at, user_satisfaction_rating")
        .in("status", ["resolved", "closed"]),
    ]);

    const active = allActiveRes.data || [];
    const openTickets = active.filter((t) => t.status === "open").length;
    const inProgressTickets = active.filter((t) => t.status === "in_progress" || t.status === "waiting_user").length;
    const unassignedTickets = active.filter((t) => !t.assigned_agent_id).length;

    const resolved = resolvedRes.data || [];
    const today = new Date().toISOString().split("T")[0];
    const resolvedToday = resolved.filter((t) => t.resolved_at?.startsWith(today)).length;

    const ratedTickets = resolved.filter((t) => typeof t.user_satisfaction_rating === "number");
    const totalRatingSum = ratedTickets.reduce((acc, t) => acc + (t.user_satisfaction_rating || 0), 0);
    const averageRating = ratedTickets.length > 0 ? Number((totalRatingSum / ratedTickets.length).toFixed(1)) : 5.0;

    return {
      openTickets,
      inProgressTickets,
      unassignedTickets,
      resolvedToday,
      averageRating,
      totalRatingsCount: ratedTickets.length,
    };
  }
}
