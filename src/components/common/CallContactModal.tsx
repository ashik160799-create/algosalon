import React, { useState } from 'react';
import { Salon } from '../../types';
import { useApp } from '../../context/AppContext';
import { getSalonMapUrl, getCleanPhoneNumber, computeSalonLiveStatus } from '../../utils/salonUtils';
import {
  X,
  Phone,
  PhoneCall,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Navigation,
} from 'lucide-react';

interface CallContactModalProps {
  salon: Salon | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CallContactModal: React.FC<CallContactModalProps> = ({
  salon,
  isOpen,
  onClose,
}) => {
  const { currentThemeConfig, colorThemeMode } = useApp();
  const isLight = colorThemeMode === 'light';
  const [copied, setCopied] = useState(false);

  if (!isOpen || !salon) return null;

  const cleanPhone = getCleanPhoneNumber(salon.phone);
  const mapUrl = getSalonMapUrl(salon);

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(salon.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDirectCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${cleanPhone}`;
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = encodeURIComponent(
      `Hello ${salon.name}, I found your salon on ALGO SALON and would like to inquire about appointments.`
    );
    const waPhone = cleanPhone.replace('+', '');
    window.open(`https://wa.me/${waPhone}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  const handleOpenMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(mapUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      id="call-contact-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="call-contact-modal"
        onClick={e => e.stopPropagation()}
        className={`relative w-full max-w-md rounded-3xl border shadow-2xl p-6 transition-all animate-in zoom-in-95 duration-200 ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
        style={{
          boxShadow: `0 20px 40px -10px ${currentThemeConfig.glowHex}`,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
            isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3.5 pr-8">
          <img
            src={salon.image}
            alt={salon.name}
            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-200 dark:ring-slate-700 shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className={`text-base font-black truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {salon.name}
              </h3>
              {salon.isVerified && (
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
              )}
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">{salon.address}, {salon.city}</p>
            <div className="flex items-center gap-2 mt-1">
              {(() => {
                const live = computeSalonLiveStatus(salon.workingHours, salon.specialSchedules, salon.isOpenNow);
                return (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    live.isOpen ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'
                  }`}>
                    {live.isOpen ? '● Open Now' : '○ Closed'}
                  </span>
                );
              })()}
              <span className="text-[11px] text-slate-400 font-medium">
                {salon.distanceKm} km away
              </span>
            </div>
          </div>
        </div>

        <div
          className={`mt-5 p-4 rounded-2xl border flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl text-white shadow-xs"
              style={{ backgroundColor: currentThemeConfig.primaryHex }}
            >
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Direct Salon Contact
              </span>
              <span className={`text-base font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {salon.phone}
              </span>
            </div>
          </div>

          <button
            type="button"
            id="copy-phone-btn"
            onClick={handleCopyPhone}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              copied
                ? 'bg-emerald-500 text-white border-emerald-500'
                : isLight
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          <button
            type="button"
            id="direct-call-now-btn"
            onClick={handleDirectCall}
            className="w-full py-3 px-4 rounded-2xl text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:opacity-95 active:scale-98"
            style={{
              backgroundColor: currentThemeConfig.primaryHex,
              boxShadow: `0 6px 18px -2px ${currentThemeConfig.glowHex}`,
            }}
          >
            <PhoneCall className="w-4 h-4 animate-bounce" />
            <span>Call Now ({salon.phone})</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="whatsapp-chat-btn"
              onClick={handleWhatsApp}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Chat</span>
            </button>

            <button
              type="button"
              id="open-map-from-call-modal-btn"
              onClick={handleOpenMap}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 text-rose-500" />
              <span>Google Maps</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>

        <p className="text-[11px] text-center text-slate-400 mt-4">
          Operated by ALGO SALON Partner Network
        </p>
      </div>
    </div>
  );
};
