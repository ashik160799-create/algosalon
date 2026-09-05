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
    t,
  } = useApp();

  const isLight = colorThemeMode === 'light';

  const [activeTab, setActiveTab] = useState<'all' | 'salons' | 'services'>('all');
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [priceFilter, setPriceFilter] = useState<string>('All');
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);

  if (!isOpen) return null;

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedGender('All');
    setPriceFilter('All');
    setOpenNowOnly(false);
    setMinRating(0);
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedCategory !== 'All' ||
    selectedGender !== 'All' ||
    priceFilter !== 'All' ||
    openNowOnly ||
    minRating > 0;

  // Filter salons
  const filteredSalons = salons.filter(salon => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      salon.name.toLowerCase().includes(q) ||
      salon.address.toLowerCase().includes(q) ||
      salon.city.toLowerCase().includes(q) ||
      salon.categories.some(c => c.toLowerCase().includes(q));

    const matchesCategory =
      selectedCategory === 'All' || salon.categories.includes(selectedCategory);

    const matchesPrice = priceFilter === 'All' || salon.priceRange === priceFilter;

    const matchesRating = salon.rating >= minRating;

    const liveStatus = computeSalonLiveStatus(salon.workingHours, salon.specialSchedules, salon.isOpenNow, salon);
    const matchesOpen = !openNowOnly || liveStatus.isOpen;

    return matchesSearch && matchesCategory && matchesPrice && matchesRating && matchesOpen;
  });

  // Filter services
  const filteredServices = services.filter(service => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      service.name.toLowerCase().includes(q) ||
      service.category.toLowerCase().includes(q) ||
      service.description.toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === 'All' || service.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleBookService = (service: ServiceItem) => {
    const parentSalon = salons.find(s => s.id === service.salonId);
    if (parentSalon) {
      setPreselectedSalon(parentSalon);
      setPreselectedService(service);
      setPreselectedStaff(null);
      setBookingModalOpen(true);
      onClose();
    }
  };

  return (
    <div
      id="search-discovery-modal-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 md:p-6 pt-12 md:pt-16 bg-black/70 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="search-discovery-modal-container"
        onClick={e => e.stopPropagation()}
        className={`relative w-full max-w-3xl max-h-[85vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-slideUp ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        {/* Header Search Input */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center gap-3 shrink-0 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div
            className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-2xl border transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-200 focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20'
                : 'bg-slate-800/80 border-slate-750 focus-within:border-primary focus-within:bg-slate-850 focus-within:ring-2 focus-within:ring-primary/20'
            }`}
          >
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              id="search-discovery-input"
              type="text"
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search salons, services, hair treatments, stylists..."
              className="w-full bg-transparent text-sm focus:outline-none placeholder:text-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggle Advanced Filters Button */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-2xl border transition-all relative ${
              showFilters || hasActiveFilters
                ? 'bg-primary text-white border-primary shadow-md'
                : isLight
                ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                : 'bg-slate-800 text-slate-300 border-slate-750 hover:bg-slate-750'
            }`}
            title="Filter Options"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {hasActiveFilters && !showFilters && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* Close Modal Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Collapsible Filter Tray */}
        {showFilters && (
          <div
            className={`p-4 sm:p-5 border-b space-y-4 shrink-0 animate-fadeIn ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Filter Discovery Results
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset all</span>
                </button>
              )}
            </div>

            {/* Service Category Buttons */}
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-2">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {['All', ...SERVICE_CATEGORIES].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                      selectedCategory === cat
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : isLight
                        ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Row: Rating + Price + Open Now */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Rating Filter */}
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Min Rating</label>
                <div className="flex items-center gap-1">
                  {[0, 4.0, 4.5, 4.8].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setMinRating(r)}
                      className={`flex-1 py-1 px-1 rounded-lg text-xs font-bold border transition-all text-center ${
                        minRating === r
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : isLight
                          ? 'bg-white text-slate-600 border-slate-200'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {r === 0 ? 'Any' : `${r}+ ★`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Price Tier</label>
                <div className="flex items-center gap-1">
                  {['All', '$', '$$', '$$$'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriceFilter(p)}
                      className={`flex-1 py-1 px-1 rounded-lg text-xs font-bold border transition-all text-center ${
                        priceFilter === p
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : isLight
                          ? 'bg-white text-slate-600 border-slate-200'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Open Now Toggle */}
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Status</label>
                <button
                  type="button"
                  onClick={() => setOpenNowOnly(!openNowOnly)}
                  className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                    openNowOnly
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                      : isLight
                      ? 'bg-white text-slate-600 border-slate-200'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${openNowOnly ? 'bg-white animate-pulse' : 'bg-emerald-500'}`} />
                  <span>Open Now Only</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Switcher Tabs (All / Salons / Services) */}
        <div
          className={`flex items-center gap-2 px-4 sm:px-6 pt-3 border-b shrink-0 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'all'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            All Results ({filteredSalons.length + filteredServices.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('salons')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'salons'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Salons ({filteredSalons.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'services'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Services ({filteredServices.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Quick Suggestions if no search query */}
          {!searchQuery && !hasActiveFilters && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Popular Searches
              </span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SUGGESTIONS.map(sug => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setSearchQuery(sug)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isLight
                        ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Salons Section */}
          {(activeTab === 'all' || activeTab === 'salons') && filteredSalons.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Store className="w-3.5 h-3.5 text-primary" />
                <span>Salons ({filteredSalons.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredSalons.map(salon => (
                  <SalonCard key={salon.id} salon={salon} compact />
                ))}
              </div>
            </div>
          )}

          {/* Services Section */}
          {(activeTab === 'all' || activeTab === 'services') && filteredServices.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Scissors className="w-3.5 h-3.5 text-primary" />
                <span>Services ({filteredServices.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredServices.map(service => (
                  <ServiceBannerCard
                    key={service.id}
                    service={service}
                    onBook={handleBookService}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredSalons.length === 0 && filteredServices.length === 0 && (
            <div className="text-center py-16 space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold">No results found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                We couldn't find any salons or services matching "{searchQuery}". Try different keywords or reset your filters.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white shadow-md active:scale-95"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
