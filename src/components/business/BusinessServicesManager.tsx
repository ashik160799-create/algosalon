import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceItem } from '../../types';
import { ServiceBannerCard } from '../common/ServiceBannerCard';
import { AiBannerModal } from '../common/AiBannerModal';
import { getRecommendedAiBanner } from '../../utils/aiBannerGenerator';
import {
  Scissors,
  Plus,
  Search,
  CheckCircle2,
  X,
  Sparkles,
  Tag,
  Clock,
  Wand2,
  Percent,
  Calculator,
  TrendingDown,
  Users,
  User,
} from 'lucide-react';

export const BusinessServicesManager: React.FC = () => {
  const {
    businessUser,
    salons,
    services,
    addService,
    updateService,
    deleteService,
    currentThemeConfig,
    colorThemeMode,
    formatPrice,
    activeCountry,
  } = useApp();

  const isLight = colorThemeMode === 'light';
  const salon = salons.find(s => s.id === businessUser.salonId) || salons[0];
  const salonServices = services.filter(s => s.salonId === salon?.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedGender, setSelectedGender] = useState<string>('All');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [activeServiceForAi, setActiveServiceForAi] = useState<ServiceItem | null>(null);
  const [isModalAiPicker, setIsModalAiPicker] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ServiceItem['category']>('Haircut');
  const [genderTarget, setGenderTarget] = useState<'Unisex' | 'Male' | 'Female'>('Unisex');
  const [priceStr, setPriceStr] = useState('28');
  const [originalPriceStr, setOriginalPriceStr] = useState('35');
  const [discountPercentStr, setDiscountPercentStr] = useState('20');
  const [offerTag, setOfferTag] = useState('20% off');
  const [durationMinutesStr, setDurationMinutesStr] = useState('30');
  const [description, setDescription] = useState('Hair services • Precision cut, wash, hot towel finish & styling.');
  const [image, setImage] = useState('');
  const [isPopular, setIsPopular] = useState(false);

  const categoriesList: Array<ServiceItem['category']> = [
    'Haircut',
    'Styling',
    'Coloring',
    'Beard & Shave',
    'Spa & Facial',
    'Nails & Lashes',
  ];

  const quickPresets = [
    { name: 'Signature Haircut', cat: 'Haircut', dur: 30, p: 28, orig: 35, desc: 'Hair services • Precision cut, wash, hot towel finish & styling.' },
    { name: 'Beard Sculpt & Shave', cat: 'Beard & Shave', dur: 25, p: 22, orig: 30, desc: 'Hot towel prep, straight razor lining, beard balm conditioning.' },
    { name: 'Balayage & Hair Gloss', cat: 'Coloring', dur: 90, p: 95, orig: 120, desc: 'Custom hand-painted highlights, gloss toner & blowout.' },
    { name: 'Deep Cleanse Facial & Spa', cat: 'Spa & Facial', dur: 45, p: 55, orig: 70, desc: 'Exfoliation, ultrasonic pore cleanse, hydration mask & neck massage.' },
  ];

  const sanitizeNum = (val: string, allowDecimals = false): string => {
    let cleaned = allowDecimals ? val.replace(/[^0-9.]/g, '') : val.replace(/[^0-9]/g, '');
    if (allowDecimals) {
      const parts = cleaned.split('.');
      if (parts.length > 2) {
        cleaned = parts[0] + '.' + parts.slice(1).join('');
      }
    }
    // Remove leading zeroes if followed by another digit, e.g. "050" -> "50"
    if (cleaned.length > 1 && cleaned.startsWith('0') && !cleaned.startsWith('0.')) {
      cleaned = cleaned.replace(/^0+/, '') || '0';
    }
    return cleaned;
  };

  const handleRegularPriceChange = (raw: string) => {
    const clean = sanitizeNum(raw, true);
    setOriginalPriceStr(clean);

    const regNum = parseFloat(clean);
    const discNum = parseFloat(discountPercentStr);

    if (!isNaN(regNum) && regNum > 0) {
      if (!isNaN(discNum) && discNum > 0) {
        const calculatedOffer = Math.max(0, Math.round(regNum * (1 - discNum / 100) * 100) / 100);
        setPriceStr(String(calculatedOffer));
        setOfferTag(`${discNum}% off`);
      } else {
        const offerNum = parseFloat(priceStr);
        if (!isNaN(offerNum) && offerNum > 0 && regNum > offerNum) {
          const calculatedDisc = Math.round(((regNum - offerNum) / regNum) * 100);
          setDiscountPercentStr(String(calculatedDisc));
          setOfferTag(`${calculatedDisc}% off`);
        }
      }
    }
  };

  const handleDiscountPercentChange = (raw: string) => {
    const clean = sanitizeNum(raw, false);
    const discNum = parseInt(clean, 10);
    const clampedDisc = isNaN(discNum) ? '' : String(Math.min(99, Math.max(0, discNum)));
    setDiscountPercentStr(clampedDisc);

    const regNum = parseFloat(originalPriceStr);
    const finalDisc = parseFloat(clampedDisc);

    if (!isNaN(regNum) && regNum > 0) {
      if (!isNaN(finalDisc) && finalDisc > 0) {
        const calculatedOffer = Math.max(0, Math.round(regNum * (1 - finalDisc / 100) * 100) / 100);
        setPriceStr(String(calculatedOffer));
        setOfferTag(`${finalDisc}% off`);
      } else if (finalDisc === 0 || clampedDisc === '') {
        setPriceStr(String(regNum));
        setOfferTag('');
      }
    }
  };

  const handleOfferPriceChange = (raw: string) => {
    const clean = sanitizeNum(raw, true);
    setPriceStr(clean);

    const offerNum = parseFloat(clean);
    const regNum = parseFloat(originalPriceStr);

    if (!isNaN(offerNum) && !isNaN(regNum) && regNum > 0) {
      if (regNum > offerNum) {
        const calculatedDisc = Math.round(((regNum - offerNum) / regNum) * 100);
        setDiscountPercentStr(String(calculatedDisc));
        setOfferTag(`${calculatedDisc}% off`);
      } else {
        setDiscountPercentStr('0');
        setOfferTag('');
      }
    }
  };

  const handleQuickDiscountSelect = (percent: number) => {
    setDiscountPercentStr(String(percent));
    const regNum = parseFloat(originalPriceStr);
    if (!isNaN(regNum) && regNum > 0) {
      if (percent > 0) {
        const calculatedOffer = Math.max(0, Math.round(regNum * (1 - percent / 100) * 100) / 100);
        setPriceStr(String(calculatedOffer));
        setOfferTag(`${percent}% off`);
      } else {
        setPriceStr(String(regNum));
        setOfferTag('');
      }
    }
  };

  const handleDurationChange = (raw: string) => {
    const clean = sanitizeNum(raw, false);
    setDurationMinutesStr(clean);
  };

  const handleOpenCreate = () => {
    setEditingServiceId(null);
    setName('Signature Haircut');
    setCategory('Haircut');
    setGenderTarget('Unisex');
    setPriceStr('28');
    setOriginalPriceStr('35');
    setDiscountPercentStr('20');
    setOfferTag('20% off');
    setDurationMinutesStr('30');
    setDescription('Hair services • Precision cut, wash, hot towel finish & styling.');
    const recommended = getRecommendedAiBanner('Haircut', 'Haircut', 'Unisex');
    setImage(recommended.imageUrl);
    setIsPopular(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (srv: ServiceItem) => {
    setEditingServiceId(srv.id);
    setName(srv.name);
    setCategory(srv.category);
    setGenderTarget(srv.genderTarget || 'Unisex');
    setPriceStr(String(srv.price));
    const defOrig = srv.originalPrice || Math.round(srv.price * 1.25);
    setOriginalPriceStr(String(defOrig));
    const calculatedDisc =
      defOrig > srv.price ? Math.round(((defOrig - srv.price) / defOrig) * 100) : (srv.discountPercent || 0);
    setDiscountPercentStr(String(calculatedDisc));
    setOfferTag(srv.offerTag || (calculatedDisc > 0 ? `${calculatedDisc}% off` : ''));
    setDurationMinutesStr(String(srv.durationMinutes || 30));
    setDescription(srv.description);
    setImage(srv.image || getRecommendedAiBanner(srv.name, srv.category, srv.genderTarget || 'Unisex').imageUrl);
    setIsPopular(!!srv.isPopular);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const regularNum = parseFloat(originalPriceStr) || parseFloat(priceStr) || 0;
    const offerNum = parseFloat(priceStr) || regularNum || 0;
    const finalDiscountPercent = regularNum > offerNum ? Math.round(((regularNum - offerNum) / regularNum) * 100) : 0;
    const finalDuration = parseInt(durationMinutesStr, 10) || 30;

    const serviceData = {
      salonId: salon ? salon.id : businessUser.salonId,
      name: name.trim(),
      category,
      genderTarget,
      price: offerNum,
      originalPrice: regularNum,
      discountPercent: finalDiscountPercent,
      offerTag: offerTag.trim() || (finalDiscountPercent > 0 ? `${finalDiscountPercent}% off` : ''),
      durationMinutes: finalDuration,
      description: description.trim(),
      image: image.trim() || getRecommendedAiBanner(name, category, genderTarget).imageUrl,
      isPopular,
    };

    if (editingServiceId) {
      updateService(editingServiceId, serviceData);
      setNotificationMsg(`Service "${name}" updated successfully!`);
    } else {
      addService(serviceData);
      setNotificationMsg(`Service "${name}" added to salon menu!`);
    }

    setModalOpen(false);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const handleOpenAiStudio = (srv: ServiceItem) => {
    setIsModalAiPicker(false);
    setActiveServiceForAi(srv);
    setAiModalOpen(true);
  };

  const handleOpenAiPickerForModal = () => {
    setIsModalAiPicker(true);
    setActiveServiceForAi({
      id: 'temp',
      salonId: businessUser.salonId,
      name: name || 'Service Banner',
      category,
      genderTarget,
      price: parseFloat(priceStr) || 0,
      durationMinutes: parseInt(durationMinutesStr, 10) || 30,
      description,
      image,
    });
    setAiModalOpen(true);
  };

  const handleApplyAiBanner = (newImg: string) => {
    if (isModalAiPicker) {
      setImage(newImg);
    } else if (activeServiceForAi && activeServiceForAi.id !== 'temp') {
      updateService(activeServiceForAi.id, { image: newImg });
      setNotificationMsg('AI Banner updated successfully!');
      setTimeout(() => setNotificationMsg(null), 2500);
    }
  };

  const filteredServices = salonServices.filter(srv => {
    const matchesCategory = selectedCategory === 'All' || srv.category === selectedCategory;
    const matchesGender =
      selectedGender === 'All' ||
      (srv.genderTarget || 'Unisex') === selectedGender ||
      (selectedGender === 'Unisex' && !srv.genderTarget);

    const matchesSearch =
      srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (srv.genderTarget && srv.genderTarget.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesGender && matchesSearch;
  });

  // Calculate gender counts for quick visibility
  const genderCounts = {
    All: salonServices.length,
    Unisex: salonServices.filter(s => !s.genderTarget || s.genderTarget === 'Unisex').length,
    Male: salonServices.filter(s => s.genderTarget === 'Male').length,
    Female: salonServices.filter(s => s.genderTarget === 'Female').length,
  };

  const parsedRegularPrice = parseFloat(originalPriceStr) || 0;
  const parsedOfferPrice = parseFloat(priceStr) || 0;
  const parsedDiscount = parseFloat(discountPercentStr) || 0;
  const calculatedSavings = Math.max(0, parsedRegularPrice - parsedOfferPrice);

  const isFiltered = searchQuery.trim() !== '' || selectedCategory !== 'All' || selectedGender !== 'All';

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Header with Title */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Services
          </h1>
        </div>
      </div>

      {notificationMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotificationMsg(null)}
            className="text-emerald-400 hover:text-emerald-200 text-sm font-black px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter & Search Hub */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border flex flex-col gap-4 shadow-sm ${
          isLight ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
        }`}
      >
        {/* Top Controls: Search Input & High-Visibility Gender Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="service-search-input"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by haircut, beard, coloring, facial, or keyword..."
              className={`w-full pl-10 pr-9 py-2.5 text-xs font-semibold rounded-2xl border focus:outline-none transition-all ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400 focus:bg-white'
                  : 'bg-slate-950 border-slate-800 text-white focus:border-slate-600 focus:bg-slate-900'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* High-Visibility Gender Filter Buttons (All, Unisex, Male, Female) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar shrink-0">
            {(
              [
                { id: 'All', label: 'All', icon: Users, count: genderCounts.All },
                { id: 'Unisex', label: 'Unisex', icon: Sparkles, count: genderCounts.Unisex },
                { id: 'Male', label: 'Male', icon: User, count: genderCounts.Male },
                { id: 'Female', label: 'Female', icon: User, count: genderCounts.Female },
              ] as const
            ).map(item => {
              const isSelected = selectedGender === item.id;
              const IconComp = item.icon;

              return (
                <button
                  key={item.id}
                  id={`filter-gender-${item.id.toLowerCase()}`}
                  type="button"
                  onClick={() => setSelectedGender(item.id)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                    isSelected
                      ? 'text-white border-transparent shadow-md'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200/90 text-slate-700 hover:text-slate-900 border-slate-200'
                      : 'bg-slate-800/90 hover:bg-slate-750 text-slate-200 hover:text-white border-slate-700'
                  }`}
                  style={{
                    backgroundColor: isSelected ? currentThemeConfig.primaryHex : undefined,
                    boxShadow: isSelected ? `0 4px 12px -2px ${currentThemeConfig.glowHex}` : undefined,
                  }}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
                        isSelected
                          ? 'bg-black/25 text-white'
                          : isLight
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <button
            id="filter-category-all"
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer border ${
              selectedCategory === 'All'
                ? 'text-white border-transparent shadow-xs'
                : isLight
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200/80'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border-slate-700/80'
            }`}
            style={{
              backgroundColor: selectedCategory === 'All' ? currentThemeConfig.primaryHex : undefined,
            }}
          >
            All Treatments{salonServices.length > 0 ? ` (${salonServices.length})` : ''}
          </button>
          {categoriesList.map(cat => {
            const countInCat = salonServices.filter(s => s.category === cat).length;
            const isCatSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                id={`filter-category-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                  isCatSelected
                    ? 'text-white border-transparent shadow-xs'
                    : isLight
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200/80'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border-slate-700/80'
                }`}
                style={{
                  backgroundColor: isCatSelected ? currentThemeConfig.primaryHex : undefined,
                }}
              >
                {cat}{countInCat > 0 ? ` (${countInCat})` : ''}
              </button>
            );
          })}
        </div>

        {/* Results summary & reset if filters applied */}
        {isFiltered && (
          <div className="flex items-center justify-between pt-1 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing <strong>{filteredServices.length}</strong> of {salonServices.length} services
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedGender('All');
              }}
              className="text-xs font-bold text-amber-500 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Add Service Action (Left Aligned above Service Banners) */}
      <div className="flex items-center justify-start">
        <button
          id="add-service-btn"
          type="button"
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm text-white shadow-md transition-all flex items-center justify-center gap-2 hover:opacity-95 active:scale-95 cursor-pointer shrink-0"
          style={{
            backgroundColor: currentThemeConfig.primaryHex,
            boxShadow: `0 4px 14px ${currentThemeConfig.glowHex}`,
          }}
        >
          <Plus className="w-4 h-4" />
          <span>Add Service</span>
        </button>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div
          className={`p-12 text-center rounded-3xl border ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <Scissors className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
          <h3 className={`text-base font-black ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
            No Services Found
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            No offerings match your current search, category, or gender filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedGender('All');
            }}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-black text-white shadow-xs"
            style={{ backgroundColor: currentThemeConfig.primaryHex }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredServices.map(srv => (
            <ServiceBannerCard
              key={srv.id}
              service={srv}
              variant="business"
              onEdit={handleOpenEdit}
              onDelete={deleteService}
              onRegenerateAiBanner={handleOpenAiStudio}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Service Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`w-full max-w-2xl max-h-[90vh] rounded-3xl border overflow-y-auto shadow-2xl ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121316] border-slate-800 text-white'
            }`}
          >
            <div className="sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between backdrop-blur-md bg-inherit">
              <div>
                <span
                  className="text-[10px] font-black uppercase tracking-widest"
                  style={{ color: currentThemeConfig.primaryHex }}
                >
                  {editingServiceId ? 'Update Offering' : 'New Offering'}
                </span>
                <h3 className="text-lg font-black tracking-tight">
                  {editingServiceId ? 'Edit Service & Pricing' : 'Add New Salon Service'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Quick Template Presets for new service */}
              {!editingServiceId && (
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-2">
                    ⚡ Quick Template Presets
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {quickPresets.map(preset => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setName(preset.name);
                          setCategory(preset.cat as any);
                          setDurationMinutesStr(String(preset.dur));
                          setOriginalPriceStr(String(preset.orig));
                          setPriceStr(String(preset.p));
                          const disc = Math.round(((preset.orig - preset.p) / preset.orig) * 100);
                          setDiscountPercentStr(String(disc));
                          setOfferTag(`${disc}% off`);
                          setDescription(preset.desc);
                          const recommended = getRecommendedAiBanner(preset.name, preset.cat, genderTarget);
                          setImage(recommended.imageUrl);
                        }}
                        className={`p-2.5 rounded-2xl border text-left text-xs transition-all ${
                          name === preset.name
                            ? 'border-indigo-500 bg-indigo-500/10 font-bold'
                            : isLight
                            ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            : 'bg-slate-900 border-slate-800 hover:bg-slate-850'
                        }`}
                      >
                        <span className="block font-bold truncate">{preset.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {activeCountry.currency} {preset.p} • {preset.dur}m
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Name */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  Service Title *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Master Fade & Hot Towel Shave"
                  className={`w-full px-4 py-2.5 rounded-2xl border text-sm font-semibold outline-none transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
                      : 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500'
                  }`}
                />
              </div>

              {/* Category and Target Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className={`w-full px-4 py-2.5 rounded-2xl border text-xs font-bold outline-none cursor-pointer ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    {categoriesList.map(c => (
                      <option key={c} value={c} className="bg-slate-900 text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    Target Audience *
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                    {(['Unisex', 'Male', 'Female'] as const).map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGenderTarget(g)}
                        className={`py-1.5 rounded-xl font-bold transition-all text-center ${
                          genderTarget === g
                            ? 'text-white shadow-xs'
                            : isLight
                            ? 'text-slate-600 hover:text-slate-900'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        style={{
                          backgroundColor: genderTarget === g ? currentThemeConfig.primaryHex : undefined,
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pricing, Discount & Auto-Calculation Section */}
              <div className={`p-4 rounded-3xl border space-y-4 ${
                isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-900/60 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4" style={{ color: currentThemeConfig.primaryHex }} />
                    <span className="text-xs font-extrabold tracking-tight">
                      Pricing & Discount Calculator
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">
                    Currency: {activeCountry.currency}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Regular / Original Price */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1.5">
                      Regular Price ({activeCountry.currency}) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        {activeCountry.currency}
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={originalPriceStr}
                        onChange={e => handleRegularPriceChange(e.target.value)}
                        placeholder="e.g. 50"
                        className={`w-full pl-9 pr-3 py-2.5 rounded-2xl border text-sm font-mono font-bold outline-none transition-all ${
                          isLight
                            ? 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'
                            : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Discount Percentage (%) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-400">
                        Discount (%)
                      </label>
                      {discountPercentStr && Number(discountPercentStr) > 0 && (
                        <span className="text-[10px] font-extrabold text-emerald-400">
                          {discountPercentStr}% SAVINGS
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Percent className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={discountPercentStr}
                        onChange={e => handleDiscountPercentChange(e.target.value)}
                        placeholder="e.g. 20"
                        className={`w-full pl-9 pr-3 py-2.5 rounded-2xl border text-sm font-mono font-bold outline-none transition-all ${
                          isLight
                            ? 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'
                            : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Offer Price (Final calculated or manually adjusted) */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1.5">
                      Final Offer Price ({activeCountry.currency}) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">
                        {activeCountry.currency}
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={priceStr}
                        onChange={e => handleOfferPriceChange(e.target.value)}
                        placeholder="e.g. 40"
                        className={`w-full pl-9 pr-3 py-2.5 rounded-2xl border text-sm font-mono font-bold outline-none transition-all ${
                          isLight
                            ? 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                            : 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Discount Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-indigo-400" />
                    Quick %:
                  </span>
                  {[0, 10, 15, 20, 25, 30, 50].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleQuickDiscountSelect(p)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                        discountPercentStr === String(p)
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : isLight
                          ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          : 'bg-slate-800/80 border border-slate-750 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {p === 0 ? 'No Discount' : `${p}% off`}
                    </button>
                  ))}
                </div>

                {/* Live Calculated Summary Display */}
                {parsedRegularPrice > 0 && (
                  <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                    isLight ? 'bg-indigo-50/50 border-indigo-100 text-slate-800' : 'bg-indigo-950/20 border-indigo-900/40 text-slate-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 line-through">
                        {formatPrice(parsedRegularPrice)}
                      </span>
                      <span className="font-black text-sm text-emerald-400">
                        {formatPrice(parsedOfferPrice)}
                      </span>
                      {parsedDiscount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {parsedDiscount}% OFF
                        </span>
                      )}
                    </div>
                    {calculatedSavings > 0 && (
                      <div className="text-[11px] font-bold text-emerald-400">
                        Customer saves {formatPrice(calculatedSavings)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Duration & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    Duration (Minutes)
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={durationMinutesStr}
                      onChange={e => handleDurationChange(e.target.value)}
                      placeholder="30"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-2xl border text-sm font-mono font-bold outline-none ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    Badge / Offer Tag
                  </label>
                  <div className="relative">
                    <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={offerTag}
                      onChange={e => setOfferTag(e.target.value)}
                      placeholder="e.g. 20% off, SPECIAL DEAL"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-2xl border text-xs font-semibold outline-none ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Popular Checkbox */}
              <div className="flex items-center pb-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={e => setIsPopular(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Mark as Featured / Popular Treatment
                  </span>
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  Service Description & Inclusions
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the treatment, included products, styling finish..."
                  className={`w-full px-4 py-2.5 rounded-2xl border text-xs font-medium outline-none ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                  }`}
                />
              </div>

              {/* Banner Image & AI Studio */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-400">
                    Banner Artwork Image URL
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenAiPickerForModal}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2.5 py-1 rounded-xl border border-indigo-500/20"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Pick AI Curated Banner</span>
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={image}
                    onChange={e => setImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className={`flex-1 px-4 py-2.5 rounded-2xl border text-xs font-mono outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                    }`}
                  />
                  {image && (
                    <img
                      src={image}
                      alt="preview"
                      className="w-12 h-10 rounded-xl object-cover border border-slate-700"
                    />
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold border transition-colors ${
                    isLight
                      ? 'border-slate-200 text-slate-700 hover:bg-slate-100'
                      : 'border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl text-xs font-black text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: currentThemeConfig.primaryHex,
                    boxShadow: `0 4px 14px ${currentThemeConfig.glowHex}`,
                  }}
                >
                  {editingServiceId ? 'Save Changes' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeServiceForAi && (
        <AiBannerModal
          isOpen={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
          service={activeServiceForAi}
          serviceName={activeServiceForAi.name}
          category={activeServiceForAi.category}
          genderTarget={activeServiceForAi.genderTarget || 'Unisex'}
          currentImage={activeServiceForAi.image || image || ''}
          onSelectImage={handleApplyAiBanner}
          onApplyBanner={(img) => handleApplyAiBanner(img)}
        />
      )}
    </div>
  );
};

