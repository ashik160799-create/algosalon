import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Salon, StaffMember, ServiceItem, Appointment } from '../../types';
import { StaffAvatar } from '../common/StaffAvatar';
import { SearchDiscoveryModal } from './SearchDiscoveryModal';
import { ThemeSwitcherModal } from '../common/ThemeSwitcherModal';
import { ServiceBannerCard } from '../common/ServiceBannerCard';
import { computeSalonLiveStatus } from '../../utils/salonUtils';
import {
  Search,
  MapPin,
  Star,
  Clock,
  Scissors,
  Sparkles,
  ChevronRight,
  Heart,
  Layers,
  Flame,
  CheckCircle2,
  Moon,
  RotateCcw,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'All', label: 'All', icon: Sparkles },
  { id: 'Haircut', label: 'Haircuts', icon: Scissors },
  { id: 'Beard & Shave', label: 'Beard & Shave', icon: Flame },
  { id: 'Styling', label: 'Styling', icon: Sparkles },
  { id: 'Coloring', label: 'Coloring', icon: Layers },
  { id: 'Spa & Facial', label: 'Spa & Facial', icon: Star },
  { id: 'Nails & Lashes', label: 'Nails & Lashes', icon: Heart },
];

export const CustomerHome: React.FC = () => {
  const {
    salons,
    services,
    staffMembers,
    appointments,
    customerUser,
    selectedCategory,
    setSelectedCategory,
    setSelectedSalon,
    setPreselectedSalon,
    setPreselectedService,
    setPreselectedStaff,
    setBookingModalOpen,
    toggleFavoriteSalon,
    setActiveCustomerTab,
    currentThemeConfig,
    colorThemeMode,
    userLocation,
    locationPermissionGranted,
    requestLocationPermission,
    formatPrice,
  } = useApp();

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const isLight = colorThemeMode === 'light';

  // Quick Stats
  const activeBookingsCount = useMemo(() => {
    return appointments.filter(
      a => a.customerId === customerUser.id && (a.status === 'confirmed' || a.status === 'pending')
    ).length;
  }, [appointments, customerUser.id]);

  const featuredSalons = useMemo(() => {
    return salons.filter(s => s.featured);
  }, [salons]);

  const filteredSalons = useMemo(() => {
    if (selectedCategory === 'All') return salons;
    return salons.filter(s => s.categories.includes(selectedCategory));
  }, [salons, selectedCategory]);

  const popularServices = useMemo(() => {
    return services.filter(s => s.popular);
  }, [services]);

  const handleBookService = (service: ServiceItem) => {
    const parentSalon = salons.find(s => s.id === service.salonId);
    if (parentSalon) {
      setPreselectedSalon(parentSalon);
      setPreselectedService(service);
      setPreselectedStaff(null);
      setBookingModalOpen(true);
    }
  };

  return (
    <div id="customer-home-root" className="min-h-screen pb-24 lg:pb-12">
      {/* Top Hero Section */}
      <section className="relative overflow-hidden pt-4 sm:pt-6 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Glow backdrop decorative accent */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${currentThemeConfig.primaryHex} 0%, transparent 70%)`,
          }}
        />

        {/* Location & Greeting Header */}
        <div className="relative flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (!locationPermissionGranted) {
                  requestLocationPermission();
                }
              }}
              className={`p-2.5 rounded-2xl border flex items-center gap-2 text-xs font-semibold transition-all ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="truncate max-w-[140px] sm:max-w-[200px]">{userLocation}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Active Bookings Badge */}
            {activeBookingsCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveCustomerTab('bookings')}
                className={`px-3 py-1.5 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                    : 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{activeBookingsCount} Active</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Banner Headline & Subtitle */}
        <div className="relative mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 border backdrop-blur-md bg-primary/10 border-primary/20 text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ALGO Premium Salon Experience</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Book top stylists & <br className="hidden sm:inline" />
            <span className="text-primary">luxury salon care</span> in seconds
          </h1>

          <p
            className={`mt-2 text-xs sm:text-base max-w-2xl font-medium ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            Verified artists, real-time availability, and instant confirmed appointments with zero waiting.
          </p>
        </div>

        {/* Floating Quick Search Trigger Bar */}
        <div
          id="customer-search-trigger"
          onClick={() => setSearchModalOpen(true)}
          className={`relative p-3.5 sm:p-4 rounded-3xl border shadow-lg cursor-pointer flex items-center justify-between gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] ${
            isLight
              ? 'bg-white border-slate-200/90 shadow-slate-200/50 hover:border-primary/50'
              : 'bg-slate-900/90 border-slate-800 shadow-black/40 hover:border-primary/50'
          }`}
          style={{
            boxShadow: `0 8px 30px -6px ${currentThemeConfig.glowHex}`,
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-primary text-white shadow-md">
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs sm:text-sm font-bold truncate">
                Search salons, services, hair spa...
              </span>
              <span className={`block text-[11px] sm:text-xs truncate ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                Downtown, Dubai Marina, Business Bay & more
              </span>
            </div>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold shrink-0 hidden sm:flex items-center gap-1">
            <span>Explore</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </section>

      {/* Category Pills Slider */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-md scale-105'
                    : isLight
                    ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300 shadow-sm'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: currentThemeConfig.primaryHex,
                        boxShadow: `0 4px 14px 0 ${currentThemeConfig.glowHex}`,
                      }
                    : undefined
                }
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSelected ? 'text-white' : 'text-primary'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Salon Showcase (if any) */}
      {featuredSalons.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Featured Spotlights</span>
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Handpicked elite studios with signature services
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {featuredSalons.slice(0, 2).map(salon => {
              const liveStatus = computeSalonLiveStatus(salon.workingHours, salon.specialSchedules, salon.isOpenNow, salon);
              return (
                <div
                  key={salon.id}
                  onClick={() => setSelectedSalon(salon)}
                  className={`group relative rounded-3xl border overflow-hidden cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                    isLight
                      ? 'bg-white border-slate-200 hover:shadow-xl'
                      : 'bg-slate-900 border-slate-800 hover:shadow-2xl'
                  }`}
                  style={{
                    borderColor: `${currentThemeConfig.primaryHex}40`,
                  }}
                >
                  <div className="relative h-48 sm:h-56 w-full overflow-hidden">
                    <img
                      src={salon.image}
                      alt={salon.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-md">
                        Featured
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md border ${
                          liveStatus.isOpen
                            ? 'bg-emerald-500/90 text-white border-emerald-400/40'
                            : 'bg-rose-500/90 text-white border-rose-400/40'
                        }`}
                      >
                        {liveStatus.isOpen ? 'Open Now' : 'Closed'}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="text-lg font-extrabold truncate drop-shadow">{salon.name}</h3>
                      <p className="text-xs text-slate-200 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{salon.address}</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1 font-bold text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{salon.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-slate-400">•</span>
                      <span className={`font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        {salon.priceRange}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className={`truncate font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {liveStatus.displayText}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setPreselectedSalon(salon);
                        setPreselectedService(null);
                        setPreselectedStaff(null);
                        setBookingModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-95"
                      style={{
                        backgroundColor: currentThemeConfig.primaryHex,
                      }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Popular Trending Services */}
      {popularServices.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">Trending Services</h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Most booked treatments across our top-rated salons
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {popularServices.slice(0, 6).map(service => (
              <ServiceBannerCard
                key={service.id}
                service={service}
                onBook={handleBookService}
                badgeText="Trending"
              />
            ))}
          </div>
        </section>
      )}

      {/* All Salons List */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
              {selectedCategory === 'All' ? 'All Verified Salons' : `${selectedCategory} Salons`}
            </h2>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Showing {filteredSalons.length} studios near {userLocation}
            </p>
          </div>
        </div>

        {/* Salons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredSalons.map(salon => {
            const liveStatus = computeSalonLiveStatus(salon.workingHours, salon.specialSchedules, salon.isOpenNow, salon);
            const isSaved = customerUser.savedSalonIds.includes(salon.id);

            return (
              <div
                key={salon.id}
                id={`salon-item-${salon.id}`}
                onClick={() => setSelectedSalon(salon)}
                className={`group relative rounded-3xl border overflow-hidden cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                  isLight
                    ? 'bg-white border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300'
                    : 'bg-slate-900 border-slate-800 hover:shadow-2xl hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="relative h-44 sm:h-52 w-full overflow-hidden">
                    <img
                      src={salon.image}
                      alt={salon.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <div
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md border shadow-sm ${
                          liveStatus.isOpen
                            ? 'bg-emerald-500/90 text-white border-emerald-400/40'
                            : 'bg-rose-500/90 text-white border-rose-400/40'
                        }`}
                      >
                        {liveStatus.isOpen ? 'Open Now' : 'Closed'}
                      </div>

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          toggleFavoriteSalon(salon.id);
                        }}
                        className={`p-2 rounded-full backdrop-blur-md border shadow-sm pointer-events-auto transition-transform active:scale-90 ${
                          isSaved
                            ? 'bg-rose-500 text-white border-rose-400'
                            : isLight
                            ? 'bg-white/80 text-slate-700 border-white/60 hover:bg-white hover:text-rose-500'
                            : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-900 hover:text-rose-400'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="text-base sm:text-lg font-bold truncate drop-shadow">
                        {salon.name}
                      </h3>
                      <p className="text-xs text-slate-200 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{salon.address}</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 font-bold text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{salon.rating.toFixed(1)}</span>
                        <span className="text-slate-400 font-normal">({salon.reviewCount})</span>
                      </div>
                      <span className="font-bold text-slate-400">{salon.priceRange}</span>
                    </div>

                    <div className={`flex items-center gap-1.5 text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="truncate font-medium">{liveStatus.displayText}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {salon.categories.slice(0, 3).map((c, i) => (
                        <span
                          key={i}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                            isLight
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : 'bg-slate-800 text-slate-400 border-slate-750'
                          }`}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 pt-3 border-t flex items-center justify-between ${
                    isLight ? 'border-slate-100 bg-slate-50/50' : 'border-slate-800 bg-slate-900/50'
                  }`}
                >
                  <span className="text-xs font-bold text-primary">Starts AED 45</span>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setPreselectedSalon(salon);
                      setPreselectedService(null);
                      setPreselectedStaff(null);
                      setBookingModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-95"
                    style={{
                      backgroundColor: currentThemeConfig.primaryHex,
                    }}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredSalons.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p>No salons found in this category.</p>
          </div>
        )}
      </section>

      {/* Global Search Discovery Modal */}
      <SearchDiscoveryModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />

      {/* Global Theme Switcher Modal */}
      <ThemeSwitcherModal
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
      />
    </div>
  );
};
