"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { login } from "./actions";
import { useSearchParams } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm({ message }: { message?: string }) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);
    if (next) formData.append("next", next);
    await login(formData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <label htmlFor="email" className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
        <input
          {...register("email")}
          id="email"
          type="email"
          placeholder="name@company.com"
          className={`w-full px-5 py-4 rounded-2xl bg-slate-50 border ${errors.email ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-600/5'} focus:bg-white focus:ring-4 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-900`}
        />
        {errors.email && <span className="text-xs font-bold text-rose-500 ml-1">{errors.email.message}</span>}
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <label htmlFor="password" className="text-sm font-bold text-slate-700">Password</label>
          <Link href="/forgot-password" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">Forgot password?</Link>
        </div>
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
        <div className={`p-4 rounded-2xl text-sm font-bold text-center ${message.toLowerCase().includes('success') ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' : 'bg-rose-50 border border-rose-100 text-rose-600'}`}>
          {message}
        </div>
      )}
      
      <button
        disabled={isSubmitting}
        type="submit"
        className="mt-2 w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-900/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Signing in..." : "Sign In to Dashboard"}
        <ArrowRight className="w-5 h-5" />
      </button>
    </form>
  );
}
