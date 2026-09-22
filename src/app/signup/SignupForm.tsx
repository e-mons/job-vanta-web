"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { signup, verifySignupOtp, resendSignupOtp } from "../login/actions";
import { useSearchParams, useRouter } from "next/navigation";
import { OtpCodeInput } from "@/components/auth/OtpCodeInput";
import { createClient } from "@/utils/supabase/client";

const signupSchema = z.object({
  full_name: z.string().min(2, "Full Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm({ message: initialMessage }: { message?: string }) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const router = useRouter();

  const [step, setStep] = useState<"form" | "verify_otp">("form");
  const [registeredEmail, setRegisteredEmail] = useState<string>("");
  const [signupError, setSignupError] = useState<string | null>(
    initialMessage && initialMessage !== "check-email" ? initialMessage : null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setSignupError(null);
    try {
      const supabase = createClient();
      const redirectOrigin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${redirectOrigin}/auth/callback?next=${encodeURIComponent(next || "/dashboard")}`,
          scopes: "openid email profile",
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setIsGoogleLoading(false);
      setSignupError(err.message || "Could not initiate Google Sign-Up. Please try again.");
    }
  };

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setSignupError(null);
    try {
      const formData = new FormData();
      formData.append("full_name", data.full_name);
      formData.append("email", data.email);
      formData.append("password", data.password);
      if (next) formData.append("next", next);

      const result = await signup(formData);

      if (!result.success) {
        setSignupError(result.message || "Could not complete registration. Please try again.");
        return;
      }

      if (result.message === "signed_in") {
        router.push(next);
        return;
      }

      // Move to 6-digit code verification
      setRegisteredEmail(result.email || data.email);
      setStep("verify_otp");
    } catch (err: any) {
      setSignupError(err?.message || "An unexpected error occurred during registration. Please try again.");
    }
  };

  const handleVerifyOtp = async (code: string) => {
    try {
      const result = await verifySignupOtp(registeredEmail, code, next);
      if (result.success) {
        router.push(result.next || next);
        return { success: true };
      }
      return { success: false, message: result.message };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || "Verification failed. Please try again.",
      };
    }
  };

  const handleResendOtp = async () => {
    try {
      return await resendSignupOtp(registeredEmail);
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || "Could not resend verification code.",
      };
    }
  };

  // Step 2: 6-Digit OTP Verification Screen
  if (step === "verify_otp") {
    return (
      <OtpCodeInput
        email={registeredEmail}
        title="Verify Your Email"
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        onChangeEmail={() => setStep("form")}
      />
    );
  }

  // Step 1: Account Creation Form
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={isGoogleLoading || isSubmitting}
        className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-xs transition-all duration-200 cursor-pointer disabled:opacity-60"
      >
        {isGoogleLoading ? (
          <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>Sign up with Google</span>
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 my-1">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">or sign up with email</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="full_name" className="text-sm font-bold text-slate-700 ml-1">
          Full Name
        </label>
        <input
          {...register("full_name")}
          id="full_name"
          type="text"
          placeholder="John Doe"
          className={`w-full px-5 py-4 rounded-2xl bg-slate-50 border ${
            errors.full_name
              ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
              : "border-slate-200 focus:border-blue-600 focus:ring-blue-600/5"
          } focus:bg-white focus:ring-4 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-900`}
        />
        {errors.full_name && (
          <span className="text-xs font-bold text-rose-500 ml-1">{errors.full_name.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-bold text-slate-700 ml-1">
          Email Address
        </label>
        <input
          {...register("email")}
          id="email"
          type="email"
          placeholder="you@example.com"
          className={`w-full px-5 py-4 rounded-2xl bg-slate-50 border ${
            errors.email
              ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
              : "border-slate-200 focus:border-blue-600 focus:ring-blue-600/5"
          } focus:bg-white focus:ring-4 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-900`}
        />
        {errors.email && (
          <span className="text-xs font-bold text-rose-500 ml-1">{errors.email.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-bold text-slate-700 ml-1">
          Password
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

      {signupError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold text-center">
          {signupError}
        </div>
      )}

      <button
        disabled={isSubmitting}
        type="submit"
        className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Sending verification code...</span>
          </>
        ) : (
          <>
            <span>Create Account</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
}
