import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Salon, ServiceItem, StaffMember } from '../../types';
import { StaffAvatar } from '../common/StaffAvatar';
import { ServiceBannerCard } from '../common/ServiceBannerCard';
import { CallContactModal } from '../common/CallContactModal';
import { getSalonMapUrl, getCleanPhoneNumber, computeSalonLiveStatus, format12Hour } from '../../utils/salonUtils';
import {
  X,
  Star,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  Calendar,
  Heart,
  ShieldCheck,
  Navigation,
  ExternalLink,
  PhoneCall,
  Copy,
  Check,
  MessageCircle,
} from 'lucide-react';

interface SalonDetailModalProps {
  salon: Salon | null;
  onClose: () => void;
}

export const SalonDetailModal: React.FC<SalonDetailModalProps> = ({ salon, onClose }) => {
  const {
    services,
    staffMembers,
    reviews,
    customerUser,
    toggleFavoriteSalon,
    setPreselectedSalon,
    setPreselectedService,
    setPreselectedStaff,
    setBookingModalOpen,
    currentThemeConfig,
    colorThemeMode,
  } = useApp();

  const isLight = colorThemeMode === 'light';
  const [activeTab, setActiveTab] = useState<'services' | 'staff' | 'reviews' | 'hours'>('services');
  const [selectedServiceCat, setSelectedServiceCat] = useState('All');
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);

  if (!salon) return null;

  const isSaved = customerUser.savedSalonIds.includes(salon.id);
  const liveStatus = computeSalonLiveStatus(salon.workingHours, salon.specialSchedules, salon.isOpenNow);
  const salonServices = services.filter(s => s.salonId === salon.id);
  const salonStaff = staffMembers.filter(st => st.salonId === salon.id);
  const salonReviews = reviews.filter(r => r.salonId === salon.id);
  const mapUrl = getSalonMapUrl(salon);
  const cleanPhone = getCleanPhoneNumber(salon.phone);

  const filteredServices = salonServices.filter(
    s => selectedServiceCat === 'All' || s.category === selectedServiceCat
  );

  const handleOpenMap = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    window.open(mapUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyPhone = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(salon.phone);
    setPhoneCopied(true);
    setTimeout(() => setPhoneCopied(false), 2200);
  };

  const handleDirectCall = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    window.location.href = `tel:${cleanPhone}`;
  };

  const handleWhatsApp = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const message = encodeURIComponent(
      `Hello ${salon.name}, I found your salon on ALGO SALON and would like to inquire about appointments.`
    );
    const waPhone = cleanPhone.replace('+', '');
    window.open(`https://wa.me/${waPhone}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  const handleBookService = (service: ServiceItem) => {
    setPreselectedSalon(salon);
    setPreselectedService(service);
    setPreselectedStaff(null);
    setBookingModalOpen(true);
    onClose();
  };

  const handleGeneralBook = () => {
    setPreselectedSalon(salon);
    setPreselectedService(null);
    setPreselectedStaff(null);
    setBookingModalOpen(true);
    onClose();
  };

  const handleBookStaff = (staff: StaffMember) => {
    setPreselectedSalon(salon);
    setPreselectedStaff(staff);
    setPreselectedService(null);
    setBookingModalOpen(true);
    onClose();
  };

  return (
    <div
      id="salon-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="salon-detail-modal"
        className={`relative w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col transition-colors animate-in zoom-in-95 duration-200 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
        style={{
          boxShadow: `0 20px 50px -10px ${currentThemeConfig.glowHex}`,
        }}
      >
        <div className="relative h-52 sm:h-64 w-full shrink-0">
          <img
            src={salon.coverImage || salon.image}
            alt={salon.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30" />

          <div className="absolute top-3.5 left-3.5 right-3.5 sm:top-4 sm:left-4 sm:right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span
                className="px-3 py-1 rounded-full text-white font-extrabold text-xs shadow-md"
                style={{
                  backgroundColor: currentThemeConfig.primaryHex,
                  boxShadow: `0 4px 12px ${currentThemeConfig.glowHex}`,
                }}
              >
                ★ ALGO Partner
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${liveStatus.badgeClass || (
                  liveStatus.isOpen
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300'
                )}`}
              >
                {liveStatus.badgeLabel || (liveStatus.isOpen ? 'Open Now' : 'Closed')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleFavoriteSalon(salon.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md transition-all shadow-md active:scale-95 cursor-pointer border border-white/15 ${
                  isSaved
                    ? 'bg-rose-600/90 text-white shadow-rose-600/40'
                    : 'bg-black/60 text-white hover:bg-black/80'
                }`}
                title={isSaved ? 'Remove from Saved' : 'Save to Favorites'}
              >
                <Heart className={`w-3.5 h-3.5 text-rose-400 ${isSaved ? 'fill-white text-white' : 'fill-rose-400'}`} />
                <span className="text-xs font-bold leading-none">{salon.likesCount || 128}</span>
              </button>

              <button
                id="close-salon-detail-btn"
                type="button"
                onClick={onClose}
                className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition-colors shadow-md border border-white/15 cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          <div className="absolute bottom-3.5 left-4 right-4 sm:bottom-4 sm:left-5 sm:right-5 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold mb-1 flex-wrap">
                <span className="flex items-center gap-1 bg-black/80 px-2.5 py-1 rounded-xl backdrop-blur-md text-amber-400 border border-white/15 shadow-sm">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{salon.rating ? salon.rating.toFixed(1) : '4.8'} ({salon.reviewCount || 142})</span>
                </span>
                <span
                  className="bg-black/80 px-2.5 py-1 rounded-xl backdrop-blur-md text-slate-200 border border-white/15 shadow-sm"
                >
                  {salon.categories?.[0] || 'Salon'} • {salon.distanceKm || 0.8} km away
                </span>
                <span
                  className="bg-black/80 px-2.5 py-1 rounded-xl backdrop-blur-md text-white font-extrabold border border-white/15 shadow-sm"
                >
                  From ${salon.startingPrice || 32}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white font-['Outfit',sans-serif]">
                {salon.name}
              </h2>
              <p className="text-xs sm:text-sm font-medium text-slate-200 mt-0.5 line-clamp-1">
                {salon.tagline}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                id="modal-header-map-btn"
                onClick={handleOpenMap}
                className="px-3 py-1.5 rounded-xl bg-black/80 hover:bg-slate-900 border border-rose-500/40 text-white font-bold text-xs backdrop-blur-md transition-all flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                title="Open Directions in Google Maps"
              >
                <Navigation className="w-3.5 h-3.5 text-rose-400" />
                <span>Map</span>
              </button>

              <button
                type="button"
                id="modal-header-call-btn"
                onClick={() => setIsCallModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-black/80 hover:bg-slate-900 border border-emerald-500/40 text-white font-bold text-xs backdrop-blur-md transition-all flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                title="Call or Message Salon"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Call</span>
              </button>
            </div>
          </div>
        </div>

        <div
          className={`px-5 pt-3 border-b shrink-0 flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs font-bold ${
            isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'services'
                ? isLight ? 'text-slate-900 font-extrabold' : 'text-white font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
            style={{
              borderColor: activeTab === 'services' ? currentThemeConfig.primaryHex : 'transparent',
            }}
          >
            Services ({salonServices.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'staff'
                ? isLight ? 'text-slate-900 font-extrabold' : 'text-white font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
            style={{
              borderColor: activeTab === 'staff' ? currentThemeConfig.primaryHex : 'transparent',
            }}
          >
            Stylists & Staff ({salonStaff.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'reviews'
                ? isLight ? 'text-slate-900 font-extrabold' : 'text-white font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
            style={{
              borderColor: activeTab === 'reviews' ? currentThemeConfig.primaryHex : 'transparent',
            }}
          >
            Reviews ({salonReviews.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hours')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'hours'
                ? isLight ? 'text-slate-900 font-extrabold' : 'text-white font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
            style={{
              borderColor: activeTab === 'hours' ? currentThemeConfig.primaryHex : 'transparent',
            }}
          >
            Location & Hours
          </button>
        </div>

        <div className={`p-5 overflow-y-auto flex-1 space-y-5 custom-scrollbar ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
          {activeTab === 'services' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {['All', 'Haircut', 'Styling', 'Coloring', 'Beard & Shave', 'Spa & Facial', 'Nails & Lashes'].map(
                  cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedServiceCat(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                        selectedServiceCat === cat
                          ? 'text-white shadow-sm'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                      }`}
                      style={{
                        backgroundColor: selectedServiceCat === cat ? currentThemeConfig.primaryHex : undefined,
                        borderColor: selectedServiceCat === cat ? currentThemeConfig.primaryHex : undefined,
                      }}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredServices.map(service => (
                  <ServiceBannerCard
                    key={service.id}
                    service={service}
                    variant="customer"
                    showCurrency="AED"
                    onBook={handleBookService}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {salonStaff.map(staff => (
                <div
                  key={staff.id}
                  onClick={() => handleBookStaff(staff)}
                  className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer hover:scale-[1.01] hover:shadow-md group ${
                    isLight
                      ? 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <StaffAvatar
                    name={staff.name}
                    avatar={staff.avatar}
                    gender={staff.gender}
                    size="md"
                    className="shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>{staff.name}</h4>
                      <span className="flex items-center gap-0.5 text-xs text-amber-500 font-bold">
                        ★{staff.rating}
                      </span>
                    </div>
                    <p
                      className="text-xs font-bold"
                      style={{ color: currentThemeConfig.primaryHex }}
                    >
                      {staff.roleTitle}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {staff.specialties.map(spec => (
                        <span
                          key={spec}
                          className={`text-[10px] px-2 py-0.5 rounded-md border ${
                            isLight
                              ? 'bg-white border-slate-200 text-slate-700'
                              : 'bg-slate-900 border-slate-800 text-slate-300'
                          }`}
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                    <div className="pt-2 flex justify-end">
                      <span
                        className="text-[11px] font-extrabold flex items-center gap-1 group-hover:underline"
                        style={{ color: currentThemeConfig.primaryHex }}
                      >
                        Book Appointment →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-3xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{salon.rating}</span>
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(salon.rating)
                              ? 'fill-amber-400 text-amber-400'
                              : isLight
                              ? 'text-slate-300'
                              : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Based on {salon.reviewCount} verified client ratings
                  </p>
                </div>
                <div className="text-right text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  100% Verified Visits
                </div>
              </div>

              <div className="space-y-3">
                {salonReviews.map(rev => (
                  <div
                    key={rev.id}
                    className={`p-4 rounded-2xl border space-y-2 ${
                      isLight ? 'bg-slate-50/60 border-slate-200' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={rev.customerAvatar}
                          alt={rev.customerName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <h5 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{rev.customerName}</h5>
                          <div className="flex items-center gap-0.5 text-[10px] text-amber-400">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-400" />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">{rev.date}</span>
                    </div>

                    {rev.serviceName && (
                      <p
                        className="text-[11px] font-bold"
                        style={{ color: currentThemeConfig.primaryHex }}
                      >
                        Service: {rev.serviceName} {rev.staffName ? `with ${rev.staffName}` : ''}
                      </p>
                    )}

                    <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{rev.comment}</p>

                    {rev.businessReply && (
                      <div
                        className={`mt-2 p-2.5 rounded-xl border text-xs space-y-0.5 ${
                          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                        }`}
                        style={{ borderColor: `${currentThemeConfig.primaryHex}30` }}
                      >
                        <p
                          className="text-[11px] font-bold flex items-center gap-1"
                          style={{ color: currentThemeConfig.primaryHex }}
                        >
                          <span>Response from Salon Manager</span>
                          <span className="text-slate-400">• {rev.businessReply.date}</span>
                        </p>
                        <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{rev.businessReply.message}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'hours' && (
            <div className="space-y-4 text-xs">
              <div
                className={`p-4 rounded-2xl border space-y-3.5 ${
                  isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Salon Location & Direct Contact
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">{salon.distanceKm} km away</span>
                </div>

                <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="flex items-start gap-2.5 min-w-0">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Salon Address</span>
                      <p className={`font-medium text-xs truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {salon.address}, {salon.city}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    id="modal-hours-map-btn"
                    onClick={handleOpenMap}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-500/30 transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
                    title="Open in Google Maps"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Get Directions</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </button>
                </div>

                <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="p-1.5 rounded-lg text-white shrink-0"
                      style={{ backgroundColor: currentThemeConfig.primaryHex }}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Phone & WhatsApp</span>
                      <p className={`font-black font-mono text-xs ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {salon.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    <button
                      type="button"
                      id="modal-hours-copy-btn"
                      onClick={handleCopyPhone}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${
                        phoneCopied
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : isLight
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                          : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                      }`}
                    >
                      {phoneCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{phoneCopied ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <button
                      type="button"
                      id="modal-hours-whatsapp-btn"
                      onClick={handleWhatsApp}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      id="modal-hours-call-btn"
                      onClick={handleDirectCall}
                      className="px-3 py-1.5 rounded-lg text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 active:scale-95"
                      style={{ backgroundColor: currentThemeConfig.primaryHex }}
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>Call Now</span>
                    </button>
                  </div>
                </div>
              </div>

              {salon.description && (
                <div
                  className={`p-4 rounded-2xl border space-y-1.5 ${
                    isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <h4 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    About {salon.name}
                  </h4>
                  <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {salon.description}
                  </p>
                </div>
              )}

              <div
                className={`p-4 rounded-2xl border space-y-2 ${
                  isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Weekly Working Hours</h4>
                  <span className="text-[11px] font-semibold text-emerald-500">{liveStatus.statusText}</span>
                </div>
                <div className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
                  {salon.workingHours.map(wh => (
                    <div key={wh.day} className="py-1.5 flex items-center justify-between">
                      <span className={`font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{wh.day}</span>
                      <span
                        className={
                          wh.isOpen
                            ? isLight
                              ? 'text-slate-900 font-mono font-bold text-xs'
                              : 'text-slate-200 font-mono text-xs'
                            : 'text-rose-500 font-medium text-xs'
                        }
                      >
                        {wh.isOpen ? `${format12Hour(wh.open)} - ${format12Hour(wh.close)}` : 'Closed'}
                      </span>
                    </div>
                  ))}
                </div>

                {salon.specialSchedules && salon.specialSchedules.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                    <h5 className={`font-bold text-xs ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Special Dates & Holiday Hours</h5>
                    {salon.specialSchedules.map(sp => (
                      <div key={sp.id} className="flex items-center justify-between text-xs py-1">
                        <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                          {sp.date} ({sp.title})
                        </span>
                        <span className={sp.isOpen ? 'text-emerald-500 font-mono font-bold' : 'text-rose-500 font-medium'}>
                          {sp.isOpen ? `${format12Hour(sp.open || '')} - ${format12Hour(sp.close || '')}` : 'Store Closed'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div
                className={`p-4 rounded-2xl border space-y-2 ${
                  isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <h4 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Amenities & Features</h4>
                <div className="flex flex-wrap gap-2">
                  {salon.amenities.map(a => (
                    <span
                      key={a}
                      className={`px-3 py-1 rounded-xl border flex items-center gap-1.5 font-medium ${
                        isLight
                          ? 'bg-white border-slate-200 text-slate-700'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      <CheckCircle2
                        className="w-3.5 h-3.5"
                        style={{ color: currentThemeConfig.primaryHex }}
                      />
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className={`p-4 border-t shrink-0 flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <div>
            <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Pricing starts from</span>
            <span className={`text-lg font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
              ${salonServices[0]?.price || 35} - ${Math.max(...salonServices.map(s => s.price), 90)}
            </span>
          </div>

          <button
            id="book-from-salon-detail-modal"
            type="button"
            onClick={handleGeneralBook}
            className="px-6 py-2.5 rounded-2xl text-white font-extrabold text-xs shadow-lg transition-all flex items-center gap-2 active:scale-95"
            style={{
              backgroundColor: currentThemeConfig.primaryHex,
              boxShadow: `0 4px 16px ${currentThemeConfig.glowHex}`,
            }}
          >
            <Calendar className="w-4 h-4" />
            <span>Select Date & Time</span>
          </button>
        </div>
      </div>

      <CallContactModal
        salon={salon}
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
      />
    </div>
  );
};
