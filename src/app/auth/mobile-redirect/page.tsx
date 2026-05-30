"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Smartphone, Download, Globe, AlertTriangle, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

function MobileRedirectContent() {
  const searchParams = useSearchParams();
  const redirectToMobile = searchParams.get("redirect_to_mobile");
  
  // Supabase redirect errors
  const urlError = searchParams.get("error");
  const urlErrorDesc = searchParams.get("error_description");

  const [status, setStatus] = useState<"loading" | "success" | "fallback" | "error">(
    urlError ? "error" : "loading"
  );
  const [isResetFlow, setIsResetFlow] = useState(false);

  useEffect(() => {
    if (urlError) return;

    if (!redirectToMobile) {
      setStatus("error");
      return;
    }

    // Detect if this is a reset password flow
    const isReset = redirectToMobile.includes("reset-password");
    setIsResetFlow(isReset);

    // Build the full deep link
    let mobileLink = "";
    try {
      const newUrl = new URL(redirectToMobile);
      
      // Append all URL parameters from current window to the mobile deep link
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.delete("redirect_to_mobile");
      currentParams.forEach((value, key) => {
        newUrl.searchParams.set(key, value);
      });
      
      mobileLink = newUrl.toString();
    } catch (e) {
      // Fallback for custom schemes that standard URL parser might fail on (e.g. jobvanta://...)
      const separator = redirectToMobile.includes("?") ? "&" : "?";
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.delete("redirect_to_mobile");
      const searchString = currentParams.toString();
      mobileLink = `${redirectToMobile}${searchString ? separator + searchString : ""}`;
    }

    console.log("[Mobile Redirect] Attempting deep link to:", mobileLink);
    
    // Attempt redirect
    window.location.href = mobileLink;

    let appOpened = false;

    // Listen for visibility change (if app opens, browser goes to background)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        appOpened = true;
        setStatus("success");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Timeout to fallback if app doesn't open
    const timeoutId = setTimeout(() => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (!appOpened) {
        setStatus("fallback");
      }
    }, 2800);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [redirectToMobile, urlError]);

  const handleManualRetry = () => {
    if (!redirectToMobile) return;
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.delete("redirect_to_mobile");
    const separator = redirectToMobile.includes("?") ? "&" : "?";
    const mobileLink = `${redirectToMobile}${currentParams.toString() ? separator + currentParams.toString() : ""}`;
    window.location.href = mobileLink;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8 sm:px-6 relative overflow-hidden selection:bg-blue-100">
      {/* Decorative Background Elements */}
      <div className="fixed top-0 right-1/4 w-[800px] h-[800px] bg-blue-100/30 rounded-full blur-[120px] -z-10" />
      <div className="fixed bottom-0 left-1/4 w-[600px] h-[600px] bg-indigo-100/20 rounded-full blur-[120px] -z-10" />

      <div className="max-w-md w-full text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-2xl shadow-blue-900/5 border border-slate-100 relative overflow-hidden"
        >
          {/* Status-specific Accent Bars */}
          {status === "loading" && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
          )}
          {status === "success" && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500" />
          )}
          {status === "fallback" && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500" />
          )}
          {status === "error" && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500" />
          )}

          {/* 1. Loading State */}
          {status === "loading" && (
            <div className="py-2">
              <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-8 relative">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">
                Opening JobVanta App
              </h1>
              <p className="text-slate-500 font-medium leading-relaxed mb-8">
                We are redirecting you back to the mobile app to verify your credentials.
              </p>
              <div className="space-y-4">
                <button
                  onClick={handleManualRetry}
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                >
                  App didn't open? Tap here
                </button>
              </div>
            </div>
          )}

          {/* 2. Success Redirected State */}
          {status === "success" && (
            <div className="py-2 animate-fade-in">
              <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <Smartphone className="w-10 h-10 text-emerald-500" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">
                Launched Mobile App
              </h1>
              <p className="text-slate-500 font-medium leading-relaxed mb-6">
                You have been redirected to the JobVanta mobile app. You can safey close this browser tab now.
              </p>
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-sm font-semibold">
                Verification complete! Please finish your action in the app.
              </div>
            </div>
          )}

          {/* 3. Fallback state (App not detected) */}
          {status === "fallback" && (
            <div className="py-1">
              <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <Smartphone className="w-10 h-10 text-amber-500" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
                App Not Opened
              </h1>
              
              {isResetFlow ? (
                // Security notice for password resets
                <div className="space-y-6">
                  <p className="text-slate-500 font-medium leading-relaxed">
                    We tried launching the JobVanta app but it didn't respond. 
                  </p>
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800 text-sm font-semibold text-left">
                    <span className="font-bold block mb-1">🔐 Security Notice:</span>
                    Password resets requested from mobile must be completed inside the app. 
                    Please open this email link on the mobile device with the app installed, or request a password reset on this browser to set it here.
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/forgot-password"
                      className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                    >
                      Reset Password on Web
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={handleManualRetry}
                      className="w-full py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all"
                    >
                      Try Opening App Again
                    </button>
                  </div>
                </div>
              ) : (
                // Signup fallback - Email is already verified!
                <div className="space-y-6">
                  <p className="text-slate-500 font-medium leading-relaxed">
                    We couldn't detect the mobile app. However, your account's email has been **successfully verified**!
                  </p>
                  
                  <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl text-left space-y-2">
                    <span className="font-bold text-sm text-slate-700 block">How to continue:</span>
                    <ul className="text-xs text-slate-500 font-medium list-disc list-inside space-y-1.5 leading-relaxed">
                      <li>Open the JobVanta mobile app on your phone and Sign In.</li>
                      <li>Don't have the app? Sign in to your verified account right here on the web.</li>
                    </ul>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Link
                      href="/login?message=Email confirmed successfully! Please log in."
                      className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                    >
                      Log In on the Web
                      <Globe className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={handleManualRetry}
                      className="w-full py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all"
                    >
                      Retry Launching App
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Verification Error State */}
          {status === "error" && (
            <div className="py-2">
              <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <AlertTriangle className="w-10 h-10 text-rose-500" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">
                Verification Failed
              </h1>
              <p className="text-slate-500 font-medium leading-relaxed mb-8">
                {urlErrorDesc || "The verification link is invalid, has expired, or has already been used."}
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
                  className="w-full py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all"
                >
                  Go to Home Page
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function MobileRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
      }
    >
      <MobileRedirectContent />
    </Suspense>
  );
}
