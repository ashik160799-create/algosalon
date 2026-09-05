import React, { useState } from 'react';
import { Salon } from '../../types';
import { useApp } from '../../context/AppContext';
import { computeSalonLiveStatus, getSalonStartingPrice, getSalonMapUrl } from '../../utils/salonUtils';
import { CallContactModal } from '../common/CallContactModal';
import {
  Star,
  MapPin,
  Clock,
  Heart,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Tag,
  Phone,
  Navigation,
  ExternalLink,
} from 'lucide-react';

interface SalonCardProps {
  salon: Salon;
  featuredBanner?: boolean;
  compact?: boolean;
}

export const SalonCard: React.FC<SalonCardProps> = ({
  salon,
  featuredBanner = false,
  compact = false,
}) => {
  const {
    services,
    setSelectedSalon,
    setPreselectedSalon,
    setPreselectedService,
    setPreselectedStaff,
    setBookingModalOpen,
    toggleFavoriteSalon,
    customerUser,
    currentThemeConfig,
    colorThemeMode,
    formatPrice,
    t,
  } = useApp();

  const isLight = colorThemeMode === 'light';
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const isSaved = customerUser.savedSalonIds.includes(salon.id);
  const liveStatus = computeSalonLiveStatus(salon.workingHours, salon.specialSchedules, salon.isOpenNow);
  const startingPrice = getSalonStartingPrice(salon, services);

  const handleOpenDetails = () => {
    setSelectedSalon(salon);
  };

  const handleQuickBook = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreselectedSalon(salon);
    setPreselectedService(null);
    setPreselectedStaff(null);
    setBookingModalOpen(true);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteSalon(salon.id);
  };

  const handleOpenMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const mapUrl = getSalonMapUrl(salon);
    window.open(mapUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCallModalOpen(true);
  };

  return (
    <div
      id={`salon-card-${salon.id}`}
      onClick={handleOpenDetails}
      className={`group relative rounded-2xl sm:rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer ${
        isLight
          ? 'bg-white border-slate-200/90 shadow-sm hover:shadow-xl hover:border-slate-300'
          : 'bg-slate-900/90 border-slate-800 hover:shadow-2xl'
      }`}
      style={{
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = `${currentThemeConfig.primaryHex}80`;
        (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 36px -8px ${currentThemeConfig.glowHex}`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = '';
        (e.currentTarget as HTMLElement).style.boxShadow = '';
      }}
    >
      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-slate-950">
        <img
          src={salon.image}
          alt={salon.name}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-black/30" />

        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
          <div className="flex flex-wrap items-center gap-1.5 max-w-[80%]">
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md flex items-center gap-1 shadow-sm ${liveStatus.badgeClass}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  liveStatus.isOpen ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'
                }`}
              />
              <span>{liveStatus.badgeLabel}</span>
            </span>

            {salon.discountBadge && (
              <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black tracking-wider uppercase shadow-md flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-950 stroke-[2.5]" />
                <span>{salon.discountBadge}</span>
              </span>
            )}
          </div>

          <button
            type="button"
            id={`fav-btn-${salon.id}`}
            onClick={handleToggleFavorite}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full backdrop-blur-md transition-all duration-200 shadow-md ${
              isSaved
                ? 'bg-rose-600 text-white scale-105 shadow-rose-600/40'
                : 'bg-black/60 text-white hover:bg-black/80'
            }`}
            title={isSaved ? 'Remove from Saved' : 'Save to Favorites'}
          >
            <Heart
              className={`w-3.5 h-3.5 transition-transform ${
                isSaved ? 'fill-white stroke-white scale-105 text-white' : 'text-rose-400 fill-rose-400'
              }`}
            />
            <span className="text-[11px] font-bold leading-none">{salon.likesCount || 128}</span>
          </button>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white z-10">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-bold bg-slate-950/80 border border-slate-700/60 px-2.5 py-1 rounded-lg backdrop-blur-md shadow-sm">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{salon.rating.toFixed(1)}</span>
              <span className="text-slate-400 text-[10px] font-normal">({salon.reviewCount})</span>
            </span>

            <span className="flex items-center gap-1 bg-slate-950/80 border border-slate-700/60 px-2.5 py-1 rounded-lg backdrop-blur-md text-slate-300 shadow-sm">
              <MapPin className="w-3.5 h-3.5" style={{ color: currentThemeConfig.primaryHex }} />
              <span>{salon.distanceKm} km</span>
            </span>
          </div>

          <div
            className="bg-slate-950/85 border px-2.5 py-1 rounded-lg backdrop-blur-md text-right shadow-sm"
            style={{ borderColor: `${currentThemeConfig.primaryHex}40` }}
          >
            <span className="text-[10px] text-slate-400 block leading-none">{t('card.starting_from', 'Starting from')}</span>
            <span className="text-sm font-extrabold text-white font-mono leading-tight">
              {formatPrice(startingPrice)}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <h3
                  className={`text-base sm:text-lg font-bold transition-colors line-clamp-1 font-['Outfit',sans-serif] ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {salon.name}
                </h3>

                {salon.isVerified && (
                  <span
                    className="inline-flex items-center justify-center shrink-0"
                    title="Verified & Approved ALGO Salon"
                  >
                    <CheckCircle2
                      className="w-4 h-4"
                      style={{ color: currentThemeConfig.primaryHex }}
                    />
                  </span>
                )}
              </div>

              <p
                className="text-xs font-medium mt-0.5 line-clamp-1"
                style={{ color: currentThemeConfig.primaryHex }}
              >
                {salon.tagline}
              </p>
            </div>
          </div>

          <div className={`mt-2.5 flex items-center gap-1.5 text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            <Clock className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
            <span className="truncate">{liveStatus.statusText}</span>
          </div>

          <div className="mt-1 flex items-center justify-between gap-1">
            <button
              type="button"
              id={`salon-map-link-${salon.id}`}
              onClick={handleOpenMap}
              className={`text-[11px] flex items-center gap-1.5 truncate text-left group/addr hover:underline cursor-pointer ${
                isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
              title="Open location in Google Maps"
            >
              <MapPin className="w-3 h-3 shrink-0 text-rose-500 group-hover/addr:scale-110 transition-transform" />
              <span className="truncate">{salon.address}</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover/addr:opacity-100 transition-opacity text-slate-400 shrink-0" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {salon.genderTarget && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-md font-bold border"
                style={{
                  backgroundColor: `${currentThemeConfig.primaryHex}15`,
                  borderColor: `${currentThemeConfig.primaryHex}40`,
                  color: currentThemeConfig.primaryHex,
                }}
              >
                {salon.genderTarget}
              </span>
            )}
            {salon.categories.slice(0, 3).map(cat => (
              <span
                key={cat}
                className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                  isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {cat}
              </span>
            ))}
            {salon.categories.length > 3 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400'
              }`}>
                +{salon.categories.length - 3}
              </span>
            )}
          </div>
        </div>

        <div className={`mt-4 pt-3 border-t flex items-center gap-1.5 ${isLight ? 'border-slate-100' : 'border-slate-800/80'}`}>
          <button
            type="button"
            id={`details-btn-${salon.id}`}
            onClick={handleOpenDetails}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-0.5 flex-1 ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="View full salon profile & services"
          >
            <span>Details</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </button>

          <button
            type="button"
            id={`map-icon-btn-${salon.id}`}
            onClick={handleOpenMap}
            className={`p-2 rounded-xl border transition-all flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 ${
              isLight
                ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600'
                : 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-900/50 text-rose-400'
            }`}
            title="Open Google Maps Directions"
            aria-label="Google Maps Directions"
          >
            <Navigation className="w-4 h-4" />
          </button>

          <button
            type="button"
            id={`call-icon-btn-${salon.id}`}
            onClick={handleOpenCall}
            className={`p-2 rounded-xl border transition-all flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 ${
              isLight
                ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-600'
                : 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-900/50 text-emerald-400'
            }`}
            title={`Call ${salon.phone}`}
            aria-label={`Call ${salon.phone}`}
          >
            <Phone className="w-4 h-4" />
          </button>

          <button
            type="button"
            id={`book-btn-${salon.id}`}
            onClick={handleQuickBook}
            className="py-2 px-3.5 rounded-xl text-white text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5 flex-1 hover:opacity-95 active:scale-95"
            style={{
              backgroundColor: currentThemeConfig.primaryHex,
              boxShadow: `0 4px 14px -2px ${currentThemeConfig.glowHex}`,
            }}
          >
            <Calendar className="w-3.5 h-3.5 text-white" />
            <span>Book</span>
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
