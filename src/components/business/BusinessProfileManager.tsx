import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PhoneCountryInput } from '../common/PhoneCountryInput';
import { SecurityBadge } from '../common/SecurityBadge';
import { LocaleRegionSwitcherModal } from '../common/LocaleRegionSwitcherModal';
import { getSalonMapUrl, format12Hour } from '../../utils/salonUtils';
import { ALL_COUNTRY_LOCALES } from '../../utils/localeConfig';
import { SalonDocument, WorkingDayHour, SpecialDateSchedule } from '../../types';
import { uploadAvatarToSupabase, deleteAvatarFromSupabase } from '../../services/supabaseService';
import {
  Store,
  MapPin,
  Phone,
  CheckCircle2,
  Save,
  KeyRound,
  ShieldCheck,
  UploadCloud,
  Camera,
  Heart,
  Star,
  ImageIcon,
  Trash2,
  Sparkles,
  FileText,
  Download,
  Eye,
  EyeOff,
  Copy,
  Check,
  RotateCcw,
  Plus,
  X,
  Wifi,
  Coffee,
  Car,
  Smartphone,
  Gamepad2,
  Accessibility,
  CreditCard,
  Snowflake,
  Lock,
  Mail,
  Building2,
  BadgeCheck,
  ExternalLink,
  Calendar,
  Sparkle,
  Baby,
  ChevronDown,
  Globe,
  Clock,
  CalendarDays,
  CalendarOff,
  CalendarCheck,
  SlidersHorizontal,
  Sun,
  Moon,
  ToggleLeft,
  ToggleRight,
  Edit3,
  AlertCircle,
  User,
  LogOut,
  Loader2,
} from 'lucide-react';

const AI_BANNER_PRESETS = [
  {
    id: 'ai-1',
    name: 'Modern Luxury Salon',
    category: 'Hair & Styling',
    url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'ai-2',
    name: 'Artisan Barber Lounge',
    category: 'Grooming & Shave',
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'ai-3',
    name: 'Aesthetic Spa & Sanctuary',
    category: 'Wellness & Glow',
    url: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'ai-4',
    name: 'Chic Parisian Studio',
    category: 'Boutique Aesthetic',
    url: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'ai-5',
    name: 'Minimalist Barber Suite',
    category: 'Modern Barber',
    url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'ai-6',
    name: 'Botanical Beauty Haven',
    category: 'Natural Aesthetics',
    url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1600&auto=format&fit=crop&q=80',
  },
];

// Pre-configured catalog of popular salon amenities
const POPULAR_AMENITIES = [
  {
    id: 'wifi',
    name: 'Free High-Speed Wi-Fi',
    category: 'Connectivity',
    icon: Wifi,
    description: 'Fast guest internet for waiting clients and browsing during styling.',
  },
  {
    id: 'espresso',
    name: 'Espresso & Drinks Bar',
    category: 'Refreshments',
    icon: Coffee,
    description: 'Specialty Arabic coffee, Italian espresso, tea, and cold beverages.',
  },
  {
    id: 'valet',
    name: 'Valet Parking',
    category: 'Convenience',
    icon: Car,
    description: 'Complimentary or dedicated valet service at the storefront entry.',
  },
  {
    id: 'ac',
    name: 'Air Conditioned',
    category: 'Comfort',
    icon: Snowflake,
    description: 'Modern climate-controlled airflow and clean ambient temperature.',
  },
  {
    id: 'apple_pay',
    name: 'Card & Apple Pay',
    category: 'Payments',
    icon: CreditCard,
    description: 'Contactless payments, credit/debit cards, and digital wallet tap.',
  },
  {
    id: 'charging',
    name: 'Phone Charging Docks',
    category: 'Connectivity',
    icon: Smartphone,
    description: 'Universal high-speed charging cables (Lightning, USB-C) at each station.',
  },
  {
    id: 'vip_suite',
    name: 'Private VIP Suites',
    category: 'Premium',
    icon: Sparkles,
    description: 'Dedicated secluded grooming rooms for maximum privacy and luxury.',
  },
  {
    id: 'prayer_room',
    name: 'Private Prayer Room',
    category: 'Comfort',
    icon: Building2,
    description: 'Quiet, clean private musalla with ablution facilities nearby.',
  },
  {
    id: 'playstation',
    name: 'PlayStation Lounge',
    category: 'Entertainment',
    icon: Gamepad2,
    description: 'Gaming station and 4K entertainment screen in the client lounge.',
  },
  {
    id: 'accessible',
    name: 'Wheelchair Accessible',
    category: 'Accessibility',
    icon: Accessibility,
    description: 'Step-free ramp entry, wide doorways, and accessible styling stations.',
  },
  {
    id: 'kids_corner',
    name: 'Kids Play Corner',
    category: 'Comfort',
    icon: Baby,
    description: 'Child-friendly seating, booster chairs, and entertainment for families.',
  },
  {
    id: 'organic',
    name: 'Organic Products',
    category: 'Premium',
    icon: Sparkle,
    description: '100% cruelty-free, organic essential oils, shampoos, and beard care.',
  },
];

const DEFAULT_DOCUMENTS: SalonDocument[] = [
  {
    id: 'doc-1',
    name: 'Commercial Trade License',
    type: 'trade_license',
    documentNumber: 'CN-2894109',
    issueDate: '2024-01-15',
    expiryDate: '2027-01-14',
    issuingAuthority: 'Department of Economic Development (DED)',
    status: 'verified',
    fileName: 'DED_Trade_License_2026.pdf',
    fileSize: '1.8 MB',
  },
  {
    id: 'doc-2',
    name: 'Public Health & Sanitation Permit',
    type: 'health_sanitation',
    documentNumber: 'HSC-88194',
    issueDate: '2024-03-10',
    expiryDate: '2027-03-09',
    issuingAuthority: 'Municipal Health & Safety Directorate',
    status: 'verified',
    fileName: 'Municipality_Health_Compliance.pdf',
    fileSize: '1.2 MB',
  },
  {
    id: 'doc-3',
    name: 'Public Liability & Salon Insurance',
    type: 'liability_insurance',
    documentNumber: 'POL-9920148',
    issueDate: '2024-06-01',
    expiryDate: '2027-05-31',
    issuingAuthority: 'Alliance Commercial Indemnity',
    status: 'verified',
    fileName: 'Salon_Liability_Insurance_Gold.pdf',
    fileSize: '2.4 MB',
  },
  {
    id: 'doc-4',
    name: 'Federal Tax Registration (VAT TRN)',
    type: 'tax_certificate',
    documentNumber: 'TRN-100492817200003',
    issueDate: '2023-11-20',
    expiryDate: '2028-11-19',
    issuingAuthority: 'Federal Tax Authority (FTA)',
    status: 'verified',
    fileName: 'FTA_VAT_Certificate.pdf',
    fileSize: '950 KB',
  },
];

const DEFAULT_WORKING_HOURS: WorkingDayHour[] = [
  { day: 'Monday', isOpen: true, open: '09:00', close: '21:00' },
  { day: 'Tuesday', isOpen: true, open: '09:00', close: '21:00' },
  { day: 'Wednesday', isOpen: true, open: '09:00', close: '21:00' },
  { day: 'Thursday', isOpen: true, open: '09:00', close: '21:00' },
  { day: 'Friday', isOpen: true, open: '09:00', close: '22:00' },
  { day: 'Saturday', isOpen: true, open: '09:00', close: '22:00' },
  { day: 'Sunday', isOpen: true, open: '10:00', close: '19:00' },
];

const DEFAULT_SPECIAL_DATES: SpecialDateSchedule[] = [
  {
    id: 'sp-1',
    date: '2026-12-25',
    title: 'Christmas Day',
    isOpen: false,
    reason: 'Annual Public Holiday • Store Closed for Staff Celebration',
  },
  {
    id: 'sp-2',
    date: '2026-12-31',
    title: "New Year's Eve",
    isOpen: true,
    open: '09:00',
    close: '17:00',
    reason: 'Special Festive Operating Hours • Early Close for NYE',
  },
  {
    id: 'sp-3',
    date: '2027-01-01',
    title: "New Year's Day",
    isOpen: false,
    reason: 'Official National Holiday • Store Closed',
  },
];

