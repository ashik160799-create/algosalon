import React from 'react';
import { ServiceItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { getRecommendedAiBanner } from '../../utils/aiBannerGenerator';
import {
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  Calendar,
  Wand2,
  Tag,
} from 'lucide-react';

interface ServiceBannerCardProps {
  service: ServiceItem;
  variant?: 'business' | 'customer';
  onBook?: (service: ServiceItem) => void;
  onEdit?: (service: ServiceItem) => void;
  onDelete?: (serviceId: string) => void;
  onRegenerateAiBanner?: (service: ServiceItem) => void;
  className?: string;
  showCurrency?: string;
}

export const ServiceBannerCard: React.FC<ServiceBannerCardProps> = ({
  service,
  variant = 'customer',
  onBook,
  onEdit,
  onDelete,
  onRegenerateAiBanner,
  className = '',
  showCurrency,
}) => {
  const { currentThemeConfig, colorThemeMode, formatPrice } = useApp();

  const isLight = colorThemeMode === 'light';

  const gender = service.genderTarget || 'Unisex';
  const discountPercent =
    service.discountPercent ||
    (service.originalPrice && service.originalPrice > service.price
      ? Math.round(((service.originalPrice - service.price) / service.originalPrice) * 100)
      : 20);

  const originalPrice =
    service.originalPrice ||
    (discountPercent > 0 ? Math.round(service.price / (1 - discountPercent / 100)) : service.price + 10);

  const offerTag = service.offerTag || `${discountPercent}% off`;

  const fallbackImg = getRecommendedAiBanner(
    service.name,
    service.category,
    service.genderTarget || 'Unisex'
  ).imageUrl;

  const bannerImage = service.image || (service as any).bannerImage || fallbackImg;

  return (
    <div
      id={`service-card-${service.id}`}
      className={`group relative w-full rounded-3xl overflow-hidden border transition-all duration-300 shadow-xl ${
        isLight
          ? 'bg-slate-900 border-slate-800 text-white'
          : 'bg-[#121316] border-slate-800/90 text-white'
      } ${className}`}
    >
      <div className="relative h-48 sm:h-52 w-full overflow-hidden">
        <img
          src={bannerImage}
          alt={service.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={e => {
            e.currentTarget.src = fallbackImg;
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#121316] via-[#121316]/70 to-black/50" />

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide backdrop-blur-md bg-black/40 text-white/90 border border-white/10 shadow-sm">
            {gender}
          </span>

          {offerTag && (
            <span className="px-3.5 py-1 rounded-full text-xs font-black tracking-wide bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30 flex items-center gap-1 animate-pulse">
              <Tag className="w-3 h-3" />
              {offerTag}
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-4 right-4 z-10 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
              {service.name}
            </h3>

            {service.isPopular && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1 backdrop-blur-sm">
                <Sparkles className="w-2.5 h-2.5 fill-amber-300" />
                Featured
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <span>{service.category}</span>
            <span className="opacity-60">•</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Clock className="w-3 h-3 text-slate-400" />
              {service.durationMinutes} mins
            </span>
          </div>

          <p className="text-xs text-slate-300/90 line-clamp-2 leading-relaxed pt-0.5">
            {service.description || 'Professional salon treatment with tailored consultation and finish.'}
          </p>
        </div>
      </div>

      <div className="p-4 bg-[#14161a] border-t border-slate-800/80 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black font-mono text-white tracking-tight">
            {showCurrency ? `${showCurrency} ${service.price}` : formatPrice(service.price)}
          </span>
          {originalPrice > service.price && (
            <span className="text-sm font-bold line-through text-slate-500 font-mono">
              {showCurrency ? `${showCurrency} ${originalPrice}` : formatPrice(originalPrice)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {variant === 'customer' ? (
            <button
              id={`book-service-${service.id}`}
              type="button"
              onClick={() => onBook && onBook(service)}
              className="px-5 py-2.5 rounded-2xl text-xs font-black text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-1.5"
              style={{
                backgroundColor: currentThemeConfig.primaryHex,
                boxShadow: `0 4px 14px ${currentThemeConfig.glowHex}`,
              }}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book now</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              {onRegenerateAiBanner && (
                <button
                  type="button"
                  onClick={() => onRegenerateAiBanner(service)}
                  className="px-2.5 py-2 rounded-xl text-xs font-bold bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 transition-all flex items-center gap-1"
                  title="Auto-generate AI Banner"
                >
                  <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline text-[11px]">AI Banner</span>
                </button>
              )}

              {onEdit && (
                <button
                  id={`btn-edit-service-${service.id}`}
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    e.preventDefault();
                    onEdit(service);
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all cursor-pointer active:scale-95"
                  title="Edit Service & Price"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}

              {onDelete && (
                <button
                  id={`btn-delete-service-${service.id}`}
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDelete(service.id);
                  }}
                  className="p-2 rounded-xl bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 transition-all cursor-pointer active:scale-95"
                  title="Delete Service"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
