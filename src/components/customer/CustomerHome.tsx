import React, { useState, useMemo } from 'react';
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
    formatPrice,
  } = useApp();

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);

  const isLight = colorThemeMode === 'light';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const firstName = customerUser?.name?.split(' ')[0] || 'Alex';

  const lastVisit = useMemo<Appointment | null>(() => {
    const userAppointments = appointments
      .filter(a => a.customerId === customerUser.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const completed = userAppointments.find(a => a.status === 'completed');
    if (completed) return completed;

    const anyUserAppt = userAppointments[0];
    if (anyUserAppt) return anyUserAppt;

    const fallbackSalon = salons[1] || salons[0];
    const fallbackStaff = staffMembers.find(s => s.salonId === fallbackSalon?.id) || staffMembers[0];
    const fallbackService = services.find(s => s.salonId === fallbackSalon?.id) || services[0];

    if (!fallbackSalon || !fallbackStaff || !fallbackService) return null;

    return {
      id: 'demo-last-visit',
      salonId: fallbackSalon.id,
      salonName: fallbackSalon.name,
      salonAddress: fallbackSalon.address,
      salonPhone: fallbackSalon.phone,
      salonImage: fallbackSalon.image,
      customerId: customerUser.id,
      customerName: customerUser.name,
      customerPhone: customerUser.phone,
      customerEmail: customerUser.email,
      serviceId: fallbackService.id,
      serviceName: fallbackService.name,
      servicePrice: fallbackService.price,
      durationMinutes: fallbackService.durationMinutes,
      staffId: fallbackStaff.id,
      staffName: fallbackStaff.name,
      staffAvatar: fallbackStaff.avatar,
      date: '2026-08-15',
      timeSlot: '03:00 PM',
      status: 'completed',
      paymentMethod: 'card',
      createdAt: '2026-08-14T08:00:00.000Z',
    };
  }, [appointments, customerUser, salons, staffMembers, services]);

  const [nearbyRadiusKm, setNearbyRadiusKm] = useState<number>(10);
  const [exploreSortBy, setExploreSortBy] = useState<'nearest' | 'rating' | 'price_asc' | 'reviews'>('nearest');
  const [exploreGenderFilter, setExploreGenderFilter] = useState<'All' | 'Men' | 'Women' | 'Unisex'>('All');
  const [explorePriceFilter, setExplorePriceFilter] = useState<'All' | '$' | '$$' | '$$$'>('All');
  const [onlyOpenNow, setOnlyOpenNow] = useState(false);
  const [visibleSalonsCount, setVisibleSalonsCount] = useState(6);

  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 4,
    minutes: 38,
    seconds: 19,
  });

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 5, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const specialOfferServices = useMemo(() => {
    return services
      .filter(s => (s.discountPercent && s.discountPercent > 0) || s.offerTag || (s.originalPrice && s.originalPrice > s.price))
      .sort((a, b) => (b.discountPercent || 20) - (a.discountPercent || 20));
  }, [services]);

  const nearbySalons = useMemo(() => {
    return salons
      .filter(s => {
        if (selectedCategory === 'All') return true;
        return s.categories.includes(selectedCategory) || services.some(srv => srv.salonId === s.id && srv.category === selectedCategory);
      })
      .filter(s => s.distanceKm <= nearbyRadiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [salons, services, selectedCategory, nearbyRadiusKm]);

  const topStylists = useMemo(() => {
    return [...staffMembers]
      .filter(s => s.rating >= 4.0)
      .sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount)
      .slice(0, 4);
  }, [staffMembers]);

  const exploreSalons = useMemo(() => {
    let result = salons.filter(salon => {
      if (selectedCategory !== 'All') {
        const matchesCategory =
          salon.categories.includes(selectedCategory) ||
          services.some(s => s.salonId === salon.id && s.category === selectedCategory);
        if (!matchesCategory) return false;
      }
      if (exploreGenderFilter !== 'All') {
        if (salon.genderTarget && salon.genderTarget !== 'All' && salon.genderTarget !== 'Unisex' && salon.genderTarget !== exploreGenderFilter) {
          return false;
        }
      }
      if (explorePriceFilter !== 'All') {
        if (salon.priceRange !== explorePriceFilter) return false;
      }
      const salonLive = computeSalonLiveStatus(salon.workingHours, salon.specialSchedules, salon.isOpenNow);
      if (onlyOpenNow && !salonLive.isOpen) return false;

      return true;
    });

    return result.sort((a, b) => {
      if (exploreSortBy === 'nearest') return a.distanceKm - b.distanceKm;
      if (exploreSortBy === 'rating') return b.rating - a.rating;
      if (exploreSortBy === 'price_asc') return (a.startingPrice || 30) - (b.startingPrice || 30);
      if (exploreSortBy === 'reviews') return b.reviewCount - a.reviewCount;
      return 0;
    });
  }, [salons, services, selectedCategory, exploreGenderFilter, explorePriceFilter, onlyOpenNow, exploreSortBy]);

  const handleRebookLastVisit = (visit: Appointment) => {
    const salon = salons.find(s => s.id === visit.salonId) || salons[0];
    const service = services.find(s => s.id === visit.serviceId) || null;
    const staff = staffMembers.find(st => st.id === visit.staffId) || null;
    setPreselectedSalon(salon);
    setPreselectedService(service);
    setPreselectedStaff(staff);
    setBookingModalOpen(true);
  };

  const handleQuickBookSalon = (salon: Salon, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreselectedSalon(salon);
    setPreselectedService(null);
    setPreselectedStaff(null);
    setBookingModalOpen(true);
  };

  const handleBookServiceFromHome = (service: ServiceItem) => {
    const salon = salons.find(s => s.id === service.salonId) || salons[0];
    setPreselectedSalon(salon);
    setPreselectedService(service);
    setPreselectedStaff(null);
    setBookingModalOpen(true);
  };

  const handleBookWithStylist = (stylist: StaffMember) => {
    const salon = salons.find(s => s.id === stylist.salonId) || salons[0];
    setPreselectedSalon(salon);
    setPreselectedStaff(stylist);
    setPreselectedService(null);
    setBookingModalOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-10">
      <header className="pt-1">
        <div>
          <h1
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-['Outfit',sans-serif] ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            {greeting}, {firstName}
          </h1>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: currentThemeConfig.primaryHex }}
            />
            <span
              className={`text-xs font-semibold flex items-center gap-1 ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{userLocation || 'Dubai Marina, UAE'}</span>
            </span>
          </div>
        </div>
      </header>

      <button
        id="home-search-bar"
        type="button"
        onClick={() => setSearchModalOpen(true)}
        aria-label="Search salons, services, and stylists"
        className={`w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 rounded-full cursor-pointer transition-all duration-200 border group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          isLight
            ? 'bg-slate-100/90 hover:bg-slate-100/95 border-slate-200/90 text-slate-800 shadow-sm'
            : 'bg-slate-900/90 hover:bg-slate-900 border-slate-800 text-slate-200 shadow-md'
        }`}
      >
        <Search
          className="w-4 h-4 shrink-0 transition-colors"
          style={{ color: currentThemeConfig.primaryHex }}
        />
        <span className={`text-sm select-none ${isLight ? 'text-slate-500 font-normal' : 'text-slate-400 font-normal'}`}>
          Search salons, services, stylists...
        </span>
      </button>

      {lastVisit && (
        <section aria-labelledby="last-visit-heading" className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2
              id="last-visit-heading"
              className={`text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Last Visit
            </h2>
            <button
              type="button"
              onClick={() => setActiveCustomerTab('bookings')}
              className="text-xs font-semibold hover:underline flex items-center gap-1 transition-colors"
              style={{ color: currentThemeConfig.primaryHex }}
            >
              <span>Booking History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div
            id="last-visit-card"
            className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isLight
                ? 'bg-white border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
                : 'bg-slate-900 border-slate-800 shadow-xl'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <img
                  src={lastVisit.staffAvatar}
                  alt={lastVisit.staffName}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                />
                <span
                  className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-900"
                  style={{ backgroundColor: currentThemeConfig.primaryHex }}
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3
                    className={`text-sm sm:text-base font-bold font-['Outfit',sans-serif] ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {lastVisit.staffName}
                  </h3>
                  <span className="flex items-center gap-0.5 text-xs font-bold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>4.9</span>
                  </span>
                </div>

                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {lastVisit.serviceName}
                </p>

                <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  {lastVisit.salonName} • {lastVisit.date}
                </p>
              </div>
            </div>

            <button
              type="button"
              id="last-visit-rebook-btn"
              onClick={() => handleRebookLastVisit(lastVisit)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 text-white shrink-0 shadow-md"
              style={{
                backgroundColor: currentThemeConfig.primaryHex,
                boxShadow: `0 4px 14px -2px ${currentThemeConfig.glowHex}`,
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Rebook</span>
            </button>
          </div>
        </section>
      )}

      <section aria-label="Service Categories">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                id={`cat-chip-${cat.id.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 border ${
                  isSelected
                    ? 'text-white border-transparent shadow-sm'
                    : isLight
                    ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: currentThemeConfig.primaryHex,
                        boxShadow: `0 4px 14px -2px ${currentThemeConfig.glowHex}`,
                      }
                    : undefined
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="featured-services-heading" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: currentThemeConfig.primaryHex }}
              >
                <Flame className="w-4 h-4" />
              </div>
              <h2
                id="featured-services-heading"
                className={`text-lg sm:text-xl font-bold font-['Outfit',sans-serif] ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                Special Offers & Treatments
              </h2>
            </div>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Verified discounts sorted by highest savings & admin-pinned priority
            </p>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono font-bold self-start sm:self-auto shadow-xs ${
              isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Flash Deals End in:</span>
            <span className="font-black tracking-wider">
              {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {specialOfferServices.slice(0, 4).map(service => (
            <ServiceBannerCard
              key={`home-srv-${service.id}`}
              service={service}
              variant="customer"
              onBook={handleBookServiceFromHome}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="nearby-salons-heading" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: currentThemeConfig.primaryHex }}
              >
                <MapPin className="w-4 h-4" />
              </div>
              <h2
                id="nearby-salons-heading"
                className={`text-lg sm:text-xl font-bold font-['Outfit',sans-serif] ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                Nearby salons
              </h2>
            </div>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {locationPermissionGranted
                ? `Salons around ${userLocation} sorted by distance`
                : 'Sample nearby salons — enable location for distance-based results'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className={`text-[11px] font-bold ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Radius:</span>
            {[2, 5, 10, 25].map(radius => (
              <button
                key={radius}
                type="button"
                onClick={() => setNearbyRadiusKm(radius)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                  nearbyRadiusKm === radius
                    ? 'text-white shadow-sm'
                    : isLight
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
                style={nearbyRadiusKm === radius ? { backgroundColor: currentThemeConfig.primaryHex } : undefined}
              >
                {radius} km
              </button>
            ))}
          </div>
        </div>

        {nearbySalons.length === 0 ? (
          <div
            className={`p-6 rounded-2xl border text-center ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <p className="text-sm font-bold">No salons found within {nearbyRadiusKm} km</p>
            <button
              type="button"
              onClick={() => setNearbyRadiusKm(25)}
              className="mt-2 text-xs font-bold underline"
              style={{ color: currentThemeConfig.primaryHex }}
            >
              Expand radius to 25 km
            </button>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar snap-x snap-mandatory">
            {nearbySalons.map(salon => {
              const isSaved = customerUser.savedSalonIds.includes(salon.id);
              const startingPrice = salon.startingPrice || 28;

              return (
                <div
                  key={`nearby-${salon.id}`}
                  id={`nearby-card-${salon.id}`}
                  onClick={() => setSelectedSalon(salon)}
                  className={`min-w-[260px] sm:min-w-[280px] max-w-[280px] rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 snap-start flex flex-col justify-between group hover:shadow-xl ${
                    isLight
                      ? 'bg-white border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:border-slate-300'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-md'
                  }`}
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-200 dark:bg-slate-950">
                    <img
                      src={salon.image}
                      alt={salon.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    <div className="absolute top-2.5 left-2.5">
                      {(() => {
                        const cardLive = computeSalonLiveStatus(salon.workingHours, salon.specialSchedules, salon.isOpenNow);
                        return (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md flex items-center gap-1 shadow-sm ${
                              cardLive.isOpen
                                ? 'bg-emerald-500/90 text-white'
                                : 'bg-slate-800/85 text-slate-300'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                cardLive.isOpen ? 'bg-white' : 'bg-slate-400'
                              }`}
                            />
                            <span>{cardLive.badgeLabel || (cardLive.isOpen ? 'Open Now' : 'Closed')}</span>
                          </span>
                        );
                      })()}
                    </div>

                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        toggleFavoriteSalon(salon.id);
                      }}
                      className={`absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur-md text-xs font-semibold border border-white/15 transition-all shadow-md active:scale-95 ${
                        isSaved ? 'bg-rose-500/90 text-white' : 'bg-black/60 text-white hover:bg-black/80'
                      }`}
                      title={isSaved ? 'Remove from Saved' : 'Save'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-white' : ''}`} />
                      <span className="text-[11px] leading-none">{120 + (salon.reviewCount % 30)}</span>
                    </button>

                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-white">
                      <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-xl font-bold border border-white/15 shadow-md">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{salon.rating.toFixed(1)}</span>
                        <span className="opacity-75 font-normal">({salon.reviewCount})</span>
                      </div>

                      <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-xl text-slate-200 font-bold border border-white/15 shadow-md">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span>{salon.distanceKm} km</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 flex flex-col justify-between flex-1 gap-3">
                    <div>
                      <h3
                        className={`text-sm font-bold truncate font-['Outfit',sans-serif] ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {salon.name}
                      </h3>
                      <p
                        className={`text-xs mt-0.5 line-clamp-1 ${
                          isLight ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        {salon.tagline}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className={`text-[10px] block leading-none ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                          Starting from
                        </span>
                        <span
                          className="text-xs font-bold font-mono"
                          style={{ color: currentThemeConfig.primaryHex }}
                        >
                          {formatPrice(startingPrice)}
                        </span>
                      </div>

                      <button
                        type="button"
                        id={`nearby-book-${salon.id}`}
                        onClick={e => handleQuickBookSalon(salon, e)}
                        className="px-3.5 py-1.5 rounded-full font-bold text-xs transition-all duration-200 hover:scale-105 active:scale-95 text-white shadow-sm"
                        style={{
                          backgroundColor: currentThemeConfig.primaryHex,
                          boxShadow: `0 2px 10px -1px ${currentThemeConfig.glowHex}`,
                        }}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="top-stylists-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: currentThemeConfig.primaryHex }}
              >
                <Scissors className="w-4 h-4" />
              </div>
              <h2
                id="top-stylists-heading"
                className={`text-lg sm:text-xl font-bold font-['Outfit',sans-serif] ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                Top Stylists
              </h2>
            </div>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Top-rated master barbers & color specialists (Rating ≥ 4.0 ★)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {topStylists.map(stylist => {
            const salon = salons.find(s => s.id === stylist.salonId);
            const specialty = stylist.specialties && stylist.specialties.length > 0
              ? stylist.specialties[0]
              : stylist.roleTitle || 'Hair Artistry';

            return (
              <div
                key={`stylist-${stylist.id}`}
                id={`stylist-row-${stylist.id}`}
                onClick={() => handleBookWithStylist(stylist)}
                className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-md group ${
                  isLight
                    ? 'bg-white border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-slate-300'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <StaffAvatar
                    name={stylist.name}
                    avatar={stylist.avatar}
                    gender={stylist.gender}
                    size="md"
                    badge={
                      stylist.isAvailable ? (
                        <span
                          className="w-3 h-3 rounded-full ring-2 ring-white dark:ring-slate-900 block"
                          style={{ backgroundColor: currentThemeConfig.primaryHex }}
                          title="Available for immediate booking"
                        />
                      ) : undefined
                    }
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4
                        className={`text-sm font-bold truncate font-['Outfit',sans-serif] ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {stylist.name}
                      </h4>
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold border truncate"
                        style={{
                          backgroundColor: `${currentThemeConfig.primaryHex}15`,
                          borderColor: `${currentThemeConfig.primaryHex}35`,
                          color: currentThemeConfig.primaryHex,
                        }}
                      >
                        {specialty}
                      </span>
                    </div>

                    <p className={`text-[11px] truncate mt-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                      {salon?.name || 'Studio'} • {stylist.reviewsCount || 48} reviews
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-xs font-bold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{stylist.rating}</span>
                    </div>
                    <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                      {stylist.experienceYears || 5}+ yrs
                    </span>
                  </div>

                  <span
                    className="p-1.5 rounded-full text-white group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: currentThemeConfig.primaryHex }}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <SearchDiscoveryModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
      <ThemeSwitcherModal isOpen={themeModalOpen} onClose={() => setThemeModalOpen(false)} />
    </div>
  );
};
