import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SalonCard } from './SalonCard';
import {
  Heart,
  Compass,
  Search,
  ArrowUpDown,
} from 'lucide-react';

export const CustomerSavedView: React.FC = () => {
  const {
    salons,
    customerUser,
    setActiveCustomerTab,
    currentThemeConfig,
    colorThemeMode,
  } = useApp();

  const isLight = colorThemeMode === 'light';
  const savedSalons = salons.filter(s => customerUser.savedSalonIds.includes(s.id));

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'rating' | 'distance' | 'name'>('rating');

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    savedSalons.forEach(s => {
      s.categories.forEach(c => set.add(c));
    });
    return ['All', ...Array.from(set)];
  }, [savedSalons]);

  const filteredAndSortedSalons = useMemo(() => {
    let result = savedSalons.filter(s => {
      if (selectedCategory !== 'All' && !s.categories.includes(selectedCategory)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          s.tagline.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return result.sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'distance') return a.distanceKm - b.distanceKm;
      return a.name.localeCompare(b.name);
    });
  }, [savedSalons, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span
            className="text-xs font-extrabold uppercase tracking-widest block mb-1"
            style={{ color: currentThemeConfig.primaryHex }}
          >
            SAVED STUDIOS
          </span>
          <h1
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-['Outfit',sans-serif] ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            Your Favorite Salons{savedSalons.length > 0 ? ` (${savedSalons.length})` : ''}
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Quickly re-visit, check open hours, and book your trusted styling spots.
          </p>
        </div>

        {savedSalons.length > 0 && (
          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-2 ${
                isLight ? 'bg-white border-slate-200 text-slate-800 shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent font-bold focus:outline-none cursor-pointer"
              >
                <option value="rating" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>
                  Top Rated
                </option>
                <option value="distance" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>
                  Nearest Distance
                </option>
                <option value="name" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>
                  Alphabetical
                </option>
              </select>
            </div>
          </div>
        )}
      </div>

      {savedSalons.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search saved salons by name or address..."
                className={`w-full rounded-2xl pl-10 pr-4 py-2.5 text-xs border transition-all focus:outline-none ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-slate-400 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-slate-700'
                }`}
              />
            </div>
          </div>

          {allCategories.length > 2 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {allCategories.map(cat => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'text-white shadow-sm'
                        : isLight
                        ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                    style={{
                      backgroundColor: isSelected ? currentThemeConfig.primaryHex : undefined,
                      borderColor: isSelected ? currentThemeConfig.primaryHex : undefined,
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {savedSalons.length === 0 ? (
        <div
          className={`p-12 rounded-3xl border text-center space-y-4 transition-colors ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-sm border ${
              isLight ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-rose-950/40 border-rose-800 text-rose-400'
            }`}
          >
            <Heart className="w-7 h-7 fill-current" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              No Saved Salons Yet
            </h3>
            <p className={`text-xs sm:text-sm max-w-sm mx-auto mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Tap the heart icon on any salon card to save it here for fast one-tap rebooking and opening updates.
            </p>
          </div>
          <button
            type="button"
            id="saved-explore-btn"
            onClick={() => setActiveCustomerTab('discover')}
            className="px-5 py-2.5 rounded-xl text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 mx-auto transition-transform active:scale-95"
            style={{
              backgroundColor: currentThemeConfig.primaryHex,
              boxShadow: `0 4px 14px -2px ${currentThemeConfig.glowHex}`,
            }}
          >
            <Compass className="w-4 h-4" />
            <span>Explore Nearby Salons</span>
          </button>
        </div>
      ) : filteredAndSortedSalons.length === 0 ? (
        <div
          className={`p-10 rounded-3xl border text-center space-y-3 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <Search className={`w-8 h-8 mx-auto ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
          <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            No saved salons match "{searchQuery}"
          </h3>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="text-xs font-bold underline"
            style={{ color: currentThemeConfig.primaryHex }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAndSortedSalons.map(salon => (
            <SalonCard key={`saved-card-${salon.id}`} salon={salon} />
          ))}
        </div>
      )}
    </div>
  );
};
