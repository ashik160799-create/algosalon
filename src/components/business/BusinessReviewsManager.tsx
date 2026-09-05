import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Star, MessageSquare, CornerDownRight } from 'lucide-react';

export const BusinessReviewsManager: React.FC = () => {
  const { businessUser, salons, reviews, replyToReview, currentThemeConfig, colorThemeMode } = useApp();
  const salon = salons.find(s => s.id === businessUser.salonId) || salons[0];
  const salonReviews = reviews.filter(r => r.salonId === salon.id);
  const isLight = colorThemeMode === 'light';

  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleSendReply = (reviewId: string) => {
    if (!replyText.trim()) return;
    replyToReview(reviewId, replyText.trim());
    setReplyingReviewId(null);
    setReplyText('');
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span
            className="text-xs font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-md inline-block"
            style={{
              backgroundColor: `${currentThemeConfig.primaryHex}20`,
              color: currentThemeConfig.primaryHex,
            }}
          >
            Reputation & Ratings
          </span>
          <h1 className={`text-xl sm:text-2xl font-black mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Reviews
          </h1>
        </div>

        <div
          className={`flex items-center gap-3 p-3 rounded-2xl border ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-1.5 text-amber-400 font-black text-xl">
            <Star className="w-5 h-5 fill-amber-400" />
            <span>{salon.rating}</span>
          </div>
          <div className="text-left text-xs border-l border-slate-200 dark:border-slate-800 pl-3">
            <span className={`font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {salon.reviewCount} Total Reviews
            </span>
            <span className="text-[10px] text-emerald-500 font-semibold">98% Positive Feedback</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {salonReviews.map(rev => {
          const isReplying = replyingReviewId === rev.id;

          return (
            <div
              key={rev.id}
              className={`p-4 sm:p-5 rounded-3xl border space-y-3.5 shadow-sm transition-all ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={rev.customerAvatar}
                    alt={rev.customerName}
                    className="w-10 h-10 rounded-2xl object-cover ring-2 ring-slate-200 dark:ring-slate-700 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {rev.customerName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="flex items-center text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                      <span>•</span>
                      <span className="font-mono text-[11px]">{rev.date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span
                    className="text-[11px] font-bold block"
                    style={{ color: currentThemeConfig.primaryHex }}
                  >
                    Service: {rev.serviceName}
                  </span>
                  {rev.staffName && (
                    <span className="text-[10px] text-slate-400 block">
                      Stylist: <strong className="text-slate-700 dark:text-slate-300">{rev.staffName}</strong>
                    </span>
                  )}
                </div>
              </div>

              <p
                className={`text-xs p-3.5 rounded-2xl border leading-relaxed ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                }`}
              >
                "{rev.comment}"
              </p>

              {rev.reply ? (
                <div
                  className="p-3 rounded-2xl border flex items-start gap-2.5 text-xs"
                  style={{
                    backgroundColor: `${currentThemeConfig.primaryHex}10`,
                    borderColor: `${currentThemeConfig.primaryHex}30`,
                  }}
                >
                  <CornerDownRight
                    className="w-4 h-4 shrink-0 mt-0.5"
                    style={{ color: currentThemeConfig.primaryHex }}
                  />
                  <div className="space-y-0.5">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider block"
                      style={{ color: currentThemeConfig.primaryHex }}
                    >
                      Salon Owner Response
                    </span>
                    <p className={isLight ? 'text-slate-800' : 'text-slate-200'}>{rev.reply}</p>
                  </div>
                </div>
              ) : (
                <>
                  {!isReplying ? (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          setReplyingReviewId(rev.id);
                          setReplyText(
                            `Hi ${rev.customerName.split(' ')[0]}, thank you so much for visiting ${salon.name}! We look forward to seeing you again.`
                          );
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border ${
                          isLight
                            ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" style={{ color: currentThemeConfig.primaryHex }} />
                        <span>Reply to Customer</span>
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`p-3 rounded-2xl border space-y-2 text-xs ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <label className={`block font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        Reply to {rev.customerName}
                      </label>
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        className={`w-full border rounded-xl p-2.5 focus:outline-none text-xs ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900 focus:border-slate-500'
                            : 'bg-slate-900 border-slate-700 text-white focus:border-slate-500'
                        }`}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setReplyingReviewId(null)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                            isLight
                              ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSendReply(rev.id)}
                          className="px-4 py-1.5 rounded-xl text-white font-bold text-xs shadow-xs"
                          style={{ backgroundColor: currentThemeConfig.primaryHex }}
                        >
                          Post Reply
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {salonReviews.length === 0 && (
          <div
            className={`p-12 rounded-3xl border text-center text-xs text-slate-400 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            No customer reviews logged yet.
          </div>
        )}
      </div>
    </div>
  );
};
