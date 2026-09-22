"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function adminLogin(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  const password = (formData.get("password") as string) || "";
  const next = (formData.get("next") as string) || "/admin/support";

  if (!email || !password) {
    return { success: false, error: "Please enter your administrative email and password." };
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData?.user) {
    return { success: false, error: authError?.message || "Invalid credentials" };
  }

  // Security check: Verify user is registered in admin_users
  const adminClient = createAdminClient();
  const { data: adminRecord, error: adminError } = await adminClient
    .from("admin_users")
    .select("role, email")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (adminError || !adminRecord) {
    // Immediately terminate session if regular candidate tries to log in through admin portal
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Access Denied: This portal is strictly restricted to authorized JobVanta administrators and support personnel.",
    };
  }

  // Update staff online presence
  await adminClient
    .from("support_staff_profiles")
    .update({
      is_online: true,
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", authData.user.id);

  revalidatePath("/admin", "layout");
  redirect(next);
}
