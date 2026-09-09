"use client";

import React, { useState, useRef, useEffect } from "react";
import { Loader2, ArrowRight, RotateCw, AlertCircle, CheckCircle2, Mail, Edit2 } from "lucide-react";

interface OtpCodeInputProps {
  email: string;
  title?: string;
  subtitle?: React.ReactNode;
  onVerify: (code: string) => Promise<{ success: boolean; message?: string }>;
  onResend: () => Promise<{ success: boolean; message?: string }>;
  onChangeEmail?: () => void;
  isLoading?: boolean;
}

export function OtpCodeInput({
  email,
  title = "Verify Your Email",
  subtitle,
  onVerify,
  onResend,
  onChangeEmail,
  isLoading = false,
}: OtpCodeInputProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    setError(null);
    setSuccessMessage(null);

    // Handle single digit input
    const cleanVal = value.replace(/\D/g, "");
    if (!cleanVal) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      setDigits(nextDigits);
      return;
    }

    // If multiple digits pasted into a single box
    if (cleanVal.length > 1) {
      handlePaste(cleanVal);
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = cleanVal.slice(-1);
    setDigits(nextDigits);

    // Auto-advance to next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 digits are filled
    const fullCode = nextDigits.join("");
    if (fullCode.length === 6 && !nextDigits.includes("")) {
      triggerVerification(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Empty box backspace: move to previous box and clear it
        const nextDigits = [...digits];
        nextDigits[index - 1] = "";
        setDigits(nextDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const nextDigits = [...digits];
        nextDigits[index] = "";
        setDigits(nextDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (pastedText: string) => {
    const cleanNumbers = pastedText.replace(/\D/g, "").slice(0, 6);
    if (!cleanNumbers) return;

    const newDigits = ["", "", "", "", "", ""];
    for (let i = 0; i < cleanNumbers.length; i++) {
      newDigits[i] = cleanNumbers[i];
    }
    setDigits(newDigits);

    if (cleanNumbers.length === 6) {
      inputRefs.current[5]?.focus();
      triggerVerification(cleanNumbers);
    } else {
      inputRefs.current[cleanNumbers.length]?.focus();
    }
  };

  const triggerVerification = async (code: string) => {
    if (code.length !== 6 || isVerifying || isLoading) return;
    setIsVerifying(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await onVerify(code);
      if (!result.success) {
        setError(result.message || "Invalid verification code. Please try again.");
      } else {
        setSuccessMessage("Code verified successfully! Redirecting...");
      }
    } catch (err: any) {
      setError(err?.message || "Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendClick = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await onResend();
      if (result.success) {
        setSuccessMessage(result.message || "A fresh 6-digit code has been sent to your email.");
        setCooldown(60);
        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setError(result.message || "Could not resend verification code. Please try again.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  const fullCode = digits.join("");
  const isComplete = fullCode.length === 6 && !digits.includes("");

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-6 shadow-sm">
        <Mail className="w-8 h-8" />
      </div>

      {/* Header */}
      <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight text-center">
        {title}
      </h2>
      <p className="text-sm text-slate-500 font-medium text-center leading-relaxed mb-6">
        {subtitle || (
          <>
            We sent a 6-digit verification code to{" "}
            <span className="font-bold text-slate-800 break-all">{email}</span>.
          </>
        )}
      </p>

      {/* 6 Digit Input Boxes */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 w-full mb-6" role="group" aria-label="Verification code input">
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoComplete={idx === 0 ? "one-time-code" : "off"}
            value={digit}
            onChange={(e) => handleDigitChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={(e) => {
              e.preventDefault();
              handlePaste(e.clipboardData.getData("text"));
            }}
            disabled={isVerifying || isLoading}
            aria-label={`Digit ${idx + 1}`}
            className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-black rounded-2xl border ${
              error
                ? "border-rose-500 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20"
                : digit
                ? "border-blue-600 bg-blue-50/20 text-slate-900 focus:border-blue-600 focus:ring-blue-600/10"
                : "border-slate-200 bg-slate-50/70 text-slate-900 focus:border-blue-600 focus:ring-blue-600/10"
            } focus:bg-white focus:ring-4 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="w-full p-4 mb-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700 text-sm font-semibold animate-in fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
          <div className="leading-snug">{error}</div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="w-full p-4 mb-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 text-emerald-700 text-sm font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500 mt-0.5" />
          <div className="leading-snug">{successMessage}</div>
        </div>
      )}

      {/* Verify Button */}
      <button
        type="button"
        disabled={!isComplete || isVerifying || isLoading}
        onClick={() => triggerVerification(fullCode)}
        className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isVerifying || isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Verifying code...</span>
          </>
        ) : (
          <>
            <span>Verify & Continue</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      {/* Resend and Edit Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between w-full mt-6 gap-3 pt-4 border-t border-slate-100 text-xs font-semibold">
        {cooldown > 0 ? (
          <span className="text-slate-400 font-medium">
            Resend code in <span className="font-bold text-slate-700">{cooldown}s</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResendClick}
            disabled={isResending}
            className="text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
            {isResending ? "Sending new code..." : "Resend verification code"}
          </button>
        )}

        {onChangeEmail && (
          <button
            type="button"
            onClick={onChangeEmail}
            className="text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Change email
          </button>
        )}
      </div>
    </div>
  );
}
