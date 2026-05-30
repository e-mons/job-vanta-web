"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, AlertTriangle, ArrowRight, Home, KeyRound, LayoutDashboard } from "lucide-react";
import Link from "next/link";

function AuthStatusContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "success";
  const type = searchParams.get("type") || "signup";
  const next = searchParams.get("next") || "/dashboard";
  const errorDescription = searchParams.get("error_description");

  const isSuccess = status === "success";
  const isReset = type === "reset";

  // Framer Motion variants
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const }
    }
  };

  const iconCircleVariants = {
    hidden: { scale: 0, rotate: -45 },
    visible: { 
      scale: 1, 
      rotate: 0,
      transition: { type: "spring" as const, stiffness: 200, damping: 15, delay: 0.1 }
    }
  };

  const checkmarkPathVariants = {
    hidden: { pathLength: 0 },
    visible: { 
      pathLength: 1,
      transition: { duration: 0.4, delay: 0.3, ease: "easeInOut" as const }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8 sm:px-6 relative overflow-hidden selection:bg-blue-100">
      {/* Decorative Background Elements */}
      <div className="fixed top-0 right-1/4 w-[800px] h-[800px] bg-blue-100/30 rounded-full blur-[120px] -z-10" />
      <div className="fixed bottom-0 left-1/4 w-[600px] h-[600px] bg-indigo-100/20 rounded-full blur-[120px] -z-10" />

      <div className="max-w-md w-full text-center relative z-10">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-2xl shadow-blue-900/5 border border-slate-100 relative overflow-hidden"
        >
          {/* Accent Line */}
          <div className={`absolute top-0 left-0 right-0 h-1.5 ${isSuccess ? "bg-emerald-500" : "bg-rose-500"}`} />

          {isSuccess ? (
            /* --- SUCCESS STATE --- */
            <div className="py-2">
              <motion.div 
                variants={iconCircleVariants}
                className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-8 relative border border-emerald-100/50"
              >
                {/* Glowing Aura */}
                <div className="absolute inset-0 bg-emerald-400/20 rounded-2xl blur-lg -z-10 animate-pulse" />
                
                {/* SVG Animated Checkmark */}
                <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                  <motion.path 
                    variants={checkmarkPathVariants}
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </motion.div>

              <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
                {isReset ? "Link Verified" : "Email Confirmed!"}
              </h1>
              
              <p className="text-slate-500 font-medium leading-relaxed mb-8">
                {isReset 
                  ? "Your password reset link is valid. You can now securely update your password."
                  : "Welcome to JobVanta! Your email address has been successfully verified. Your account is ready."}
              </p>

              <div className="flex flex-col gap-3">
                {isReset ? (
                  <Link
                    href={next}
                    className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                  >
                    <KeyRound className="w-4 h-4" />
                    Reset Password
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    href={next}
                    className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
                
                <Link
                  href="/"
                  className="w-full py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Home className="w-4 h-4" />
                  Go to Home Page
                </Link>
              </div>
            </div>
          ) : (
            /* --- ERROR STATE --- */
            <div className="py-2">
              <motion.div 
                variants={iconCircleVariants}
                className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-8 relative border border-rose-100/50"
              >
                {/* Glowing Aura */}
                <div className="absolute inset-0 bg-rose-400/20 rounded-2xl blur-lg -z-10 animate-pulse" />
                <AlertTriangle className="w-10 h-10 text-rose-500" />
              </motion.div>

              <h1 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">
                Verification Failed
              </h1>

              <p className="text-slate-500 font-medium leading-relaxed mb-8">
                {errorDescription || "The verification link is invalid, has expired, or has already been used."}
              </p>

              <div className="flex flex-col gap-3">
                <Link
                  href="/login"
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                >
                  Back to Sign In
                </Link>
                
                <Link
                  href="/"
                  className="w-full py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Home className="w-4 h-4" />
                  Back to Home
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function AuthStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthStatusContent />
    </Suspense>
  );
}
