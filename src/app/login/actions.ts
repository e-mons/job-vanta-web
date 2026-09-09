"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { classifyAuthError, type AuthActionResult, type AuthErrorDetails } from "@/utils/authErrors";

export async function login(formData: FormData): Promise<AuthActionResult> {
  const supabase = await createClient();
  const next = (formData.get("next") as string) || "/dashboard";

  const email = ((formData.get("email") as string) || "").trim();
  const password = (formData.get("password") as string) || "";

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const errorDetails = classifyAuthError(error, email);
    return {
      success: false,
      error: errorDetails,
    };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export type SignupActionResult = {
  success: boolean;
  email?: string;
  message?: string;
};

export async function signup(formData: FormData): Promise<SignupActionResult> {
  const supabase = await createClient();
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  const password = (formData.get("password") as string) || "";
  const fullName = ((formData.get("full_name") as string) || "").trim();

  if (!email || !email.includes("@")) {
    return { success: false, message: "Please provide a valid email address." };
  }
  if (!password || password.length < 6) {
    return { success: false, message: "Password must be at least 6 characters." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    const rawMsg = (error.message || "").toLowerCase();
    let friendlyMessage = error.message || "Could not complete registration. Please try again.";

    if (
      rawMsg.includes("already registered") ||
      rawMsg.includes("already exists") ||
      error.code === "user_already_exists"
    ) {
      friendlyMessage = "An account with this email address already exists. Please sign in instead.";
    } else if (rawMsg.includes("password should be at least") || rawMsg.includes("weak_password")) {
      friendlyMessage = "Password is too weak. Please use at least 6 characters with a combination of letters and numbers.";
    } else if (rawMsg.includes("rate limit") || error.status === 429) {
      friendlyMessage = "Too many sign-up attempts. Please wait a few moments before trying again.";
    }

    return {
      success: false,
      message: friendlyMessage,
    };
  }

  // If user is already confirmed (e.g. autoconfirm enabled or identity already verified)
  if (data.session) {
    revalidatePath("/", "layout");
    return {
      success: true,
      email,
      message: "signed_in",
    };
  }

  return {
    success: true,
    email,
  };
}

export type VerifyOtpResult = {
  success: boolean;
  message?: string;
  code?: string;
  next?: string;
};

export async function verifySignupOtp(
  email: string,
  token: string,
  next: string = "/dashboard"
): Promise<VerifyOtpResult> {
  const trimmedEmail = email?.trim().toLowerCase();
  const trimmedToken = token?.trim();

  if (!trimmedEmail || !trimmedToken) {
    return {
      success: false,
      message: "Please provide both your email address and the 6-digit verification code.",
    };
  }

  if (trimmedToken.length !== 6 || !/^\d{6}$/.test(trimmedToken)) {
    return {
      success: false,
      message: "Verification code must be exactly 6 digits.",
      code: "invalid_format",
    };
  }

  try {
    const supabase = await createClient();

    // Primary attempt: signup confirmation OTP
    let { data, error } = await supabase.auth.verifyOtp({
      email: trimmedEmail,
      token: trimmedToken,
      type: "signup",
    });

    // Secondary fallback: email OTP (in case user verification mapped to email type)
    if (error && (error.code === "otp_expired" || error.message?.toLowerCase().includes("invalid"))) {
      const retryResult = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token: trimmedToken,
        type: "email",
      });
      if (!retryResult.error && retryResult.data?.session) {
        data = retryResult.data;
        error = null;
      }
    }

    if (error) {
      const rawMsg = (error.message || "").toLowerCase();
      const rawCode = (error.code || "").toLowerCase();

      if (rawCode === "otp_expired" || rawMsg.includes("expired")) {
        return {
          success: false,
          message: "This verification code has expired. Please request a new code.",
          code: "otp_expired",
        };
      }
      if (error.status === 429 || rawMsg.includes("rate limit")) {
        return {
          success: false,
          message: "Too many verification attempts. Please wait a moment before trying again.",
          code: "rate_limit",
        };
      }
      return {
        success: false,
        message: "Invalid verification code. Please double-check and try again.",
        code: "invalid_code",
      };
    }

    if (!data?.session && !data?.user) {
      return {
        success: false,
        message: "Verification succeeded, but no session could be established. Please sign in.",
        code: "no_session",
      };
    }

    revalidatePath("/", "layout");
    return {
      success: true,
      next: next || "/dashboard",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "An unexpected error occurred during verification. Please try again.",
    };
  }
}

