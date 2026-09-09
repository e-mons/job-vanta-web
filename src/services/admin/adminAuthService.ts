import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import type { AdminPermission, AdminRole, AdminUser } from "@shared/types/adminQa";

export class AdminUnauthorizedError extends Error {
  constructor(message = "Authentication required for administrative operations") {
    super(message);
    this.name = "AdminUnauthorizedError";
    Object.setPrototypeOf(this, AdminUnauthorizedError.prototype);
  }
}

export class AdminForbiddenError extends Error {
  constructor(message = "Insufficient administrative permissions for this operation") {
    super(message);
    this.name = "AdminForbiddenError";
    Object.setPrototypeOf(this, AdminForbiddenError.prototype);
  }
}

export interface AuthenticatedAdminContext {
  userId: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  adminRecord: AdminUser;
}

/**
 * Validates that the current request is from an authenticated admin with required permissions.
 * Follows least-privilege security model.
 */
export async function requireAdminPermission(
  requiredPermission?: AdminPermission
): Promise<AuthenticatedAdminContext> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new AdminUnauthorizedError();
  }

  // Use admin client to query admin_users record securely
  const adminClient = createAdminClient();
  const { data: adminRecord, error: adminError } = await adminClient
    .from("admin_users")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (adminError || !adminRecord) {
    throw new AdminForbiddenError("You are not registered as an authorized administrator");
  }

  const role = adminRecord.role as AdminRole;
  const permissions = (adminRecord.permissions || []) as AdminPermission[];

  // super_admin has all permissions automatically
  if (role === "super_admin") {
    return {
      userId: user.id,
      email: user.email || adminRecord.email,
      role,
      permissions,
      adminRecord,
    };
  }

  if (requiredPermission && !permissions.includes(requiredPermission)) {
    throw new AdminForbiddenError(
      `Permission denied: Operation requires '${requiredPermission}' permission`
    );
  }

  return {
    userId: user.id,
    email: user.email || adminRecord.email,
    role,
    permissions,
    adminRecord,
  };
}

/**
 * Checks if a user is an admin without throwing.
 */
export async function checkAdminStatus(userId?: string): Promise<{
  isAdmin: boolean;
  role: AdminRole | null;
  permissions: AdminPermission[];
}> {
  if (!userId) return { isAdmin: false, role: null, permissions: [] };

  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("admin_users")
      .select("role, permissions")
      .eq("user_id", userId)
      .single();

    if (!data) return { isAdmin: false, role: null, permissions: [] };

    return {
      isAdmin: true,
      role: data.role as AdminRole,
      permissions: (data.permissions || []) as AdminPermission[],
    };
  } catch {
    return { isAdmin: false, role: null, permissions: [] };
  }
}
