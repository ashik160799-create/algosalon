/**
 * ALGO SALON SPOT-PRO — Worldwide Authentication Error Handling & Email Sanitization
 *
 * Provides international-grade error classification, human-friendly translations,
 * dynamic rate-limit countdown synchronization, and robust email sanitization.
 */

export type AuthErrorCategory =
  | 'network'
  | 'rate_limit'
  | 'token_expired'
  | 'invalid_token'
  | 'oauth_cancelled'
  | 'oauth_config'
  | 'account_exists'
  | 'invalid_email'
  | 'pin_error'
  | 'unknown';

export interface ParsedAuthError {
  category: AuthErrorCategory;
  message: string;
  originalMessage?: string;
  retryAfterSeconds?: number;
  actionType?: 'resend' | 'retry' | 'switch_role' | 'reset_pin' | 'enter_email';
  isRecoverable: boolean;
}

/**
 * Strips invisible Unicode whitespace characters, zero-width spaces, and non-breaking spaces
 * commonly inserted by mobile keyboards (iOS QuickType, Android Gboard, Samsung Keyboard)
 * or copy-pasting from chat apps, then converts to lowercase and trims.
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  return email
    // Remove zero-width spaces, word joiners, byte-order marks, non-breaking spaces & all unicode whitespace
    .replace(/[\u200B-\u200D\uFEFF\u00A0\u2000-\u200A\u2028\u2029\s]+/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Validates email according to RFC 5322 specifications with support for
 * modern international top-level domains (.co.uk, .com.au, .ae, .in, .fr, .de, .salon, .pro, etc.)
 */
export function isValidEmail(email: string): boolean {
  const sanitized = sanitizeEmail(email);
  if (!sanitized) return false;

  // Comprehensive international-friendly email regex
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(sanitized)) return false;

  // Additional sanity check: domain must contain at least one dot and a valid TLD of at least 2 characters
  const parts = sanitized.split('@');
  if (parts.length !== 2) return false;

  const domain = parts[1];
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];

  return domainParts.length >= 2 && tld.length >= 2;
}

/**
 * Extracts wait time in seconds from error messages or status payloads
 * (e.g., "For security purposes, you can only request this once every 60 seconds")
 */
