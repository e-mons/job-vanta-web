"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    const mobileLink = searchParams.get("redirect_to_mobile");
    if (mobileLink) {
      setRedirectUrl(mobileLink);
      
      // Auto-redirect after a short delay
      const timer = setTimeout(() => {
        window.location.replace(mobileLink);
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      // Default fallback for web checkouts
      router.push("/dashboard");
    }
  }, [searchParams, router]);

  const handleManualOpen = () => {
    if (redirectUrl) {
      window.location.replace(redirectUrl);
    }
  };

  if (!redirectUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-400 font-medium">Processing your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-white selection:bg-blue-600">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.08),transparent_50%)]"></div>
      
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center backdrop-blur-xl shadow-2xl">
        {/* Success Checkmark Circle */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 mb-6">
          <svg
            className="h-10 w-10 animate-[bounce_1s_infinite]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>

        <h1 className="text-2xl font-black tracking-tight text-white mb-2">
          Payment Successful!
        </h1>
        
        <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8 px-4">
          Your transaction is complete. We are redirecting you back to the <span className="text-blue-400 font-bold">Jobvanta</span> mobile app to activate your premium features.
        </p>

        {/* Action Button */}
        <button
          onClick={handleManualOpen}
          className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 py-4 px-6 text-sm font-bold text-white transition-all duration-300 hover:from-blue-500 hover:to-blue-600 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-[0.98]"
        >
          <span>Open Jobvanta App</span>
          <svg
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M9 5l7 7-7 7"
            ></path>
          </svg>
        </button>

        {/* Fallback instruction */}
        <p className="mt-4 text-xs text-slate-500 font-medium">
          If the app does not open automatically, click the button above.
        </p>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-400 font-medium">Processing your payment...</p>
        </div>
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
}
