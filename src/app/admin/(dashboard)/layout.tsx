import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { redirect } from "next/navigation";
import AdminClientLayout from "./AdminClientLayout";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login");
  }

  // Strictly verify that the user is an authorized admin/staff member
  const adminClient = createAdminClient();
  const { data: adminRecord, error: adminError } = await adminClient
    .from("admin_users")
    .select("role, email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || !adminRecord) {
    // Ordinary candidate accounts must NEVER access /admin
    redirect("/admin/login?error=forbidden");
  }

  return (
    <AdminClientLayout
      adminEmail={user.email || adminRecord.email}
      adminRole={adminRecord.role}
    >
      {children}
    </AdminClientLayout>
  );
}
