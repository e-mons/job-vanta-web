"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { signup, verifySignupOtp, resendSignupOtp } from "../login/actions";
import { useSearchParams, useRouter } from "next/navigation";
import { OtpCodeInput } from "@/components/auth/OtpCodeInput";

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
