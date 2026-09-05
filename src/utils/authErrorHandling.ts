export interface AuthErrorMessage {
  title: string;
  detail: string;
  suggestion?: string;
  isPinError?: boolean;
}

export const sanitizeAuthErrorMessage = (error: any): AuthErrorMessage => {
  if (!error) {
    return {
      title: 'Authentication Failed',
      detail: 'An unexpected error occurred. Please try again.',
      suggestion: 'Check your network connection and retry.',
    };
  }

  const rawMessage = typeof error === 'string' ? error : error?.message || '';
  const lower = rawMessage.toLowerCase();

  if (lower.includes('invalid pin') || lower.includes('incorrect pin') || lower.includes('pin mismatch')) {
    return {
      title: 'Invalid Security PIN',
      detail: 'The 4-digit PIN you entered does not match our records.',
      suggestion: 'Please verify and enter your correct 4-digit PIN.',
      isPinError: true,
    };
  }

  if (lower.includes('invalid credentials') || lower.includes('invalid login credentials')) {
    return {
      title: 'Invalid Login Credentials',
      detail: 'The phone number, email, or PIN is incorrect.',
      suggestion: 'Please check your details and try again.',
    };
  }

  if (lower.includes('user not found') || lower.includes('no account found')) {
    return {
      title: 'Account Not Found',
      detail: 'No registered user was found with these details.',
      suggestion: 'Please sign up or check your credentials.',
    };
  }

  if (lower.includes('network') || lower.includes('fetch') || lower.includes('timeout')) {
    return {
      title: 'Connection Issue',
      detail: 'Unable to reach the authentication server.',
      suggestion: 'Please check your internet connection.',
    };
  }

  return {
    title: 'Authentication Error',
    detail: rawMessage || 'Unable to complete authentication request.',
    suggestion: 'Please try again in a few moments.',
  };
};
