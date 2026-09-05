import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OtpVerificationScreen } from './OtpVerificationScreen';
import { PinPad } from './PinPad';
import { AlgoLogo } from '../common/AlgoLogo';
import { PhoneCountryInput } from '../common/PhoneCountryInput';
import {
  findAccountByEmail,
  registerNewAccount,
  updateAccountAppCode,
  normalizeEmail,
  checkAccountStatus,
} from '../../utils/accountRegistry';
import {
  signInWithSupabaseGoogle,
  sendSupabaseOtp,
  verifySupabaseOtp,
  syncAccountIdentityToSupabase,
} from '../../services/supabaseService';
import { GoogleOauthSetupModal } from './GoogleOauthSetupModal';

type CustomerScreenStep =
  | 'email_google_select'
  | 'new_verify_email'
  | 'new_create_account'
  | 'new_success'
  | 'existing_enter_code'
  | 'forgot_verify_email'
  | 'forgot_create_new_code'
  | 'forgot_success';

interface CustomerAuthFlowProps {
  initialMode?: 'new' | 'existing';
  onComplete: () => void;
  onCancel?: () => void;
}

export const CustomerAuthFlow: React.FC<CustomerAuthFlowProps> = ({
  initialMode = 'new',
  onComplete,
}) => {
  const {
    loginAsCustomer,
    signupCustomer,
    fetchFreshUserProfile,
    currentThemeConfig,
    colorThemeMode,
    customerUser,
  } = useApp();

  const isLight = colorThemeMode === 'light';

  const [customerType, setCustomerType] = useState<'new' | 'existing'>(initialMode);
  const [step, setStep] = useState<CustomerScreenStep>('email_google_select');

  const [email, setEmail] = useState('');
  const [entryError, setEntryError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | 'Prefer not to say'>('Female');
  const [createAppCode, setCreateAppCode] = useState('');
  const [confirmAppCode, setConfirmAppCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);

  const [enterAppCode, setEnterAppCode] = useState('');
  const [existingCodeError, setExistingCodeError] = useState<string | null>(null);

  const [newResetCode, setNewResetCode] = useState('');
  const [confirmResetCode, setConfirmResetCode] = useState('');
  const [resetCodeError, setResetCodeError] = useState<string | null>(null);

  // Supabase Google OAuth state
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [googleOauthGuideOpen, setGoogleOauthGuideOpen] = useState(false);
  const [googleOauthErrorMsg, setGoogleOauthErrorMsg] = useState<string | null>(null);

  const handleGoogleContinue = async () => {
    setEntryError(null);
    setIsGoogleSigningIn(true);

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('algosalon_pending_oauth_role', 'customer');
      }
      const { data, error } = await signInWithSupabaseGoogle();
      if (error) {
        console.warn('Supabase Google OAuth error:', error.message);
        setGoogleOauthErrorMsg(error.message || 'Google OAuth provider is awaiting setup in Supabase.');
        setGoogleOauthGuideOpen(true);
      }
    } catch (err: any) {
      console.warn('Google login error:', err);
      setGoogleOauthErrorMsg(err?.message || 'Could not initiate Google login.');
      setGoogleOauthGuideOpen(true);
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return;

    const status = checkAccountStatus(normalizedEmail);

    if (status.exists && status.account) {
      if (status.role === 'business') {
        setEntryError(
          `This email is already registered as Type: Business. Each email can only have one account. Please sign in via the Salon Partner portal.`
        );
        return;
      }
      setEntryError(null);
      setCustomerType('existing');
      setStep('existing_enter_code');
      return;
    }

    setEntryError(null);
    // Send real Supabase OTP to this email
    try {
      await sendSupabaseOtp(normalizedEmail);
    } catch (err) {
      console.warn('Supabase OTP dispatch note:', err);
    }
    setStep('new_verify_email');
  };

  const handleCompleteNewAccount = () => {
    if (!fullName.trim()) {
      setCodeError('Please enter your full name.');
      return;
    }
    if (createAppCode.length !== 4) {
      setCodeError('Please create a 4-digit App Code.');
      return;
    }
    if (createAppCode !== confirmAppCode) {
      setCodeError('4-digit codes do not match. Please check.');
      return;
    }

    setCodeError(null);

    const normEmail = normalizeEmail(email) || 'user@example.com';
    const regResult = registerNewAccount({
      email: normEmail,
      role: 'customer',
      name: fullName.trim(),
      appCode: createAppCode,
      phone: phone.trim() || '+971 50 000 0000',
      gender,
    });

    if (!regResult.success) {
      setExistingCodeError(regResult.error || 'An account already exists with this email. Please log in instead.');
      setCustomerType('existing');
      setStep('existing_enter_code');
      return;
    }

    signupCustomer({
      id: regResult.account!.id,
      name: fullName.trim(),
      email: normEmail,
      phone: phone.trim() || '',
      gender,
      appCode: createAppCode,
      avatar:
        gender === 'Male'
          ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      savedSalonIds: [],
      loyaltyPoints: 0,
    });

    fetchFreshUserProfile();

    setStep('new_success');
  };

  const handleValidateExistingCode = (code = enterAppCode) => {
    const normEmail = normalizeEmail(email);
    const existing = findAccountByEmail(normEmail);
    const validCode = existing?.appCode || customerUser.appCode || '1234';

    if (code === validCode) {
      setExistingCodeError(null);
      syncAccountIdentityToSupabase(normEmail, 'customer', {
        full_name: existing?.name,
        phone: existing?.phone,
      });
      loginAsCustomer({
        id: existing?.id,
        email: existing?.email || normEmail,
        name: existing?.name,
        phone: existing?.phone,
        avatar: existing?.avatar,
        gender: existing?.gender,
        appCode: validCode,
      });
      onComplete();
    } else {
      setExistingCodeError('Incorrect 4-digit App Code. Try 1234 or reset code.');
    }
  };

  const handleCompleteResetCode = () => {
    if (newResetCode.length !== 4) {
      setResetCodeError('Please create a 4-digit App Code.');
      return;
    }
    if (newResetCode !== confirmResetCode) {
      setResetCodeError('4-digit codes do not match.');
      return;
    }

    setResetCodeError(null);
    const normEmail = normalizeEmail(email);
    if (normEmail) {
      updateAccountAppCode(normEmail, newResetCode);
    }

    loginAsCustomer({
      appCode: newResetCode,
    });
    setStep('forgot_success');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {step === 'email_google_select' && (
          <motion.div
            key="email_google_select"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full flex flex-col items-center text-center"
          >
            <AlgoLogo size="md" showText={false} />

            <h2 className="mt-3 text-2xl font-black font-['Outfit',sans-serif] tracking-tight">
              Customer Experience
            </h2>
            <p
              className={`mt-1 text-xs font-semibold ${
                isLight ? 'text-zinc-700' : 'text-zinc-300'
              }`}
            >
              Explore top salons, live booking & verified stylists
            </p>

            <div
              className={`mt-4 w-full p-1.5 rounded-2xl border grid grid-cols-2 gap-1.5 text-xs font-extrabold ${
                isLight
                  ? 'bg-zinc-100 border-zinc-300'
                  : 'bg-zinc-900 border-zinc-800'
              }`}
            >
              <button
                type="button"
                id="btn-customer-type-new"
                onClick={() => setCustomerType('new')}
                className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  customerType === 'new'
                    ? 'text-white shadow-md'
                    : isLight
                    ? 'text-zinc-800 hover:text-zinc-950'
                    : 'text-zinc-300 hover:text-white'
                }`}
                style={{
                  backgroundColor:
                    customerType === 'new'
                      ? currentThemeConfig.primaryHex
                      : 'transparent',
                }}
              >
                <User className="w-4 h-4" />
                <span>New Customer</span>
              </button>

              <button
                type="button"
                id="btn-customer-type-existing"
                onClick={() => setCustomerType('existing')}
                className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  customerType === 'existing'
                    ? 'text-white shadow-md'
                    : isLight
                    ? 'text-zinc-800 hover:text-zinc-950'
                    : 'text-zinc-300 hover:text-white'
                }`}
                style={{
                  backgroundColor:
                    customerType === 'existing'
                      ? currentThemeConfig.primaryHex
                      : 'transparent',
                }}
              >
                <Lock className="w-4 h-4" />
                <span>Existing Customer</span>
              </button>
            </div>

            <button
              type="button"
              id="customer-google-continue-btn"
              disabled={isGoogleSigningIn}
              onClick={handleGoogleContinue}
              className={`mt-4 w-full py-3.5 px-4 rounded-2xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all duration-200 shadow-sm active:scale-[0.99] group ${
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
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            {entryError && (
              <p role="alert" className="mt-2 text-left text-xs font-medium text-amber-700 dark:text-amber-300">
                {entryError}
              </p>
            )}

            <div className="w-full flex items-center gap-3 my-4">
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
                Or With Email
              </span>
              <div
                className={`flex-1 h-[1px] ${
                  isLight ? 'bg-zinc-200' : 'bg-zinc-800'
                }`}
              />
            </div>

            <form onSubmit={handleEmailContinue} className="w-full space-y-3">
              <div className="text-left">
                <label
                  className={`block text-xs font-bold mb-1.5 ${
                    isLight ? 'text-zinc-700' : 'text-zinc-300'
                  }`}
                >
                  {customerType === 'new' ? 'Your Email Address' : 'Registered Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    id="customer-email-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={
                      customerType === 'new'
                        ? 'e.g. name@example.com'
                        : 'e.g. alex.j@example.com'
                    }
                    className={`w-full border rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm font-medium placeholder-zinc-400 focus:outline-none transition-all ${
                      isLight
                        ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-blue-600 focus:bg-white'
                        : 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500 focus:bg-zinc-950'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                id="customer-continue-submit-btn"
                className="w-full mt-2 py-3.5 px-6 rounded-2xl text-white font-extrabold text-sm transition-all duration-200 shadow-lg flex items-center justify-center gap-2 group active:scale-[0.99]"
                style={{
                  backgroundColor: currentThemeConfig.primaryHex,
                  boxShadow: `0 8px 20px -4px ${currentThemeConfig.glowHex}`,
                }}
              >
                <span>
                  {customerType === 'new' ? 'Continue to Verification' : 'Find Account & Sign In'}
                </span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Instant Verification • Safe 4-Digit App Code</span>
            </div>
          </motion.div>
        )}

        {step === 'new_verify_email' && (
          <OtpVerificationScreen
            key="new_verify_email"
            title="Verify Your Email"
            subtitle={`Enter the 6-digit Supabase verification code sent to ${email || 'your email'}`}
            email={email || 'alex.j@example.com'}
            isGoogle={false}
            codeLength={6}
            onVerifyCode={async (code) => {
              const res = await verifySupabaseOtp(email, code);
              return { success: !res.error, error: res.error?.message };
            }}
            onResendCode={async () => {
              await sendSupabaseOtp(email);
            }}
            onSuccess={() => setStep('new_create_account')}
            onBack={() => setStep('email_google_select')}
            targetRoleName="Customer"
          />
        )}

        {step === 'new_create_account' && (
          <motion.div
            key="new_create_account"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setStep('email_google_select')}
                className={`flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-xl border transition-all ${
                  isLight
                    ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <span
                className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg"
                style={{
                  backgroundColor: `${currentThemeConfig.primaryHex}15`,
                  color: currentThemeConfig.primaryHex,
                }}
              >
                Step 2 of 2
              </span>
            </div>

            <h2 className="text-xl font-black font-['Outfit',sans-serif]">
              Create Your Profile
            </h2>
            <p
              className={`text-xs mt-0.5 mb-4 ${
                isLight ? 'text-zinc-600' : 'text-zinc-400'
              }`}
            >
              Set up your profile and your 4-digit fast terminal pass
            </p>

            <div className="space-y-3">
              <div>
                <label className={`block text-xs font-bold mb-1 ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                  Full Legal / Display Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    id="new-customer-name-input"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    className={`w-full border rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium placeholder-zinc-400 focus:outline-none ${
                      isLight
                        ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-blue-600'
                        : 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <PhoneCountryInput
                  id="new-customer-phone-input"
                  label="Contact Phone Number"
                  value={phone}
                  onChange={(full) => setPhone(full)}
                  placeholder="54 429 8306"
                  showValidationHint={false}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                    Create 4-Digit Code
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={createAppCode}
                    onChange={e => setCreateAppCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full border rounded-2xl px-3 py-2 text-center text-lg font-mono font-black"
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                    Confirm 4-Digit Code
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={confirmAppCode}
                    onChange={e => setConfirmAppCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full border rounded-2xl px-3 py-2 text-center text-lg font-mono font-black"
                  />
                </div>
              </div>

              {codeError && (
                <p className="text-xs text-rose-500 font-bold">{codeError}</p>
              )}

              <button
                type="button"
                onClick={handleCompleteNewAccount}
                className="w-full mt-3 py-3.5 rounded-2xl text-white font-extrabold text-sm shadow-md"
                style={{ backgroundColor: currentThemeConfig.primaryHex }}
              >
                Complete Registration
              </button>
            </div>
          </motion.div>
        )}

        {step === 'existing_enter_code' && (
          <PinPad
            key="existing_enter_code"
            value={enterAppCode}
            onChange={(val) => {
              setEnterAppCode(val);
              if (existingCodeError) setExistingCodeError(null);
            }}
            title="Welcome Back"
            subtitle={`Enter your 4-digit App Code for ${email || 'your account'}`}
            onComplete={code => handleValidateExistingCode(code)}
            onForgotPin={() => setStep('forgot_create_new_code')}
            onBack={() => {
              setEnterAppCode('');
              setExistingCodeError(null);
              setStep('email_google_select');
            }}
            errorMessage={existingCodeError}
            onClearError={() => setExistingCodeError(null)}
          />
        )}

        {step === 'new_success' && (
          <motion.div
            key="new_success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black">Registration Complete!</h2>
            <p className="text-xs text-zinc-400">Welcome to ALGO Salon. You can now book premier salons instantly.</p>
            <button
              onClick={onComplete}
              className="w-full py-3.5 rounded-2xl text-white font-extrabold text-sm shadow-md"
              style={{ backgroundColor: currentThemeConfig.primaryHex }}
            >
              Start Exploring Salons
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Supabase Google OAuth Setup & Status Modal */}
      <GoogleOauthSetupModal
        isOpen={googleOauthGuideOpen}
        onClose={() => setGoogleOauthGuideOpen(false)}
        errorMessage={googleOauthErrorMsg}
        onContinueWithEmail={() => {
          const input = document.getElementById('customer-email-input');
          if (input) input.focus();
        }}
      />
    </div>
  );
};
