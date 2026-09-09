"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, Lock, Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { forgotPassword, verifyRecoveryOtp, resendRecoveryOtp, resetPassword } from "../login/actions";
import { createClient } from "@/utils/supabase/client";
import { useSearchParams, useRouter } from "next/navigation";
import { OtpCodeInput } from "@/components/auth/OtpCodeInput";
import Link from "next/link";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});
type EmailFormValues = z.infer<typeof emailSchema>;

const passwordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string().min(6, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
type PasswordFormValues = z.infer<typeof passwordSchema>;

export function ForgotPasswordForm({ message }: { message?: string }) {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const router = useRouter();

  // Stages: "enter_email" -> "enter_code" -> "new_password" -> "success"
  const [stage, setStage] = useState<"enter_email" | "enter_code" | "new_password" | "success">("enter_email");
  const [targetEmail, setTargetEmail] = useState<string>(emailParam);
  const [stageError, setStageError] = useState<string | null>(message && message !== "success" ? message : null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email form
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    setValue: setEmailValue,
    formState: { errors: emailErrors, isSubmitting: isSendingEmail },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: emailParam },
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isUpdatingPassword },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (emailParam) {
      setEmailValue("email", emailParam);
      setTargetEmail(emailParam);
    }
  }, [emailParam, setEmailValue]);

  // Stage 1 submit: Request 6-digit recovery code
  const onEmailSubmit = async (data: EmailFormValues) => {
    setStageError(null);
    try {
      const cleanEmail = data.email.trim().toLowerCase();
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);

      if (error) {
        // Fallback to server action
        const formData = new FormData();
        formData.append("email", cleanEmail);
        const result = await forgotPassword(formData);
        if (!result.success) {
          setStageError(result.message || error.message || "Could not send reset code. Please try again.");
          return;
        }
      }

      setTargetEmail(cleanEmail);
      setStage("enter_code");
    } catch (err: any) {
      setStageError(err?.message || "Could not send reset code. Please try again.");
    }
  };

  // Stage 2 submit: Verify recovery code
  const handleVerifyCode = async (code: string) => {
    setStageError(null);
    try {
      const cleanEmail = targetEmail.trim().toLowerCase();
      const cleanCode = code.trim();

      // Client-side Supabase verifyOtp first (establishes active session in browser)
      const supabase = createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanCode,
        type: "recovery",
      });

      if (!error && (data?.session || data?.user)) {
        setStage("new_password");
        return { success: true };
      }

      // Fallback: server action
      const serverResult = await verifyRecoveryOtp(cleanEmail, cleanCode);
      if (serverResult.success) {
        setStage("new_password");
        return { success: true };
      }

      const rawMsg = (error?.message || serverResult.message || "").toLowerCase();
      if (rawMsg.includes("expired") || error?.code === "otp_expired") {
        return {
          success: false,
          message: "This recovery code has expired. Please request a new code.",
        };
      }

      return {
        success: false,
        message: serverResult.message || error?.message || "Invalid recovery code. Please try again.",
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || "Verification failed. Please try again.",
      };
    }
  };

  const handleResendCode = async () => {
    try {
      const cleanEmail = targetEmail.trim().toLowerCase();
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);

      if (error) {
        return await resendRecoveryOtp(cleanEmail);
      }

      return {
        success: true,
        message: `A fresh 6-digit recovery code has been sent to ${cleanEmail}.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || "Could not resend recovery code. Please try again.",
      };
    }
  };

  // Stage 3 submit: Update password
  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setStageError(null);
    try {
      const supabase = createClient();
      let updated = false;

      // Update via browser client session
      const { error: clientError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (!clientError) {
        updated = true;
      } else {
        // Fallback to server action
        const formData = new FormData();
        formData.append("password", data.password);
        const serverResult = await resetPassword(formData);
        if (serverResult.success) {
          updated = true;
        } else {
          setStageError(serverResult.message || clientError.message || "Could not update password. Please try again.");
          return;
        }
      }

      if (updated) {
        try {
          await supabase.auth.signOut();
        } catch {
          // Ignore signout error
        }
        setStage("success");
      }
    } catch (err: any) {
      setStageError(err?.message || "An unexpected error occurred while saving your password. Please try again.");
    }
  };

  // Stage 4: Success View
  if (stage === "success") {
    return (
      <div className="flex flex-col items-center text-center py-6 gap-6 animate-in fade-in">
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Password Updated!
          </h2>
          <p className="text-slate-500 font-medium leading-relaxed max-w-sm">
            Your password has been successfully reset. You can now sign in with your new credentials.
          </p>
        </div>
        <Link
          href="/login?message=Password updated successfully! Please sign in."
          className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
        >
          <span>Sign In to Your Account</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  // Stage 2: 6-Digit Recovery Code Verification
  if (stage === "enter_code") {
    return (
      <OtpCodeInput
        email={targetEmail}
        title="Enter Reset Code"
        subtitle={
          <>
            We sent a 6-digit recovery code to{" "}
            <span className="font-bold text-slate-800 break-all">{targetEmail}</span>.
          </>
        }
        onVerify={handleVerifyCode}
        onResend={handleResendCode}
        onChangeEmail={() => setStage("enter_email")}
      />
    );
  }

  // Stage 3: Set New Password Form
  if (stage === "new_password") {
    return (
      <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="flex flex-col gap-5 animate-in fade-in">
        <div className="text-center mb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Code Verified
          </div>
          <h2 className="text-2xl font-black text-slate-900">Set New Password</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Choose a new strong password for your account.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-bold text-slate-700 ml-1">
            New Password
          </label>
          <div className="relative">
            <input
              {...registerPassword("password")}
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className={`w-full px-5 py-4 pr-12 rounded-2xl bg-slate-50 border ${
                passwordErrors.password
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
          {passwordErrors.password && (
            <span className="text-xs font-bold text-rose-500 ml-1">{passwordErrors.password.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="confirmPassword" className="text-sm font-bold text-slate-700 ml-1">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              {...registerPassword("confirmPassword")}
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              className={`w-full px-5 py-4 pr-12 rounded-2xl bg-slate-50 border ${
                passwordErrors.confirmPassword
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
          {passwordErrors.confirmPassword && (
            <span className="text-xs font-bold text-rose-500 ml-1">{passwordErrors.confirmPassword.message}</span>
          )}
        </div>

        {stageError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold text-center">
            {stageError}
          </div>
        )}

        <button
          disabled={isUpdatingPassword}
          type="submit"
          className="mt-2 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {isUpdatingPassword ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving New Password...</span>
            </>
          ) : (
            <>
              <span>Save & Complete Reset</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    );
  }

  // Stage 1: Enter Email Form
  return (
    <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <label htmlFor="email" className="text-sm font-bold text-slate-700 ml-1">
          Email Address
        </label>
        <input
          {...registerEmail("email")}
          id="email"
          type="email"
          placeholder="name@company.com"
          autoComplete="email"
          className={`w-full px-5 py-4 rounded-2xl bg-slate-50 border ${
            emailErrors.email
              ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
              : "border-slate-200 focus:border-blue-600 focus:ring-blue-600/5"
          } focus:bg-white focus:ring-4 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-900`}
        />
        {emailErrors.email && (
          <span className="text-xs font-bold text-rose-500 ml-1">{emailErrors.email.message}</span>
        )}
      </div>

      {stageError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold text-center">
          {stageError}
        </div>
      )}

      <button
        disabled={isSendingEmail}
        type="submit"
        className="mt-2 w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-900/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
      >
        {isSendingEmail ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Sending Verification Code...</span>
          </>
        ) : (
          <>
            <span>Send Verification Code</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
}
