"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, Mail } from "lucide-react";
import { forgotPassword } from "../login/actions";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm({ message }: { message?: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const isSuccess = message === "success";

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    const formData = new FormData();
    formData.append("email", data.email);
    await forgotPassword(formData);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center gap-6 py-4">
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
          <Mail className="w-10 h-10 text-emerald-500" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-black text-slate-900 mb-2">Check your email</h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xs">
            We've sent you a password reset link. Please check your inbox and click the link to set a new password.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 w-full">
          <p className="text-xs font-bold text-blue-600 text-center">
            Didn't receive the email? Check your spam folder or try again.
          </p>
        </div>
      </div>
    );
  }

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

      {message && message !== "success" && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold text-center">
          {message}
        </div>
      )}
      
      <button
        disabled={isSubmitting}
        type="submit"
        className="mt-2 w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-900/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Sending reset link..." : "Send Reset Link"}
        <ArrowRight className="w-5 h-5" />
      </button>
    </form>
  );
}
