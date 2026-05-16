"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, Mail } from "lucide-react";
import { signup } from "../login/actions";
import { useSearchParams } from "next/navigation";

const signupSchema = z.object({
  full_name: z.string().min(2, "Full Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm({ message }: { message?: string }) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    const formData = new FormData();
    formData.append("full_name", data.full_name);
    formData.append("email", data.email);
    formData.append("password", data.password);
    if (next) formData.append("next", next);
    await signup(formData);
  };

  if (message === "check-email") {
    return (
      <div className="flex flex-col items-center text-center gap-6 py-8">
        <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 animate-bounce">
          <Mail className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-900">Check your email</h3>
          <p className="text-slate-500 font-medium leading-relaxed">
            We've sent a magic link to your email address. <br />
            Please click the link to confirm your account.
          </p>
        </div>
        <div className="w-full h-px bg-slate-100 my-2" />
        <p className="text-sm text-slate-400 font-medium">
          Didn't receive the email? Check your spam folder.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="full_name" className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
        <input
          {...register("full_name")}
          id="full_name"
          type="text"
          placeholder="John Doe"
          className={`w-full px-5 py-4 rounded-2xl bg-slate-50 border ${errors.full_name ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-600/5'} focus:bg-white focus:ring-4 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-900`}
        />
        {errors.full_name && <span className="text-xs font-bold text-rose-500 ml-1">{errors.full_name.message}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
        <input
          {...register("email")}
          id="email"
          type="email"
          placeholder="you@example.com"
          className={`w-full px-5 py-4 rounded-2xl bg-slate-50 border ${errors.email ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-600/5'} focus:bg-white focus:ring-4 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-900`}
        />
        {errors.email && <span className="text-xs font-bold text-rose-500 ml-1">{errors.email.message}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-bold text-slate-700 ml-1">Password</label>
        <input
          {...register("password")}
          id="password"
          type="password"
          placeholder="••••••••"
          className={`w-full px-5 py-4 rounded-2xl bg-slate-50 border ${errors.password ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-600/5'} focus:bg-white focus:ring-4 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-900`}
        />
        {errors.password && <span className="text-xs font-bold text-rose-500 ml-1">{errors.password.message}</span>}
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold text-center">
          {message}
        </div>
      )}
      
      <button
        disabled={isSubmitting}
        type="submit"
        className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Creating Account..." : "Create Account"}
        <ArrowRight className="w-5 h-5" />
      </button>
    </form>
  );
}
