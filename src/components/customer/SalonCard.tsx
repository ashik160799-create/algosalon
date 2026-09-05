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
  const liveStatus = computeSalonLiveStatus(salon.workingHours, salon.specialSchedules, salon.isOpenNow, salon);
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
      <div>
        {/* Salon Cover Image */}
        <div className={`relative w-full overflow-hidden ${compact ? 'h-36 sm:h-44' : 'h-48 sm:h-56'}`}>
          <img
            src={salon.image}
            alt={salon.name}
            className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
          />
          {!imageLoaded && (
            <div className={`absolute inset-0 animate-pulse ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`} />
          )}

          {/* Top Overlay Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            {/* Live Open / Closed Status Pill */}
            <div
              className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md border shadow-sm flex items-center gap-1.5 ${
                liveStatus.isOpen
                  ? 'bg-emerald-500/90 text-white border-emerald-400/40'
                  : 'bg-rose-500/90 text-white border-rose-400/40'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  liveStatus.isOpen ? 'bg-white animate-pulse' : 'bg-white/80'
                }`}
              />
              <span>{liveStatus.isOpen ? t('open_now', 'Open Now') : t('closed', 'Closed')}</span>
            </div>

            {/* Favorite Button */}
            <button
              id={`fav-btn-${salon.id}`}
              type="button"
              onClick={handleToggleFavorite}
              className={`p-2 rounded-full backdrop-blur-md border shadow-sm pointer-events-auto transition-transform active:scale-90 ${
                isSaved
                  ? 'bg-rose-500 text-white border-rose-400'
                  : isLight
                  ? 'bg-white/80 text-slate-700 border-white/60 hover:bg-white hover:text-rose-500'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-900 hover:text-rose-400'
              }`}
              title={isSaved ? t('remove_saved', 'Remove from Saved') : t('save_salon', 'Save Salon')}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Bottom Left Price Category Pill */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-lg text-xs font-bold backdrop-blur-md border ${
                isLight
                  ? 'bg-white/90 text-slate-900 border-white/80 shadow-sm'
                  : 'bg-slate-950/80 text-white border-slate-700/60'
              }`}
            >
              {salon.priceRange}
            </span>

            {salon.distanceKm !== undefined && (
              <span
                className={`px-2 py-0.5 rounded-lg text-xs font-medium backdrop-blur-md border flex items-center gap-1 ${
                  isLight
                    ? 'bg-slate-900/70 text-white border-slate-800'
                    : 'bg-slate-950/70 text-slate-300 border-slate-800'
                }`}
              >
                <Navigation className="w-3 h-3 text-emerald-400" />
                {salon.distanceKm.toFixed(1)} km
              </span>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 sm:p-5 space-y-3">
          {/* Title and Rating */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-bold truncate transition-colors group-hover:text-primary">
                {salon.name}
              </h3>
              <p
                className={`text-xs sm:text-sm truncate mt-0.5 ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {salon.tagline || salon.categories.join(' • ')}
              </p>
            </div>

            {/* Rating Box */}
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border shrink-0 ${
                isLight
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
              <span>{salon.rating.toFixed(1)}</span>
              <span className="text-[10px] opacity-75 font-normal">({salon.reviewCount})</span>
            </div>
          </div>

          {/* Address Line & Quick Actions */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <div
              className={`flex items-center gap-1.5 truncate max-w-[65%] ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{salon.address}</span>
            </div>

            {/* External Map & Call Icons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleOpenMap}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isLight
                    ? 'border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                    : 'border-slate-750 hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
                title="View on Google Maps"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleOpenCall}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isLight
                    ? 'border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                    : 'border-slate-750 hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Call Salon"
              >
                <Phone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Live Hours Summary Line */}
          <div
            className={`flex items-center gap-1.5 text-xs ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="truncate font-medium">{liveStatus.displayText}</span>
          </div>

          {/* Category Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {salon.categories.slice(0, 3).map((cat, i) => (
              <span
                key={i}
                className={`text-[11px] px-2 py-0.5 rounded-md font-medium border ${
                  isLight
                    ? 'bg-slate-50 text-slate-600 border-slate-200'
                    : 'bg-slate-800/60 text-slate-400 border-slate-750'
                }`}
              >
                {cat}
              </span>
            ))}
            {salon.categories.length > 3 && (
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-md font-medium ${
                  isLight ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                +{salon.categories.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer: Starting Price + Book Button */}
      <div
        className={`p-4 sm:p-5 pt-3 border-t flex items-center justify-between gap-3 ${
          isLight ? 'border-slate-100 bg-slate-50/50' : 'border-slate-800 bg-slate-900/50'
        }`}
      >
        <div>
          <span className={`text-[11px] uppercase tracking-wider block ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            {t('starts_from', 'Starts from')}
          </span>
          <span className="text-sm sm:text-base font-extrabold text-primary">
            {startingPrice > 0 ? formatPrice(startingPrice) : formatPrice(45)}
          </span>
        </div>

        <button
          id={`quick-book-btn-${salon.id}`}
          type="button"
          onClick={handleQuickBook}
          className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          style={{
            backgroundColor: currentThemeConfig.primaryHex,
            boxShadow: `0 4px 14px 0 ${currentThemeConfig.glowHex}`,
          }}
        >
          <span>{t('book_now', 'Book Now')}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Call Dialog Modal */}
      <CallContactModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        phoneNumber={salon.phone}
        salonName={salon.name}
      />
    </div>
  );
};
