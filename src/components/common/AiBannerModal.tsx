import React, { useState } from 'react';
import { ServiceItem } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  AI_BANNER_PRESETS,
  generateAiPromptForService,
} from '../../utils/aiBannerGenerator';
import {
  Wand2,
  Sparkles,
  RefreshCw,
  Check,
  X,
  Copy,
} from 'lucide-react';

interface AiBannerModalProps {
  service?: ServiceItem | null;
  serviceName?: string;
  category?: string;
  genderTarget?: 'Unisex' | 'Male' | 'Female';
  currentImage?: string;
  offerTag?: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  onApplyBanner?: (newImageUrl: string, promptUsed?: string) => void;
  onSelectImage?: (newImageUrl: string) => void;
}

export const AiBannerModal: React.FC<AiBannerModalProps> = ({
  service,
  serviceName,
  category,
  genderTarget: initialGenderTarget,
  currentImage,
  offerTag,
  description,
  isOpen,
  onClose,
  onApplyBanner,
  onSelectImage,
}) => {
  const { currentThemeConfig, colorThemeMode } = useApp();
  const isLight = colorThemeMode === 'light';

  const effectiveName = service?.name || serviceName || 'Salon Service';
  const effectiveCategory = service?.category || category || 'Haircut';
  const defaultGender: 'Unisex' | 'Male' | 'Female' =
    service?.genderTarget || initialGenderTarget || 'Unisex';
  const defaultImage =
    service?.image || currentImage || AI_BANNER_PRESETS[0].imageUrl;
  const effectiveOfferTag = service?.offerTag || offerTag || '20% off';
  const effectiveDescription =
    service?.description || description || 'Premium professional salon care & styling.';

  const [genderTarget, setGenderTarget] = useState<'Unisex' | 'Male' | 'Female'>(defaultGender);
  const [customStyle, setCustomStyle] = useState('Cinematic Studio Lighting');
  const [prompt, setPrompt] = useState(() =>
    generateAiPromptForService(effectiveName, effectiveCategory, defaultGender)
  );
  const [selectedImage, setSelectedImage] = useState<string>(defaultImage);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Sync state when opened with a new service
  React.useEffect(() => {
    if (isOpen) {
      const g = service?.genderTarget || initialGenderTarget || 'Unisex';
      const img = service?.image || currentImage || AI_BANNER_PRESETS[0].imageUrl;
      setGenderTarget(g);
      setSelectedImage(img);
      setPrompt(generateAiPromptForService(effectiveName, effectiveCategory, g));
    }
  }, [isOpen, service, serviceName, category, initialGenderTarget, currentImage]);

  if (!isOpen) return null;

  const handleRegeneratePrompt = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const newPrompt = generateAiPromptForService(
        effectiveName,
        effectiveCategory,
        genderTarget,
        `Style: ${customStyle}`
      );
      setPrompt(newPrompt);

      const match = AI_BANNER_PRESETS.filter(
        p => p.category === effectiveCategory || p.genderTarget === genderTarget
      );
      if (match.length > 0) {
        const randomImg = match[Math.floor(Math.random() * match.length)].imageUrl;
        setSelectedImage(randomImg);
      }
      setIsGenerating(false);
    }, 450);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleApply = () => {
    if (onApplyBanner) {
      onApplyBanner(selectedImage, prompt);
    }
    if (onSelectImage) {
      onSelectImage(selectedImage);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-2xl rounded-3xl border p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border"
              style={{
                backgroundColor: `${currentThemeConfig.primaryHex}20`,
                borderColor: `${currentThemeConfig.primaryHex}40`,
                color: currentThemeConfig.primaryHex,
              }}
            >
              <Wand2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI Visual Studio
              </span>
              <h3 className="text-lg font-black">Generate Service Banner</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold mb-1.5 text-slate-400 uppercase tracking-wider">
            Banner Preview
          </label>
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 h-44 shadow-lg">
            <img
              src={selectedImage}
              alt="AI Preview"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute top-3 left-3 right-3 flex justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-black/50 backdrop-blur-md text-white border border-white/10">
                {genderTarget}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-500 text-white shadow">
                {effectiveOfferTag}
              </span>
            </div>
            <div className="absolute bottom-3 left-4 right-4">
              <h4 className="text-lg font-black text-white">{effectiveName}</h4>
              <p className="text-xs text-slate-300 line-clamp-1">{effectiveDescription}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Automatic Prompt Configuration
            </label>
            <button
              type="button"
              onClick={handleRegeneratePrompt}
              disabled={isGenerating}
              className="text-xs font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate Prompt</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold mb-1">Target Audience</label>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                {(['Unisex', 'Male', 'Female'] as const).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setGenderTarget(g);
                      setPrompt(generateAiPromptForService(effectiveName, effectiveCategory, g));
                    }}
                    className={`py-1.5 rounded-lg font-bold text-center transition-all ${
                      genderTarget === g
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1">Visual Atmosphere</label>
              <select
                value={customStyle}
                onChange={e => {
                  setCustomStyle(e.target.value);
                  setPrompt(
                    generateAiPromptForService(
                      effectiveName,
                      effectiveCategory,
                      genderTarget,
                      `Style: ${e.target.value}`
                    )
                  );
                }}
                className={`w-full p-2.5 rounded-xl border font-semibold text-xs focus:outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-950 border-slate-800 text-white'
                }`}
              >
                <option value="Cinematic Studio Lighting">Cinematic Studio Lighting</option>
                <option value="Luxury Barber & Vintage Brass">Luxury Barber & Vintage Brass</option>
                <option value="High-Fashion Runway Minimal">High-Fashion Runway Minimal</option>
                <option value="Warm Botanical Zen Spa">Warm Botanical Zen Spa</option>
                <option value="Editorial Macro Beauty">Editorial Macro Beauty</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-bold mb-1 text-slate-400">
              Active AI Generation Prompt:
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className={`w-full p-3 text-xs font-mono rounded-xl border focus:outline-none leading-relaxed ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-indigo-500'
                  : 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500'
              }`}
            />
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="absolute right-2.5 bottom-2.5 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 border border-slate-700 shadow-sm"
              title="Copy Prompt"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedPrompt ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold mb-2 text-slate-400 uppercase tracking-wider">
            Select Generated Visual Art
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto custom-scrollbar p-1">
            {AI_BANNER_PRESETS.map(preset => {
              const isSelected = selectedImage === preset.imageUrl;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSelectedImage(preset.imageUrl);
                    setPrompt(preset.suggestedPrompt);
                    setGenderTarget(preset.genderTarget);
                  }}
                  className={`group relative h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-[1.02]'
                      : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                >
                  <img
                    src={preset.imageUrl}
                    alt={preset.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <span className="absolute bottom-1 left-1.5 right-1.5 text-[9px] font-bold text-white truncate text-left">
                    {preset.title}
                  </span>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl text-xs font-black text-white shadow-md flex items-center gap-1.5 transition-all hover:opacity-95"
            style={{ backgroundColor: currentThemeConfig.primaryHex }}
          >
            <Check className="w-4 h-4" />
            <span>Apply Banner to Service</span>
          </button>
        </div>
      </div>
    </div>
  );
};
