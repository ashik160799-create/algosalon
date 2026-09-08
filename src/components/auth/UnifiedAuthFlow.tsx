import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Scissors,
  Store,
  ExternalLink,
  AlertCircle,
  KeyRound,
  User,
  Phone,
  Building2,
  MapPin,
  Check,
  Copy,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AlgoLogo } from '../common/AlgoLogo';
import { PinPad } from './PinPad';
import { PhoneCountryInput } from '../common/PhoneCountryInput';
import {
  RegisteredAccount,
  getRegisteredAccounts,
  findAccountByEmail,
  isEmailRegistered,
  registerNewAccount,
  updateAccountAppCode,
  updateRegisteredAccount,
  normalizeEmail,
  checkAccountStatus,
  verifyAccountPin,
} from '../../utils/accountRegistry';
import {
  signInWithSupabaseGoogle,
  sendSupabaseOtp,
  verifySupabaseOtp,
  resendSupabaseVerification,
  syncAccountIdentityToSupabase,
  checkSupabaseEmailConfirmed,
  checkSupabaseAccountIdentity,
  checkSupabaseRecoveryVerified,
} from '../../services/supabaseService';
import { supabaseALGOsalonClient } from '../../supabaseALGOsalonClient';
import { GoogleOauthSetupModal } from './GoogleOauthSetupModal';
import {
  sanitizeEmail,
  isValidEmail,
  parseAuthError,
  translateAuthError,
  extractRateLimitSeconds,
} from '../../utils/authErrorHandling';

export type AuthFlowStep =
  | 'email_entry'
  | 'new_verify_link'
  | 'select_account_type'
  | 'new_create_profile'
  | 'new_set_app_code'
  | 'existing_enter_code'
  | 'forgot_verify_link'
  | 'forgot_set_new_code'
  | 'success_celebration';

interface UnifiedAuthFlowProps {
  initialRole?: 'customer' | 'business';
  onAuthSuccess: (role: 'customer' | 'business', isNewUser: boolean) => void;
  onBackToWelcome?: () => void;
  inlineMode?: boolean;
}

const PENDING_AUTH_KEY = 'algosalon_pending_auth';

interface StoredAuthSession {
  step: AuthFlowStep;
  emailInput: string;
  selectedRole: 'customer' | 'business';
  fullName: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  businessName: string;
  businessCategory: string;
  businessLocation: string;
  timestamp: number;
}

