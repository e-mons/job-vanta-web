"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const next = (formData.get("next") as string) || "/dashboard";

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    const loginUrl = new URL("/login", "http://localhost:3000"); // Base URL doesn't matter much for redirect
    loginUrl.searchParams.set("message", "Could not authenticate user");
    if (next !== "/dashboard") loginUrl.searchParams.set("next", next);
    redirect(loginUrl.pathname + loginUrl.search);
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const next = (formData.get("next") as string) || "/dashboard";

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: {
      data: {
        full_name: formData.get("full_name") as string,
      }
    }
  };

  const { error } = await supabase.auth.signUp({
    ...data,
    options: {
      ...data.options,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?next=${next}`,
    },
  });

  if (error) {
    const signupUrl = new URL("/signup", "http://localhost:3000");
    signupUrl.searchParams.set("message", "Could not sign up user");
    if (next !== "/dashboard") signupUrl.searchParams.set("next", next);
    redirect(signupUrl.pathname + signupUrl.search);
  }

  revalidatePath("/", "layout");
  redirect("/signup?message=check-email");
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?next=/reset-password`,
  });

  if (error) {
    redirect("/forgot-password?message=Could not send reset email. Please try again.");
  }

  redirect("/forgot-password?message=success");
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect("/reset-password?message=Could not update password. Please try again.");
  }

  redirect("/login?message=Password updated successfully! Please sign in.");
}
