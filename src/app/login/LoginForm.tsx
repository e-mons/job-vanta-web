"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { 
  ArrowRight, 
  KeyRound, 
  Mail, 
  Clock, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  X,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff
} from "lucide-react";
import { login, resendSignupOtp, verifySignupOtp } from "./actions";
import { classifyAuthError, type AuthErrorDetails } from "@/utils/authErrors";
import { useSearchParams, useRouter } from "next/navigation";
import { OtpCodeInput } from "@/components/auth/OtpCodeInput";
import { createClient } from "@/utils/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm({ message }: { message?: string }) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const router = useRouter();

  // Determine initial state from URL query param if present
  const isInitialSuccess = Boolean(message && message.toLowerCase().includes("success"));
  const initialError: AuthErrorDetails | null = 
    message && !isInitialSuccess 
      ? classifyAuthError({ message }) 
      : null;

  const [authError, setAuthError] = useState<AuthErrorDetails | null>(initialError);
  const [successBanner, setSuccessBanner] = useState<string | null>(isInitialSuccess ? message! : null);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Unconfirmed email OTP mode
  const [isEnteringOtp, setIsEnteringOtp] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setAuthError(null);
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
      setAuthError(classifyAuthError(err));
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const enteredEmail = watch("email") || "";

  const onSubmit = async (data: LoginFormValues) => {
    setAuthError(null);
    setResendStatus(null);
    setSuccessBanner(null);

    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);
    if (next) formData.append("next", next);

    const result = await login(formData);
    if (result && !result.success && result.error) {
      setAuthError(result.error);
      if (result.error.category === "email_not_confirmed") {
        // Automatically offer OTP entry
        setIsEnteringOtp(true);
      }
    }
  };

  const handleResendOtp = async () => {
    const targetEmail = enteredEmail.trim() || authError?.email?.trim();
    if (!targetEmail) {
      return {
        success: false,
        message: "Please enter your email address to receive a verification code.",
      };
    }

    setIsResending(true);
    setResendStatus(null);
    try {
      const res = await resendSignupOtp(targetEmail);
      setResendStatus(res);
      return res;
    } catch {
      const errRes = {
        success: false,
        message: "Unable to resend verification code right now. Please try again.",
      };
      setResendStatus(errRes);
      return errRes;
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    const targetEmail = enteredEmail.trim() || authError?.email?.trim() || "";
    const result = await verifySignupOtp(targetEmail, code, next);
    if (result.success) {
      router.push(result.next || next);
      return { success: true };
    }
    return { success: false, message: result.message };
  };

  const clearError = () => {
    setAuthError(null);
    setResendStatus(null);
    setIsEnteringOtp(false);
  };

  // If user triggered OTP verification mode for unconfirmed email
  if (isEnteringOtp && (enteredEmail.trim() || authError?.email?.trim())) {
    const targetEmail = enteredEmail.trim() || authError?.email?.trim() || "";
    return (
      <div className="flex flex-col gap-4">
        <OtpCodeInput
          email={targetEmail}
          title="Verify Your Account"
          subtitle={
            <>
              Enter the 6-digit verification code sent to{" "}
              <span className="font-bold text-slate-800 break-all">{targetEmail}</span> to complete sign-in.
            </>
          }
          onVerify={handleVerifyOtp}
          onResend={handleResendOtp}
          onChangeEmail={() => {
            setIsEnteringOtp(false);
            setAuthError(null);
          }}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-sm font-semibold flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 leading-snug">{successBanner}</div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-600/70 hover:text-emerald-900 transition-colors p-1"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sensible & Diagnostic Error Card */}
      {authError && (
        <div 
          role="alert" 
          aria-live="polite"
          className="p-5 rounded-2xl bg-rose-50/90 border border-rose-200 text-slate-900 shadow-sm transition-all animate-in fade-in slide-in-from-top-2 duration-300"
        >
          {/* Header row with diagnostic category icon, title, and dismiss button */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100/90 text-rose-600 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                {authError.category === "invalid_credentials" && <KeyRound className="w-5 h-5" />}
                {authError.category === "email_not_confirmed" && <Mail className="w-5 h-5" />}
                {authError.category === "over_request_rate_limit" && <Clock className="w-5 h-5" />}
                {authError.category === "connection_error" && <AlertTriangle className="w-5 h-5" />}
                {(authError.category === "user_disabled" || authError.category === "unknown") && (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  {authError.title}
                </h2>
                <p className="text-xs font-medium text-slate-600 mt-1 leading-relaxed">
                  {authError.message}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={clearError}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-rose-100/50 transition-colors shrink-0"
              aria-label="Dismiss error notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Actionable Next Steps & Guidance */}
          <div className="mt-4 pt-3.5 border-t border-rose-200/70 flex flex-col gap-2.5">
            {authError.hint && (
              <p className="text-xs text-slate-600 font-medium leading-normal flex items-start gap-1.5">
                <span className="font-bold text-rose-700">What to do:</span>
                <span>{authError.hint}</span>
              </p>
            )}

            {/* Contextual Action: Invalid Credentials */}
            {authError.category === "invalid_credentials" && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Link
                  href={`/forgot-password?email=${encodeURIComponent(enteredEmail.trim())}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-xs font-bold text-slate-800 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 shadow-xs transition-all"
                >
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  <span>Reset password</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </Link>

                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-xs font-bold text-slate-800 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 shadow-xs transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Create new account</span>
                </Link>
              </div>
            )}

            {/* Contextual Action: Unconfirmed Email */}
            {authError.category === "email_not_confirmed" && (
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEnteringOtp(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-xs transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Enter 6-Digit Code</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  disabled={isResending}
                  onClick={handleResendOtp}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-rose-200 text-xs font-bold text-slate-800 hover:bg-slate-50 shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
                  <span>{isResending ? "Sending code..." : "Resend Code"}</span>
                </button>

                {resendStatus && (
                  <div
                    className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-start gap-2 mt-1 ${
                      resendStatus.success
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-100/70 text-rose-900 border border-rose-200"
                    }`}
                  >
                    {resendStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span>{resendStatus.message}</span>
                  </div>
                )}
              </div>
            )}

            {/* Contextual Action: Rate Limit */}
            {authError.category === "over_request_rate_limit" && (
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <Link
                  href={`/forgot-password?email=${encodeURIComponent(enteredEmail.trim())}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-rose-200 text-xs font-bold text-slate-800 hover:text-blue-600 shadow-xs transition-all"
                >
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  <span>Reset password to regain access</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </Link>
              </div>
            )}

            {/* Contextual Action: Account Disabled */}
            {authError.category === "user_disabled" && (
              <div className="pt-1">
                <a
                  href="mailto:support@jobvanta.ai"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-rose-200 text-xs font-bold text-slate-800 hover:text-rose-600 shadow-xs transition-all"
                >
                  <Mail className="w-3.5 h-3.5 text-rose-600" />
                  <span>Contact Support (support@jobvanta.ai)</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
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
        <span>Continue with Google</span>
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 my-1">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">or continue with email</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Email Input */}
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-bold text-slate-700 ml-1">
          Email Address
        </label>
        <input
          {...register("email")}
          id="email"
          type="email"
          placeholder="name@company.com"
          autoComplete="email"
          className={`w-full px-5 py-4 rounded-2xl bg-slate-50 border ${
            errors.email 
              ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20" 
              : "border-slate-200 focus:border-blue-600 focus:ring-blue-600/5"
          } focus:bg-white focus:ring-4 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-900`}
        />
        {errors.email && (
          <span className="text-xs font-bold text-rose-500 ml-1">
            {errors.email.message}
          </span>
        )}
      </div>

      {/* Password Input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between ml-1">
          <label htmlFor="password" className="text-sm font-bold text-slate-700">
            Password
          </label>
          <Link 
            href={`/forgot-password?email=${encodeURIComponent(enteredEmail.trim())}`}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            {...register("password")}
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
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
          <span className="text-xs font-bold text-rose-500 ml-1">
            {errors.password.message}
          </span>
        )}
      </div>

      {/* Submit Button */}
      <button
        disabled={isSubmitting}
        type="submit"
        className="mt-2 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <span>Sign In</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
}
