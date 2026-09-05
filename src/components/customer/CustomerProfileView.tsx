import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ThemeSwitcherModal } from '../common/ThemeSwitcherModal';
import { LocaleRegionSwitcherModal } from '../common/LocaleRegionSwitcherModal';
import { SecurityBadge } from '../common/SecurityBadge';
import { parsePhoneNumber } from '../../utils/countryCodes';
import { SUPPORTED_LANGUAGES } from '../../utils/localeConfig';
import { uploadAvatarToSupabase, deleteAvatarFromSupabase } from '../../services/supabaseService';
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Smartphone,
  Mail,
  Lock,
  User,
  Calendar,
  Globe,
  Palette,
  Sun,
  Moon,
  Store,
  Sparkles,
  CheckCircle2,
  Camera,
  HelpCircle,
  RotateCcw,
  MessageCircle,
  Coins,
  Languages,
  Sliders,
  Phone,
  LogOut,
  Trash2,
  Upload,
  Loader2,
  AlertTriangle,
  X,
  Check,
} from 'lucide-react';

const COUNTRIES = [
  'India',
  'United Arab Emirates',
  'Saudi Arabia',
  'United States',
  'United Kingdom',
  'Canada',
  'Qatar',
  'Kuwait',
  'Bahrain',
  'Oman',
  'Australia',
  'Germany',
  'France',
  'Singapore',
  'Malaysia',
  'Egypt',
  'Jordan',
  'Pakistan',
  'Bangladesh',
  'Philippines',
  'Italy',
  'Spain',
  'Netherlands',
  'Switzerland',
  'Japan',
  'South Korea',
];

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
];

type ActiveEditField = 'name' | 'phone' | 'email' | 'pin' | 'gender' | 'dob' | 'nationality' | 'avatar' | null;

