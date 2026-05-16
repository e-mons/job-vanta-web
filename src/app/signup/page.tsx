import Link from "next/link";
import { SignupForm } from "./SignupForm";
import { Sparkles, ArrowRight, ChevronLeft } from "lucide-react";
import { Suspense } from "react";

export default async function SignupPage(props: { searchParams: Promise<{ message: string }> }) {
  const searchParams = await props.searchParams;
  const message = searchParams.message;

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 selection:bg-blue-100 text-slate-900 font-sans relative overflow-hidden px-4 py-8 sm:py-12">
      {/* Decorative Background Elements */}
      <div className="fixed top-0 right-1/4 w-[800px] h-[800px] bg-blue-100/30 rounded-full blur-[120px] -z-10" />
      <div className="fixed bottom-0 left-1/4 w-[600px] h-[600px] bg-indigo-100/20 rounded-full blur-[120px] -z-10" />

      <div className="relative z-10 w-full max-w-[480px]">
        {/* Top Branding & Navigation */}
        <div className="flex flex-col items-center mb-8 sm:mb-10">
          <Link href="/" className="flex items-center gap-2.5 group mb-6 sm:mb-8">
            <img 
              src="/logo.png" 
              alt="JobVanta Logo" 
              className="w-10 h-10 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform duration-300"
            />
            <span className="font-bold text-2xl tracking-tight text-slate-900">
              JobVanta
            </span>
          </Link>
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Start Your Journey
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-3 text-center">Join the future</h1>
          <p className="text-slate-500 font-medium text-center">
            Create your account and build your career.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white border border-slate-200 shadow-2xl shadow-blue-900/5 rounded-[2rem] sm:rounded-[40px] p-6 sm:p-10 relative overflow-hidden">
          {/* Subtle accent line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 to-blue-600" />
          
          <Suspense fallback={<div className="h-40 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
            <SignupForm message={message} />
          </Suspense>

          <div className="mt-10 pt-8 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