export async function resendSignupOtp(email: string): Promise<{ success: boolean; message: string }> {
  const trimmed = email?.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) {
    return {
      success: false,
      message: "Please provide a valid email address to resend the verification code.",
    };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: trimmed,
    });

    if (error) {
      if (error.status === 429 || error.message?.toLowerCase().includes("rate")) {
        return {
          success: false,
          message: "A verification code was recently sent. Please wait a moment before requesting another.",
        };
      }
      return {
        success: false,
        message: error.message || "Could not resend verification code. Please try again later.",
      };
    }

    return {
      success: true,
      message: `A fresh 6-digit verification code has been sent to ${trimmed}.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "An unexpected error occurred while resending the verification code.",
    };
  }
}

export type ForgotPasswordActionResult = {
  success: boolean;
  email?: string;
  message?: string;
};

export async function forgotPassword(formData: FormData): Promise<ForgotPasswordActionResult> {
  try {
    const supabase = await createClient();
    const email = ((formData.get("email") as string) || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return { success: false, message: "Please provide a valid email address." };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      const rawMsg = (error.message || "").toLowerCase();
      if (error.status === 429 || rawMsg.includes("rate limit")) {
        return {
          success: false,
          message: "Too many reset requests. Please wait a few moments before trying again.",
        };
      }
      return {
        success: false,
        message: error.message || "Could not send password reset code. Please try again.",
      };
    }

    return {
      success: true,
      email,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "An unexpected error occurred while requesting password reset.",
    };
  }
}

export async function verifyRecoveryOtp(email: string, token: string): Promise<VerifyOtpResult> {
  const trimmedEmail = email?.trim().toLowerCase();
  const trimmedToken = token?.trim();

  if (!trimmedEmail || !trimmedToken) {
    return {
      success: false,
      message: "Please provide both your email address and the 6-digit recovery code.",
    };
  }

  if (trimmedToken.length !== 6 || !/^\d{6}$/.test(trimmedToken)) {
    return {
      success: false,
      message: "Recovery code must be exactly 6 digits.",
      code: "invalid_format",
    };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      email: trimmedEmail,
      token: trimmedToken,
      type: "recovery",
    });

    if (error) {
      const rawMsg = (error.message || "").toLowerCase();
      const rawCode = (error.code || "").toLowerCase();

      if (rawCode === "otp_expired" || rawMsg.includes("expired")) {
        return {
          success: false,
          message: "This recovery code has expired. Please request a new code.",
          code: "otp_expired",
        };
      }
      if (error.status === 429 || rawMsg.includes("rate limit")) {
        return {
          success: false,
          message: "Too many verification attempts. Please wait a moment before trying again.",
          code: "rate_limit",
        };
      }
      return {
        success: false,
        message: "Invalid recovery code. Please double-check and try again.",
        code: "invalid_code",
      };
    }

    if (!data?.session) {
      return {
        success: false,
        message: "Recovery code verified, but no recovery session was established.",
        code: "no_session",
      };
    }

    return {
      success: true,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "An unexpected error occurred while verifying the recovery code.",
    };
  }
}

export async function resendRecoveryOtp(email: string): Promise<{ success: boolean; message: string }> {
  const trimmed = email?.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) {
    return {
      success: false,
      message: "Please provide a valid email address.",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed);

    if (error) {
      if (error.status === 429 || error.message?.toLowerCase().includes("rate")) {
        return {
          success: false,
          message: "A password reset code was recently sent. Please wait a moment before requesting another.",
        };
      }
      return {
        success: false,
        message: error.message || "Could not resend reset code. Please try again later.",
      };
    }

    return {
      success: true,
      message: `A fresh 6-digit recovery code has been sent to ${trimmed}.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "An unexpected error occurred while resending the recovery code.",
    };
  }
}

export async function resetPassword(formData: FormData): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();
    const password = (formData.get("password") as string) || "";

    if (!password || password.length < 6) {
      return {
        success: false,
        message: "Password must be at least 6 characters long.",
      };
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return {
        success: false,
        message: error.message || "Could not update password. Please try again.",
      };
    }

    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore signout error
    }

    return {
      success: true,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "An unexpected error occurred while resetting password.",
    };
  }
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