export const BusinessProfileManager: React.FC = () => {
  const {
    businessUser,
    loginAsBusiness,
    updateBusinessProfile,
    fetchFreshUserProfile,
    switchRole,
    logout,
    deleteAccount,
    salons,
    updateSalonProfile,
    currentThemeConfig,
    colorThemeMode,
    activeCountry,
    setActiveCountryCode,
    isLocaleModalOpen,
    setIsLocaleModalOpen,
  } = useApp();

  const [deleteBizAccountModalOpen, setDeleteBizAccountModalOpen] = useState(false);
  const [isDeletingBizAccount, setIsDeletingBizAccount] = useState(false);

  const handleConfirmDeleteBizAccount = async () => {
    setIsDeletingBizAccount(true);
    try {
      const success = await deleteAccount();
      if (!success) {
        alert('Failed to delete business account. Please try again.');
        setIsDeletingBizAccount(false);
      }
    } catch (err) {
      console.error('Delete business account error:', err);
      alert('Error deleting business account.');
      setIsDeletingBizAccount(false);
    }
  };

  const isLight = colorThemeMode === 'light';
  const salon = salons.find(s => s.id === businessUser.salonId) || salons[0];

  // Settings Section Navigation: 5 clean, focused sections
  const [activeSettingsSection, setActiveSettingsSection] = useState<
    'details' | 'hours' | 'security' | 'documents' | 'amenities'
  >('details');

  const [bannerActionNotice, setBannerActionNotice] = useState<string | null>(null);
  const [logoActionNotice, setLogoActionNotice] = useState<string | null>(null);
  const [generalNotice, setGeneralNotice] = useState<string | null>(null);

  // Shop Details & Media Fields
  const [logo, setLogo] = useState(salon?.logo || '');
  const [name, setName] = useState(salon?.name || businessUser.businessName || 'My Salon Studio');
  const [category, setCategory] = useState(businessUser.category || salon?.categories?.[0] || 'Hair & Styling');
  const [tagline, setTagline] = useState(salon?.tagline || '');
  const [description, setDescription] = useState(salon?.description || '');
  const [address, setAddress] = useState(salon?.address || '');
  const [city, setCity] = useState(salon?.city || businessUser.location || '');
  const [mapUrl, setMapUrl] = useState(salon?.mapUrl || '');
  const [phone, setPhone] = useState(salon?.phone || businessUser.phone || '');
  const [image, setImage] = useState(salon?.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop&q=80');

  // Operating Hours & Schedule State
  const [workingHours, setWorkingHours] = useState<WorkingDayHour[]>(
    salon?.workingHours && salon.workingHours.length > 0
      ? salon.workingHours
      : DEFAULT_WORKING_HOURS
  );
  const [specialSchedules, setSpecialSchedules] = useState<SpecialDateSchedule[]>(
    salon?.specialSchedules && salon.specialSchedules.length > 0
      ? salon.specialSchedules
      : DEFAULT_SPECIAL_DATES
  );

  // Bulk Template Hours & UX states
  const [templateOpenTime, setTemplateOpenTime] = useState('09:00');
  const [templateCloseTime, setTemplateCloseTime] = useState('21:00');
  const [scheduleNotice, setScheduleNotice] = useState<string | null>(null);

  // Special Date Modal & Form State
  const [isAddSpecialModalOpen, setIsAddSpecialModalOpen] = useState(false);
  const [editingSpecialId, setEditingSpecialId] = useState<string | null>(null);
  const [specialDateInput, setSpecialDateInput] = useState('');
  const [specialTitleInput, setSpecialTitleInput] = useState('');
  const [specialIsOpenInput, setSpecialIsOpenInput] = useState(false);
  const [specialOpenInput, setSpecialOpenInput] = useState('10:00');
  const [specialCloseInput, setSpecialCloseInput] = useState('17:00');
  const [specialReasonInput, setSpecialReasonInput] = useState('');

  // Real-time Like Count Logic
  const [likesCount, setLikesCount] = useState<number>(salon?.likesCount || 0);
  const [hasLiked, setHasLiked] = useState(false);

  // Banner Camera Menu & AI Preset Dialog
  const [showBannerCameraMenu, setShowBannerCameraMenu] = useState(false);
  const [showAiBannerModal, setShowAiBannerModal] = useState(false);

  // Amenities State
  const [amenitiesList, setAmenitiesList] = useState<string[]>(salon?.amenities || [
    'Free High-Speed Wi-Fi',
    'Air Conditioned',
    'Card & Apple Pay',
  ]);
  const [newCustomAmenity, setNewCustomAmenity] = useState('');
  const [amenityFilterCategory, setAmenityFilterCategory] = useState<string>('All');

  // Documents State
  const initialTradeDoc = salon?.documents?.find(d => d.type === 'trade_license');
  const initialTaxDoc = salon?.documents?.find(d => d.type === 'tax_certificate');

  const [licenseNumber, setLicenseNumber] = useState(
    salon?.licenseNumber || initialTradeDoc?.documentNumber || 'CN-2894109'
  );
  const [trnNumber, setTrnNumber] = useState(
    salon?.trnNumber || initialTaxDoc?.documentNumber || '100492817200003'
  );

  const [documents, setDocuments] = useState<SalonDocument[]>(
    salon?.documents && salon.documents.length > 0 ? salon.documents : DEFAULT_DOCUMENTS
  );
  const [selectedDocPreview, setSelectedDocPreview] = useState<SalonDocument | null>(null);
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [newDocForm, setNewDocForm] = useState<{
    name: string;
    type: 'trade_license' | 'health_sanitation' | 'liability_insurance' | 'tax_certificate' | 'other';
    documentNumber: string;
    issuingAuthority: string;
    expiryDate: string;
    fileName: string;
  }>({
    name: '',
    type: 'trade_license',
    documentNumber: '',
    issuingAuthority: '',
    expiryDate: '2027-12-31',
    fileName: '',
  });

  // Account & App Code State
  const [ownerName, setOwnerName] = useState(businessUser.name || 'Salon Director');
  const [ownerRole, setOwnerRole] = useState(businessUser.ownerRole || 'Owner & Salon Director');
  const [ownerEmail, setOwnerEmail] = useState(businessUser.email || 'partner@algosalon.com');
  const [signUpGmail, setSignUpGmail] = useState(
    businessUser.signUpGmail || businessUser.email || 'partner@algosalon.com'
  );
  const [appCode, setAppCode] = useState(businessUser.appCode || '1234');
  const [showAppCode, setShowAppCode] = useState(false);
  const [copiedAppCode, setCopiedAppCode] = useState(false);
  const [isResetAppCodeModalOpen, setIsResetAppCodeModalOpen] = useState(false);
  const [customResetCode, setCustomResetCode] = useState('');

  // Sync state on session updates or fresh profile retrieval
  useEffect(() => {
    const fresh = fetchFreshUserProfile();
    const active = fresh?.business || businessUser;
    setOwnerName(active.name || 'Salon Director');
    setOwnerRole(active.ownerRole || 'Owner & Salon Director');
    setOwnerEmail(active.email || 'partner@algosalon.com');
    setSignUpGmail(active.signUpGmail || active.email || 'partner@algosalon.com');
    setAppCode(active.appCode || '1234');
  }, [businessUser]);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const heroImageInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'Luxury Hair Salon',
    'Barber Shop & Shave Lounge',
    'Spa & Wellness Sanctuary',
    'Nail & Beauty Couture',
    'Unisex Aesthetic Studio',
    'Skin Care & Dermatology',
  ];

  // Real-time Like Count Handler
  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasLiked) {
      const updated = Math.max(0, likesCount - 1);
      setLikesCount(updated);
      setHasLiked(false);
      updateSalonProfile(salon.id, { likesCount: updated });
    } else {
      const updated = likesCount + 1;
      setLikesCount(updated);
      setHasLiked(true);
      updateSalonProfile(salon.id, { likesCount: updated });
      setBannerActionNotice('Storefront like registered in real-time!');
      setTimeout(() => setBannerActionNotice(null), 3000);
    }
  };

  // Logo Handlers
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Logo file size exceeds 5MB. Please choose a smaller file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogo(reader.result);
        updateSalonProfile(salon.id, { logo: reader.result });
        setLogoActionNotice('Shop brand logo updated successfully!');
        setTimeout(() => setLogoActionNotice(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteLogo = () => {
    setLogo('');
    updateSalonProfile(salon.id, { logo: '' });
    setLogoActionNotice('Shop brand logo removed. Shop initial displayed.');
    setTimeout(() => setLogoActionNotice(null), 3500);
  };

  // Hero Image Banner Handlers
  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('Image size exceeds 8MB. Please choose a smaller file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImage(reader.result);
        updateSalonProfile(salon.id, { image: reader.result });
        setShowBannerCameraMenu(false);
        setBannerActionNotice('Storefront banner image uploaded successfully!');
        setTimeout(() => setBannerActionNotice(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteBanner = () => {
    setImage('');
    updateSalonProfile(salon.id, { image: '' });
    setShowBannerCameraMenu(false);
    setBannerActionNotice('Storefront banner removed. Default studio theme active.');
    setTimeout(() => setBannerActionNotice(null), 3500);
  };

  const handleSelectAiBanner = (bannerUrl: string, bannerName: string) => {
    setImage(bannerUrl);
    updateSalonProfile(salon.id, { image: bannerUrl });
    setShowAiBannerModal(false);
    setShowBannerCameraMenu(false);
    setBannerActionNotice(`AI Studio banner "${bannerName}" applied!`);
    setTimeout(() => setBannerActionNotice(null), 3500);
  };

  // Amenities Handlers
  const handleToggleAmenity = (amenityName: string) => {
    let updated: string[];
    if (amenitiesList.includes(amenityName)) {
      updated = amenitiesList.filter(a => a !== amenityName);
    } else {
      updated = [...amenitiesList, amenityName];
    }
    setAmenitiesList(updated);
    updateSalonProfile(salon.id, { amenities: updated });
    setGeneralNotice(`Amenity "${amenityName}" updated.`);
    setTimeout(() => setGeneralNotice(null), 2500);
  };

  const handleAddCustomAmenity = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCustomAmenity.trim();
    if (!trimmed) return;
    if (amenitiesList.includes(trimmed)) {
      alert('This amenity is already in your list.');
      return;
    }
    const updated = [...amenitiesList, trimmed];
    setAmenitiesList(updated);
    updateSalonProfile(salon.id, { amenities: updated });
    setNewCustomAmenity('');
    setGeneralNotice(`Custom amenity "${trimmed}" added successfully!`);
    setTimeout(() => setGeneralNotice(null), 3000);
  };

  const handleRemoveAmenity = (amenityName: string) => {
    const updated = amenitiesList.filter(a => a !== amenityName);
    setAmenitiesList(updated);
    updateSalonProfile(salon.id, { amenities: updated });
  };

  // Document Handlers
  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocForm.name.trim() || !newDocForm.documentNumber.trim()) return;
    const newDoc: SalonDocument = {
      id: `doc-${Date.now()}`,
      name: newDocForm.name.trim(),
      type: newDocForm.type,
      documentNumber: newDocForm.documentNumber.trim(),
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: newDocForm.expiryDate || '2027-12-31',
      issuingAuthority: newDocForm.issuingAuthority.trim() || 'Government Authority',
      status: 'verified',
      fileName: newDocForm.fileName || 'Verified_Permit.pdf',
      fileSize: '1.4 MB',
    };
    const updated = [newDoc, ...documents];
    setDocuments(updated);
    updateSalonProfile(salon.id, { documents: updated });
    setIsAddDocModalOpen(false);
    setNewDocForm({
      name: '',
      type: 'trade_license',
      documentNumber: '',
      issuingAuthority: '',
      expiryDate: '2027-12-31',
      fileName: '',
    });
    setGeneralNotice(`Document "${newDoc.name}" uploaded and verified!`);
    setTimeout(() => setGeneralNotice(null), 3000);
  };

  const handleDeleteDocument = (id: string) => {
    const updated = documents.filter(d => d.id !== id);
    setDocuments(updated);
    updateSalonProfile(salon.id, { documents: updated });
    setGeneralNotice('Document record removed.');
    setTimeout(() => setGeneralNotice(null), 2500);
  };

  // Operating Hours & Weekly Schedule Handlers
  const handleToggleDayOpen = (index: number) => {
    setWorkingHours(prev =>
      prev.map((wh, idx) => (idx === index ? { ...wh, isOpen: !wh.isOpen } : wh))
    );
  };

  const handleDayTimeChange = (index: number, field: 'open' | 'close', value: string) => {
    setWorkingHours(prev =>
      prev.map((wh, idx) => (idx === index ? { ...wh, [field]: value } : wh))
    );
  };

  const handleApplyTemplateHours = () => {
    setWorkingHours(prev =>
      prev.map(wh => (wh.isOpen ? { ...wh, open: templateOpenTime, close: templateCloseTime } : wh))
    );
    setScheduleNotice(`Standard hours (${templateOpenTime} - ${templateCloseTime}) applied to all open days!`);
    setTimeout(() => setScheduleNotice(null), 3500);
  };

  const handleSetAllDaysOpen = () => {
    setWorkingHours(prev =>
      prev.map(wh => ({
        ...wh,
        isOpen: true,
        open: templateOpenTime,
        close: templateCloseTime,
      }))
    );
    setScheduleNotice('All 7 days set to Open with standard schedule!');
    setTimeout(() => setScheduleNotice(null), 3500);
  };

  const handleSetStandardSalonWeek = () => {
    setWorkingHours(prev =>
      prev.map(wh => ({
        ...wh,
        isOpen: wh.day !== 'Sunday',
        open: templateOpenTime,
        close: templateCloseTime,
      }))
    );
    setScheduleNotice('Standard Salon Schedule applied: Monday to Saturday Open, Sunday Closed.');
    setTimeout(() => setScheduleNotice(null), 3500);
  };

  const handleSetWeekdaysOnly = () => {
    setWorkingHours(prev =>
      prev.map(wh => ({
        ...wh,
        isOpen: wh.day !== 'Saturday' && wh.day !== 'Sunday',
        open: templateOpenTime,
        close: templateCloseTime,
      }))
    );
    setScheduleNotice('Weekdays Only schedule applied: Monday to Friday Open, Weekends Closed.');
    setTimeout(() => setScheduleNotice(null), 3500);
  };

  const handleCopyDayToAll = (sourceIndex: number) => {
    const sourceDay = workingHours[sourceIndex];
    if (!sourceDay) return;
    setWorkingHours(prev =>
      prev.map(wh => (wh.isOpen ? { ...wh, open: sourceDay.open, close: sourceDay.close } : wh))
    );
    setScheduleNotice(`Copied ${sourceDay.day}'s hours (${sourceDay.open} - ${sourceDay.close}) to all open days!`);
    setTimeout(() => setScheduleNotice(null), 3500);
  };

  // Special Dates Overrides Handlers
  const handleOpenAddSpecialModal = (preset?: {
    title: string;
    date: string;
    isOpen: boolean;
    open?: string;
    close?: string;
    reason?: string;
  }) => {
    if (preset) {
      setEditingSpecialId(null);
      setSpecialDateInput(preset.date);
      setSpecialTitleInput(preset.title);
      setSpecialIsOpenInput(preset.isOpen);
      setSpecialOpenInput(preset.open || '10:00');
      setSpecialCloseInput(preset.close || '17:00');
      setSpecialReasonInput(preset.reason || '');
    } else {
      setEditingSpecialId(null);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const ymd = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
      setSpecialDateInput(ymd);
      setSpecialTitleInput('');
      setSpecialIsOpenInput(false);
      setSpecialOpenInput('10:00');
      setSpecialCloseInput('17:00');
      setSpecialReasonInput('');
    }
    setIsAddSpecialModalOpen(true);
  };

  const handleEditSpecialDate = (spec: SpecialDateSchedule) => {
    setEditingSpecialId(spec.id);
    setSpecialDateInput(spec.date);
    setSpecialTitleInput(spec.title);
    setSpecialIsOpenInput(spec.isOpen);
    setSpecialOpenInput(spec.open || '10:00');
    setSpecialCloseInput(spec.close || '17:00');
    setSpecialReasonInput(spec.reason || '');
    setIsAddSpecialModalOpen(true);
  };

  const handleSaveSpecialDateModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!specialDateInput) {
      alert('Please select a date for the special schedule override.');
      return;
    }
    if (!specialTitleInput.trim()) {
      alert('Please enter an occasion title (e.g. Christmas Day, VIP Event).');
      return;
    }

    if (editingSpecialId) {
      setSpecialSchedules(prev =>
        prev.map(s =>
          s.id === editingSpecialId
            ? {
                ...s,
                date: specialDateInput,
                title: specialTitleInput.trim(),
                isOpen: specialIsOpenInput,
                open: specialIsOpenInput ? specialOpenInput : undefined,
                close: specialIsOpenInput ? specialCloseInput : undefined,
                reason: specialReasonInput.trim(),
              }
            : s
        )
      );
      setScheduleNotice(`Updated special schedule override for ${specialTitleInput.trim()}`);
    } else {
      const newEntry: SpecialDateSchedule = {
        id: `sp-${Date.now()}`,
        date: specialDateInput,
        title: specialTitleInput.trim(),
        isOpen: specialIsOpenInput,
        open: specialIsOpenInput ? specialOpenInput : undefined,
        close: specialIsOpenInput ? specialCloseInput : undefined,
        reason: specialReasonInput.trim(),
      };
      setSpecialSchedules(prev => [...prev, newEntry]);
      setScheduleNotice(`Added special schedule override for ${specialTitleInput.trim()}`);
    }

    setIsAddSpecialModalOpen(false);
    setTimeout(() => setScheduleNotice(null), 3500);
  };

  const handleDeleteSpecialDate = (id: string) => {
    setSpecialSchedules(prev => prev.filter(s => s.id !== id));
    setScheduleNotice('Special date schedule removed.');
    setTimeout(() => setScheduleNotice(null), 3000);
  };

  const handleToggleSpecialDateOpen = (id: string) => {
    setSpecialSchedules(prev =>
      prev.map(s => {
        if (s.id === id) {
          const nextIsOpen = !s.isOpen;
          return {
            ...s,
            isOpen: nextIsOpen,
            open: nextIsOpen ? s.open || '10:00' : undefined,
            close: nextIsOpen ? s.close || '17:00' : undefined,
          };
        }
        return s;
      })
    );
  };

  // App Code Handlers
  const handleCopyAppCode = () => {
    navigator.clipboard.writeText(appCode);
    setCopiedAppCode(true);
    setTimeout(() => setCopiedAppCode(false), 2000);
  };

  const handleGenerateRandomAppCode = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
    setAppCode(randomDigits);
    loginAsBusiness(
      {
        name: ownerName.trim(),
        ownerRole: ownerRole.trim(),
        email: ownerEmail.trim(),
        signUpGmail: signUpGmail.trim(),
        isGmailLinked: true,
        appCode: randomDigits,
        businessName: name.trim(),
        category: category,
        location: city.trim(),
      },
      salon.id
    );
    setIsResetAppCodeModalOpen(false);
    setGeneralNotice(`New 4-Digit App Code generated: ${randomDigits}`);
    setTimeout(() => setGeneralNotice(null), 4000);
  };

  const handleSaveCustomAppCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = customResetCode.trim();
    if (cleanCode.length !== 4 || !/^\d{4}$/.test(cleanCode)) {
      alert('App code must be exactly 4 numeric digits (e.g. 5821).');
      return;
    }
    setAppCode(cleanCode);
    loginAsBusiness(
      {
        name: ownerName.trim(),
        ownerRole: ownerRole.trim(),
        email: ownerEmail.trim(),
        signUpGmail: signUpGmail.trim(),
        isGmailLinked: true,
        appCode: cleanCode,
        businessName: name.trim(),
        category: category,
        location: city.trim(),
      },
      salon.id
    );
    setIsResetAppCodeModalOpen(false);
    setCustomResetCode('');
    setGeneralNotice(`App Code updated to ${cleanCode}`);
    setTimeout(() => setGeneralNotice(null), 4000);
  };

  // Master Save Handler
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    updateSalonProfile(salon.id, {
      logo: logo.trim(),
      name: name.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      address: address.trim(),
      city: city.trim(),
      mapUrl: mapUrl.trim(),
      phone: phone.trim(),
      image: image.trim(),
      likesCount: likesCount,
      amenities: amenitiesList,
      documents: documents,
      licenseNumber: licenseNumber.trim(),
      trnNumber: trnNumber.trim(),
      workingHours: workingHours,
      specialSchedules: specialSchedules,
      isVerified: true,
    });

    loginAsBusiness(
      {
        name: ownerName.trim(),
        ownerRole: ownerRole.trim(),
        email: ownerEmail.trim(),
        signUpGmail: signUpGmail.trim(),
        isGmailLinked: true,
        appCode: appCode.trim(),
        businessName: name.trim(),
        category: category,
        location: city.trim(),
      },
      salon.id
    );

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const computedMapUrl = getSalonMapUrl({ name, address, city, mapUrl });

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Settings Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Settings Dashboard
          </h1>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Configure storefront identity, shop open & closed schedules, special holidays, security & verified licensing.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <span>Settings saved successfully! All shop details, weekly schedules, special dates, amenities, and credentials have been updated.</span>
          </div>
        </div>
      )}

      {generalNotice && (
        <div className="p-3.5 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-500 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{generalNotice}</span>
        </div>
      )}

      {/* ============================================================= */}
      {/* STRUCTURED NAVIGATION TABS (5 Core Sections)                  */}
      {/* ============================================================= */}
      <div
        className={`p-1.5 rounded-2xl border flex items-center gap-1.5 overflow-x-auto custom-scrollbar ${
          isLight ? 'bg-slate-100/90 border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <button
          type="button"
          id="settings-tab-details"
          onClick={() => setActiveSettingsSection('details')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSettingsSection === 'details'
              ? isLight
                ? 'bg-white text-slate-900 shadow-sm font-black'
                : 'bg-slate-800 text-white shadow-sm font-black'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Store className="w-4 h-4 text-amber-500" />
          <span>Shops Details</span>
        </button>

        <button
          type="button"
          id="settings-tab-hours"
          onClick={() => setActiveSettingsSection('hours')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSettingsSection === 'hours'
              ? isLight
                ? 'bg-white text-slate-900 shadow-sm font-black'
                : 'bg-slate-800 text-white shadow-sm font-black'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-500" />
          <span>Shop Hours & Schedule</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            {workingHours.filter(d => d.isOpen).length}d Open
          </span>
        </button>

        <button
          type="button"
          id="settings-tab-security"
          onClick={() => setActiveSettingsSection('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSettingsSection === 'security'
              ? isLight
                ? 'bg-white text-slate-900 shadow-sm font-black'
                : 'bg-slate-800 text-white shadow-sm font-black'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <KeyRound className="w-4 h-4 text-purple-500" />
          <span>Gmail & App Code</span>
          <span className="px-1.5 py-0.5 rounded-md font-mono text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
            PIN: {showAppCode ? appCode : '••••'}
          </span>
        </button>

        <button
          type="button"
          id="settings-tab-documents"
          onClick={() => setActiveSettingsSection('documents')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSettingsSection === 'documents'
              ? isLight
                ? 'bg-white text-slate-900 shadow-sm font-black'
                : 'bg-slate-800 text-white shadow-sm font-black'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <FileText className="w-4 h-4 text-sky-500" />
          <span>Documents Verified & Licensing</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
            <ShieldCheck className="w-2.5 h-2.5" />
            <span>Verified</span>
          </span>
        </button>

        <button
          type="button"
          id="settings-tab-amenities"
          onClick={() => setActiveSettingsSection('amenities')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSettingsSection === 'amenities'
              ? isLight
                ? 'bg-white text-slate-900 shadow-sm font-black'
                : 'bg-slate-800 text-white shadow-sm font-black'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Coffee className="w-4 h-4 text-emerald-500" />
          <span>Complimentary Guest Amenities</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeSettingsSection === 'amenities'
                ? 'bg-emerald-500 text-white'
                : isLight
                ? 'bg-slate-200 text-slate-700'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {amenitiesList.length}
          </span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* ============================================================= */}
      {/* SECTION 1: SHOPS DETAILS (WITH LOGO & STOREFRONT BANNER)      */}
      {/* ============================================================= */}
      {activeSettingsSection === 'details' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Hidden Inputs for Real Uploads */}
          <input
            ref={heroImageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleHeroImageUpload}
          />
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />

          {/* ======================================================= */}
          {/* CARD 1: LOGO DETAILS VIEW CARD                          */}
          {/* ======================================================= */}
          <div
            className={`rounded-3xl border p-5 sm:p-6 shadow-sm transition-all ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            {/* Header label */}
            <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
                  style={{ backgroundColor: currentThemeConfig.primaryHex }}
                >
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h2 className={`text-sm sm:text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Shop Brand Identity & Location
                  </h2>
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Official logo, brand name, verification status, and direct map coordinates.
                  </p>
                </div>
              </div>

              <span
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full border"
                style={{
                  backgroundColor: `${currentThemeConfig.primaryHex}15`,
                  borderColor: `${currentThemeConfig.primaryHex}30`,
                  color: currentThemeConfig.primaryHex,
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Partner</span>
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-start sm:items-center gap-4 min-w-0">
                {/* Shop Logo with Smart Upload & Delete Icon */}
                <div className="relative group/logo shrink-0">
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 overflow-hidden shadow-sm flex items-center justify-center relative select-none transition-transform group-hover/logo:scale-102"
                    style={{
                      borderColor: currentThemeConfig.primaryHex,
                      backgroundColor: isLight ? '#f8fafc' : '#0f172a',
                    }}
                  >
                    {logo ? (
                      <img
                        src={logo}
                        alt={name || 'Shop Brand Logo'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center font-black text-2xl sm:text-3xl text-white select-none transition-transform"
                        style={{
                          background: `linear-gradient(135deg, ${currentThemeConfig.primaryHex}, #0f172a)`,
                        }}
                      >
                        <span className="font-['Outfit',sans-serif] tracking-tight drop-shadow-sm">
                          {(name?.trim() || 'A').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Redesigned Logo Action Buttons (Upload & Delete) */}
                  <div className="absolute -bottom-1.5 -right-1.5 flex items-center gap-1 z-10">
                    <button
                      type="button"
                      id="upload-shop-logo-btn"
                      onClick={() => logoInputRef.current?.click()}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer border ${
                        isLight
                          ? 'bg-white hover:bg-slate-50 text-slate-700 hover:text-sky-600 border-slate-200 shadow-slate-200/60'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-sky-400 border-slate-700 shadow-black/50'
                      }`}
                      title={logo ? 'Change / Upload Shop Logo' : 'Upload Shop Logo'}
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>

                    {logo && (
                      <button
                        type="button"
                        id="delete-shop-logo-btn"
                        onClick={handleDeleteLogo}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer border ${
                          isLight
                            ? 'bg-white hover:bg-rose-50 text-rose-500 border-rose-200 shadow-rose-100/60'
                            : 'bg-slate-900 hover:bg-rose-950/50 text-rose-400 border-rose-900/60 shadow-black/50'
                        }`}
                        title="Delete Logo (Display First Letter)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Salon Info: Name, Category, Map URL Link, Contact Number */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2
                      className={`text-lg sm:text-xl font-black font-['Outfit',sans-serif] tracking-tight truncate ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {name || 'Your Salon Legal / Brand Name'}
                    </h2>
                    <span
                      className="inline-flex items-center justify-center shrink-0"
                      title="Verified & Approved ALGO Salon"
                    >
                      <CheckCircle2
                        className="w-4 h-4"
                        style={{ color: currentThemeConfig.primaryHex }}
                      />
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                        isLight
                          ? 'bg-slate-100 border-slate-200 text-slate-700'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {category}
                    </span>
                  </div>

                  {tagline && (
                    <p
                      className="text-xs font-semibold truncate"
                      style={{ color: currentThemeConfig.primaryHex }}
                    >
                      {tagline}
                    </p>
                  )}

                  {/* Map Icon linked with Shop Map URL & Contact Number Icon */}
                  <div className="flex items-center gap-3.5 flex-wrap text-xs pt-0.5">
                    {/* Map Icon linked with Shop Map URL */}
                    <a
                      href={computedMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 font-bold transition-colors cursor-pointer group"
                      title="Open verified location in Google Maps"
                    >
                      <div className="w-5 h-5 rounded-md bg-rose-500/10 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate max-w-[200px] sm:max-w-xs">
                        {address ? `${address}, ` : ''}{city || 'Dubai, UAE'}
                      </span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>

                    {/* Contact Number Icon */}
                    {phone && (
                      <a
                        href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                        className={`flex items-center gap-1.5 font-mono font-bold transition-colors cursor-pointer ${
                          isLight ? 'text-slate-700 hover:text-slate-900' : 'text-slate-300 hover:text-white'
                        }`}
                        title="Direct Contact Number"
                      >
                        <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                          <Phone className="w-3 h-3" />
                        </div>
                        <span>{phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Map Action Button */}
              <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
                <a
                  href={computedMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-500 shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>View on Map</span>
                </a>
              </div>
            </div>

            {/* Logo Notice */}
            {logoActionNotice && (
              <div className="mt-4 p-3 bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{logoActionNotice}</span>
              </div>
            )}
          </div>

          {/* ======================================================= */}
          {/* CARD 2: REDESIGNED STOREFRONT BANNER CARD (BELOW LOGO)  */}
          {/* ======================================================= */}
          <div
            className={`rounded-3xl border overflow-hidden shadow-sm transition-all ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            {/* Banner Section Header & Action Bar */}
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm sm:text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Storefront Cover Banner
                    </h3>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        isLight
                          ? 'bg-slate-100 border-slate-200 text-slate-700'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      16:9 Cinema
                    </span>
                  </div>
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Displayed prominently on client discovery, search results & salon detail screens.
                  </p>
                </div>
              </div>

              {/* Quick Actions Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => heroImageInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Upload image from computer"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Banner</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAiBannerModal(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-400/20 hover:bg-amber-400/30 border border-amber-500/30 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Select from AI-curated studio themes"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>AI Presets</span>
                </button>

                {image && (
                  <button
                    type="button"
                    onClick={handleDeleteBanner}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 border border-rose-500/30 transition-all cursor-pointer"
                    title="Remove banner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Banner Media Container */}
            <div className="relative aspect-[16/9] sm:aspect-[21/8] w-full overflow-hidden bg-slate-950 group">
              {image ? (
                <img
                  src={image}
                  alt={name || 'Shop Storefront Banner'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-[#121316]">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mb-2">
                    <ImageIcon className="w-7 h-7 opacity-70" />
                  </div>
                  <span className="text-xs font-bold text-slate-400">No Custom Banner Selected</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Click camera icon or choose AI presets above</span>
                </div>
              )}

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 pointer-events-none" />

              {/* Top Action Bar on Banner: Camera Tool Button + Status */}
              <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 z-20">
                <div className="flex items-center gap-2">
                  {/* Camera Action Button with Popover Menu */}
                  <div className="relative">
                    <button
                      id="shop-banner-camera-btn"
                      type="button"
                      onClick={() => setShowBannerCameraMenu(!showBannerCameraMenu)}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-black/80 hover:bg-black text-white backdrop-blur-md border border-white/25 flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer hover:border-white/40"
                      title="Banner Controls: Upload, Delete or Add AI Image"
                    >
                      <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </button>

                    {/* Camera Action Dropdown Popover */}
                    {showBannerCameraMenu && (
                      <div
                        className={`absolute left-0 top-12 z-30 w-56 rounded-2xl border p-2 shadow-2xl space-y-1 animate-in fade-in zoom-in-95 ${
                          isLight
                            ? 'bg-white/95 backdrop-blur-md border-slate-200 text-slate-800'
                            : 'bg-slate-900/95 backdrop-blur-md border-slate-700 text-white'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setShowBannerCameraMenu(false);
                            heroImageInputRef.current?.click();
                          }}
                          className="w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <UploadCloud className="w-4 h-4 text-sky-500 shrink-0" />
                          <span>Upload Banner Image</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowBannerCameraMenu(false);
                            setShowAiBannerModal(true);
                          }}
                          className="w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>Add Small AI Image</span>
                        </button>

                        {image && (
                          <button
                            type="button"
                            onClick={handleDeleteBanner}
                            className="w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer border-t border-slate-100 dark:border-slate-800 pt-1.5"
                          >
                            <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
                            <span>Delete Current Banner</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/90 text-white shadow-sm backdrop-blur-md">
                    ● Live on Discovery
                  </span>
                </div>
              </div>

              {/* Bottom Left of Banner: Real Star Rating, Rating Value Logic & Review Count */}
              <div className="absolute bottom-3.5 left-3.5 flex items-center gap-2 z-10">
                <div className="flex items-center gap-1.5 font-bold bg-black/80 border border-white/20 px-3 py-1.5 rounded-2xl backdrop-blur-md shadow-md text-white">
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-black leading-none">
                    {salon.rating ? salon.rating.toFixed(1) : '4.8'}
                  </span>
                  <span className="text-slate-300 text-[10px] sm:text-[11px] font-medium">
                    ({salon.reviewCount || 142} reviews)
                  </span>
                </div>
              </div>

              {/* Bottom Right of Banner: Real-time 'Like' Count Logic */}
              <div className="absolute bottom-3.5 right-3.5 flex items-center gap-2 z-10">
                <button
                  type="button"
                  id="banner-like-count-btn"
                  onClick={handleToggleLike}
                  className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-2xl backdrop-blur-md border font-extrabold text-xs sm:text-sm transition-all shadow-md active:scale-90 cursor-pointer ${
                    hasLiked
                      ? 'bg-rose-500 text-white border-rose-400 ring-2 ring-rose-400/30'
                      : 'bg-black/80 hover:bg-black text-white border-white/20'
                  }`}
                  title="Click to register real-time storefront like"
                >
                  <Heart
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${
                      hasLiked ? 'text-white fill-white scale-110' : 'text-rose-400 fill-rose-400'
                    }`}
                  />
                  <span className="leading-none">{likesCount} Likes</span>
                </button>
              </div>
            </div>

            {/* Banner Notice */}
            {bannerActionNotice && (
              <div className="p-3 bg-emerald-500/15 border-t border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{bannerActionNotice}</span>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* HEADLINE SECTION: SHOPS DETAILS                            */}
          {/* ========================================================= */}
          <div
            className={`p-6 rounded-3xl border space-y-5 shadow-sm ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            {/* Section Header */}
            <div className="border-b pb-4 border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-amber-500" />
                  <h2 className={`text-base sm:text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Shops Details
                  </h2>
                </div>
                <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Manage your salon legal name, business category, tagline, description, direct contact number, auto-verified map URL & full street address.
                </p>
              </div>
            </div>

            {/* Details Form Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Salon Legal / Brand Name */}
              <div>
                <label className={`block font-bold mb-1.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  Salon Legal / Brand Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    updateSalonProfile(salon.id, { name: e.target.value });
                  }}
                  placeholder="e.g. Spot-Pro Signature Studio"
                  className={`w-full border rounded-xl px-3.5 py-2.5 font-semibold focus:outline-none transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-slate-600'
                  }`}
                />
              </div>

              {/* Business Category */}
              <div>
                <label className={`block font-bold mb-1.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  Business Category
                </label>
                <select
                  value={category}
                  onChange={e => {
                    setCategory(e.target.value);
                    updateSalonProfile(salon.id, {
                      categories: [e.target.value, ...(salon.categories?.filter(c => c !== e.target.value) || [])],
                    });
                  }}
                  className={`w-full border rounded-xl px-3.5 py-2.5 font-semibold focus:outline-none transition-all cursor-pointer ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-slate-600'
                  }`}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Shop Tagline */}
              <div className="sm:col-span-2">
                <label className={`block font-bold mb-1.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  Shop Tagline / Slogan
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={e => {
                    setTagline(e.target.value);
                    updateSalonProfile(salon.id, { tagline: e.target.value });
                  }}
                  placeholder="e.g. Precision Barbering, Luxury Grooming & Modern Aesthetics"
                  className={`w-full border rounded-xl px-3.5 py-2.5 font-semibold focus:outline-none transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-slate-600'
                  }`}
                />
              </div>

              {/* Shop About Description */}
              <div className="sm:col-span-2">
                <label className={`block font-bold mb-1.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  Shop About Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => {
                    setDescription(e.target.value);
                    updateSalonProfile(salon.id, { description: e.target.value });
                  }}
                  placeholder="Describe your master stylists, grooming equipment, luxury products, and client experience..."
                  className={`w-full border rounded-xl px-3.5 py-2.5 font-semibold focus:outline-none transition-all resize-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-slate-600'
                  }`}
                />
              </div>

              {/* Direct Contact Number */}
              <div className="sm:col-span-2">
                <PhoneCountryInput
                  id="business-phone-setting"
                  value={phone}
                  onChange={full => {
                    setPhone(full);
                    updateSalonProfile(salon.id, { phone: full });
                  }}
                  label="Direct Contact Number"
                  placeholder="54 429 8306"
                />
              </div>

              {/* Shop Map URL Auto Verified */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`block font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    Shop Map URL (Auto Verified)
                  </label>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Auto Verified</span>
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={mapUrl}
                    onChange={e => {
                      setMapUrl(e.target.value);
                      updateSalonProfile(salon.id, { mapUrl: e.target.value });
                    }}
                    placeholder="e.g. https://maps.app.goo.gl/salon-location or leave blank to auto-generate from address"
                    className={`flex-1 border rounded-xl px-3.5 py-2.5 font-mono text-[11px] focus:outline-none transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-rose-500'
                    }`}
                  />
                  <a
                    href={computedMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 rounded-xl border border-rose-500/30 text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Test Link</span>
                  </a>
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label className={`block font-bold mb-1.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  Street Address & Suite
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => {
                    setAddress(e.target.value);
                    updateSalonProfile(salon.id, { address: e.target.value });
                  }}
                  placeholder="e.g. 420 Grand Avenue, Suite 102"
                  className={`w-full border rounded-xl px-3.5 py-2.5 font-semibold focus:outline-none transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-slate-600'
                  }`}
                />
              </div>

              {/* City */}
              <div>
                <label className={`block font-bold mb-1.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  City / District
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={e => {
                    setCity(e.target.value);
                    updateSalonProfile(salon.id, { city: e.target.value });
                  }}
                  placeholder="e.g. Dubai"
                  className={`w-full border rounded-xl px-3.5 py-2.5 font-semibold focus:outline-none transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-slate-600'
                  }`}
                />
              </div>

              {/* Country */}
              <div className="sm:col-span-2">
                <label className={`block font-bold mb-1.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  Country
                </label>
                <div className="relative group">
                  <div
                    className={`w-full border rounded-xl px-3.5 py-2.5 font-semibold flex items-center justify-between transition-all pointer-events-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 group-hover:border-slate-400'
                        : 'bg-slate-950 border-slate-800 text-white group-hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl leading-none">{activeCountry.flag}</span>
                      <span className="font-bold text-xs">{activeCountry.name}</span>
                      <span className="text-[11px] font-mono text-slate-400">({activeCountry.code})</span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400">
                      <span className="text-[11px] font-medium text-slate-400">Change</span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <select
                    id="business-country-select"
                    value={activeCountry.code}
                    onChange={e => {
                      const selectedCode = e.target.value;
                      setActiveCountryCode(selectedCode);
                      const found = ALL_COUNTRY_LOCALES.find(c => c.code === selectedCode);
                      if (found) {
                        setGeneralNotice(`Country updated to ${found.flag} ${found.name}`);
                        setTimeout(() => setGeneralNotice(null), 3000);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
                    title="Click to select country"
                  >
                    {ALL_COUNTRY_LOCALES.map(c => (
                      <option
                        key={c.code}
                        value={c.code}
                        className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}
                      >
                        {c.flag} {c.name} ({c.code}) - {c.currency}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SECTION 2: SHOP OPERATING HOURS & WEEKLY SCHEDULE             */}
      {/* ============================================================= */}
      {activeSettingsSection === 'hours' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {scheduleNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{scheduleNotice}</span>
            </div>
          )}

          {/* Master Operating Times & Quick Batch Scheduler Card */}
          <div
            className={`p-5 sm:p-6 rounded-3xl border space-y-5 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={`text-base sm:text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Shop Operating Hours & Standard Schedule
                  </h2>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Set your default daily open/close hours, customize individual days of the week, or quick-apply bulk schedules.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {workingHours.filter(d => d.isOpen).length} of 7 Days Open
                </span>
              </div>
            </div>

            {/* Quick Bulk Presets & Master Times */}
            <div
              className={`p-4 rounded-2xl border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="space-y-1">
                <span className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Standard Master Hours Template
                </span>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Set standard operating hours and apply across all active store days in 1 click.
                </p>
              </div>

              <div className="flex items-center flex-wrap gap-2.5 w-full lg:w-auto">
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-bold text-slate-500">Opens:</span>
                  <input
                    type="time"
                    value={templateOpenTime}
                    onChange={e => setTemplateOpenTime(e.target.value)}
                    className="text-xs font-black bg-transparent text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  />
                  <span className="text-[11px] font-bold text-slate-400">({format12Hour(templateOpenTime)})</span>
                </div>

                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-500">Closes:</span>
                  <input
                    type="time"
                    value={templateCloseTime}
                    onChange={e => setTemplateCloseTime(e.target.value)}
                    className="text-xs font-black bg-transparent text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  />
                  <span className="text-[11px] font-bold text-slate-400">({format12Hour(templateCloseTime)})</span>
                </div>

                <button
                  type="button"
                  id="apply-template-hours-btn"
                  onClick={handleApplyTemplateHours}
                  className="px-3.5 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply to Open Days</span>
                </button>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className={`font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Quick Schedules:</span>
              <button
                type="button"
                onClick={handleSetAllDaysOpen}
                className={`px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer ${
                  isLight ? 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
                }`}
              >
                ✨ Open All 7 Days (Mon-Sun)
              </button>
              <button
                type="button"
                onClick={handleSetStandardSalonWeek}
                className={`px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer ${
                  isLight ? 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
                }`}
              >
                🏢 Standard Week (Mon-Sat Open, Sun Closed)
              </button>
              <button
                type="button"
                onClick={handleSetWeekdaysOnly}
                className={`px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer ${
                  isLight ? 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
                }`}
              >
                💼 Weekdays Only (Mon-Fri)
              </button>
            </div>
          </div>

          {/* 7-Day Weekly Schedule Detailed List */}
          <div
            className={`p-5 sm:p-6 rounded-3xl border space-y-4 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-sky-500" />
                <h3 className={`text-sm sm:text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Weekly Day-by-Day Schedule
                </h3>
              </div>
              <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Toggle open/closed and customize hours for any day
              </span>
            </div>

            <div className="space-y-2.5">
              {workingHours.map((dayItem, index) => {
                return (
                  <div
                    key={dayItem.day}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      dayItem.isOpen
                        ? isLight
                          ? 'bg-slate-50/70 border-slate-200 hover:border-emerald-300'
                          : 'bg-slate-950/40 border-slate-800 hover:border-emerald-500/40'
                        : isLight
                        ? 'bg-rose-50/40 border-rose-200/60'
                        : 'bg-rose-950/20 border-rose-900/30'
                    }`}
                  >
                    {/* Day name & toggle */}
                    <div className="flex items-center gap-3 min-w-[170px]">
                      <button
                        type="button"
                        onClick={() => handleToggleDayOpen(index)}
                        title={dayItem.isOpen ? `Click to mark ${dayItem.day} as Closed` : `Click to mark ${dayItem.day} as Open`}
                        className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer relative shrink-0 ${
                          dayItem.isOpen ? 'bg-emerald-500' : isLight ? 'bg-slate-300' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                            dayItem.isOpen ? 'translate-x-5.5' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      <div>
                        <span className={`text-sm font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {dayItem.day}
                        </span>
                        <span
                          className={`block text-[10px] font-bold ${
                            dayItem.isOpen
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {dayItem.isOpen ? 'Open for Business' : 'Store Closed'}
                        </span>
                      </div>
                    </div>

                    {/* Time Selectors or Closed Badge */}
                    {dayItem.isOpen ? (
                      <div className="flex items-center flex-wrap gap-2.5 flex-1 justify-start md:justify-end">
                        {/* Open Time */}
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                          <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="text-[11px] font-bold text-slate-500">Opens:</span>
                          <input
                            type="time"
                            value={dayItem.open}
                            onChange={e => handleDayTimeChange(index, 'open', e.target.value)}
                            className="text-xs font-black bg-transparent text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                          />
                          <span className="text-[11px] font-bold text-slate-400 shrink-0">
                            {format12Hour(dayItem.open)}
                          </span>
                        </div>

                        <span className="text-slate-400 font-bold text-xs">to</span>

                        {/* Close Time */}
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                          <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="text-[11px] font-bold text-slate-500">Closes:</span>
                          <input
                            type="time"
                            value={dayItem.close}
                            onChange={e => handleDayTimeChange(index, 'close', e.target.value)}
                            className="text-xs font-black bg-transparent text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                          />
                          <span className="text-[11px] font-bold text-slate-400 shrink-0">
                            {format12Hour(dayItem.close)}
                          </span>
                        </div>

                        {/* Quick Copy to all days */}
                        <button
                          type="button"
                          onClick={() => handleCopyDayToAll(index)}
                          title={`Copy ${dayItem.day}'s hours to all other open days`}
                          className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            isLight
                              ? 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'
                              : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-[11px]">Copy to All</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 justify-start md:justify-end flex-1">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                          <CalendarOff className="w-3.5 h-3.5" />
                          <span>Store Closed on {dayItem.day}s</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleDayOpen(index)}
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer px-2 py-1"
                        >
                          + Mark as Open
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================= */}
          {/* SPECIAL DATES: HOLIDAY SCHEDULES & CLOSURES OVERRIDES     */}
          {/* ========================================================= */}
          <div
            className={`p-5 sm:p-6 rounded-3xl border space-y-5 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={`text-base sm:text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Special Dates & Holiday Schedule Overrides
                  </h2>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Configure specific calendar days when your shop is closed for holidays, maintenance, or operates on custom hours.
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="add-special-date-btn"
                onClick={() => handleOpenAddSpecialModal()}
                className="px-4 py-2.5 rounded-2xl text-xs font-black text-white bg-amber-600 hover:bg-amber-500 shadow-md cursor-pointer transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Special Date</span>
              </button>
            </div>

            {/* Quick Holiday Presets Row */}
            <div className="space-y-2">
              <span className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Quick Holiday Presets (1-Click Add):
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() =>
                    handleOpenAddSpecialModal({
                      title: 'Christmas Day',
                      date: '2026-12-25',
                      isOpen: false,
                      reason: 'Annual Public Holiday • Store Closed for Staff Celebration',
                    })
                  }
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isLight
                      ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                      : 'bg-rose-950/40 border-rose-800 text-rose-300 hover:bg-rose-900/50'
                  }`}
                >
                  🎄 Christmas Day (Dec 25)
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleOpenAddSpecialModal({
                      title: "New Year's Eve",
                      date: '2026-12-31',
                      isOpen: true,
                      open: '09:00',
                      close: '17:00',
                      reason: 'Special Festive Operating Hours • Early Close for NYE',
                    })
                  }
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isLight
                      ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                      : 'bg-amber-950/40 border-amber-800 text-amber-300 hover:bg-amber-900/50'
                  }`}
                >
                  🎉 New Year's Eve (Dec 31)
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleOpenAddSpecialModal({
                      title: "New Year's Day",
                      date: '2027-01-01',
                      isOpen: false,
                      reason: 'Official National Holiday • Store Closed',
                    })
                  }
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isLight
                      ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                      : 'bg-rose-950/40 border-rose-800 text-rose-300 hover:bg-rose-900/50'
                  }`}
                >
                  🎊 New Year's Day (Jan 1)
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleOpenAddSpecialModal({
                      title: 'National Holiday',
                      date: '2026-12-02',
                      isOpen: false,
                      reason: 'National Day Holiday Closure',
                    })
                  }
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isLight
                      ? 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100'
                      : 'bg-sky-950/40 border-sky-800 text-sky-300 hover:bg-sky-900/50'
                  }`}
                >
                  🇦🇪 National Day (Dec 2)
                </button>
              </div>
            </div>

            {/* Special Dates Configured List */}
            {specialSchedules.length === 0 ? (
              <div
                className={`p-8 rounded-2xl border text-center space-y-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <CalendarDays className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
                <div>
                  <h4 className={`text-sm font-black ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    No Special Date Overrides Configured
                  </h4>
                  <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Your weekly standard schedule applies to all upcoming dates. Add special holiday closures or custom hours above.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAddSpecialModal()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-500 cursor-pointer"
                >
                  + Add First Holiday Override
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {specialSchedules.map(spec => (
                  <div
                    key={spec.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      spec.isOpen
                        ? isLight
                          ? 'bg-amber-50/50 border-amber-200 shadow-xs'
                          : 'bg-amber-950/20 border-amber-800/40'
                        : isLight
                        ? 'bg-rose-50/50 border-rose-200 shadow-xs'
                        : 'bg-rose-950/20 border-rose-900/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`p-2 rounded-xl ${
                            spec.isOpen
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {spec.isOpen ? <Clock className="w-4 h-4" /> : <CalendarOff className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <h4 className={`text-sm font-black truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {spec.title}
                          </h4>
                          <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                            📅 {spec.date}
                          </span>
                        </div>
                      </div>

                      {/* Status pill */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-black shrink-0 ${
                          spec.isOpen
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {spec.isOpen
                          ? `Special: ${format12Hour(spec.open || '09:00')} - ${format12Hour(spec.close || '17:00')}`
                          : 'Closed All Day'}
                      </span>
                    </div>

                    {spec.reason && (
                      <p className={`text-xs italic ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        "{spec.reason}"
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                      <button
                        type="button"
                        onClick={() => handleToggleSpecialDateOpen(spec.id)}
                        className="font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      >
                        Toggle {spec.isOpen ? 'to Closed' : 'to Open'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditSpecialDate(spec)}
                          title="Edit Special Date"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSpecialDate(spec.id)}
                          title="Delete Special Date"
                          className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-800/60 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SECTION 3: GMAIL & APP CODE                                   */}
      {/* ============================================================= */}
      {activeSettingsSection === 'security' && (
        <div
          className={`p-5 sm:p-6 rounded-3xl border space-y-6 animate-in fade-in duration-150 ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}
        >
          {/* Header */}
          <div className="border-b pb-4 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-purple-500" />
              <h2 className={`text-base sm:text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Gmail & App Code
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                Partner Security
              </span>
            </div>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Manage your registered salon Gmail identity and the 4-digit terminal App Code used for staff stations, fast authentication, and POS terminals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Sign-up Gmail ID */}
            <div
              className={`p-5 rounded-3xl border space-y-4 flex flex-col justify-between ${
                isLight ? 'bg-slate-50/90 border-slate-200 shadow-xs' : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className={`text-xs font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        Sign-up Gmail ID
                      </h3>
                      <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Google Linked & Verified</span>
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                </div>

                <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Primary Google account linked for salon ownership, monthly statement payouts, and administrative security alerts.
                </p>

                <div className="space-y-1.5">
                  <label className={`block text-[11px] font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Registered Partner Email
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={signUpGmail}
                      onChange={e => setSignUpGmail(e.target.value)}
                      placeholder="e.g. partner@example.com"
                      className={`flex-1 border rounded-xl px-3.5 py-2.5 font-mono text-xs font-bold focus:outline-none transition-all ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-slate-500'
                          : 'bg-slate-900 border-slate-700 text-white focus:border-slate-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Protected by 256-bit encrypted authentication.</span>
              </div>
            </div>

            {/* Card 2: 4-Digit App Code with Dedicated Reset Button */}
            <div
              className={`p-5 rounded-3xl border space-y-4 flex flex-col justify-between ${
                isLight ? 'bg-slate-50/90 border-slate-200 shadow-xs' : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className={`text-xs font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        App Code: 4-Digit Security PIN
                      </h3>
                      <span className="text-[10px] text-purple-500 font-bold">
                        Staff & Terminal Quick Access
                      </span>
                    </div>
                  </div>

                  {/* Reset PIN Icon Button */}
                  <button
                    type="button"
                    id="reset-appcode-icon-btn"
                    onClick={() => {
                      setCustomResetCode('');
                      setIsResetAppCodeModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 transition-all cursor-pointer"
                    title="Reset or Generate new 4-Digit App Code"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset PIN</span>
                  </button>
                </div>

                <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Used to unlock business modes, fast-switch stylists on the shared salon tablet, and authorize discounts.
                </p>

                {/* 4-Digit PIN Visual Display */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Active 4-Digit Code
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAppCode(!showAppCode)}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      {showAppCode ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Reveal</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Digit Boxes */}
                    <div className="flex items-center gap-2 flex-1">
                      {(showAppCode ? appCode.padEnd(4, '•').split('') : ['•', '•', '•', '•']).map((digit, idx) => (
                        <div
                          key={idx}
                          className={`flex-1 h-12 rounded-2xl border flex items-center justify-center font-mono text-lg font-black ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-900 shadow-2xs'
                              : 'bg-slate-900 border-slate-700 text-purple-400 shadow-2xs'
                          }`}
                        >
                          {digit}
                        </div>
                      ))}
                    </div>

                    {/* Copy Button */}
                    <button
                      type="button"
                      id="copy-appcode-btn"
                      onClick={handleCopyAppCode}
                      className={`h-12 px-3.5 rounded-2xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                        copiedAppCode
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : isLight
                          ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                      title="Copy 4-digit code"
                    >
                      {copiedAppCode ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Default station code: 1234</span>
                <button
                  type="button"
                  onClick={() => {
                    setCustomResetCode('');
                    setIsResetAppCodeModalOpen(true);
                  }}
                  className="text-purple-500 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Change Code</span>
                </button>
              </div>
            </div>
          </div>

          {/* Owner Identity Settings */}
          <div className="border-t pt-5 border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Salon Director & Authorized Representative
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className={`block font-bold mb-1.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  Owner / Representative Full Name
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  placeholder="e.g. Marcus Vance"
                  className={`w-full border rounded-xl px-3.5 py-2.5 font-semibold focus:outline-none transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-slate-600'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  Designation / Role Title
                </label>
                <input
                  type="text"
                  value={ownerRole}
                  onChange={e => setOwnerRole(e.target.value)}
                  placeholder="e.g. Master Stylist & Salon Director"
                  className={`w-full border rounded-xl px-3.5 py-2.5 font-semibold focus:outline-none transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-slate-600'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Account Switching & Session Logout */}
          <div className="border-t pt-5 border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Account Switching & Session
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                  isLight ? 'bg-purple-50/50 border-purple-200' : 'bg-purple-950/20 border-purple-900/40'
                }`}
              >
                <div>
                  <h4 className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-purple-950' : 'text-purple-200'}`}>
                    <User className="w-4 h-4 text-purple-500" />
                    <span>Customer Booking Portal</span>
                  </h4>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-purple-700' : 'text-purple-300'}`}>
                    Switch to client view to browse salons and book appointments.
                  </p>
                </div>
                <button
                  id="biz-profile-switch-customer-btn"
                  type="button"
                  onClick={() => switchRole('customer')}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer self-start"
                >
                  Switch to Customer Portal →
                </button>
              </div>

              <div
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                  isLight ? 'bg-rose-50/50 border-rose-200' : 'bg-rose-950/20 border-rose-900/40'
                }`}
              >
                <div>
                  <h4 className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-rose-950' : 'text-rose-200'}`}>
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Business Session</span>
                  </h4>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-rose-700' : 'text-rose-300'}`}>
                    Log out of this business terminal and return to the login screen.
                  </p>
                </div>
                <button
                  id="biz-profile-logout-btn"
                  type="button"
                  onClick={() => logout()}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer self-start"
                >
                  Log Out Completely
                </button>
              </div>

              {/* Delete Business Account (Supabase Database Deletion) */}
              <div
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                  isLight ? 'bg-red-50/50 border-red-200' : 'bg-red-950/20 border-red-900/40'
                }`}
              >
                <div>
                  <h4 className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-red-950' : 'text-red-200'}`}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <span>Delete Business Account</span>
                  </h4>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-red-700' : 'text-red-300'}`}>
                    Permanently delete salon profile, staff, services, and records from Supabase database.
                  </p>
                </div>
                <button
                  id="biz-profile-delete-account-btn"
                  type="button"
                  onClick={() => setDeleteBizAccountModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer self-start flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SECTION 3: DOCUMENTS VERIFIED & LICENSING                     */}
      {/* ============================================================= */}
      {activeSettingsSection === 'documents' && (
        <div
          className={`p-5 sm:p-6 rounded-3xl border space-y-6 animate-in fade-in duration-150 ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}
        >
          {/* Header & Verification Tier Status */}
          <div className="border-b pb-4 border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-500" />
                <h2 className={`text-base sm:text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Documents Verified & Licensing
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  <span>Gold Compliance Tier</span>
                </span>
              </div>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Commercial trade license, municipal health permits, public liability insurance & TRN tax verification.
              </p>
            </div>

            <button
              type="button"
              id="upload-new-document-btn"
              onClick={() => setIsAddDocModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl text-xs font-black text-white bg-sky-600 hover:bg-sky-500 shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>

          {/* Status Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div
              className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                isLight ? 'bg-emerald-50/60 border-emerald-200' : 'bg-emerald-950/20 border-emerald-900'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-600 dark:text-emerald-400 block">
                  Verification Status
                </span>
                <span className={`font-black text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  100% Fully Verified
                </span>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                isLight ? 'bg-sky-50/60 border-sky-200' : 'bg-sky-950/20 border-sky-900'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-500 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-sky-600 dark:text-sky-400 block">
                  Active Certificates
                </span>
                <span className={`font-black text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {documents.length} Legal Records
                </span>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                isLight ? 'bg-purple-50/60 border-purple-200' : 'bg-purple-950/20 border-purple-900'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-500 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-purple-600 dark:text-purple-400 block">
                  Tax TRN Number
                </span>
                <span className="font-mono font-bold text-xs text-purple-600 dark:text-purple-400">
                  {salon.trnNumber || '100492817200003'}
                </span>
              </div>
            </div>
          </div>

          {/* Document Records List */}
          <div className="space-y-3">
            <h3 className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Verified Licensing Documents List
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isLight ? 'bg-slate-50/80 border-slate-200 hover:border-slate-300' : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-500 border border-sky-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-sm font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {doc.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" />
                          <span>Verified</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          #{doc.documentNumber}
                        </span>
                        <span>•</span>
                        <span>{doc.issuingAuthority}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Expires: {doc.expiryDate}</span>
                        </span>
                      </div>

                      {doc.fileName && (
                        <p className="text-[11px] font-mono text-slate-400">
                          File: {doc.fileName} {doc.fileSize ? `(${doc.fileSize})` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedDocPreview(doc)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isLight
                          ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5 text-sky-500" />
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        alert(`Downloading verified copy of ${doc.name} (${doc.fileName || 'document.pdf'})...`);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isLight
                          ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Download</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SECTION 4: COMPLIMENTARY GUEST AMENITIES                      */}
      {/* ============================================================= */}
      {activeSettingsSection === 'amenities' && (
        <div
          className={`p-5 sm:p-6 rounded-3xl border space-y-6 animate-in fade-in duration-150 ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}
        >
          {/* Header */}
          <div className="border-b pb-4 border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-emerald-500" />
                <h2 className={`text-base sm:text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Complimentary Guest Amenities
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {amenitiesList.length} Active Perks
                </span>
              </div>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Highlight the hospitality, comfort, and complimentary services your salon offers to attract more clients.
              </p>
            </div>

            {/* Quick Live Preview Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live Preview:</span>
              {amenitiesList.slice(0, 3).map((a, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1"
                >
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span>{a}</span>
                </span>
              ))}
              {amenitiesList.length > 3 && (
                <span className="text-[10px] font-extrabold text-slate-400">
                  +{amenitiesList.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Amenity Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {['All', 'Connectivity', 'Refreshments', 'Comfort', 'Convenience', 'Premium', 'Accessibility'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setAmenityFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  amenityFilterCategory === cat
                    ? isLight
                      ? 'bg-slate-900 text-white shadow-xs font-black'
                      : 'bg-white text-slate-950 shadow-xs font-black'
                    : isLight
                    ? 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Amenities Grid Catalog with Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {POPULAR_AMENITIES.filter(
              item => amenityFilterCategory === 'All' || item.category === amenityFilterCategory
            ).map(item => {
              const isEnabled = amenitiesList.includes(item.name);
              const ItemIcon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleAmenity(item.name)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isEnabled
                      ? isLight
                        ? 'bg-emerald-50/70 border-emerald-300/80 shadow-xs ring-1 ring-emerald-400/20'
                        : 'bg-emerald-950/20 border-emerald-500/40 shadow-xs ring-1 ring-emerald-500/20'
                      : isLight
                      ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                        isEnabled
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : isLight
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <ItemIcon className="w-5 h-5" />
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className={`text-xs font-black truncate ${
                            isEnabled
                              ? isLight
                                ? 'text-slate-900'
                                : 'text-white'
                              : isLight
                              ? 'text-slate-700'
                              : 'text-slate-300'
                          }`}
                        >
                          {item.name}
                        </h4>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                            isLight ? 'bg-slate-200 text-slate-600' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>
                      <p className={`text-[11px] line-clamp-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div className="shrink-0 pt-0.5">
                    <div
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                        isEnabled ? 'bg-emerald-500' : isLight ? 'bg-slate-300' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Custom Amenity Card */}
          <div
            className={`p-4 rounded-2xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <h4 className={`text-xs font-black mb-1.5 flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <Plus className="w-4 h-4 text-emerald-500" />
              <span>Add Custom Specialty Amenity</span>
            </h4>
            <p className={`text-[11px] mb-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Offer something unique? Add custom perks like "Arabic Bakhoor Fragrance Bar", "Foot Massage Station", or "Bridal Changing Room".
            </p>

            <form onSubmit={handleAddCustomAmenity} className="flex gap-2">
              <input
                type="text"
                value={newCustomAmenity}
                onChange={e => setNewCustomAmenity(e.target.value)}
                placeholder="e.g. Complimentary Moroccan Mint Tea & Dates"
                className={`flex-1 border rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none transition-all ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-slate-500'
                    : 'bg-slate-900 border-slate-800 text-white focus:border-slate-600'
                }`}
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Amenity</span>
              </button>
            </form>

            {/* Custom Amenities Tag Cloud */}
            {amenitiesList.filter(a => !POPULAR_AMENITIES.some(p => p.name === a)).length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Custom Defined Amenities:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {amenitiesList
                    .filter(a => !POPULAR_AMENITIES.some(p => p.name === a))
                    .map((customName, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>{customName}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAmenity(customName)}
                          className="p-0.5 hover:text-rose-500 cursor-pointer"
                          title="Remove amenity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: AI BANNER PRESETS PICKER MODAL                         */}
      {/* ============================================================= */}
      {showAiBannerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div
            className={`w-full max-w-2xl rounded-3xl border p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black">Add Small AI Image Preset</h3>
                  <p className="text-xs text-slate-400">Select a curated high-resolution AI Studio salon storefront banner</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiBannerModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {AI_BANNER_PRESETS.map(preset => (
                <div
                  key={preset.id}
                  onClick={() => handleSelectAiBanner(preset.url, preset.name)}
                  className={`rounded-2xl border overflow-hidden cursor-pointer group transition-all hover:scale-[1.02] ${
                    image === preset.url
                      ? 'border-amber-500 ring-2 ring-amber-500/40 shadow-lg'
                      : isLight
                      ? 'border-slate-200 hover:border-slate-400'
                      : 'border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-950">
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-black/70 text-amber-400 backdrop-blur-md">
                      {preset.category}
                    </div>
                    {image === preset.url && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <h4 className="text-xs font-black">{preset.name}</h4>
                    <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1">
                      <span>Apply</span>
                      <Check className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAiBannerModal(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                  isLight ? 'border-slate-200 text-slate-700 hover:bg-slate-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: RESET 4-DIGIT APP CODE MODAL                           */}
      {/* ============================================================= */}
      {isResetAppCodeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-3xl border p-6 space-y-5 shadow-2xl animate-in zoom-in-95 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black">Reset 4-Digit App Code</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsResetAppCodeModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Choose to instantly generate a fresh random 4-digit PIN or enter your preferred 4-digit security code.
            </p>

            {/* Quick Random Generation */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                isLight ? 'bg-purple-50/60 border-purple-200' : 'bg-purple-950/20 border-purple-900'
              }`}
            >
              <div>
                <span className="text-xs font-black text-purple-600 dark:text-purple-400 block">
                  Quick Automatic Reset
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Instantly creates a random secure 4-digit code.
                </span>
              </div>

              <button
                type="button"
                onClick={handleGenerateRandomAppCode}
                className="px-3.5 py-2 rounded-xl text-xs font-black text-white bg-purple-600 hover:bg-purple-500 shadow-md cursor-pointer transition-all shrink-0"
              >
                Generate Random PIN
              </button>
            </div>

            {/* Custom 4-digit Input Form */}
            <form onSubmit={handleSaveCustomAppCode} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  Or Set Custom 4-Digit PIN
                </label>
                <input
                  type="text"
                  maxLength={4}
                  pattern="\d{4}"
                  required
                  value={customResetCode}
                  onChange={e => setCustomResetCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 5821"
                  className={`w-full border rounded-xl px-4 py-3 font-mono text-center text-lg font-black tracking-widest focus:outline-none transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-purple-500'
                      : 'bg-slate-950 border-slate-800 text-purple-400 focus:border-purple-500'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResetAppCodeModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                    isLight ? 'border-slate-200 text-slate-700 hover:bg-slate-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={customResetCode.length !== 4}
                  className="px-5 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer transition-all"
                >
                  Save App Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: UPLOAD / ADD NEW DOCUMENT MODAL                        */}
      {/* ============================================================= */}
      {isAddDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-3xl border p-6 space-y-5 shadow-2xl animate-in zoom-in-95 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-500 flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black">Upload Legal Business Document</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDocModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="space-y-4 text-xs">
              <div>
                <label className={`block font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={newDocForm.name}
                  onChange={e => setNewDocForm({ ...newDocForm, name: e.target.value })}
                  placeholder="e.g. Municipality Health & Sanitation License"
                  className={`w-full border rounded-xl px-3.5 py-2.5 font-semibold focus:outline-none transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-sky-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    Document Category
                  </label>
                  <select
                    value={newDocForm.type}
                    onChange={e => setNewDocForm({ ...newDocForm, type: e.target.value as any })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 font-semibold focus:outline-none transition-all cursor-pointer ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  >
                    <option value="trade_license">Commercial Trade License</option>
                    <option value="health_sanitation">Health & Sanitation Permit</option>
                    <option value="liability_insurance">Liability & Insurance Policy</option>
                    <option value="tax_certificate">Tax TRN Certificate</option>
                    <option value="other">Other Official Permit</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    License / Document Number
                  </label>
                  <input
                    type="text"
                    required
                    value={newDocForm.documentNumber}
                    onChange={e => setNewDocForm({ ...newDocForm, documentNumber: e.target.value })}
                    placeholder="e.g. CN-9948201"
                    className={`w-full border rounded-xl px-3.5 py-2.5 font-mono font-bold focus:outline-none transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-sky-500'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    Issuing Authority / Agency
                  </label>
                  <input
                    type="text"
                    value={newDocForm.issuingAuthority}
                    onChange={e => setNewDocForm({ ...newDocForm, issuingAuthority: e.target.value })}
                    placeholder="e.g. Dubai Economy & Tourism (DED)"
                    className={`w-full border rounded-xl px-3.5 py-2.5 font-semibold focus:outline-none transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-sky-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={newDocForm.expiryDate}
                    onChange={e => setNewDocForm({ ...newDocForm, expiryDate: e.target.value })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 font-semibold focus:outline-none transition-all cursor-pointer ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-sky-500'
                    }`}
                  />
                </div>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className={`block font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  Attachment File (PDF, JPG, PNG)
                </label>
                <div
                  onClick={() => docFileInputRef.current?.click()}
                  className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 hover:border-sky-500'
                      : 'bg-slate-950 border-slate-700 hover:border-sky-500'
                  }`}
                >
                  <UploadCloud className="w-6 h-6 text-sky-500 mb-1" />
                  <span className="text-xs font-bold">
                    {newDocForm.fileName ? newDocForm.fileName : 'Click or Drag & Drop Document Scan'}
                  </span>
                  <span className="text-[10px] text-slate-400">PDF, JPG up to 10MB</span>
                </div>

                <input
                  ref={docFileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) setNewDocForm({ ...newDocForm, fileName: f.name });
                  }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddDocModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                    isLight ? 'border-slate-200 text-slate-700 hover:bg-slate-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black text-white bg-sky-600 hover:bg-sky-500 shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Save & Verify Document</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: DOCUMENT VIEW PREVIEW MODAL                            */}
      {/* ============================================================= */}
      {selectedDocPreview && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-3xl border p-6 space-y-4 shadow-2xl animate-in zoom-in-95 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-500" />
                <h3 className="text-base font-black">{selectedDocPreview.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDocPreview(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Digital Certificate Mock */}
            <div className="p-4 rounded-2xl border border-sky-500/30 bg-sky-500/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-sky-600 dark:text-sky-400">
                  Official Verification Record
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" />
                  <span>VERIFIED</span>
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between py-1 border-b border-sky-500/20">
                  <span className="text-slate-400 font-medium">License / Number:</span>
                  <span className="font-mono font-bold">{selectedDocPreview.documentNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-sky-500/20">
                  <span className="text-slate-400 font-medium">Issuing Authority:</span>
                  <span className="font-bold">{selectedDocPreview.issuingAuthority}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-sky-500/20">
                  <span className="text-slate-400 font-medium">Issued Date:</span>
                  <span>{selectedDocPreview.issueDate}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-medium">Valid Until:</span>
                  <span className="font-bold text-emerald-500">{selectedDocPreview.expiryDate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedDocPreview(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                  isLight ? 'border-slate-200 text-slate-700 hover:bg-slate-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Downloading ${selectedDocPreview.name}...`);
                  setSelectedDocPreview(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-md cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: ADD / EDIT SPECIAL DATE SCHEDULE OVERRIDE             */}
      {/* ============================================================= */}
      {isAddSpecialModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-3xl border p-6 space-y-5 shadow-2xl animate-in zoom-in-95 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black">
                  {editingSpecialId ? 'Edit Special Date Schedule' : 'Add Special Date Override'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSpecialModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSpecialDateModal} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    Calendar Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={specialDateInput}
                    onChange={e => setSpecialDateInput(e.target.value)}
                    className={`w-full border rounded-xl px-3.5 py-2.5 font-semibold focus:outline-none transition-all cursor-pointer ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    Occasion / Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={specialTitleInput}
                    onChange={e => setSpecialTitleInput(e.target.value)}
                    placeholder="e.g. Christmas Day, VIP Night"
                    className={`w-full border rounded-xl px-3.5 py-2.5 font-semibold focus:outline-none transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                    }`}
                  />
                </div>
              </div>

              {/* Schedule Type Selection: Closed vs Special Open Hours */}
              <div className="space-y-2">
                <label className={`block font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  Store Status for this Date
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSpecialIsOpenInput(false)}
                    className={`py-2.5 px-3 rounded-xl font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      !specialIsOpenInput
                        ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                        : isLight
                        ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <CalendarOff className="w-3.5 h-3.5" />
                    <span>Store Closed All Day</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSpecialIsOpenInput(true)}
                    className={`py-2.5 px-3 rounded-xl font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      specialIsOpenInput
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : isLight
                        ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Open with Special Hours</span>
                  </button>
                </div>
              </div>

              {/* Custom Hours inputs if Open */}
              {specialIsOpenInput && (
                <div
                  className={`p-3.5 rounded-2xl border space-y-2.5 animate-in fade-in ${
                    isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-amber-950/20 border-amber-800/40'
                  }`}
                >
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                    Set Custom Operating Hours for this Event:
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Opens at: ({format12Hour(specialOpenInput)})
                      </label>
                      <input
                        type="time"
                        value={specialOpenInput}
                        onChange={e => setSpecialOpenInput(e.target.value)}
                        className={`w-full border rounded-xl px-3 py-2 font-bold focus:outline-none ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Closes at: ({format12Hour(specialCloseInput)})
                      </label>
                      <input
                        type="time"
                        value={specialCloseInput}
                        onChange={e => setSpecialCloseInput(e.target.value)}
                        className={`w-full border rounded-xl px-3 py-2 font-bold focus:outline-none ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Reason / Customer Note */}
              <div>
                <label className={`block font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  Reason / Public Note for Customers (Optional)
                </label>
                <input
                  type="text"
                  value={specialReasonInput}
                  onChange={e => setSpecialReasonInput(e.target.value)}
                  placeholder="e.g. Annual Public Holiday • Closed for Staff Celebration"
                  className={`w-full border rounded-xl px-3.5 py-2.5 font-semibold focus:outline-none transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddSpecialModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                    isLight ? 'border-slate-200 text-slate-700 hover:bg-slate-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black text-white bg-amber-600 hover:bg-amber-500 shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingSpecialId ? 'Update Override' : 'Save Special Date'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SMART FLOATING EASY-ACCESS SAVE BUTTON (BOTTOM RIGHT UI/UX)  */}
      {/* ============================================================= */}
      <div className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-50 flex items-center gap-2.5 group">
        {savedSuccess && (
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-emerald-500 text-white font-black text-xs shadow-2xl animate-in fade-in slide-in-from-right-4 duration-200 border border-emerald-400">
            <CheckCircle2 className="w-4.5 h-4.5 text-white shrink-0" />
            <span>Settings Saved!</span>
          </div>
        )}

        <button
          id="save-business-settings-btn"
          type="button"
          onClick={() => handleSave()}
          aria-label="Save Settings Changes"
          className={`px-5 py-3.5 sm:px-6 sm:py-4 rounded-2xl sm:rounded-3xl font-black text-xs sm:text-sm text-white shadow-2xl transition-all duration-300 flex items-center justify-center gap-2.5 hover:scale-105 active:scale-95 cursor-pointer border border-white/20 backdrop-blur-md relative ${
            savedSuccess ? 'bg-emerald-600 border-emerald-400 ring-4 ring-emerald-500/30' : ''
          }`}
          style={{
            backgroundColor: savedSuccess ? '#10b981' : currentThemeConfig.primaryHex,
            boxShadow: savedSuccess
              ? '0 12px 35px rgba(16, 185, 129, 0.45)'
              : `0 12px 35px ${currentThemeConfig.glowHex}`,
          }}
          title="Smart Easy-Access Save • Save all settings changes"
        >
          <div className="relative flex items-center justify-center">
            {savedSuccess ? (
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-in zoom-in-75 duration-200" />
            ) : (
              <Save className="w-5 h-5 sm:w-6 sm:h-6 text-white transition-transform duration-200 group-hover:rotate-6" />
            )}
            {!savedSuccess && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-slate-900 animate-ping" />
            )}
          </div>

          <span className="tracking-wide">
            {savedSuccess ? 'Saved!' : 'Save Changes'}
          </span>

          <span className="hidden md:inline-flex px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider font-extrabold bg-white/20 text-white border border-white/10">
            Save
          </span>
        </button>
      </div>

      {/* Delete Business Account Confirmation Modal */}
      {deleteBizAccountModalOpen && (
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
                Delete Business Account?
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                This action will <span className="font-bold text-red-600">permanently delete</span> your business profile, salon details, staff profiles, services, and all associated records from the Supabase database. This cannot be undone.
              </p>
            </div>

            <div
              className={`p-3 rounded-2xl border text-xs space-y-1 ${
                isLight ? 'bg-red-50 border-red-200 text-red-800' : 'bg-red-950/40 border-red-900/60 text-red-300'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>Supabase Database Deletion</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Business / Salon: <span className="font-mono font-bold">{salon?.name || businessUser.businessName || businessUser.email}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteBizAccountModalOpen(false)}
                disabled={isDeletingBizAccount}
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
                id="confirm-delete-biz-account-btn"
                onClick={handleConfirmDeleteBizAccount}
                disabled={isDeletingBizAccount}
                className="flex-1 py-3 rounded-2xl font-black text-xs bg-red-600 hover:bg-red-700 text-white shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeletingBizAccount ? (
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

      <LocaleRegionSwitcherModal isOpen={isLocaleModalOpen} onClose={() => setIsLocaleModalOpen(false)} />
    </div>
  );
};