const getStoredAuthSession = (): Partial<StoredAuthSession> | null => {
  try {
    const raw = localStorage.getItem(PENDING_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Expire after 3 hours
    if (Date.now() - (parsed.timestamp || 0) > 1000 * 60 * 60 * 3) {
      localStorage.removeItem(PENDING_AUTH_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const UnifiedAuthFlow: React.FC<UnifiedAuthFlowProps> = ({
  initialRole = 'customer',
  onAuthSuccess,
  onBackToWelcome,
  inlineMode = false,
}) => {
  const {
    loginAsCustomer,
    loginAsBusiness,
    signupCustomer,
    signupBusiness,
    fetchFreshUserProfile,
    currentThemeConfig,
    colorThemeMode,
    customerUser,
    businessUser,
    salons,
  } = useApp();

  const isLight = colorThemeMode === 'light';
  const primaryColor = currentThemeConfig?.primaryHex || '#0EA36F';
  const glowColor = currentThemeConfig?.glowHex || 'rgba(14,163,111,0.35)';
  const contrastColor = currentThemeConfig?.contrastText || '#ffffff';

  const savedSession = getStoredAuthSession();

  // Selected intent before email lookup
  const [selectedRole, setSelectedRole] = useState<'customer' | 'business'>(() => {
    return savedSession?.selectedRole || initialRole;
  });
  const [step, setStep] = useState<AuthFlowStep>(() => {
    return savedSession?.step && savedSession.step !== 'email_entry' ? savedSession.step : 'email_entry';
  });

  // Input states
  const [emailInput, setEmailInput] = useState(() => savedSession?.emailInput || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [resolvedAccount, setResolvedAccount] = useState<RegisteredAccount | null>(() => {
    if (savedSession?.emailInput) {
      return findAccountByEmail(savedSession.emailInput) || null;
    }
    return null;
  });
  const [isVerifyingLink, setIsVerifyingLink] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendNotice, setResendNotice] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);
  const [pinFailedAttempts, setPinFailedAttempts] = useState(0);
  const [pinLockoutCooldown, setPinLockoutCooldown] = useState(0);
  const [forgotLinkSentAt, setForgotLinkSentAt] = useState<string | null>(null);

  // Return from mail detection & instant code states
  const [returnedFromEmailApp, setReturnedFromEmailApp] = useState(false);
  const [showOtpOption, setShowOtpOption] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verificationNotice, setVerificationNotice] = useState<{
    type: 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // Supabase Google OAuth state
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [googleOauthGuideOpen, setGoogleOauthGuideOpen] = useState(false);
  const [googleOauthErrorMsg, setGoogleOauthErrorMsg] = useState<string | null>(null);
  const [copiedRedirectUri, setCopiedRedirectUri] = useState(false);

  // Profile creation states (for New Account)
  const [fullName, setFullName] = useState(() => savedSession?.fullName || '');
  const [phone, setPhone] = useState(() => savedSession?.phone || '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | 'Prefer not to say'>(() => savedSession?.gender || 'Male');
  const [businessName, setBusinessName] = useState(() => savedSession?.businessName || '');
  const [businessCategory, setBusinessCategory] = useState(() => savedSession?.businessCategory || 'Luxury Hair Salon');
  const [businessLocation, setBusinessLocation] = useState(() => savedSession?.businessLocation || 'Downtown Metro');

  // App Code states
  const [newAppCode, setNewAppCode] = useState('');
  const [confirmAppCode, setConfirmAppCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);

  // Existing Code entry state
  const [existingPin, setExistingPin] = useState('');
  const [existingCodeError, setExistingCodeError] = useState<string | null>(null);

  // Reset Code states
  const [resetAppCode, setResetAppCode] = useState('');
  const [confirmResetAppCode, setConfirmResetAppCode] = useState('');
  const [resetCodeError, setResetCodeError] = useState<string | null>(null);

  // Persist pending auth session to prevent loss of progress during external mail app check or page refresh
  useEffect(() => {
    if (step === 'email_entry' && !emailInput.trim()) {
      localStorage.removeItem(PENDING_AUTH_KEY);
      return;
    }
    try {
      localStorage.setItem(
        PENDING_AUTH_KEY,
        JSON.stringify({
          step,
          emailInput,
          selectedRole,
          fullName,
          phone,
          gender,
          businessName,
          businessCategory,
          businessLocation,
          timestamp: Date.now(),
        })
      );
    } catch {
      // ignore
    }
  }, [step, emailInput, selectedRole, fullName, phone, gender, businessName, businessCategory, businessLocation]);

  // Detect when user switches out to their email client and returns to the tab
  useEffect(() => {
    let wasHidden = false;
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        wasHidden = true;
      } else if (document.visibilityState === 'visible' && wasHidden) {
        if (step === 'new_verify_link') {
          setReturnedFromEmailApp(true);
        }
      }
    };
    const handleFocus = () => {
      if (wasHidden && step === 'new_verify_link') {
        setReturnedFromEmailApp(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [step]);

  // Cooldown timer for link resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Cooldown timer for PIN lockout
  useEffect(() => {
    if (pinLockoutCooldown <= 0) return;
    const timer = setTimeout(() => {
      setPinLockoutCooldown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [pinLockoutCooldown]);

  // Main check account status function
  const handleCheckAccountStatus = async (emailToCheck: string) => {
    const sanitized = sanitizeEmail(emailToCheck);
    if (!sanitized || !isValidEmail(sanitized)) {
      setErrorMessage('Please enter a valid Gmail or email address (e.g. name@domain.com).');
      return;
    }

    // Check internet connectivity
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setErrorMessage('Connection issue: Unable to reach server. Please check your internet connection and try again.');
      return;
    }

    setErrorMessage(null);
    setIsSubmittingEmail(true);

    try {
      let existing = findAccountByEmail(sanitized);

      // If not in local storage, check Supabase database for existing account identity
      if (!existing) {
        try {
          const remote = await checkSupabaseAccountIdentity(sanitized);
          if (remote.exists && remote.account) {
            existing = {
              id: remote.account.id || `acc-${Date.now()}`,
              email: sanitized,
              role: remote.role || 'customer',
              name: remote.account.name || sanitized.split('@')[0],
              appCode: remote.account.appCode || '',
              phone: remote.account.phone || '',
              avatar: remote.account.avatar || undefined,
              signUpGmail: sanitized,
            };
            registerNewAccount(existing);
          }
        } catch (err) {
          console.warn('Supabase account identity check note:', err);
        }
      }

      if (existing) {
        // Core Rule: 1 Email = 1 Account Type. The role is permanently bound to the existing account.
        // Auto-detect role and direct to previous 4-digit App Code without sending a magic link!
        setResolvedAccount(existing);
        setSelectedRole(existing.role);
        setExistingPin('');
        setExistingCodeError(null);
        setStep('existing_enter_code');
        setIsSubmittingEmail(false);
      } else {
        // Dispatch real Supabase OTP / Magic link to this email
        const res = await sendSupabaseOtp(sanitized, selectedRole);
        if (res.error) {
          console.warn('Supabase OTP dispatch note:', res.error);
          const parsed = parseAuthError(res.error);
          if (parsed.category === 'rate_limit') {
            // Supabase hourly limit reached, but a link was recently dispatched to this email inbox
            setResolvedAccount(null);
            setResendCooldown(parsed.retryAfterSeconds || 60);
            setVerificationNotice(null);
            setResendNotice({
              type: 'warning',
              message: 'Rate limit active: A verification link was recently sent to your inbox. Please check your email and tap Verify.',
            });
            setStep('new_verify_link');
            setIsSubmittingEmail(false);
            return;
          }
          setErrorMessage(parsed.message || 'Unable to send verification email. Please try again.');
          setIsSubmittingEmail(false);
          return;
        }

        // Successfully dispatched -> Move to Check your mail screen
        setResolvedAccount(null);
        setResendCooldown(60);
        setVerificationNotice(null);
        setResendNotice(null);
        setStep('new_verify_link');
        setIsSubmittingEmail(false);
      }
    } catch (err: unknown) {
      console.warn('Account status check error:', err);
      const parsed = parseAuthError(err);
      setErrorMessage(parsed.message || 'Unable to process email. Please try again.');
      setIsSubmittingEmail(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setGoogleOauthErrorMsg(null);
    handleCheckAccountStatus(emailInput);
  };

  const handleGoogleContinue = async () => {
    setErrorMessage(null);
    setGoogleOauthErrorMsg(null);

    // Check internet connectivity
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setGoogleOauthErrorMsg('Connection issue: Unable to reach Google. Please check your internet connection.');
      return;
    }

    setIsGoogleSigningIn(true);

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('algosalon_pending_oauth_role', selectedRole || initialRole || 'customer');
      }
      const { error } = await signInWithSupabaseGoogle();
      if (error) {
        const parsed = parseAuthError(error);
        console.warn('Supabase Google OAuth response:', parsed.message);
        if (parsed.category === 'oauth_cancelled' || parsed.category === 'network') {
          setGoogleOauthErrorMsg(parsed.message);
        } else {
          setGoogleOauthErrorMsg(parsed.message || 'Google OAuth provider is awaiting setup in Supabase.');
          setGoogleOauthGuideOpen(true);
        }
      }
      // If redirect initiated, browser navigates to Google
    } catch (err: unknown) {
      console.warn('Google login error:', err);
      const parsed = parseAuthError(err);
      if (parsed.category === 'oauth_cancelled' || parsed.category === 'network') {
        setGoogleOauthErrorMsg(parsed.message);
      } else {
        setGoogleOauthErrorMsg(parsed.message || 'Could not initiate Google login.');
        setGoogleOauthGuideOpen(true);
      }
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  // Advance to role selection / next step once verified
  const goToNextStep = () => {
    const existing = findAccountByEmail(emailInput);
    if (existing) {
      // Block duplicate creation & redirect to login
      setResolvedAccount(existing);
      setSelectedRole(existing.role);
      setExistingCodeError('An account already exists with this email. Please log in instead.');
      setStep('existing_enter_code');
      return;
    }
    // Role is preselected on Splash Screen ('Get started' -> Customer, 'Join us' -> Business).
    // Bypasses the intermediate Select Account Type screen and moves directly to profile creation.
    setStep('new_create_profile');
  };

  // When user clicks the "Verify Email & Continue" button
  async function checkVerified() {
    setIsVerifyingLink(true);
    setVerificationNotice(null);
    setResendNotice(null);

    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsVerifyingLink(false);
        setVerificationNotice({
          type: 'error',
          message: 'Connection issue: Unable to reach server. Please check your internet connection and tap Verify again.',
        });
        return;
      }

      // Check whether the email is confirmed in Supabase (via magic link click)
      const isConfirmed = await checkSupabaseEmailConfirmed(emailInput);

      setIsVerifyingLink(false);

      if (isConfirmed) {
        // ✅ Magic link was verified in Gmail -> proceed to next step
        goToNextStep();
      } else {
        // ❌ Not verified yet -> show required error and stay on page
        setVerificationNotice({
          type: 'error',
          message: 'Check your email and click the verification link.',
        });
      }
    } catch {
      setIsVerifyingLink(false);
      setVerificationNotice({
        type: 'error',
        message: 'Check your email and click the verification link.',
      });
    }
  }

  // 1b. Screen 4: Select Account Type Continue
  const handleAccountTypeContinue = () => {
    const existing = findAccountByEmail(emailInput);
    if (existing) {
      // Block duplicate creation & redirect to login
      setResolvedAccount(existing);
      setSelectedRole(existing.role);
      setExistingCodeError('An account already exists with this email. Please log in instead.');
      setStep('existing_enter_code');
      return;
    }
    setStep('new_create_profile');
  };

  const handleResendLink = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setResendNotice(null);
    setVerificationNotice(null);

    const targetEmail = sanitizeEmail(emailInput);
    if (!targetEmail || !isValidEmail(targetEmail)) {
      setIsResending(false);
      setResendNotice({
        type: 'error',
        message: 'Please enter a valid Gmail or email address before requesting a link.',
      });
      return;
    }

    try {
      let error: any = null;
      if (step === 'forgot_verify_link') {
        const cleanEmail = sanitizeEmail(targetEmail);
        setForgotLinkSentAt(new Date().toISOString());
        const resetRes = await supabaseALGOsalonClient.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/`,
        });
        error = resetRes.error;
      } else {
        const resendRes = await resendSupabaseVerification(targetEmail, selectedRole);
        error = resendRes.error;
      }
      if (error) {
        console.warn('Supabase resend note:', error);
        const parsed = parseAuthError(error);
        if (parsed.category === 'rate_limit') {
          const waitTime = parsed.retryAfterSeconds || 60;
          setResendCooldown(waitTime);
          setResendNotice({
            type: 'warning',
            message: parsed.message,
          });
        } else {
          setResendNotice({
            type: 'error',
            message: parsed.message,
          });
        }
      } else {
        setResendCooldown(60);
        setResendNotice({
          type: 'success',
          message: 'A fresh verification link has been sent to your email inbox.',
        });
      }
    } catch (err: any) {
      console.warn('Resend error:', err);
      const parsed = parseAuthError(err);
      if (parsed.category === 'rate_limit') {
        const waitTime = parsed.retryAfterSeconds || 60;
        setResendCooldown(waitTime);
        setResendNotice({
          type: 'warning',
          message: parsed.message,
        });
      } else {
        setResendNotice({
          type: 'error',
          message: parsed.message,
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  // 2. New Signup Flow - Step: Profile Details Complete
  const handleProfileContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = findAccountByEmail(emailInput);
    if (existing) {
      setResolvedAccount(existing);
      setSelectedRole(existing.role);
      setExistingCodeError('An account already exists with this email. Please log in instead.');
      setStep('existing_enter_code');
      return;
    }

    if (selectedRole === 'customer') {
      if (!fullName.trim()) {
        setCodeError('Please enter your full name.');
        return;
      }
    } else {
      if (!businessName.trim() || !fullName.trim()) {
        setCodeError('Please fill in salon and manager name.');
        return;
      }
    }
    setCodeError(null);
    setStep('new_set_app_code');
  };

  // 3. New Signup Flow - Step: Set 4-Digit Security PIN
  const handleCompleteNewAccount = () => {
    if (newAppCode.length !== 4) {
      setCodeError('Please enter a 4-digit App Code.');
      return;
    }
    if (newAppCode !== confirmAppCode) {
      setCodeError('4-digit codes do not match. Please verify.');
      return;
    }

    setCodeError(null);

    const email = normalizeEmail(emailInput);
    if (!email) {
      setCodeError('Please enter a valid email address.');
      return;
    }
    
    const dedicatedSalonId = selectedRole === 'business' ? `salon-${Date.now()}` : undefined;
    // Strict Database Check: One email = one account only
    const regResult = registerNewAccount({
      email,
      role: selectedRole,
      name: fullName.trim() || email.split('@')[0],
      appCode: newAppCode,
      phone: phone.trim(),
      gender: selectedRole === 'customer' ? gender : undefined,
      businessName: selectedRole === 'business' ? businessName : undefined,
      category: selectedRole === 'business' ? businessCategory : undefined,
      location: selectedRole === 'business' ? businessLocation : undefined,
      salonId: dedicatedSalonId,
    });

    if (!regResult.success) {
      // Block creation and show exact required error message
      setExistingCodeError(regResult.error || 'An account already exists with this email. Please log in instead.');
      if (regResult.existingAccount) {
        setResolvedAccount(regResult.existingAccount);
        setSelectedRole(regResult.existingAccount.role);
      }
      setStep('existing_enter_code');
      return;
    }

    const createdAccount = regResult.account!;

    if (selectedRole === 'customer') {
      signupCustomer({
        id: createdAccount.id,
        name: createdAccount.name,
        email: createdAccount.email,
        phone: createdAccount.phone || '',
        gender: createdAccount.gender,
        appCode: newAppCode,
        avatar: createdAccount.avatar || '',
        savedSalonIds: [],
        loyaltyPoints: 0,
      });
      fetchFreshUserProfile();
    } else {
      const userShopName = createdAccount.businessName?.trim() || (createdAccount.name && createdAccount.name !== 'Salon Director' ? `${createdAccount.name}'s Studio` : 'My Salon Studio');
      signupBusiness(
        {
          id: createdAccount.id,
          name: createdAccount.name,
          email: createdAccount.email,
          signUpGmail: createdAccount.email,
          phone: createdAccount.phone,
          businessName: userShopName,
          category: createdAccount.category,
          appCode: newAppCode,
          ownerRole: 'Owner & Salon Director',
          salonId: createdAccount.salonId,
        },
        {
          id: createdAccount.salonId,
          name: userShopName,
          phone: createdAccount.phone,
          categories: createdAccount.category ? [createdAccount.category] : ['Hair & Styling'],
        }
      );
      fetchFreshUserProfile();
    }

    syncAccountIdentityToSupabase(createdAccount.email, selectedRole, {
      full_name: createdAccount.name,
      name: createdAccount.name,
      phone: createdAccount.phone,
      gender: createdAccount.gender,
      app_code: newAppCode,
      business_name: createdAccount.businessName,
    });

    localStorage.removeItem(PENDING_AUTH_KEY);
    onAuthSuccess(selectedRole, true);
  };

  // 4. Existing Account Flow - Step: Enter 4-digit PIN
  const handleValidateExistingCode = (code: string) => {
    if (pinLockoutCooldown > 0) {
      setExistingCodeError(`Too many incorrect attempts. Please wait ${pinLockoutCooldown}s or tap Forgot App Code to reset via email.`);
      return;
    }

    const targetAccount = resolvedAccount || findAccountByEmail(emailInput);

    if (!targetAccount) {
      setExistingCodeError('Account not found. Please check your email or sign up.');
      return;
    }

    if (verifyAccountPin(targetAccount, code)) {
      setPinFailedAttempts(0);
      setExistingCodeError(null);
      syncAccountIdentityToSupabase(targetAccount.email, targetAccount.role, {
        full_name: targetAccount.name,
        phone: targetAccount.phone,
        business_name: targetAccount.businessName,
      });
      if (targetAccount.role === 'customer') {
        loginAsCustomer({
          id: targetAccount.id,
          email: targetAccount.email,
          name: targetAccount.name,
          phone: targetAccount.phone,
          gender: targetAccount.gender,
          avatar: targetAccount.avatar,
          appCode: targetAccount.appCode,
        });
      } else {
        loginAsBusiness(
          {
            id: targetAccount.id,
            email: targetAccount.email,
            name: targetAccount.name,
            phone: targetAccount.phone,
            businessName: targetAccount.businessName,
            category: targetAccount.category,
            appCode: targetAccount.appCode,
          },
          targetAccount.salonId
        );
      }
      localStorage.removeItem(PENDING_AUTH_KEY);
      onAuthSuccess(targetAccount.role, false);
    } else {
      const nextFailures = pinFailedAttempts + 1;
      setPinFailedAttempts(nextFailures);
      if (nextFailures >= 5) {
        setPinLockoutCooldown(30);
        setExistingCodeError('Too many failed attempts. For security, please wait 30 seconds or tap Forgot App Code to reset via email.');
      } else {
        setExistingCodeError('Incorrect 4-digit App Code. Please check your code or tap Forgot App Code.');
      }
    }
  };

  // 5. Forgot App Code Flow - Step: Re-verify via Email Link
  const handleForgotVerifyEmail = async () => {
    setIsVerifyingLink(true);
    setResendNotice(null);

    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsVerifyingLink(false);
        setResendNotice({
          type: 'error',
          message: 'Connection issue: Unable to reach server. Please check your internet connection and tap Verify again.',
        });
        return;
      }

      const targetEmail = sanitizeEmail(resolvedAccount?.email || emailInput);

      // Check whether the identity recovery / magic link was clicked in Gmail
      const isVerified = await checkSupabaseRecoveryVerified(
        targetEmail,
        forgotLinkSentAt || undefined
      );

      setIsVerifyingLink(false);

      if (isVerified) {
        // ✅ Magic link was verified in Gmail -> proceed to create new 4-digit PIN
        setStep('forgot_set_new_code');
      } else {
        // ❌ Not verified yet -> show required error and stay on page
        setResendNotice({
          type: 'error',
          message: 'Check your email and click the verification link.',
        });
      }
    } catch {
      setIsVerifyingLink(false);
      setResendNotice({
        type: 'error',
        message: 'Check your email and click the verification link.',
      });
    }
  };

  // 6. Forgot App Code Flow - Step: Create New 4-digit PIN
  const handleCompleteResetCode = () => {
    if (resetAppCode.length !== 4) {
      setResetCodeError('Please enter a 4-digit App Code.');
      return;
    }
    if (resetAppCode !== confirmResetAppCode) {
      setResetCodeError('4-digit codes do not match.');
      return;
    }

    setResetCodeError(null);
    const targetEmail = resolvedAccount?.email || emailInput;
    const targetRole = resolvedAccount?.role || selectedRole;

    if (targetEmail) {
      updateAccountAppCode(targetEmail, resetAppCode);
      syncAccountIdentityToSupabase(targetEmail, targetRole, {
        app_code: resetAppCode,
        appCode: resetAppCode,
      }).catch(err => {
        console.warn('Sync new PIN to Supabase on reset error:', err);
      });
    }

    if (targetRole === 'customer') {
      loginAsCustomer({
        appCode: resetAppCode,
      });
    } else {
      loginAsBusiness({
        appCode: resetAppCode,
      });
    }

    localStorage.removeItem(PENDING_AUTH_KEY);
    onAuthSuccess(targetRole, false);
  };

  return (
    <div
      className={`w-full ${inlineMode ? 'max-w-lg' : 'max-w-md'} mx-auto select-none flex flex-col justify-center items-center my-auto transition-all duration-300 ${
        !inlineMode
          ? isLight
            ? 'bg-white/95 border border-zinc-200/90 rounded-3xl p-5 sm:p-6 shadow-xl shadow-zinc-200/60 backdrop-blur-md'
            : 'bg-zinc-950/90 border border-zinc-800/90 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-black backdrop-blur-md'
          : ''
      }`}
    >
      <AnimatePresence mode="wait">
        {/* ===================================================================== */}
        {/* SCREEN 3: AUTH SCREEN (Email / Google Entry + Status Check)           */}
        {/* ===================================================================== */}
        {step === 'email_entry' && (
          <motion.div
            key="screen3_email_entry"
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.28 }}
            className="w-full flex flex-col items-center text-center"
          >
            {/* Header Brand Lockup */}
            <div className="flex flex-col items-center mb-3">
              <div
                className={`p-2 rounded-2xl border transition-all duration-300 shadow-md ${
                  isLight
                    ? 'bg-white border-zinc-200 shadow-zinc-300/40'
                    : 'bg-zinc-950 border-zinc-800 shadow-black'
                }`}
              >
                <AlgoLogo size="md" showText={false} />
              </div>

              {/* Typography: "ALGO [SALON]" + "BY SPOT-PRO" */}
              <div className="mt-2 inline-flex flex-col items-end">
                <div className="flex items-center justify-center gap-2">
                  <span
                    className={`text-2xl sm:text-3xl font-black tracking-tight font-['Outfit',sans-serif] ${
                      isLight ? 'text-zinc-950' : 'text-white'
                    }`}
                  >
                    ALGO
                  </span>
                  <span
                    className="px-2.5 py-0.5 rounded-lg font-black text-xl sm:text-2xl tracking-tight shadow-md font-['Outfit',sans-serif] uppercase"
                    style={{
                      backgroundColor: primaryColor,
                      color: contrastColor,
                      boxShadow: `0 4px 14px -2px ${glowColor}`,
                    }}
                  >
                    SALON
                  </span>
                </div>
                <span
                  className={`mt-0.5 text-[10px] sm:text-[11px] font-black tracking-[0.24em] uppercase font-sans text-right self-end pr-0.5 ${
                    isLight ? 'text-zinc-600' : 'text-zinc-400'
                  }`}
                >
                  BY SPOT-PRO
                </span>
              </div>

              <h2
                className={`mt-3 text-xl sm:text-2xl font-black font-['Outfit',sans-serif] tracking-tight ${
                  isLight ? 'text-zinc-950' : 'text-white'
                }`}
              >
                Sign-In or create new account
              </h2>
              <p
                className={`mt-1 text-xs sm:text-sm font-semibold ${
                  isLight ? 'text-zinc-600' : 'text-zinc-400'
                }`}
              >
                Continue with Google or email to access your account
              </p>
            </div>

            {/* 1. Continue with Google Button */}
            <button
              type="button"
              id="btn-continue-google-auth"
              disabled={isGoogleSigningIn}
              onClick={handleGoogleContinue}
              className={`w-full py-3.5 px-4 rounded-2xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all duration-200 shadow-sm active:scale-[0.99] cursor-pointer group ${
                isLight
                  ? 'bg-white hover:bg-zinc-50 border-zinc-300 text-zinc-900 shadow-zinc-200'
                  : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-700 text-white'
              } ${isGoogleSigningIn ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isGoogleSigningIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                  <span>Connecting to Google via Supabase...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {googleOauthErrorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-amber-500 font-semibold text-left mt-1.5 px-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{googleOauthErrorMsg}</span>
              </div>
            )}

            {/* Divider — "or with Email" */}
            <div className="w-full flex items-center gap-3 my-3.5">
              <div
                className={`flex-1 h-[1px] ${
                  isLight ? 'bg-zinc-200' : 'bg-zinc-800'
                }`}
              />
              <span
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'text-zinc-500' : 'text-zinc-400'
                }`}
              >
                or with Email
              </span>
              <div
                className={`flex-1 h-[1px] ${
                  isLight ? 'bg-zinc-200' : 'bg-zinc-800'
                }`}
              />
            </div>

            {/* Email Input Field & Form */}
            <form onSubmit={handleEmailSubmit} className="w-full space-y-3">
              <div className="text-left">
                <label
                  htmlFor="auth-email-input"
                  className={`block text-xs font-bold mb-1.5 ${
                    isLight ? 'text-zinc-700' : 'text-zinc-300'
                  }`}
                >
                  Enter Gmail / Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    id="auth-email-input"
                    value={emailInput}
                    onChange={e => {
                      setEmailInput(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                      if (googleOauthErrorMsg) setGoogleOauthErrorMsg(null);
                    }}
                    placeholder="e.g. yourname@gmail.com"
                    className={`w-full border rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm font-medium placeholder-zinc-400 focus:outline-none transition-all ${
                      isLight
                        ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-emerald-600 focus:bg-white'
                        : 'bg-zinc-900 border-zinc-700 text-white focus:border-emerald-500 focus:bg-zinc-950'
                    }`}
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-1.5 text-xs text-rose-500 font-semibold text-left">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Continue / Submit Button */}
              <button
                type="submit"
                id="btn-auth-continue-submit"
                disabled={isSubmittingEmail}
                className="w-full py-3.5 px-6 rounded-2xl font-extrabold text-sm tracking-tight transition-all duration-200 shadow-lg flex items-center justify-center gap-2 group active:scale-[0.99] cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: primaryColor,
                  color: contrastColor,
                  boxShadow: `0 8px 20px -4px ${glowColor}`,
                }}
              >
                {isSubmittingEmail ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending verification link...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* ===================================================================== */}
        {/* NEW SIGNUP: CHECK YOUR MAIL (Verification Link Sent)                  */}
        {/* ===================================================================== */}
        {step === 'new_verify_link' && (
          <motion.div
            key="new_verify_link"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.28 }}
            className="w-full flex flex-col items-center text-center space-y-4"
          >
            <div className="flex items-center justify-between w-full mb-1 pr-8 sm:pr-10">
              <button
                type="button"
                id="btn-back-to-email-step"
                onClick={() => {
                  localStorage.removeItem(PENDING_AUTH_KEY);
                  setStep('email_entry');
                }}
                className={`flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-xl border transition-all cursor-pointer ${
                  isLight
                    ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <span
                className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border ${
                  isLight
                    ? 'bg-zinc-100 border-zinc-300 text-zinc-800'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-200'
                }`}
              >
                New Account Signup
              </span>
            </div>

            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md relative mt-1 mb-1.5"
              style={{
                backgroundColor: `${primaryColor}18`,
                color: primaryColor,
                boxShadow: `0 6px 18px -4px ${glowColor}`,
              }}
            >
              <Mail className="w-7 h-7" />
              <span
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center animate-pulse"
                style={{ backgroundColor: primaryColor }}
              >
                <Sparkles className="w-2 h-2 text-white" />
              </span>
            </div>

            <div className="w-full flex flex-col items-center">
              <h2
                className={`text-2xl font-black font-['Outfit',sans-serif] tracking-tight ${
                  isLight ? 'text-zinc-950' : 'text-white'
                }`}
              >
                Check your mail
              </h2>
              
              <p
                className={`mt-1 text-xs sm:text-sm font-semibold max-w-xs leading-relaxed ${
                  isLight ? 'text-zinc-600' : 'text-zinc-300'
                }`}
              >
                We sent a secure verification link to:
              </p>

              {/* Ultra Clear High-Contrast Email Display Card with Edit Button */}
              <div
                className={`w-full my-2 px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-2 shadow-xs transition-all ${
                  isLight
                    ? 'bg-zinc-100 border-zinc-300 text-zinc-950'
                    : 'bg-zinc-900 border-zinc-700 text-white'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${primaryColor}25`, color: primaryColor }}
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <span
                    className={`font-black text-xs sm:text-sm tracking-tight truncate select-all ${
                      isLight ? 'text-zinc-950' : 'text-white'
                    }`}
                  >
                    {emailInput || 'your email'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem(PENDING_AUTH_KEY);
                    setStep('email_entry');
                  }}
                  className="text-[11px] font-extrabold px-2 py-0.5 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors shrink-0 cursor-pointer"
                >
                  Change
                </button>
              </div>

              <p
                className={`text-xs font-medium max-w-xs leading-relaxed mt-1 ${
                  isLight ? 'text-zinc-500' : 'text-zinc-400'
                }`}
              >
                Tap the button below to confirm your email and proceed to account setup.
              </p>
            </div>

            {/* Instant Verification Actions & Single Status Notification */}
            <div className="w-full space-y-2.5 pt-1">
              {/* Congestion-Free Unified Notification: Only one notice shown at any time */}
              {verificationNotice ? (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold text-left flex items-center gap-2 border shadow-xs ${
                    verificationNotice.type === 'error'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="flex-1 text-[11.5px] leading-snug">
                    {verificationNotice.message}
                  </p>
                  <button
                    type="button"
                    onClick={() => setVerificationNotice(null)}
                    className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors shrink-0 cursor-pointer"
                    aria-label="Dismiss notice"
                  >
                    <X className="w-3.5 h-3.5 opacity-70 hover:opacity-100" />
                  </button>
                </motion.div>
              ) : resendNotice ? (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="status"
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold text-left flex items-center gap-2 border shadow-xs ${
                    resendNotice.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : resendNotice.type === 'warning'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {resendNotice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <p className="flex-1 text-[11.5px] leading-snug">
                    {resendNotice.message}
                  </p>
                  <button
                    type="button"
                    onClick={() => setResendNotice(null)}
                    className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors shrink-0 cursor-pointer"
                    aria-label="Dismiss notice"
                  >
                    <X className="w-3.5 h-3.5 opacity-70 hover:opacity-100" />
                  </button>
                </motion.div>
              ) : returnedFromEmailApp ? (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-xs font-bold text-left"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <p className="flex-1 text-[11.5px]">
                    Welcome back! Tap below to verify and continue.
                  </p>
                </motion.div>
              ) : null}

              <button
                type="button"
                id="btn-simulate-tap-verification-link"
                disabled={isVerifyingLink}
                onClick={checkVerified}
                className="w-full py-3.5 px-6 rounded-2xl font-extrabold text-sm sm:text-base tracking-tight transition-all duration-200 shadow-xl flex items-center justify-center gap-2 group active:scale-[0.99] cursor-pointer"
                style={{
                  backgroundColor: primaryColor,
                  color: contrastColor,
                  boxShadow: `0 8px 20px -4px ${glowColor}`,
                }}
              >
                {isVerifyingLink ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Checking Supabase verification...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify Email & Continue</span>
                  </>
                )}
              </button>

              {/* Code option toggle */}
              {!showOtpOption ? (
                <button
                  type="button"
                  onClick={() => setShowOtpOption(true)}
                  className="text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors py-0.5 cursor-pointer"
                >
                  Have a verification code? Enter 6 or 4-digit code
                </button>
              ) : (
                <div className="w-full p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-2 text-left animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Enter Supabase verification code:
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={async (e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtpCode(val);
                        setOtpError(null);
                        if (val.length === 6) {
                          if (typeof navigator !== 'undefined' && !navigator.onLine) {
                            setOtpError('Connection issue: Unable to reach server. Please check your internet connection.');
                            return;
                          }
                          setIsVerifyingLink(true);
                          try {
                            const { error } = await verifySupabaseOtp(emailInput, val);
                            if (error) {
                              setOtpError(parseAuthError(error).message);
                            } else {
                              goToNextStep();
                            }
                          } catch (err: any) {
                            setOtpError(parseAuthError(err).message);
                          } finally {
                            setIsVerifyingLink(false);
                          }
                        }
                      }}
                      placeholder="e.g. 123456"
                      className="flex-1 px-3 py-2 text-center text-sm font-black tracking-widest rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      disabled={isVerifyingLink}
                      onClick={async () => {
                        if (otpCode.length === 6) {
                          if (typeof navigator !== 'undefined' && !navigator.onLine) {
                            setOtpError('Connection issue: Unable to reach server. Please check your internet connection.');
                            return;
                          }
                          setIsVerifyingLink(true);
                          try {
                            const { error } = await verifySupabaseOtp(emailInput, otpCode);
                            if (error) {
                              setOtpError(parseAuthError(error).message);
                            } else {
                              goToNextStep();
                            }
                          } catch (err: any) {
                            setOtpError(parseAuthError(err).message);
                          } finally {
                            setIsVerifyingLink(false);
                          }
                        } else {
                          setOtpError('Please enter the 6-digit code sent to your email.');
                        }
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors cursor-pointer flex items-center justify-center min-w-[70px]"
                    >
                      {isVerifyingLink ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        'Confirm'
                      )}
                    </button>
                  </div>
                  {otpError && <p className="text-[11px] text-rose-500 font-semibold">{otpError}</p>}
                </div>
              )}

              <button
                type="button"
                id="btn-resend-verification-link"
                disabled={resendCooldown > 0 || isResending}
                onClick={handleResendLink}
                className={`w-full py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  resendCooldown > 0 || isResending
                    ? 'text-zinc-400 cursor-not-allowed'
                    : 'text-zinc-700 dark:text-zinc-300 hover:underline cursor-pointer'
                }`}
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                    <span>Sending fresh link...</span>
                  </>
                ) : resendCooldown > 0 ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Resend link in {resendCooldown}s</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Didn’t receive email? Resend link</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ===================================================================== */}
        {/* SCREEN 4: SELECT ACCOUNT TYPE (Customer [Default] or Business)        */}
        {/* ===================================================================== */}
        {step === 'select_account_type' && (
          <motion.div
            key="select_account_type"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-full flex flex-col text-left space-y-4"
          >
            {/* Top Navigation & Verified Status */}
            <div className="flex items-center justify-between w-full pr-8 sm:pr-10">
              <button
                type="button"
                id="btn-back-to-email-from-role"
                onClick={() => setStep('email_entry')}
                className={`inline-flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-xl border transition-all duration-150 cursor-pointer ${
                  isLight
                    ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border shadow-xs max-w-[180px] sm:max-w-[240px] shrink-0 ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-emerald-950/80 border-emerald-700 text-emerald-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className={`truncate text-xs font-black tracking-tight ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                  {emailInput || 'Verified'}
                </span>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3] shrink-0" />
              </div>
            </div>

            {/* Header */}
            <div>
              <h2
                className={`text-xl sm:text-2xl font-black font-['Outfit',sans-serif] tracking-tight ${
                  isLight ? 'text-zinc-950' : 'text-white'
                }`}
              >
                Select Account Type
              </h2>
              <p
                className={`mt-1 text-xs sm:text-sm font-medium ${
                  isLight ? 'text-zinc-500' : 'text-zinc-400'
                }`}
              >
                Choose your primary profile to continue.
              </p>
            </div>

            {/* Account Selection Cards - Clean, Professional & Completely Green when Selected */}
            <div className="space-y-2.5 pt-0.5">
              {/* Option 1: I'm a Customer */}
              <div
                id="card-select-customer"
                onClick={() => setSelectedRole('customer')}
                className={`w-full p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all duration-200 relative cursor-pointer ${
                  selectedRole === 'customer'
                    ? 'text-white shadow-xl shadow-emerald-500/20'
                    : isLight
                    ? 'bg-white border-zinc-200/80 hover:border-zinc-300 text-zinc-900'
                    : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700 text-white'
                }`}
                style={
                  selectedRole === 'customer'
                    ? {
                        backgroundColor: primaryColor,
                        borderColor: primaryColor,
                      }
                    : undefined
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    {/* Clear, High-Contrast Customer Icon Logo */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                        selectedRole === 'customer'
                          ? 'bg-white shadow-md ring-2 ring-white/30'
                          : isLight
                          ? 'bg-zinc-100 text-zinc-900 border border-zinc-200 shadow-sm'
                          : 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                      }`}
                    >
                      <Scissors
                        className="w-6 h-6 stroke-[2.5]"
                        style={
                          selectedRole === 'customer'
                            ? { color: primaryColor }
                            : undefined
                        }
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-black text-sm sm:text-base font-['Outfit',sans-serif] tracking-tight ${
                            selectedRole === 'customer'
                              ? 'text-white'
                              : isLight
                              ? 'text-zinc-950'
                              : 'text-white'
                          }`}
                        >
                          I&apos;m a Customer
                        </span>
                      </div>
                      <p
                        className={`text-xs mt-0.5 leading-snug font-medium ${
                          selectedRole === 'customer'
                            ? 'text-white/90'
                            : isLight
                            ? 'text-zinc-500'
                            : 'text-zinc-400'
                        }`}
                      >
                        Book salon appointments, queues & grooming services
                      </p>
                    </div>
                  </div>

                  {/* Radio check */}
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150 ${
                      selectedRole === 'customer'
                        ? 'bg-white border-white shadow-sm'
                        : 'border-zinc-300 dark:border-zinc-700 bg-transparent'
                    }`}
                  >
                    {selectedRole === 'customer' && (
                      <Check
                        className="w-3.5 h-3.5 stroke-[3]"
                        style={{ color: primaryColor }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Option 2: Salon Partner / Business */}
              <div
                id="card-select-business"
                onClick={() => setSelectedRole('business')}
                className={`w-full p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all duration-200 relative cursor-pointer ${
                  selectedRole === 'business'
                    ? 'text-white shadow-xl shadow-emerald-500/20'
                    : isLight
                    ? 'bg-white border-zinc-200/80 hover:border-zinc-300 text-zinc-900'
                    : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700 text-white'
                }`}
                style={
                  selectedRole === 'business'
                    ? {
                        backgroundColor: primaryColor,
                        borderColor: primaryColor,
                      }
                    : undefined
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    {/* Clear, High-Contrast Business Icon Logo */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                        selectedRole === 'business'
                          ? 'bg-white shadow-md ring-2 ring-white/30'
                          : isLight
                          ? 'bg-zinc-100 text-zinc-900 border border-zinc-200 shadow-sm'
                          : 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                      }`}
                    >
                      <Store
                        className="w-6 h-6 stroke-[2.5]"
                        style={
                          selectedRole === 'business'
                            ? { color: primaryColor }
                            : undefined
                        }
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-black text-sm sm:text-base font-['Outfit',sans-serif] tracking-tight ${
                            selectedRole === 'business'
                              ? 'text-white'
                              : isLight
                              ? 'text-zinc-950'
                              : 'text-white'
                          }`}
                        >
                          Salon Partner
                        </span>
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            selectedRole === 'business'
                              ? 'bg-white/20 text-white'
                              : isLight
                              ? 'bg-zinc-100 text-zinc-700 border border-zinc-200 font-bold'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          Business
                        </span>
                      </div>
                      <p
                        className={`text-xs mt-0.5 leading-snug font-medium ${
                          selectedRole === 'business'
                            ? 'text-white/90'
                            : isLight
                            ? 'text-zinc-500'
                            : 'text-zinc-400'
                        }`}
                      >
                        Register your salon, manage staff, bookings & revenue
                      </p>
                    </div>
                  </div>

                  {/* Radio check */}
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150 ${
                      selectedRole === 'business'
                        ? 'bg-white border-white shadow-sm'
                        : 'border-zinc-300 dark:border-zinc-700 bg-transparent'
                    }`}
                  >
                    {selectedRole === 'business' && (
                      <Check
                        className="w-3.5 h-3.5 stroke-[3]"
                        style={{ color: primaryColor }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <div className="pt-2">
              <button
                type="button"
                id="btn-account-type-continue"
                onClick={handleAccountTypeContinue}
                className="w-full py-3.5 px-6 rounded-2xl font-extrabold text-sm tracking-tight transition-all duration-200 shadow-lg flex items-center justify-center gap-2 group active:scale-[0.99] cursor-pointer hover:opacity-95"
                style={{
                  backgroundColor: primaryColor,
                  color: contrastColor,
                  boxShadow: `0 8px 20px -4px ${glowColor}`,
                }}
              >
                <span>
                  {selectedRole === 'customer'
                    ? 'Continue as Customer'
                    : 'Continue as Salon Partner'}
                </span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ===================================================================== */}
        {/* NEW SIGNUP: CREATE PROFILE DETAILS                                    */}
        {/* ===================================================================== */}
        {step === 'new_create_profile' && (
          <motion.div
            key="new_create_profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.28 }}
            className="w-full text-left"
          >
            <div className="flex items-center justify-between mb-3 pr-8 sm:pr-10">
              <button
                type="button"
                id="btn-back-to-email-entry"
                onClick={() => setStep('email_entry')}
                className={`flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-xl border transition-all cursor-pointer ${
                  isLight
                    ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <span
                className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border ${
                  isLight
                    ? 'bg-zinc-100 border-zinc-300 text-zinc-800'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-200'
                }`}
              >
                Step 2: Profile Details
              </span>
            </div>

            <h2
              className={`text-xl font-black font-['Outfit',sans-serif] ${
                isLight ? 'text-zinc-950' : 'text-white'
              }`}
            >
              {selectedRole === 'customer'
                ? 'Create Customer Profile'
                : 'Salon Partner Registration'}
            </h2>
            <p
              className={`text-xs mt-0.5 mb-4 font-semibold ${
                isLight ? 'text-zinc-600' : 'text-zinc-400'
              }`}
            >
              {selectedRole === 'customer'
                ? 'Provide your contact details for appointments & notifications'
                : 'Set up your salon shop details & director profile'}
            </p>

            <form onSubmit={handleProfileContinue} className="space-y-3.5">
              {selectedRole === 'customer' ? (
                <>
                  <div>
                    <label
                      htmlFor="new-profile-fullname"
                      className={`block text-xs font-bold mb-1 ${
                        isLight ? 'text-zinc-700' : 'text-zinc-300'
                      }`}
                    >
                      Full Legal / Display Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        id="new-profile-fullname"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="e.g. Alex Johnson"
                        className={`w-full border rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm font-medium placeholder-zinc-400 focus:outline-none ${
                          isLight
                            ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-emerald-600'
                            : 'bg-zinc-900 border-zinc-700 text-white focus:border-emerald-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <PhoneCountryInput
                      id="new-customer-phone-input"
                      label="Contact Phone Number"
                      value={phone}
                      onChange={full => setPhone(full)}
                      placeholder="54 429 8306"
                      showValidationHint={false}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-xs font-bold mb-1.5 ${
                        isLight ? 'text-zinc-700' : 'text-zinc-300'
                      }`}
                    >
                      Gender Preference (For Salon Suggestions)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Male', 'Female', 'Other'] as const).map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            gender === g
                              ? 'shadow-sm'
                              : isLight
                              ? 'bg-zinc-50 border-zinc-300 text-zinc-700'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                          }`}
                          style={{
                            backgroundColor: gender === g ? primaryColor : undefined,
                            borderColor: gender === g ? primaryColor : undefined,
                            color: gender === g ? contrastColor : undefined,
                          }}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label
                      htmlFor="new-biz-salon-name"
                      className={`block text-xs font-bold mb-1 ${
                        isLight ? 'text-zinc-700' : 'text-zinc-300'
                      }`}
                    >
                      Salon / Barbershop Business Name
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        id="new-biz-salon-name"
                        value={businessName}
                        onChange={e => setBusinessName(e.target.value)}
                        placeholder="e.g. Royal Crown Barber Lounge"
                        className={`w-full border rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm font-medium placeholder-zinc-400 focus:outline-none ${
                          isLight
                            ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-emerald-600'
                            : 'bg-zinc-900 border-zinc-700 text-white focus:border-emerald-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="new-biz-owner-name"
                      className={`block text-xs font-bold mb-1 ${
                        isLight ? 'text-zinc-700' : 'text-zinc-300'
                      }`}
                    >
                      Owner / Managing Director Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        id="new-biz-owner-name"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="e.g. Marcus Vance"
                        className={`w-full border rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm font-medium placeholder-zinc-400 focus:outline-none ${
                          isLight
                            ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-emerald-600'
                            : 'bg-zinc-900 border-zinc-700 text-white focus:border-emerald-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <PhoneCountryInput
                      id="new-biz-phone-input"
                      label="Business Contact Phone"
                      value={phone}
                      onChange={full => setPhone(full)}
                      placeholder="50 123 4567"
                      showValidationHint={false}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="new-biz-location-input"
                      className={`block text-xs font-bold mb-1 ${
                        isLight ? 'text-zinc-700' : 'text-zinc-300'
                      }`}
                    >
                      Shop Address / Location
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        id="new-biz-location-input"
                        value={businessLocation}
                        onChange={e => setBusinessLocation(e.target.value)}
                        placeholder="e.g. Downtown Metro, Floor 1"
                        className={`w-full border rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm font-medium placeholder-zinc-400 focus:outline-none ${
                          isLight
                            ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-emerald-600'
                            : 'bg-zinc-900 border-zinc-700 text-white focus:border-emerald-500'
                        }`}
                      />
                    </div>
                  </div>
                </>
              )}

              {codeError && (
                <p className="text-xs text-rose-500 font-bold">{codeError}</p>
              )}

              <button
                type="submit"
                id="btn-continue-to-app-code"
                className="w-full mt-3 py-3.5 px-6 rounded-2xl font-extrabold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  backgroundColor: primaryColor,
                  color: contrastColor,
                  boxShadow: `0 8px 20px -4px ${glowColor}`,
                }}
              >
                <span>Continue to Set App Code</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}

        {/* ===================================================================== */}
        {/* NEW SIGNUP: SET 4-DIGIT APP CODE (PIN)                                */}
        {/* ===================================================================== */}
        {step === 'new_set_app_code' && (
          <motion.div
            key="new_set_app_code"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.28 }}
            className="w-full text-center"
          >
            <div className="flex items-center justify-between mb-3 text-left pr-8 sm:pr-10">
              <button
                type="button"
                id="btn-back-to-profile-step"
                onClick={() => setStep('new_create_profile')}
                className={`flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-xl border transition-all cursor-pointer ${
                  isLight
                    ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <span
                className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border ${
                  isLight
                    ? 'bg-zinc-100 border-zinc-300 text-zinc-800'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-200'
                }`}
              >
                Step 3: Security Code
              </span>
            </div>

            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md"
              style={{
                backgroundColor: `${primaryColor}20`,
                color: primaryColor,
              }}
            >
              <KeyRound className="w-7 h-7" />
            </div>

            <h2
              className={`text-xl sm:text-2xl font-black font-['Outfit',sans-serif] ${
                isLight ? 'text-zinc-950' : 'text-white'
              }`}
            >
              Set Your App Code
            </h2>
            <p
              className={`text-xs mt-1 mb-4 font-semibold ${
                isLight ? 'text-zinc-600' : 'text-zinc-400'
              }`}
            >
              Choose a 4-digit PIN for instant terminal sign-in
            </p>

            <div className="space-y-4 text-left">
              <div>
                <label
                  className={`block text-xs font-bold mb-1.5 ${
                    isLight ? 'text-zinc-700' : 'text-zinc-300'
                  }`}
                >
                  Create 4-Digit Security PIN
                </label>
                <input
                  type="password"
                  id="input-create-pin"
                  maxLength={4}
                  value={newAppCode}
                  onChange={e => {
                    setNewAppCode(e.target.value.replace(/\D/g, ''));
                    if (codeError) setCodeError(null);
                  }}
                  placeholder="••••"
                  className={`w-full border rounded-2xl py-3 text-center text-2xl font-mono font-black tracking-[0.5em] focus:outline-none ${
                    isLight
                      ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-emerald-600'
                      : 'bg-zinc-900 border-zinc-700 text-white focus:border-emerald-500'
                  }`}
                />
              </div>

              <div>
                <label
                  className={`block text-xs font-bold mb-1.5 ${
                    isLight ? 'text-zinc-700' : 'text-zinc-300'
                  }`}
                >
                  Confirm 4-Digit Security PIN
                </label>
                <input
                  type="password"
                  id="input-confirm-pin"
                  maxLength={4}
                  value={confirmAppCode}
                  onChange={e => {
                    setConfirmAppCode(e.target.value.replace(/\D/g, ''));
                    if (codeError) setCodeError(null);
                  }}
                  placeholder="••••"
                  className={`w-full border rounded-2xl py-3 text-center text-2xl font-mono font-black tracking-[0.5em] focus:outline-none ${
                    isLight
                      ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-emerald-600'
                      : 'bg-zinc-900 border-zinc-700 text-white focus:border-emerald-500'
                  }`}
                />
              </div>

              {codeError && (
                <p className="text-xs text-rose-500 font-bold text-center">{codeError}</p>
              )}

              <button
                type="button"
                id="btn-complete-new-account"
                onClick={handleCompleteNewAccount}
                className="w-full py-4 px-6 rounded-2xl font-extrabold text-sm sm:text-base tracking-tight transition-all duration-200 shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  backgroundColor: primaryColor,
                  color: contrastColor,
                  boxShadow: `0 10px 24px -4px ${glowColor}`,
                }}
              >
                <Check className="w-5 h-5" />
                <span>Complete Account &amp; Continue</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ===================================================================== */}
        {/* EXISTING CUSTOMER / BUSINESS: ENTER 4-DIGIT APP CODE                  */}
        {/* ===================================================================== */}
        {step === 'existing_enter_code' && (
          <motion.div
            key="existing_enter_code"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.28 }}
            className="w-full"
          >
            <PinPad
              value={existingPin}
              onChange={(val) => {
                setExistingPin(val);
                if (existingCodeError) setExistingCodeError(null);
              }}
              title={
                resolvedAccount?.role === 'business'
                  ? 'Salon Partner Sign In'
                  : 'Welcome Back'
              }
              subtitle={`Enter 4-digit App Code for ${
                resolvedAccount?.email || emailInput
              }`}
              onComplete={code => handleValidateExistingCode(code)}
              onForgotPin={async () => {
                const targetEmail = resolvedAccount?.email || emailInput;
                const cleanTarget = sanitizeEmail(targetEmail);
                setResendCooldown(60);
                setResendNotice(null);
                setStep('forgot_verify_link');
                const nowIso = new Date().toISOString();
                setForgotLinkSentAt(nowIso);

                // Dispatch Supabase password reset / verification link to user's email
                if (cleanTarget) {
                  try {
                    await supabaseALGOsalonClient.auth.resetPasswordForEmail(cleanTarget, {
                      redirectTo: `${window.location.origin}/`,
                    });
                  } catch (err) {
                    console.warn('Password reset dispatch note:', err);
                  }
                }
              }}
              onBack={() => {
                setExistingPin('');
                setExistingCodeError(null);
                setStep('email_entry');
              }}
              errorMessage={existingCodeError}
              onClearError={() => setExistingCodeError(null)}
            />
          </motion.div>
        )}

        {/* ===================================================================== */}
        {/* FORGOT APP CODE: RE-VERIFY VIA EMAIL LINK                             */}
        {/* ===================================================================== */}
        {step === 'forgot_verify_link' && (
          <motion.div
            key="forgot_verify_link"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.28 }}
            className="w-full flex flex-col items-center text-center space-y-4"
          >
            <div className="flex items-center justify-between w-full mb-1 pr-8 sm:pr-10">
              <button
                type="button"
                id="btn-back-to-existing-pin"
                onClick={() => setStep('existing_enter_code')}
                className={`flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-xl border transition-all cursor-pointer ${
                  isLight
                    ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <span
                className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border ${
                  isLight
                    ? 'bg-zinc-100 border-zinc-300 text-zinc-800'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-200'
                }`}
              >
                Reset App Code
              </span>
            </div>

            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg relative"
              style={{
                backgroundColor: `${primaryColor}20`,
                color: primaryColor,
                boxShadow: `0 8px 24px -4px ${glowColor}`,
              }}
            >
              <KeyRound className="w-8 h-8" />
            </div>

            <div>
              <h2
                className={`text-2xl font-black font-['Outfit',sans-serif] tracking-tight ${
                  isLight ? 'text-zinc-950' : 'text-white'
                }`}
              >
                Re-verify your identity
              </h2>
              <p
                className={`mt-1.5 text-xs sm:text-sm font-semibold max-w-xs leading-relaxed ${
                  isLight ? 'text-zinc-600' : 'text-zinc-400'
                }`}
              >
                We sent a secure password reset link to{' '}
                <span className="font-extrabold underline text-zinc-900 dark:text-zinc-100">
                  {resolvedAccount?.email || emailInput}
                </span>
                . Tap it to create your new 4-digit PIN.
              </p>
            </div>

            <div className="w-full space-y-2.5 pt-2">
              {resendNotice && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="status"
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold text-left flex items-center gap-2 border shadow-xs ${
                    resendNotice.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : resendNotice.type === 'warning'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {resendNotice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <p className="flex-1 text-[11.5px] leading-snug">
                    {resendNotice.message}
                  </p>
                  <button
                    type="button"
                    onClick={() => setResendNotice(null)}
                    className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors shrink-0 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 opacity-70 hover:opacity-100" />
                  </button>
                </motion.div>
              )}

              <button
                type="button"
                id="btn-simulate-forgot-verify-link"
                disabled={isVerifyingLink}
                onClick={handleForgotVerifyEmail}
                className="w-full py-4 px-6 rounded-2xl font-extrabold text-sm sm:text-base tracking-tight transition-all duration-200 shadow-xl flex items-center justify-center gap-2 group active:scale-[0.99] cursor-pointer"
                style={{
                  backgroundColor: primaryColor,
                  color: contrastColor,
                  boxShadow: `0 10px 24px -4px ${glowColor}`,
                }}
              >
                {isVerifyingLink ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Identity...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tap Link in Email (Verify Identity)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id="btn-resend-forgot-link"
                disabled={resendCooldown > 0 || isResending}
                onClick={handleResendLink}
                className={`w-full py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  resendCooldown > 0 || isResending
                    ? 'text-zinc-400 cursor-not-allowed'
                    : 'text-zinc-700 dark:text-zinc-300 hover:underline cursor-pointer'
                }`}
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                    <span>Sending fresh link...</span>
                  </>
                ) : resendCooldown > 0 ? (
                  <span>Resend link in {resendCooldown}s</span>
                ) : (
                  <span>Didn’t receive reset link? Resend</span>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ===================================================================== */}
        {/* FORGOT APP CODE: CREATE NEW 4-DIGIT PIN                               */}
        {/* ===================================================================== */}
        {step === 'forgot_set_new_code' && (
          <motion.div
            key="forgot_set_new_code"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.28 }}
            className="w-full text-center"
          >
            <div className="flex items-center justify-between mb-3 text-left pr-8 sm:pr-10">
              <button
                type="button"
                id="btn-back-to-forgot-link"
                onClick={() => setStep('forgot_verify_link')}
                className={`flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-xl border transition-all cursor-pointer ${
                  isLight
                    ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <span
                className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border ${
                  isLight
                    ? 'bg-zinc-100 border-zinc-300 text-zinc-800'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-200'
                }`}
              >
                Create New PIN
              </span>
            </div>

            <h2
              className={`text-xl sm:text-2xl font-black font-['Outfit',sans-serif] ${
                isLight ? 'text-zinc-950' : 'text-white'
              }`}
            >
              Create New App Code
            </h2>
            <p
              className={`text-xs mt-1 mb-4 font-semibold ${
                isLight ? 'text-zinc-600' : 'text-zinc-400'
              }`}
            >
              This new 4-digit code will replace your previous one
            </p>

            <div className="space-y-4 text-left">
              <div>
                <label
                  className={`block text-xs font-bold mb-1.5 ${
                    isLight ? 'text-zinc-700' : 'text-zinc-300'
                  }`}
                >
                  New 4-Digit Security PIN
                </label>
                <input
                  type="password"
                  id="input-new-reset-pin"
                  maxLength={4}
                  value={resetAppCode}
                  onChange={e => {
                    setResetAppCode(e.target.value.replace(/\D/g, ''));
                    if (resetCodeError) setResetCodeError(null);
                  }}
                  placeholder="••••"
                  className={`w-full border rounded-2xl py-3 text-center text-2xl font-mono font-black tracking-[0.5em] focus:outline-none ${
                    isLight
                      ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-emerald-600'
                      : 'bg-zinc-900 border-zinc-700 text-white focus:border-emerald-500'
                  }`}
                />
              </div>

              <div>
                <label
                  className={`block text-xs font-bold mb-1.5 ${
                    isLight ? 'text-zinc-700' : 'text-zinc-300'
                  }`}
                >
                  Confirm New 4-Digit PIN
                </label>
                <input
                  type="password"
                  id="input-confirm-reset-pin"
                  maxLength={4}
                  value={confirmResetAppCode}
                  onChange={e => {
                    setConfirmResetAppCode(e.target.value.replace(/\D/g, ''));
                    if (resetCodeError) setResetCodeError(null);
                  }}
                  placeholder="••••"
                  className={`w-full border rounded-2xl py-3 text-center text-2xl font-mono font-black tracking-[0.5em] focus:outline-none ${
                    isLight
                      ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-emerald-600'
                      : 'bg-zinc-900 border-zinc-700 text-white focus:border-emerald-500'
                  }`}
                />
              </div>

              {resetCodeError && (
                <p className="text-xs text-rose-500 font-bold text-center">{resetCodeError}</p>
              )}

              <button
                type="button"
                id="btn-save-new-pin-and-continue"
                onClick={handleCompleteResetCode}
                className="w-full py-4 px-6 rounded-2xl font-extrabold text-sm sm:text-base tracking-tight transition-all duration-200 shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  backgroundColor: primaryColor,
                  color: contrastColor,
                  boxShadow: `0 10px 24px -4px ${glowColor}`,
                }}
              >
                <Check className="w-5 h-5" />
                <span>Save Code &amp; Continue to Home</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Supabase Google OAuth Setup & Status Modal */}
      <GoogleOauthSetupModal
        isOpen={googleOauthGuideOpen}
        onClose={() => setGoogleOauthGuideOpen(false)}
        errorMessage={googleOauthErrorMsg}
        onContinueWithEmail={() => {
          const input = document.getElementById('auth-email-input');
          if (input) input.focus();
        }}
      />
    </div>
  );
};
