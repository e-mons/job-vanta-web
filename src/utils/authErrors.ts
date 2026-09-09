export type AuthErrorCategory =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "over_request_rate_limit"
  | "user_disabled"
  | "connection_error"
  | "unknown";

export type AuthErrorDetails = {
  category: AuthErrorCategory;
  title: string;
  message: string;
  hint?: string;
  actionType?: "reset_password" | "resend_verification" | "enter_code" | "wait" | "signup" | "retry" | "support";
  email?: string;
};

export type AuthActionResult = {
  success: boolean;
  error?: AuthErrorDetails;
};

/**
 * Classifies raw Supabase Auth or network errors into clear, sensible,
 * and user-actionable error categories.
 */
export function classifyAuthError(error: any, email?: string): AuthErrorDetails {
  const rawMsg = (error?.message || "").toLowerCase();
  const rawCode = (error?.code || "").toLowerCase();
  const status = error?.status;

  // 1. Unconfirmed Email
  if (
    rawCode === "email_not_confirmed" ||
    rawMsg.includes("email not confirmed") ||
    rawMsg.includes("not confirmed") ||
    rawMsg.includes("unconfirmed")
  ) {
    return {
      category: "email_not_confirmed",
      title: "Email verification required",
      message: "Your account was created, but your email address has not been confirmed yet.",
      hint: "Please enter the 6-digit verification code sent to your email, or request a fresh code.",
      actionType: "enter_code",
      email,
    };
  }

  // 2. Rate Limit / Too Many Attempts
  if (
    status === 429 ||
    rawCode === "over_request_rate_limit" ||
    rawMsg.includes("too many requests") ||
    rawMsg.includes("rate limit") ||
    rawMsg.includes("security purposes")
  ) {
    return {
      category: "over_request_rate_limit",
      title: "Too many sign-in attempts",
      message: "Sign-in attempts have been temporarily paused for your account security.",
      hint: "Please wait a few minutes before trying again, or reset your password to regain access immediately.",
      actionType: "reset_password",
      email,
    };
  }

  // 3. User Banned or Disabled
  if (
    rawCode.includes("disabled") ||
    rawCode.includes("banned") ||
    rawMsg.includes("user is disabled") ||
    rawMsg.includes("user has been disabled") ||
    rawMsg.includes("banned")
  ) {
    return {
      category: "user_disabled",
      title: "Account unavailable",
      message: "This account is currently disabled or suspended.",
      hint: "If you believe this is an error, please reach out to JobVanta support for assistance.",
      actionType: "support",
      email,
    };
  }

  // 4. Connection or Gateway Issue
  if (
    rawMsg.includes("fetch failed") ||
    rawMsg.includes("network") ||
    rawMsg.includes("timeout") ||
    rawMsg.includes("enotfound") ||
    rawMsg.includes("econnreset") ||
    status === 502 ||
    status === 503 ||
    status === 504
  ) {
    return {
      category: "connection_error",
      title: "Connection issue",
      message: "Unable to reach the authentication service right now.",
      hint: "Please check your internet connection and try again in a few moments.",
      actionType: "retry",
      email,
    };
  }

  // 5. Invalid Credentials (wrong password or unregistered email)
  if (
    rawCode === "invalid_credentials" ||
    rawCode === "invalid_grant" ||
    rawMsg.includes("invalid login credentials") ||
    rawMsg.includes("invalid credentials") ||
    rawMsg.includes("invalid password") ||
    rawMsg.includes("user not found") ||
    rawMsg.includes("could not authenticate user")
  ) {
    return {
      category: "invalid_credentials",
      title: "Incorrect email or password",
      message: "The email address or password you entered does not match our records.",
      hint: "Please double-check your spelling, ensure Caps Lock is off, or reset your password if you've forgotten it.",
      actionType: "reset_password",
      email,
    };
  }

  // 6. Generic Fallback with Sanitized Message
  return {
    category: "unknown",
    title: "Sign in unsuccessful",
    message: error?.message || "We could not authenticate your account with the provided details.",
    hint: "Please verify your sign-in credentials, reset your password, or try again.",
    actionType: "reset_password",
    email,
  };
}
