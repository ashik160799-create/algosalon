import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SalonCard } from './SalonCard';
import { ServiceBannerCard } from '../common/ServiceBannerCard';
import { ServiceItem } from '../../types';
import { computeSalonLiveStatus } from '../../utils/salonUtils';
import {
  Search,
  X,
  SlidersHorizontal,
  MapPin,
  Star,
  RotateCcw,
  Check,
  Store,
  Scissors,
} from 'lucide-react';

interface SearchDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GENDER_OPTIONS = ['All', 'Men', 'Women', 'Unisex'] as const;

const POPULAR_SUGGESTIONS = [
  'Skin Fade',
  'Beard Sculpting',
  'Organic Balayage',
  'Silk Press',
  'Keratin Therapy',
  'Russian Lashes',
  'Scalp Detox',
  'Hot Towel Shave',
];

const SERVICE_CATEGORIES = [
  'Haircut',
  'Beard & Shave',
  'Styling',
  'Coloring',
  'Spa & Facial',
  'Nails & Lashes',
];

export const SearchDiscoveryModal: React.FC<SearchDiscoveryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    salons,
    services,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    setPreselectedSalon,
    setPreselectedService,
    setPreselectedStaff,
    setBookingModalOpen,
    currentThemeConfig,
    colorThemeMode,
  } = useApp();

  const isLight = colorThemeMode === 'light';

  const [activeTab, setActiveTab] = useState<'salons' | 'services'>('salons');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Men' | 'Women' | 'Unisex'>('All');
  const [maxDistance, setMaxDistance] = useState<number>(20);
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedPrice, setSelectedPrice] = useState<string>('all');
  const [onlyOpenNow, setOnlyOpenNow] = useState(false);
  const [sortBy, setSortBy] = useState<'recommended' | 'distance' | 'rating' | 'price_low'>('recommended');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const advancedFiltersCount = useMemo(() => {
    let count = 0;
    if (maxDistance < 20) count++;
    if (minRating > 0) count++;
    if (selectedPrice !== 'all') count++;
    if (onlyOpenNow) count++;
    if (sortBy !== 'recommended') count++;
    return count;
  }, [maxDistance, minRating, selectedPrice, onlyOpenNow, sortBy]);

  const filteredSalons = useMemo(() => {
    return salons.filter(salon => {
      const q = searchQuery.toLowerCase().trim();
      const matchText =
        !q ||
        salon.name.toLowerCase().includes(q) ||
        salon.tagline.toLowerCase().includes(q) ||
        salon.description.toLowerCase().includes(q) ||
        salon.city.toLowerCase().includes(q) ||
        salon.address.toLowerCase().includes(q) ||
        salon.categories.some(c => c.toLowerCase().includes(q)) ||
        services.some(s => s.salonId === salon.id && s.name.toLowerCase().includes(q));

      const matchCat =
        selectedCategory === 'All' ||
        salon.categories.includes(selectedCategory) ||
        services.some(s => s.salonId === salon.id && s.category === selectedCategory);

      const matchGender =
        genderFilter === 'All' ||
        salon.genderTarget === 'All' ||
        salon.genderTarget === 'Unisex' ||
        salon.genderTarget === genderFilter;

      const matchDist = salon.distanceKm <= maxDistance;
      const matchRating = salon.rating >= minRating;
      const matchPrice = selectedPrice === 'all' || salon.priceRange === selectedPrice;
      const salonLive = computeSalonLiveStatus(salon.workingHours, salon.specialSchedules, salon.isOpenNow);
      const matchOpen = !onlyOpenNow || salonLive.isOpen;

      return matchText && matchCat && matchGender && matchDist && matchRating && matchPrice && matchOpen;
    });
  }, [
    salons,
    services,
    searchQuery,
    selectedCategory,
    genderFilter,
    maxDistance,
    minRating,
    selectedPrice,
    onlyOpenNow,
  ]);

  const sortedSalons = useMemo(() => {
    return [...filteredSalons].sort((a, b) => {
      if (sortBy === 'distance') return a.distanceKm - b.distanceKm;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price_low') return (a.startingPrice || 0) - (b.startingPrice || 0);
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });
  }, [filteredSalons, sortBy]);

  const filteredServices = useMemo(() => {
    return services.filter(srv => {
      const q = searchQuery.toLowerCase().trim();
      const matchText =
        !q ||
        srv.name.toLowerCase().includes(q) ||
        srv.description.toLowerCase().includes(q) ||
        srv.category.toLowerCase().includes(q);

      const matchCat = selectedCategory === 'All' || srv.category === selectedCategory;

      const matchGender =
        genderFilter === 'All' ||
        !srv.genderTarget ||
        srv.genderTarget === 'Unisex' ||
        srv.genderTarget === genderFilter;

      return matchText && matchCat && matchGender;
    });
  }, [services, searchQuery, selectedCategory, genderFilter]);

  const handleBookServiceFromSearch = (service: ServiceItem) => {
    const salon = salons.find(s => s.id === service.salonId) || salons[0];
    setPreselectedSalon(salon);
    setPreselectedService(service);
    setPreselectedStaff(null);
    setBookingModalOpen(true);
    onClose();
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setGenderFilter('All');
    setMaxDistance(20);
    setMinRating(0);
    setSelectedPrice('all');
    setOnlyOpenNow(false);
    setSortBy('recommended');
  };

  const resetAdvancedFiltersOnly = () => {
    setMaxDistance(20);
    setMinRating(0);
    setSelectedPrice('all');
    setOnlyOpenNow(false);
    setSortBy('recommended');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div
        className={`relative w-full max-w-4xl border rounded-3xl shadow-2xl overflow-hidden my-2 sm:my-4 transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
        style={{
          boxShadow: `0 20px 50px -10px ${currentThemeConfig.glowHex}`,
        }}
      >
        <div
          className={`p-4 sm:p-5 border-b ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search
                className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: currentThemeConfig.primaryHex }}
              />
              <input
                id="search-discovery-input"
                type="text"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search salons, services, stylists..."
                className={`w-full border rounded-2xl pl-12 pr-10 py-3 text-sm sm:text-base focus:outline-none transition-all shadow-inner ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-900 border-slate-700 text-white placeholder-slate-400'
                }`}
                style={{
                  borderColor: searchQuery ? currentThemeConfig.primaryHex : undefined,
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              id="close-search-discovery-btn"
              type="button"
              onClick={onClose}
              className={`p-3 rounded-2xl border transition-colors shrink-0 ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider shrink-0 mr-1">
              Popular:
            </span>
            {POPULAR_SUGGESTIONS.map(term => {
              const isSelected = searchQuery === term;
              return (
                <button
                  key={term}
                  type="button"
                  onClick={() => setSearchQuery(isSelected ? '' : term)}
                  className={`px-2.5 py-1 rounded-lg border text-xs transition-colors shrink-0 ${
                    isSelected
                      ? 'text-white'
                      : isLight
                      ? 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: currentThemeConfig.primaryHex,
                          borderColor: currentThemeConfig.primaryHex,
                        }
                      : undefined
                  }
                >
                  {term}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className={`px-4 py-2.5 border-b flex items-center justify-between gap-3 overflow-x-auto no-scrollbar ${
            isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-950 p-1 rounded-full shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('salons')}
              className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                activeTab === 'salons'
                  ? 'text-white shadow-sm'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
              style={{
                backgroundColor: activeTab === 'salons' ? currentThemeConfig.primaryHex : undefined,
              }}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Salons ({sortedSalons.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                activeTab === 'services'
                  ? 'text-white shadow-sm'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
              style={{
                backgroundColor: activeTab === 'services' ? currentThemeConfig.primaryHex : undefined,
              }}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Services & Offers ({filteredServices.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              id="open-filters-sheet-btn"
              onClick={() => setIsFilterSheetOpen(!isFilterSheetOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 border transition-all ${
                isFilterSheetOpen || advancedFiltersCount > 0
                  ? 'text-white shadow-sm'
                  : isLight
                  ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  : 'bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
              style={
                isFilterSheetOpen || advancedFiltersCount > 0
                  ? {
                      backgroundColor: currentThemeConfig.primaryHex,
                      borderColor: currentThemeConfig.primaryHex,
                      boxShadow: `0 2px 8px ${currentThemeConfig.glowHex}`,
                    }
                  : undefined
              }
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {advancedFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-slate-950 text-[10px] font-extrabold flex items-center justify-center">
                  {advancedFiltersCount}
                </span>
              )}
            </button>

            <div className={`w-[1px] h-5 shrink-0 ${isLight ? 'bg-slate-300' : 'bg-slate-800'}`} />

            <button
              type="button"
              onClick={() => {
                setGenderFilter('All');
                setSelectedCategory('All');
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 border transition-all ${
                genderFilter === 'All' && selectedCategory === 'All'
                  ? 'text-white shadow-sm'
                  : isLight
                  ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
              style={
                genderFilter === 'All' && selectedCategory === 'All'
                  ? {
                      backgroundColor: currentThemeConfig.primaryHex,
                      borderColor: currentThemeConfig.primaryHex,
                      boxShadow: `0 2px 8px ${currentThemeConfig.glowHex}`,
                    }
                  : undefined
              }
            >
              All
            </button>

            {(['Men', 'Women', 'Unisex'] as const).map(gender => {
              const isSelected = genderFilter === gender;
              return (
                <button
                  key={gender}
                  type="button"
                  onClick={() => setGenderFilter(isSelected ? 'All' : gender)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 border transition-all ${
                    isSelected
                      ? 'text-white shadow-sm'
                      : isLight
                      ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: currentThemeConfig.primaryHex,
                          borderColor: currentThemeConfig.primaryHex,
                          boxShadow: `0 2px 8px ${currentThemeConfig.glowHex}`,
                        }
                      : undefined
                  }
                >
                  {gender}
                </button>
              );
            })}

            <div className={`w-[1px] h-5 shrink-0 ${isLight ? 'bg-slate-300' : 'bg-slate-800'}`} />

            {SERVICE_CATEGORIES.map(cat => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? 'All' : cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 border whitespace-nowrap transition-all ${
                    isSelected
                      ? 'text-white shadow-sm'
                      : isLight
                      ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: currentThemeConfig.primaryHex,
                          borderColor: currentThemeConfig.primaryHex,
                          boxShadow: `0 2px 8px ${currentThemeConfig.glowHex}`,
                        }
                      : undefined
                  }
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {isFilterSheetOpen && (
          <div
            className={`p-4 sm:p-5 border-b space-y-4 animate-in slide-in-from-top-2 duration-200 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wide uppercase text-slate-400">
                Detailed Refinements
              </span>
              <button
                type="button"
                onClick={resetAdvancedFiltersOnly}
                className="text-xs font-semibold flex items-center gap-1 hover:underline transition-colors"
                style={{ color: currentThemeConfig.primaryHex }}
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Detailed Filters</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div
                className={`p-3.5 rounded-2xl border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold flex items-center gap-1 text-slate-700 dark:text-slate-300">
                    <MapPin className="w-3.5 h-3.5" style={{ color: currentThemeConfig.primaryHex }} />
                    Distance
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{maxDistance} km</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={maxDistance}
                  onChange={e => setMaxDistance(Number(e.target.value))}
                  className="w-full cursor-pointer"
                  style={{ accentColor: currentThemeConfig.primaryHex }}
                />
              </div>

              <div
                className={`p-3.5 rounded-2xl border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold flex items-center gap-1 text-slate-700 dark:text-slate-300">
                    <Star className="w-3.5 h-3.5" style={{ color: currentThemeConfig.primaryHex }} />
                    Min Rating
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {minRating === 0 ? 'Any' : `${minRating}★+`}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[0, 4.0, 4.5, 4.8].map(r => {
                    const isSelected = minRating === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setMinRating(r)}
                        className={`py-1 rounded-lg text-[11px] font-bold transition-all border ${
                          isSelected
                            ? 'text-white border-transparent'
                            : isLight
                            ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                        style={
                          isSelected
                            ? {
                                backgroundColor: currentThemeConfig.primaryHex,
                              }
                            : undefined
                        }
                      >
                        {r === 0 ? 'All' : `${r}★`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                className={`p-3.5 rounded-2xl border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-2">Price Tier</span>
                <div className="grid grid-cols-4 gap-1">
                  {['all', '$', '$$', '$$$'].map(p => {
                    const isSelected = selectedPrice === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setSelectedPrice(p)}
                        className={`py-1 rounded-lg text-[11px] font-bold transition-all border ${
                          isSelected
                            ? 'text-white border-transparent'
                            : isLight
                            ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                        style={
                          isSelected
                            ? {
                                backgroundColor: currentThemeConfig.primaryHex,
                              }
                            : undefined
                        }
                      >
                        {p === 'all' ? 'All' : p}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Open Now</span>
                  <button
                    type="button"
                    onClick={() => setOnlyOpenNow(!onlyOpenNow)}
                    className={`w-10 h-5 rounded-full transition-colors relative border ${
                      onlyOpenNow
                        ? 'border-transparent'
                        : isLight
                        ? 'bg-slate-200 border-slate-300'
                        : 'bg-slate-800 border-slate-700'
                    }`}
                    style={
                      onlyOpenNow
                        ? {
                            backgroundColor: currentThemeConfig.primaryHex,
                          }
                        : undefined
                    }
                  >
                    <span
                      className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                        onlyOpenNow ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className={`mt-2 w-full border rounded-lg px-2 py-1 text-[11px] font-semibold focus:outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-800'
                      : 'bg-slate-950 border-slate-700 text-slate-200'
                  }`}
                >
                  <option value="recommended">⭐ Recommended</option>
                  <option value="distance">📍 Closest Distance</option>
                  <option value="rating">🏆 Highest Rated</option>
                  <option value="price_low">💲 Lowest Price</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-transform hover:scale-105 active:scale-95 shadow-sm flex items-center gap-1.5"
                style={{
                  backgroundColor: currentThemeConfig.primaryHex,
                }}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Show {sortedSalons.length} Results</span>
              </button>
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Found{' '}
              <strong className={isLight ? 'text-slate-900 font-extrabold' : 'text-white font-extrabold'}>
                {activeTab === 'salons' ? sortedSalons.length : filteredServices.length}
              </strong>{' '}
              matching {activeTab === 'salons' ? 'salons' : 'services & offers'}
            </span>

            {(selectedCategory !== 'All' || genderFilter !== 'All' || advancedFiltersCount > 0 || searchQuery) && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-xs font-semibold hover:underline flex items-center gap-1"
                style={{ color: currentThemeConfig.primaryHex }}
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset all</span>
              </button>
            )}
          </div>

          {activeTab === 'salons' ? (
            sortedSalons.length === 0 ? (
              <div className="py-12 text-center">
                <Search className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">No Salons Match Search</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Try widening your distance, adjusting audience or category chips, or clearing search text.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="mt-4 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-transform hover:scale-105"
                  style={{
                    backgroundColor: currentThemeConfig.primaryHex,
                    boxShadow: `0 4px 12px ${currentThemeConfig.glowHex}`,
                  }}
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sortedSalons.map(salon => (
                  <div key={salon.id} onClick={onClose}>
                    <SalonCard salon={salon} />
                  </div>
                ))}
              </div>
            )
          ) : (
            filteredServices.length === 0 ? (
              <div className="py-12 text-center">
                <Scissors className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">No Treatments or Offers Found</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Try selecting a different category or audience tag, or clear search text to see all services.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="mt-4 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-transform hover:scale-105"
                  style={{
                    backgroundColor: currentThemeConfig.primaryHex,
                    boxShadow: `0 4px 12px ${currentThemeConfig.glowHex}`,
                  }}
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredServices.map(service => (
                  <ServiceBannerCard
                    key={`search-service-${service.id}`}
                    service={service}
                    variant="customer"
                    showCurrency="AED"
                    onBook={handleBookServiceFromSearch}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
