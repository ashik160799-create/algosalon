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
  const liveStatus = computeSalonLiveStatus(salon.workingHours, salon.specialSchedules, salon.isOpenNow, salon);
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

  const serviceCategories = ['All', ...Array.from(new Set(salonServices.map(s => s.category)))];

  return (
    <div
      id="salon-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/70 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="salon-detail-modal-container"
        onClick={e => e.stopPropagation()}
        className={`relative w-full max-w-4xl max-h-[92vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-slideUp ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        {/* Header Hero Image & Actions */}
        <div className="relative h-60 sm:h-72 md:h-80 w-full shrink-0 overflow-hidden">
          <img
            src={salon.image}
            alt={salon.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-black/30" />

          {/* Top Bar Actions */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            {/* Live Open / Closed Badge */}
            <div
              className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border shadow-md flex items-center gap-2 pointer-events-auto ${
                liveStatus.isOpen
                  ? 'bg-emerald-500/90 text-white border-emerald-400/50'
                  : 'bg-rose-500/90 text-white border-rose-400/50'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  liveStatus.isOpen ? 'bg-white animate-pulse' : 'bg-white/80'
                }`}
              />
              <span>{liveStatus.isOpen ? 'Open Now' : 'Closed'}</span>
            </div>

            {/* Right Buttons: Favorite + Close */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={() => toggleFavoriteSalon(salon.id)}
                className={`p-2.5 rounded-full backdrop-blur-md border shadow-md transition-transform active:scale-90 ${
                  isSaved
                    ? 'bg-rose-500 text-white border-rose-400'
                    : 'bg-slate-900/70 text-white border-white/20 hover:bg-slate-900 hover:text-rose-400'
                }`}
                title={isSaved ? 'Remove from Saved' : 'Save Salon'}
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2.5 rounded-full bg-slate-900/70 text-white border border-white/20 backdrop-blur-md hover:bg-slate-900 transition-colors active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Salon Info Inside Hero */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/90 text-white backdrop-blur-md border border-amber-400/40">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{salon.rating.toFixed(1)}</span>
                <span className="text-[11px] font-normal opacity-90">({salon.reviewCount} reviews)</span>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white/20 backdrop-blur-md border border-white/20">
                {salon.priceRange}
              </span>
              {salon.distanceKm !== undefined && (
                <span className="px-2.5 py-1 rounded-xl text-xs font-medium bg-emerald-500/80 backdrop-blur-md border border-emerald-400/30 flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  {salon.distanceKm.toFixed(1)} km away
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight drop-shadow-md">
              {salon.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 flex items-center gap-1.5 drop-shadow">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>{salon.address}</span>
            </p>
          </div>
        </div>

        {/* Action Hub Row: Map, Direct Call, WhatsApp, Live Hours */}
        <div
          className={`p-3 sm:p-4 border-b flex flex-wrap items-center justify-between gap-2.5 shrink-0 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          {/* Live Working Hours text */}
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-semibold">{liveStatus.displayText}</span>
          </div>

          {/* Quick Communication & Direction Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpenMap}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all active:scale-95 ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-750 hover:bg-slate-100 hover:text-slate-900 shadow-sm'
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 text-blue-500" />
              <span>Directions</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCallModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all active:scale-95 ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-750 hover:bg-slate-100 hover:text-slate-900 shadow-sm'
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750'
              }`}
            >
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              <span>Call</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsApp}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          className={`flex items-center gap-2 px-4 sm:px-6 pt-3 border-b shrink-0 overflow-x-auto no-scrollbar ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          {(['services', 'staff', 'reviews', 'hours'] as const).map(tabKey => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setActiveTab(tabKey)}
              className={`pb-3 px-3 text-xs sm:text-sm font-semibold capitalize border-b-2 transition-all shrink-0 ${
                activeTab === tabKey
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tabKey === 'services' && `Services (${salonServices.length})`}
              {tabKey === 'staff' && `Staff & Stylists (${salonStaff.length})`}
              {tabKey === 'reviews' && `Reviews (${salonReviews.length})`}
              {tabKey === 'hours' && 'Hours & Location'}
            </button>
          ))}
        </div>

        {/* Scrollable Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: SERVICES */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              {/* Category Pills */}
              {serviceCategories.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {serviceCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedServiceCat(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                        selectedServiceCat === cat
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : isLight
                          ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Service Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredServices.map(service => (
                  <ServiceBannerCard
                    key={service.id}
                    service={service}
                    onBook={handleBookService}
                    badgeText={service.popular ? 'Popular Choice' : undefined}
                  />
                ))}
              </div>

              {filteredServices.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <p>No services found in this category.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STAFF */}
          {activeTab === 'staff' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {salonStaff.map(staff => (
                <div
                  key={staff.id}
                  className={`p-4 rounded-2xl border flex items-center gap-3.5 transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-md'
                      : 'bg-slate-800/60 border-slate-750 hover:bg-slate-800'
                  }`}
                >
                  <StaffAvatar
                    avatarUrl={staff.avatar}
                    name={staff.name}
                    isAvailable={staff.available}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold truncate">{staff.name}</h4>
                    <p
                      className={`text-xs truncate ${
                        isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {staff.role}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-amber-500">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{staff.rating.toFixed(1)}</span>
                      <span className="text-slate-400 font-normal">({staff.reviewsCount})</span>
                    </div>
                  </div>
                </div>
              ))}

              {salonStaff.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-400">
                  <p>No staff profiles listed currently.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {salonReviews.map(review => (
                <div
                  key={review.id}
                  className={`p-4 rounded-2xl border space-y-2 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-750'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold flex items-center justify-center text-xs">
                        {review.customerName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold">{review.customerName}</h4>
                        <span className="text-[11px] text-slate-400">{review.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < review.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className={`text-xs sm:text-sm ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    {review.comment}
                  </p>

                  {review.reply && (
                    <div
                      className={`p-3 rounded-xl border mt-2 text-xs space-y-1 ${
                        isLight
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                          : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>Response from {review.reply.authorName}</span>
                        <span className="text-[10px] opacity-75">{review.reply.date}</span>
                      </div>
                      <p className="opacity-90">{review.reply.comment}</p>
                    </div>
                  )}
                </div>
              ))}

              {salonReviews.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <p>No customer reviews yet. Be the first to review!</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: HOURS & LOCATION */}
          {activeTab === 'hours' && (
            <div className="space-y-6">
              {/* Working Hours Table */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Weekly Schedule
                </h3>
                <div
                  className={`rounded-2xl border divide-y overflow-hidden ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 divide-slate-200'
                      : 'bg-slate-800/60 border-slate-750 divide-slate-750'
                  }`}
                >
                  {salon.workingHours.map(wh => (
                    <div key={wh.day} className="px-4 py-3 flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-semibold">{wh.day}</span>
                      <span
                        className={
                          wh.isOpen
                            ? isLight
                              ? 'text-slate-700 font-medium'
                              : 'text-slate-200 font-medium'
                            : 'text-rose-500 font-bold'
                        }
                      >
                        {wh.isOpen ? `${format12Hour(wh.open)} - ${format12Hour(wh.close)}` : 'Closed'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Salon Amenities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {salon.amenities.map(am => (
                    <span
                      key={am}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 ${
                        isLight
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{am}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer CTA */}
        <div
          className={`p-4 sm:p-5 border-t flex items-center justify-between gap-4 shrink-0 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <div>
            <span className="text-xs text-slate-400 block">Experience luxury care</span>
            <span className="text-sm sm:text-base font-bold text-primary">Instant Confirmation</span>
          </div>

          <button
            type="button"
            onClick={handleGeneralBook}
            className="px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white shadow-lg transition-all active:scale-95 flex items-center gap-2"
            style={{
              backgroundColor: currentThemeConfig.primaryHex,
              boxShadow: `0 4px 18px 0 ${currentThemeConfig.glowHex}`,
            }}
          >
            <Calendar className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>
        </div>
      </div>

      {/* Direct Call Modal */}
      <CallContactModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        phoneNumber={salon.phone}
        salonName={salon.name}
      />
    </div>
  );
};