export const CustomerProfileView: React.FC = () => {
  const {
    customerUser,
    loginAsCustomer,
    updateCustomerProfile,
    fetchFreshUserProfile,
    setActiveCustomerTab,
    switchRole,
    logout,
    deleteAccount,
    setShowSplash,
    currentThemeConfig,
    colorThemeMode,
    toggleColorThemeMode,
    appointments,
    activeCountry,
    activeLanguage,
    currencyCode,
    currencySymbol,
    dialCode,
    isAutoRegionEnabled,
    isLocaleModalOpen,
    setIsLocaleModalOpen,
    resetToDeviceLocale,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const isLight = colorThemeMode === 'light';
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [activeEditModal, setActiveEditModal] = useState<ActiveEditField>(null);

  const [nameVal, setNameVal] = useState(customerUser.name || '');
  const [phoneVal, setPhoneVal] = useState(customerUser.phone || '');
  const [emailVal, setEmailVal] = useState(customerUser.email || '');
  const [pinVal, setPinVal] = useState(customerUser.appCode || '1234');
  const [confirmPinVal, setConfirmPinVal] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [genderVal, setGenderVal] = useState<'Male' | 'Female' | 'Other' | 'Prefer not to say'>(
    customerUser.gender || 'Male'
  );
  const [dobVal, setDobVal] = useState(customerUser.dateOfBirth || '');
  const [nationalityVal, setNationalityVal] = useState(customerUser.nationality || '');
  const [avatarVal, setAvatarVal] = useState(customerUser.avatar || AVATAR_PRESETS[0]);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [savedToast, setSavedToast] = useState<string | null>(null);

  // Sync state whenever customerUser or current session changes
  useEffect(() => {
    // Always fetch fresh profile on mount or session update
    const fresh = fetchFreshUserProfile();
    const active = fresh?.customer || customerUser;
    setNameVal(active.name || '');
    setPhoneVal(active.phone || '');
    setEmailVal(active.email || '');
    setPinVal(active.appCode || '1234');
    setConfirmPinVal(active.appCode || '1234');
    setGenderVal(active.gender || 'Male');
    setDobVal(active.dateOfBirth || '');
    setNationalityVal(active.nationality || '');
    setAvatarVal(active.avatar || AVATAR_PRESETS[0]);
  }, [customerUser]);

  const [smsAlerts, setSmsAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  const showToast = (message: string) => {
    setSavedToast(message);
    setTimeout(() => setSavedToast(null), 2500);
  };

  const openFieldEditor = (field: ActiveEditField) => {
    setPinError(null);
    setConfirmPinVal('');
    switch (field) {
      case 'name':
        setNameVal(customerUser.name || '');
        break;
      case 'phone':
        setPhoneVal(customerUser.phone || '');
        break;
      case 'email':
        setEmailVal(customerUser.email || '');
        break;
      case 'pin':
        setPinVal(customerUser.appCode || '1234');
        setConfirmPinVal(customerUser.appCode || '1234');
        break;
      case 'gender':
        setGenderVal(customerUser.gender || 'Male');
        break;
      case 'dob':
        setDobVal(customerUser.dateOfBirth || '');
        break;
      case 'nationality':
        setNationalityVal(customerUser.nationality || '');
        setCountrySearch('');
        break;
      case 'avatar':
        setAvatarVal(customerUser.avatar || AVATAR_PRESETS[0]);
        setCustomAvatarUrl('');
        break;
    }
    setActiveEditModal(field);
  };

  const handleSaveField = (field: ActiveEditField) => {
    switch (field) {
      case 'name':
        if (!nameVal.trim()) return;
        updateCustomerProfile({ name: nameVal.trim() });
        showToast('Name updated successfully');
        break;
      case 'phone':
        if (!phoneVal.trim()) return;
        updateCustomerProfile({ phone: phoneVal.trim() });
        showToast('Phone number updated successfully');
        break;
      case 'email':
        updateCustomerProfile({ email: emailVal.trim() });
        showToast('Sign-up Gmail / Email ID updated successfully');
        break;
      case 'pin':
        if (!/^\d{4}$/.test(pinVal)) {
          setPinError('App Code must be exactly 4 numeric digits (e.g. 1234).');
          return;
        }
        if (confirmPinVal && pinVal !== confirmPinVal) {
          setPinError('PIN confirmation does not match.');
          return;
        }
        updateCustomerProfile({ appCode: pinVal.trim() });
        showToast('4-Digit Security PIN reset successfully');
        break;
      case 'gender':
        updateCustomerProfile({ gender: genderVal });
        showToast('Gender preference updated');
        break;
      case 'dob':
        updateCustomerProfile({ dateOfBirth: dobVal });
        showToast('Date of birth updated');
        break;
      case 'nationality':
        updateCustomerProfile({ nationality: nationalityVal });
        showToast('Nationality updated');
        break;
      case 'avatar':
        updateCustomerProfile({ avatar: customAvatarUrl.trim() || avatarVal });
        showToast('Profile photo updated');
        break;
      default:
        break;
    }
    setActiveEditModal(null);
  };

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size must be under 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const res = await uploadAvatarToSupabase(file, customerUser.id || 'customer');
      if (res.success && res.url) {
        setAvatarVal(res.url);
        updateCustomerProfile({ avatar: res.url });
        showToast('Profile photo uploaded and saved!');
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setAvatarVal(reader.result);
            updateCustomerProfile({ avatar: reader.result });
            showToast('Profile photo updated!');
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      showToast('Failed to upload profile picture');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      if (customerUser.avatar && customerUser.avatar.startsWith('http')) {
        await deleteAvatarFromSupabase(customerUser.avatar);
      }
      const defaultAvatar = customerUser.gender === 'Female' ? AVATAR_PRESETS[3] : AVATAR_PRESETS[2];
      setAvatarVal(defaultAvatar);
      setCustomAvatarUrl('');
      updateCustomerProfile({ avatar: defaultAvatar });
      showToast('Profile photo removed. Default photo set.');
    } catch (err) {
      console.error('Failed to delete avatar:', err);
      showToast('Error removing avatar');
    }
  };

  const handleConfirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const success = await deleteAccount();
      if (!success) {
        showToast('Failed to delete account. Please try again.');
        setIsDeletingAccount(false);
      }
    } catch (err) {
      console.error('Delete account error:', err);
      showToast('Error deleting account');
      setIsDeletingAccount(false);
    }
  };

  const filteredCountries = COUNTRIES.filter(c =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const customerAppointments = appointments.filter(a => a.customerId === customerUser.id);
  const parsedPhone = parsePhoneNumber(customerUser.phone || '');

  return (
    <div className="max-w-2xl mx-auto pb-24 space-y-5 px-1 sm:px-0 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pt-1">
        <button
          id="profile-back-btn"
          type="button"
          onClick={() => setActiveCustomerTab('discover')}
          className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all duration-150 active:scale-95 shadow-xs cursor-pointer ${
            isLight
              ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
              : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
          }`}
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>

        <div className="text-center flex-1">
          <h1 className={`text-base sm:text-lg font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Profile & Account
          </h1>
          <p className={`text-[11px] font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Personal information, bookings & preferences
          </p>
        </div>

        <div className="w-10" />
      </div>

      {savedToast && (
        <div
          className="p-3.5 rounded-2xl border flex items-center gap-2.5 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            backgroundColor: isLight ? '#f0fdf4' : '#052e16',
            borderColor: '#22c55e',
            color: isLight ? '#15803d' : '#4ade80',
          }}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span className="text-xs font-bold">{savedToast}</span>
        </div>
      )}

      <div
        className={`p-4 sm:p-5 rounded-3xl border shadow-sm relative overflow-hidden transition-all ${
          isLight
            ? 'bg-gradient-to-br from-white via-slate-50 to-white border-slate-200/90'
            : 'bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border-slate-800'
        }`}
        style={{
          boxShadow: `0 10px 30px -10px ${currentThemeConfig.glowHex}`,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative group shrink-0 self-center sm:self-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileUpload}
            />
            <img
              src={customerUser.avatar || AVATAR_PRESETS[0]}
              alt={customerUser.name}
              className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-offset-2 transition-transform group-hover:scale-105"
              style={{
                borderColor: currentThemeConfig.primaryHex,
                boxShadow: `0 4px 14px ${currentThemeConfig.glowHex}`,
              }}
              referrerPolicy="no-referrer"
            />
            <button
              type="button"
              id="customer-profile-upload-avatar-btn"
              onClick={() => openFieldEditor('avatar')}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer"
              style={{ backgroundColor: currentThemeConfig.primaryHex }}
              title="Upload / Change Profile Photo"
            >
              {isUploadingAvatar ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
            </button>
            {customerUser.avatar && (
              <button
                type="button"
                id="customer-profile-delete-avatar-btn"
                onClick={handleDeleteAvatar}
                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 border-white dark:border-slate-900"
                title="Delete Profile Photo"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h2
                className={`text-lg sm:text-xl font-black tracking-tight truncate ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {customerUser.name || 'Valued Client'}
              </h2>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase text-white shrink-0 shadow-xs"
                style={{ backgroundColor: currentThemeConfig.primaryHex }}
              >
                VIP Member
              </span>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27a7.17 7.17 0 0 1 0-4.54V6.58H1.25a11.97 11.97 0 0 0 0 10.84l4.03-3.15Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                />
              </svg>
              <span className={`font-semibold truncate ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                {customerUser.email || 'No email specified'}
              </span>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
              <span className="text-sm leading-none" role="img" aria-label={parsedPhone.country.name}>
                {parsedPhone.country.flag}
              </span>
              <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {parsedPhone.dialCode} {parsedPhone.nationalNumber}
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                  isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                {parsedPhone.country.name}
              </span>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                  isLight
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                <span>{customerUser.loyaltyPoints ?? 0} Loyalty Points</span>
              </span>

              <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                ≈ ${(customerUser.loyaltyPoints ?? 0) / 20} Wallet Balance
              </span>
            </div>
          </div>
        </div>

        <div
          className={`grid grid-cols-3 gap-2 mt-4 pt-4 border-t ${
            isLight ? 'border-slate-200/80' : 'border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveCustomerTab('bookings')}
            className={`p-2.5 rounded-2xl border text-center transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${
              isLight ? 'bg-white border-slate-200/80 hover:bg-slate-50' : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/50'
            }`}
          >
            <div className={`text-base font-extrabold font-mono leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {customerAppointments.length}
            </div>
            <div className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Bookings
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveCustomerTab('saved')}
            className={`p-2.5 rounded-2xl border text-center transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${
              isLight ? 'bg-white border-slate-200/80 hover:bg-slate-50' : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/50'
            }`}
          >
            <div className={`text-base font-extrabold font-mono leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {customerUser.savedSalonIds?.length ?? 0}
            </div>
            <div className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Saved Salons
            </div>
          </button>

          <button
            type="button"
            onClick={() => setThemeModalOpen(true)}
            className={`p-2.5 rounded-2xl border text-center transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${
              isLight ? 'bg-white border-slate-200/80 hover:bg-slate-50' : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/50'
            }`}
          >
            <div
              className="text-base font-extrabold truncate leading-tight"
              style={{ color: currentThemeConfig.primaryHex }}
            >
              {currentThemeConfig.name.split(' ')[0]}
            </div>
            <div className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Theme Palette
            </div>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className={`text-xs font-extrabold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Personal Information & Credentials
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">Tap row to edit</span>
        </div>

        <div
          className={`rounded-3xl border overflow-hidden shadow-sm divide-y transition-colors ${
            isLight
              ? 'bg-white border-slate-200/80 divide-slate-100'
              : 'bg-slate-900/90 border-slate-800 divide-slate-800/80'
          }`}
        >
          <div
            id="profile-item-name"
            onClick={() => openFieldEditor('name')}
            role="button"
            tabIndex={0}
            className={`p-3.5 sm:p-4 flex items-center justify-between cursor-pointer transition-colors ${
              isLight ? 'hover:bg-slate-50 active:bg-slate-100' : 'hover:bg-slate-800/60 active:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-800 text-slate-200'
                }`}
              >
                <User className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <h4 className={`text-sm font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Full Name
                </h4>
                <p className={`text-xs mt-0.5 truncate uppercase font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {customerUser.name || 'Valued Client'}
                </p>
              </div>
            </div>
            <ArrowRight className={`w-4 h-4 shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
          </div>

          <div
            id="profile-item-email"
            onClick={() => openFieldEditor('email')}
            role="button"
            tabIndex={0}
            className={`p-3.5 sm:p-4 flex items-center justify-between cursor-pointer transition-colors ${
              isLight ? 'hover:bg-slate-50 active:bg-slate-100' : 'hover:bg-slate-800/60 active:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-red-50 text-red-600' : 'bg-red-950/40 text-red-400'
                }`}
              >
                <Mail className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className={`text-sm font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Sign-up Gmail / Email ID
                  </h4>
                  <span className="text-[10px] font-extrabold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>Verified</span>
                  </span>
                </div>
                <p className={`text-xs mt-0.5 truncate font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {customerUser.email || 'No email specified'}
                </p>
              </div>
            </div>
            <ArrowRight className={`w-4 h-4 shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
          </div>

          <div
            id="profile-item-phone"
            onClick={() => openFieldEditor('phone')}
            role="button"
            tabIndex={0}
            className={`p-3.5 sm:p-4 flex items-center justify-between cursor-pointer transition-colors ${
              isLight ? 'hover:bg-slate-50 active:bg-slate-100' : 'hover:bg-slate-800/60 active:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-800 text-slate-200'
                }`}
              >
                <Smartphone className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <h4 className={`text-sm font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Mobile Contact Number
                </h4>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-sm leading-none" role="img" aria-label={parsedPhone.country.name}>
                    {parsedPhone.country.flag}
                  </span>
                  <span className={`text-xs font-semibold font-mono ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                    {parsedPhone.dialCode} {parsedPhone.nationalNumber}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border ${
                      isLight
                        ? 'bg-slate-100 border-slate-200 text-slate-600'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    {parsedPhone.country.name}
                  </span>
                </div>
              </div>
            </div>
            <ArrowRight className={`w-4 h-4 shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
          </div>

          <div
            id="profile-item-pin"
            onClick={() => openFieldEditor('pin')}
            role="button"
            tabIndex={0}
            className={`p-3.5 sm:p-4 flex items-center justify-between cursor-pointer transition-colors ${
              isLight ? 'hover:bg-slate-50 active:bg-slate-100' : 'hover:bg-slate-800/60 active:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-950/40 text-amber-400'
                }`}
              >
                <Lock className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className={`text-sm font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    4-Digit Security PIN
                  </h4>
                  <span className="text-[10px] font-extrabold text-amber-600 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 flex items-center gap-0.5">
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Reset PIN</span>
                  </span>
                </div>
                <p className={`text-xs mt-0.5 font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  •••• (Quick authentication active)
                </p>
              </div>
            </div>
            <ArrowRight className={`w-4 h-4 shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
          </div>

          <div
            id="profile-item-gender"
            onClick={() => openFieldEditor('gender')}
            role="button"
            tabIndex={0}
            className={`p-3.5 sm:p-4 flex items-center justify-between cursor-pointer transition-colors ${
              isLight ? 'hover:bg-slate-50 active:bg-slate-100' : 'hover:bg-slate-800/60 active:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-800 text-slate-200'
                }`}
              >
                <CreditCard className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <h4 className={`text-sm font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Gender Preference
                </h4>
                <p className={`text-xs mt-0.5 truncate font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {customerUser.gender || 'Not specified'}
                </p>
              </div>
            </div>
            <ArrowRight className={`w-4 h-4 shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
          </div>

          <div
            id="profile-item-dob"
            onClick={() => openFieldEditor('dob')}
            role="button"
            tabIndex={0}
            className={`p-3.5 sm:p-4 flex items-center justify-between cursor-pointer transition-colors ${
              isLight ? 'hover:bg-slate-50 active:bg-slate-100' : 'hover:bg-slate-800/60 active:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-800 text-slate-200'
                }`}
              >
                <Calendar className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <h4 className={`text-sm font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Date of Birth
                </h4>
                <p className={`text-xs mt-0.5 truncate font-semibold font-mono ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {customerUser.dateOfBirth || 'Not specified'}
                </p>
              </div>
            </div>
            <ArrowRight className={`w-4 h-4 shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
          </div>

          <div
            id="profile-item-nationality"
            onClick={() => openFieldEditor('nationality')}
            role="button"
            tabIndex={0}
            className={`p-3.5 sm:p-4 flex items-center justify-between cursor-pointer transition-colors ${
              isLight ? 'hover:bg-slate-50 active:bg-slate-100' : 'hover:bg-slate-800/60 active:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-800 text-slate-200'
                }`}
              >
                <Globe className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <h4 className={`text-sm font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Nationality / Region
                </h4>
                <p className={`text-xs mt-0.5 truncate font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {customerUser.nationality || 'Not specified'}
                </p>
              </div>
            </div>
            <ArrowRight className={`w-4 h-4 shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
          </div>
        </div>

        <SecurityBadge variant="banner" />
      </div>

      {/* Auto Localization + Manual Override Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className={`text-xs font-extrabold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Region & Language
            </h3>
            {isAutoRegionEnabled ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Smartphone className="w-3 h-3" />
                <span>Auto-Detect</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Sliders className="w-3 h-3" />
                <span>Manual Override</span>
              </span>
            )}
          </div>

          <button
            type="button"
            id="open-locale-modal-btn"
            onClick={() => setIsLocaleModalOpen(true)}
            className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Change</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div
          className={`rounded-3xl border shadow-sm divide-y transition-colors overflow-hidden ${
            isLight
              ? 'bg-white border-slate-200/80 divide-slate-100'
              : 'bg-slate-900/90 border-slate-800 divide-slate-800/80'
          }`}
        >
          {/* Country Row */}
          <div
            id="profile-item-country"
            onClick={() => setIsLocaleModalOpen(true)}
            role="button"
            tabIndex={0}
            className={`p-3.5 sm:p-4 flex items-center justify-between cursor-pointer transition-colors ${
              isLight ? 'hover:bg-slate-50 active:bg-slate-100' : 'hover:bg-slate-800/60 active:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl ${
                  isLight ? 'bg-slate-100' : 'bg-slate-800'
                }`}
              >
                {activeCountry.flag}
              </div>
              <div className="min-w-0">
                <h4 className={`text-sm font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Country & Region
                </h4>
                <p className={`text-xs mt-0.5 truncate font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {activeCountry.name} ({activeCountry.nativeName})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {activeCountry.code}
              </span>
              <ArrowRight className={`w-4 h-4 shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
            </div>
          </div>

          {/* Language Row */}
          <div
            id="profile-item-language"
            onClick={() => setIsLocaleModalOpen(true)}
            role="button"
            tabIndex={0}
            className={`p-3.5 sm:p-4 flex items-center justify-between cursor-pointer transition-colors ${
              isLight ? 'hover:bg-slate-50 active:bg-slate-100' : 'hover:bg-slate-800/60 active:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-950/40 text-blue-400'
                }`}
              >
                <Languages className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <h4 className={`text-sm font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Language
                </h4>
                <p className={`text-xs mt-0.5 truncate font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {SUPPORTED_LANGUAGES.find(l => l.code === activeLanguage)?.name} ({SUPPORTED_LANGUAGES.find(l => l.code === activeLanguage)?.nativeName})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm leading-none">
                {SUPPORTED_LANGUAGES.find(l => l.code === activeLanguage)?.flag}
              </span>
              <ArrowRight className={`w-4 h-4 shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="px-1">
          <h3 className={`text-xs font-extrabold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Notification Preferences
          </h3>
        </div>

        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-sm space-y-4 transition-colors ${
            isLight ? 'bg-white border-slate-200/80' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-800 text-slate-200'
                }`}
              >
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  SMS Appointment Reminders
                </h4>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Receive 2h advance SMS reminder before your scheduled appointment
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSmsAlerts(!smsAlerts);
                showToast(smsAlerts ? 'SMS alerts turned off' : 'SMS alerts activated');
              }}
              className={`w-12 h-7 rounded-full p-1 transition-colors relative shrink-0 cursor-pointer ${
                smsAlerts ? 'bg-emerald-500' : isLight ? 'bg-slate-200' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  smsAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-950/40 text-emerald-400'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  WhatsApp Instant Digital Pass
                </h4>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Direct pass QR code & location link sent directly to your WhatsApp
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setWhatsappAlerts(!whatsappAlerts);
                showToast(whatsappAlerts ? 'WhatsApp alerts disabled' : 'WhatsApp alerts activated');
              }}
              className={`w-12 h-7 rounded-full p-1 transition-colors relative shrink-0 cursor-pointer ${
                whatsappAlerts ? 'bg-emerald-500' : isLight ? 'bg-slate-200' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  whatsappAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div
        className={`p-4 sm:p-5 rounded-3xl border shadow-sm flex items-center justify-between gap-3 transition-colors ${
          isLight ? 'bg-white border-slate-200/80' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
            style={{ backgroundColor: currentThemeConfig.primaryHex }}
          >
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className={`text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
              ALGO Concierge & VIP Help
            </h4>
            <p className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              24/7 assistance with rescheduling, custom stylists, or billing
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSupportModalOpen(true)}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors shrink-0 cursor-pointer ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
              : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
          }`}
        >
          Contact Support
        </button>
      </div>

      <div
        className={`p-4 sm:p-5 rounded-3xl border space-y-4 shadow-sm ${
          isLight ? 'bg-white border-slate-200/80' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <div>
            <h4
              className={`text-xs font-bold flex items-center gap-1.5 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              <RotateCcw className="w-4 h-4 shrink-0" style={{ color: currentThemeConfig.primaryHex }} />
              <span>ALGO Welcome Splash Screen</span>
            </h4>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Replay the animated intro sequence and interactive welcome screen.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSplash(true)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs border shadow-sm shrink-0 transition-transform active:scale-95 cursor-pointer ${
              isLight
                ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
            }`}
          >
            Play Intro Animation ✦
          </button>
        </div>

        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <div>
            <h4
              className={`text-xs font-bold flex items-center gap-1.5 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              <Store className="w-4 h-4 shrink-0" style={{ color: currentThemeConfig.primaryHex }} />
              <span>Salon Owner or Stylist?</span>
            </h4>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Switch to ALGO Business Hub to manage bookings, staff, and schedules.
            </p>
          </div>
          <button
            id="customer-profile-switch-hub-btn"
            type="button"
            onClick={() => switchRole('business')}
            className="px-4 py-2.5 rounded-xl text-white font-bold text-xs shadow-md shrink-0 transition-transform active:scale-95 cursor-pointer"
            style={{
              backgroundColor: currentThemeConfig.primaryHex,
            }}
          >
            Open Business Hub →
          </button>
        </div>

        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isLight ? 'bg-rose-50/50 border-rose-200/70' : 'bg-rose-950/20 border-rose-900/50'
          }`}
        >
          <div>
            <h4
              className={`text-xs font-bold flex items-center gap-1.5 ${
                isLight ? 'text-rose-950' : 'text-rose-200'
              }`}
            >
              <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
              <span>Session & Account</span>
            </h4>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-rose-700' : 'text-rose-300'}`}>
              Log out completely from this device and return to the login screen.
            </p>
          </div>
          <button
            id="customer-profile-logout-btn"
            type="button"
            onClick={() => logout()}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shrink-0 transition-transform active:scale-95 cursor-pointer"
          >
            Log Out Completely
          </button>
        </div>

        {/* Delete Customer Account (Supabase Database Deletion) */}
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isLight ? 'bg-red-50/50 border-red-200/80' : 'bg-red-950/20 border-red-900/50'
          }`}
        >
          <div>
            <h4
              className={`text-xs font-bold flex items-center gap-1.5 ${
                isLight ? 'text-red-950' : 'text-red-200'
              }`}
            >
              <Trash2 className="w-4 h-4 shrink-0 text-red-500" />
              <span>Delete Customer Account</span>
            </h4>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-red-700' : 'text-red-300'}`}>
              Permanently erase your account, bookings, and saved data from the Supabase database.
            </p>
          </div>
          <button
            id="customer-profile-delete-account-btn"
            type="button"
            onClick={() => setDeleteAccountModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shrink-0 transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Delete Customer Account Confirmation Modal */}
      {deleteAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl relative space-y-4 animate-in zoom-in-95 duration-200 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className={`text-lg font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Delete Customer Account?
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                This action is <span className="font-bold text-red-600">permanent and irreversible</span>. All your profile details, appointments, favorites, and notifications will be completely wiped from the Supabase database.
              </p>
            </div>

            <div
              className={`p-3 rounded-2xl border text-xs space-y-1 ${
                isLight ? 'bg-red-50 border-red-200 text-red-800' : 'bg-red-950/40 border-red-900/60 text-red-300'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>Supabase Database Deletion</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Account: <span className="font-mono font-bold">{customerUser.email || customerUser.name}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteAccountModalOpen(false)}
                disabled={isDeletingAccount}
                className={`flex-1 py-3 rounded-2xl font-bold text-xs border transition-colors cursor-pointer ${
                  isLight
                    ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-delete-customer-account-btn"
                onClick={handleConfirmDeleteAccount}
                disabled={isDeletingAccount}
                className="flex-1 py-3 rounded-2xl font-black text-xs bg-red-600 hover:bg-red-700 text-white shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Profile Field Editor Modal */}
      {activeEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-3xl p-5 sm:p-6 border shadow-2xl relative space-y-4 animate-in zoom-in-95 duration-200 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className={`text-base font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {activeEditModal === 'avatar' && 'Edit Profile Photo'}
                {activeEditModal === 'name' && 'Edit Full Name'}
                {activeEditModal === 'phone' && 'Edit Mobile Number'}
                {activeEditModal === 'email' && 'Edit Email ID'}
                {activeEditModal === 'pin' && 'Reset 4-Digit Security PIN'}
                {activeEditModal === 'gender' && 'Select Gender Preference'}
                {activeEditModal === 'dob' && 'Edit Date of Birth'}
                {activeEditModal === 'nationality' && 'Select Nationality / Region'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveEditModal(null)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* AVATAR EDITOR */}
            {activeEditModal === 'avatar' && (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="relative">
                    <img
                      src={customAvatarUrl.trim() || avatarVal}
                      alt="Avatar Preview"
                      className="w-24 h-24 rounded-3xl object-cover ring-4 ring-offset-2"
                      style={{ borderColor: currentThemeConfig.primaryHex }}
                    />
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 rounded-3xl bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    <button
                      type="button"
                      id="modal-upload-avatar-file-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="px-3.5 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
                      style={{ backgroundColor: currentThemeConfig.primaryHex }}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingAvatar ? 'Uploading...' : 'Upload New Photo'}</span>
                    </button>

                    {(customerUser.avatar || avatarVal) && (
                      <button
                        type="button"
                        id="modal-delete-avatar-btn"
                        onClick={handleDeleteAvatar}
                        className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Or Choose From Curated Presets
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAvatarVal(preset);
                          setCustomAvatarUrl('');
                        }}
                        className={`relative rounded-2xl overflow-hidden aspect-square border-2 transition-transform hover:scale-105 active:scale-95 cursor-pointer ${
                          avatarVal === preset && !customAvatarUrl
                            ? 'ring-2 ring-offset-1 ring-emerald-500 border-emerald-500'
                            : isLight
                            ? 'border-slate-200'
                            : 'border-slate-700'
                        }`}
                      >
                        <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                        {avatarVal === preset && !customAvatarUrl && (
                          <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-300 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Or Paste Custom Image URL
                  </label>
                  <input
                    type="url"
                    value={customAvatarUrl}
                    onChange={e => setCustomAvatarUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-slate-600'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* NAME EDITOR */}
            {activeEditModal === 'name' && (
              <div className="space-y-2">
                <label className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Full Name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={nameVal}
                  onChange={e => setNameVal(e.target.value)}
                  placeholder="e.g. John Doe"
                  className={`w-full px-4 py-3 rounded-2xl border text-sm font-semibold outline-none transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-slate-600'
                  }`}
                />
              </div>
            )}

            {/* PHONE EDITOR */}
            {activeEditModal === 'phone' && (
              <div className="space-y-2">
                <label className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Mobile Contact Number
                </label>
                <input
                  type="tel"
                  autoFocus
                  value={phoneVal}
                  onChange={e => setPhoneVal(e.target.value)}
                  placeholder="+971 50 123 4567"
                  className={`w-full px-4 py-3 rounded-2xl border text-sm font-mono font-bold outline-none transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-slate-600'
                  }`}
                />
              </div>
            )}

            {/* EMAIL EDITOR */}
            {activeEditModal === 'email' && (
              <div className="space-y-2">
                <label className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Sign-up Gmail / Email Address
                </label>
                <input
                  type="email"
                  autoFocus
                  value={emailVal}
                  onChange={e => setEmailVal(e.target.value)}
                  placeholder="name@gmail.com"
                  className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-slate-600'
                  }`}
                />
              </div>
            )}

            {/* PIN EDITOR */}
            {activeEditModal === 'pin' && (
              <div className="space-y-3">
                <div>
                  <label className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    New 4-Digit Security PIN
                  </label>
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={4}
                    autoFocus
                    value={pinVal}
                    onChange={e => setPinVal(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className={`w-full px-4 py-3 rounded-2xl border text-center text-lg font-mono font-bold tracking-widest outline-none mt-1 ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-slate-600'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Confirm 4-Digit PIN
                  </label>
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={4}
                    value={confirmPinVal}
                    onChange={e => setConfirmPinVal(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className={`w-full px-4 py-3 rounded-2xl border text-center text-lg font-mono font-bold tracking-widest outline-none mt-1 ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-slate-600'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                  >
                    {showPin ? 'Hide PIN numbers' : 'Show PIN numbers'}
                  </button>
                </div>

                {pinError && (
                  <p className="text-xs font-bold text-rose-500 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{pinError}</span>
                  </p>
                )}
              </div>
            )}

            {/* GENDER EDITOR */}
            {activeEditModal === 'gender' && (
              <div className="space-y-2">
                <label className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Select Gender Preference
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Male', 'Female', 'Other', 'Prefer not to say'] as const).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGenderVal(g)}
                      className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                        genderVal === g
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : isLight
                          ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                          : 'border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* DOB EDITOR */}
            {activeEditModal === 'dob' && (
              <div className="space-y-2">
                <label className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dobVal}
                  onChange={e => setDobVal(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl border text-sm font-semibold outline-none transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-slate-600'
                  }`}
                />
              </div>
            )}

            {/* NATIONALITY EDITOR */}
            {activeEditModal === 'nationality' && (
              <div className="space-y-2">
                <label className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Search Nationality / Country
                </label>
                <input
                  type="text"
                  value={countrySearch}
                  onChange={e => setCountrySearch(e.target.value)}
                  placeholder="Search countries..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {filteredCountries.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNationalityVal(c)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        nationalityVal === c
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                          : isLight
                          ? 'hover:bg-slate-100 text-slate-700'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveEditModal(null)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs border transition-colors cursor-pointer ${
                  isLight ? 'border-slate-200 text-slate-600 hover:bg-slate-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                id="save-field-modal-btn"
                onClick={() => handleSaveField(activeEditModal)}
                className="px-5 py-2.5 rounded-xl font-black text-xs text-white shadow-md transition-transform active:scale-95 cursor-pointer"
                style={{ backgroundColor: currentThemeConfig.primaryHex }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {supportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: currentThemeConfig.primaryHex }}
                >
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    ALGO VIP Concierge
                  </h3>
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    24/7 Priority Support
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSupportModalOpen(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
                  isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`p-4 rounded-2xl border space-y-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Hotline Support</div>
                  <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">+971 800 ALGO (2546)</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                <div>
                  <div className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Email Concierge</div>
                  <div className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>vip-support@algosalon.ae</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>WhatsApp Instant Help</div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Live 24/7 Agent Available</div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSupportModalOpen(false)}
              className="w-full py-3 rounded-2xl text-white font-bold text-xs shadow-md cursor-pointer"
              style={{ backgroundColor: currentThemeConfig.primaryHex }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <ThemeSwitcherModal isOpen={themeModalOpen} onClose={() => setThemeModalOpen(false)} />
      <LocaleRegionSwitcherModal isOpen={isLocaleModalOpen} onClose={() => setIsLocaleModalOpen(false)} />
    </div>
  );
};
