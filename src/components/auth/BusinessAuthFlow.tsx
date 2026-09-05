import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Store,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OtpVerificationScreen } from './OtpVerificationScreen';
import { PinPad } from './PinPad';
import { AlgoLogo } from '../common/AlgoLogo';
import {
  findAccountByEmail,
  registerNewAccount,
  updateAccountAppCode,
  normalizeEmail,
  checkAccountStatus,
} from '../../utils/accountRegistry';
import { syncAccountIdentityToSupabase, signInWithSupabaseGoogle } from '../../services/supabaseService';

type BusinessScreenStep =
  | 'email_google_select'
  | 'new_verify_email'
  | 'new_create_account'
  | 'new_success'
  | 'existing_enter_code'
  | 'forgot_verify_email'
  | 'forgot_create_new_code'
  | 'forgot_success';

interface BusinessAuthFlowProps {
  initialMode?: 'new' | 'existing';
  onComplete: () => void;
  onCancel?: () => void;
}

export const BusinessAuthFlow: React.FC<BusinessAuthFlowProps> = ({
  initialMode = 'new',
  onComplete,
}) => {
  const {
    loginAsBusiness,
    signupBusiness,
    fetchFreshUserProfile,
    currentThemeConfig,
    colorThemeMode,
    salons,
    businessUser,
  } = useApp();

  const isLight = colorThemeMode === 'light';

  const [businessType, setBusinessType] = useState<'new' | 'existing'>(initialMode);
  const [step, setStep] = useState<BusinessScreenStep>('email_google_select');

  const [email, setEmail] = useState('');
  const [entryError, setEntryError] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('Luxury Hair Salon');
  const [location, setLocation] = useState('Downtown Metro');
  const [createAppCode, setCreateAppCode] = useState('');
  const [confirmAppCode, setConfirmAppCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);

  const [enterAppCode, setEnterAppCode] = useState('');
  const [existingCodeError, setExistingCodeError] = useState<string | null>(null);

  const [newResetCode, setNewResetCode] = useState('');
  const [confirmResetCode, setConfirmResetCode] = useState('');
  const [resetCodeError, setResetCodeError] = useState<string | null>(null);

  const mockExistingSalon = salons[0] || {
    id: 'salon-1',
    name: 'Spot-Pro Signature Studio',
    city: 'Downtown Metro',
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop&q=80',
  };

  const handleGoogleContinue = async () => {
    setEntryError(null);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('algosalon_pending_oauth_role', 'business');
      }
      const { error } = await signInWithSupabaseGoogle();
      if (error) {
        setEntryError(error.message || 'Could not initiate Google login.');
      }
    } catch (err: any) {
      setEntryError(err?.message || 'Could not initiate Google login.');
    }
  };

  const handleEmailContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return;

    const status = checkAccountStatus(normalizedEmail);

    if (status.exists && status.account) {
      if (status.role === 'customer') {
        setEntryError('This email is already registered as Type: Customer. Each email can only have one account. Please sign in via the Customer portal.');
        return;
      }
      setEntryError(null);
      setBusinessType('existing');
      setStep('existing_enter_code');
      return;
    }

    setEntryError(null);
    setStep('new_create_account');
  };

  const handleCompleteNewAccount = () => {
    if (!businessName.trim()) {
      setCodeError('Please enter your business or salon name.');
      return;
    }
    if (!ownerName.trim()) {
      setCodeError('Please enter owner / manager name.');
      return;
    }
    if (createAppCode.length !== 4) {
      setCodeError('Please create a 4-digit App Code.');
      return;
    }
    if (createAppCode !== confirmAppCode) {
      setCodeError('4-digit codes do not match.');
      return;
    }

    setCodeError(null);

    const normEmail = normalizeEmail(email) || 'partner@algosalon.com';
    const regResult = registerNewAccount({
      email: normEmail,
      role: 'business',
      name: ownerName.trim(),
      appCode: createAppCode,
      phone: phone.trim() || '+971 50 123 4567',
      businessName: businessName.trim(),
      category,
      location,
      salonId: salons[0]?.id || 'salon-1',
    });

    if (!regResult.success) {
      setExistingCodeError(regResult.error || 'An account already exists with this email. Please log in instead.');
      setBusinessType('existing');
      setStep('existing_enter_code');
      return;
    }

    signupBusiness(
      {
        id: regResult.account!.id,
        name: ownerName.trim(),
        email: normEmail,
        phone: phone.trim() || '',
        businessName: businessName.trim(),
        category: category,
        location: location,
        appCode: createAppCode,
        ownerRole: 'Owner & Salon Director',
      },
      {
        name: businessName.trim(),
        phone: phone.trim(),
        city: location,
        categories: category ? [category] : ['Hair & Styling'],
      }
    );

    fetchFreshUserProfile();

    setStep('new_success');
  };

  const handleValidateExistingCode = (code = enterAppCode) => {
    const normEmail = normalizeEmail(email);
    const existing = findAccountByEmail(normEmail);
    const validCode = existing?.appCode || businessUser.appCode || '1234';

    if (code === validCode) {
      setExistingCodeError(null);
      syncAccountIdentityToSupabase(normEmail, 'business', {
        full_name: existing?.name,
        business_name: existing?.businessName,
        phone: existing?.phone,
      });
      loginAsBusiness(
        {
          id: existing?.id,
          email: existing?.email || normEmail,
          name: existing?.name,
          phone: existing?.phone,
          businessName: existing?.businessName,
          category: existing?.category,
          appCode: validCode,
        },
        existing?.salonId || businessUser.salonId
      );
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

    loginAsBusiness({
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
              Salon Partner Portal
            </h2>
            <p
              className={`mt-1 text-xs font-semibold ${
                isLight ? 'text-zinc-700' : 'text-zinc-300'
              }`}
            >
              Grow your salon business, manage staff & live appointments
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
                id="btn-business-type-new"
                onClick={() => setBusinessType('new')}
                className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  businessType === 'new'
                    ? 'text-white shadow-md'
                    : isLight
                    ? 'text-zinc-800 hover:text-zinc-950'
                    : 'text-zinc-300 hover:text-white'
                }`}
                style={{
                  backgroundColor:
                    businessType === 'new'
                      ? currentThemeConfig.primaryHex
                      : 'transparent',
                }}
              >
                <Store className="w-4 h-4" />
                <span>New Business</span>
              </button>

              <button
                type="button"
                id="btn-business-type-existing"
                onClick={() => setBusinessType('existing')}
                className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  businessType === 'existing'
                    ? 'text-white shadow-md'
                    : isLight
                    ? 'text-zinc-800 hover:text-zinc-950'
                    : 'text-zinc-300 hover:text-white'
                }`}
                style={{
                  backgroundColor:
                    businessType === 'existing'
                      ? currentThemeConfig.primaryHex
                      : 'transparent',
                }}
              >
                <Lock className="w-4 h-4" />
                <span>Existing Business</span>
              </button>
            </div>

            <button
              type="button"
              id="business-google-continue-btn"
              onClick={handleGoogleContinue}
              className={`mt-4 w-full py-3.5 px-4 rounded-2xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all duration-200 shadow-sm active:scale-[0.99] group ${
                isLight
                  ? 'bg-white hover:bg-zinc-50 border-zinc-300 text-zinc-900 shadow-zinc-200'
                  : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-700 text-white'
              }`}
            >
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
              <span>Continue with Google Workspace</span>
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
                Or Business Email
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
                  {businessType === 'new'
                    ? 'Business Email Address'
                    : 'Registered Partner Email'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    id="business-email-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={
                      businessType === 'new'
                        ? 'e.g. salon@yourbrand.com'
                        : 'e.g. marcus@algosalon.com'
                    }
                    className={`w-full border rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm font-medium placeholder-zinc-400 focus:outline-none transition-all ${
                      isLight
                        ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-blue-600'
                        : 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                id="business-continue-submit-btn"
                className="w-full mt-2 py-3.5 px-6 rounded-2xl text-white font-extrabold text-sm transition-all duration-200 shadow-lg flex items-center justify-center gap-2 group active:scale-[0.99]"
                style={{
                  backgroundColor: currentThemeConfig.primaryHex,
                  boxShadow: `0 8px 20px -4px ${currentThemeConfig.glowHex}`,
                }}
              >
                <span>
                  {businessType === 'new'
                    ? 'Verify Email & Register'
                    : 'Find Partner Account & Sign In'}
                </span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Verified Partner Network • Direct Deposit & Slot Sync</span>
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
            title="Partner Verification"
            subtitle={`Enter your 4-digit Station App Code for ${businessUser.name || 'your salon'}`}
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
      </AnimatePresence>
    </div>
  );
};
