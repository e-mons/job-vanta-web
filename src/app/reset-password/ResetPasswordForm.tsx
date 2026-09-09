"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, Eye, EyeOff, Loader2, KeyRound } from "lucide-react";
import { resetPassword } from "../login/actions";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string().min(6, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm({ message }: { message?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [formError, setFormError] = useState<string | null>(message || null);
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        setHasSession(!!session);
      } catch {
        setHasSession(false);
      }
    }
    checkSession();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setFormError(null);
    try {
      const supabase = createClient();
      let updated = false;

      const { error: clientError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (!clientError) {
        updated = true;
      } else {
        const formData = new FormData();
        formData.append("password", data.password);
        const result = await resetPassword(formData);
        if (result.success) {
          updated = true;
        } else {
          setFormError(result.message || clientError.message || "Could not update password. Please try again.");
          return;
        }
      }

      if (updated) {
        try {
          await supabase.auth.signOut();
        } catch {
          // Ignore signout error
        }
        router.push("/login?message=Password updated successfully! Please sign in.");
      }
    } catch (err: any) {
      setFormError(err?.message || "An unexpected error occurred while updating your password. Please try again.");
    }
  };

  if (hasSession === false) {
    return (
      <div className="flex flex-col items-center text-center py-4 gap-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
          <KeyRound className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-slate-900">Verification Required</h2>
          <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xs">
            To set a new password, please request and verify a 6-digit recovery code first.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
        >
          <span>Request Reset Code</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <label htmlFor="password" className="text-sm font-bold text-slate-700 ml-1">
          New Password
        </label>
        <div className="relative">
          <input
            {...register("password")}
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className={`w-full px-5 py-4 pr-12 rounded-2xl bg-slate-50 border ${
              errors.password
                ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                : "border-slate-200 focus:border-blue-600 focus:ring-blue-600/5"
            } focus:bg-white focus:ring-4 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-900`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && (
          <span className="text-xs font-bold text-rose-500 ml-1">{errors.password.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <label htmlFor="confirmPassword" className="text-sm font-bold text-slate-700 ml-1">
          Confirm New Password
        </label>
        <div className="relative">
          <input
            {...register("confirmPassword")}
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            className={`w-full px-5 py-4 pr-12 rounded-2xl bg-slate-50 border ${
              errors.confirmPassword
                ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                : "border-slate-200 focus:border-blue-600 focus:ring-blue-600/5"
            } focus:bg-white focus:ring-4 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-900`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <span className="text-xs font-bold text-rose-500 ml-1">{errors.confirmPassword.message}</span>
        )}
      </div>

      {formError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold text-center">
          {formError}
        </div>
      )}

      <button
        disabled={isSubmitting || hasSession === null}
        type="submit"
        className="mt-2 w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-900/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Updating password...</span>
          </>
        ) : (
          <>
            <span>Set New Password</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
}