export function extractRateLimitSeconds(error: any, defaultSeconds: number = 60): number {
  if (!error) return defaultSeconds;

  const msg = typeof error === 'string' ? error : error?.message || error?.error_description || '';
  const match = msg.match(/(\d+)\s*seconds?/i);
  if (match && match[1]) {
    const parsed = parseInt(match[1], 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  // Check headers or retry_after if available
  if (error?.status === 429 || error?.code === 'over_email_send_rate_limit') {
    return defaultSeconds;
  }

  return defaultSeconds;
}

/**
 * Parses any Supabase, GoTrue, OAuth, network, or application authentication error
 * and returns a standardized, user-friendly, internationalized error object.
 */
export function parseAuthError(error: any): ParsedAuthError {
  if (!error) {
    return {
      category: 'unknown',
      message: 'An unexpected error occurred. Please try again.',
      isRecoverable: true,
    };
  }

  const rawMsg = (
    typeof error === 'string'
      ? error
      : error?.message || error?.error_description || error?.details || JSON.stringify(error)
  ).toLowerCase();

  const code = (error?.code || error?.status || '').toString().toLowerCase();

  // 1. Network / Offline / Connection Drops
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  if (
    isOffline ||
    rawMsg.includes('failed to fetch') ||
    rawMsg.includes('networkerror') ||
    rawMsg.includes('network request failed') ||
    rawMsg.includes('err_internet_disconnected') ||
    rawMsg.includes('err_connection_timed_out') ||
    rawMsg.includes('connection timed out') ||
    rawMsg.includes('abort') ||
    rawMsg.includes('timeout')
  ) {
    return {
      category: 'network',
      message: 'Connection issue: Unable to reach SaloonSpot servers. Please check your internet connection and try again.',
      originalMessage: rawMsg,
      actionType: 'retry',
      isRecoverable: true,
    };
  }

  // 2. Supabase Rate Limiting (Status 429)
  if (
    code === '429' ||
    code === 'over_email_send_rate_limit' ||
    rawMsg.includes('rate limit') ||
    rawMsg.includes('once every') ||
    rawMsg.includes('too many requests') ||
    rawMsg.includes('security purposes')
  ) {
    const seconds = extractRateLimitSeconds(error, 60);
    return {
      category: 'rate_limit',
      message: `For your security, verification requests are time-spaced. Please wait ${seconds}s before requesting a new link.`,
      originalMessage: rawMsg,
      retryAfterSeconds: seconds,
      actionType: 'resend',
      isRecoverable: true,
    };
  }

  // 3. Token / Magic Link Expired
  if (
    rawMsg.includes('token has expired') ||
    rawMsg.includes('otp_expired') ||
    rawMsg.includes('link has expired') ||
    rawMsg.includes('token is expired') ||
    rawMsg.includes('invalid_grant') ||
    rawMsg.includes('email link is invalid or has expired')
  ) {
    return {
      category: 'token_expired',
      message: 'This verification link has expired for security. Tap Resend below to receive a fresh link in your inbox.',
      originalMessage: rawMsg,
      actionType: 'resend',
      isRecoverable: true,
    };
  }

  // 4. Invalid Verification Token or Code
  if (
    rawMsg.includes('invalid token') ||
    rawMsg.includes('token not found') ||
    rawMsg.includes('bad token') ||
    rawMsg.includes('incorrect code') ||
    rawMsg.includes('token is invalid')
  ) {
    return {
      category: 'invalid_token',
      message: 'Incorrect verification code. Please check the 6-digit code in your email or tap Resend.',
      originalMessage: rawMsg,
      actionType: 'resend',
      isRecoverable: true,
    };
  }

  // 5. Google OAuth Cancelled / Popup Blocked / Access Denied
  if (
    rawMsg.includes('popup_closed_by_user') ||
    rawMsg.includes('access_denied') ||
    rawMsg.includes('popup closed') ||
    rawMsg.includes('user cancelled') ||
    rawMsg.includes('blocked') ||
    rawMsg.includes('cross-origin') ||
    rawMsg.includes('third-party cookie')
  ) {
    return {
      category: 'oauth_cancelled',
      message: 'Google sign-in was closed or blocked by browser privacy settings. You can sign in smoothly using your email below.',
      originalMessage: rawMsg,
      actionType: 'enter_email',
      isRecoverable: true,
    };
  }

  // 6. OAuth Provider Not Configured
  if (
    rawMsg.includes('provider is not enabled') ||
    rawMsg.includes('oauth client') ||
    rawMsg.includes('not configured') ||
    rawMsg.includes('unsupported_provider')
  ) {
    return {
      category: 'oauth_config',
      message: 'Google Sign-In is being initialized. Continue with your Gmail / Email below for instant access.',
      originalMessage: rawMsg,
      actionType: 'enter_email',
      isRecoverable: true,
    };
  }

  // 7. Account Already Exists (Role conflict or duplicate registration)
  if (
    rawMsg.includes('already registered') ||
    rawMsg.includes('user already exists') ||
    rawMsg.includes('already exists with this email')
  ) {
    return {
      category: 'account_exists',
      message: 'An account already exists with this email. Please enter your 4-digit App Code to sign in.',
      originalMessage: rawMsg,
      actionType: 'switch_role',
      isRecoverable: true,
    };
  }

  // 8. Invalid Email Format
  if (
    rawMsg.includes('invalid email') ||
    rawMsg.includes('valid email') ||
    rawMsg.includes('malformed')
  ) {
    return {
      category: 'invalid_email',
      message: 'Please enter a valid Gmail or email address (e.g. name@domain.com).',
      originalMessage: rawMsg,
      actionType: 'enter_email',
      isRecoverable: true,
    };
  }

  // 9. PIN / App Code Error
  if (rawMsg.includes('pin') || rawMsg.includes('app code')) {
    return {
      category: 'pin_error',
      message: 'Incorrect 4-digit App Code. Try 1234 or tap Forgot App Code to reset via email.',
      originalMessage: rawMsg,
      actionType: 'reset_pin',
      isRecoverable: true,
    };
  }

  // 10. Clean Fallback for any unknown technical error
  return {
    category: 'unknown',
    message: 'Unable to complete sign-in right now. Please check your details and try again.',
    originalMessage: rawMsg,
    actionType: 'retry',
    isRecoverable: true,
  };
}

/**
 * Convenient shorthand returning directly the translated human-friendly error string.
 */
export function translateAuthError(error: any): string {
  return parseAuthError(error).message;
}
