import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Appointment } from '../../types';
import { X, Star, Sparkles, CheckCircle2 } from 'lucide-react';

interface ReviewModalProps {
  appointment: Appointment | null;
  onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ appointment, onClose }) => {
  const { addReview, customerUser, currentThemeConfig, colorThemeMode } = useApp();
  const isLight = colorThemeMode === 'light';
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!appointment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    addReview({
      appointmentId: appointment.id,
      salonId: appointment.salonId,
      customerId: customerUser.id,
      customerName: customerUser.name,
      customerAvatar: customerUser.avatar,
      rating,
      comment: comment.trim(),
      serviceName: appointment.serviceName,
      staffName: appointment.staffName,
    });

    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div
        className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
        style={{
          boxShadow: `0 16px 40px -10px ${currentThemeConfig.glowHex}`,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close review dialog"
          className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            isLight ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-500 mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Review Submitted!</h3>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Thank you for supporting {appointment.salonName} and your stylist.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center">
              <span
                className="text-[10px] font-extrabold uppercase tracking-widest block"
                style={{ color: currentThemeConfig.primaryHex }}
              >
                Rate Your Experience
              </span>
              <h3 className={`text-lg font-bold mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {appointment.salonName}
              </h3>
              <p
                className="text-xs font-semibold"
                style={{ color: currentThemeConfig.primaryHex }}
              >
                {appointment.serviceName} with {appointment.staffName}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map(star => {
                const isFilled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`Rate ${star} out of 5 stars`}
                    aria-pressed={rating === star}
                    className="p-1 rounded-lg transition-transform hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        isFilled
                          ? 'text-amber-400 fill-amber-400 drop-shadow'
                          : isLight
                          ? 'text-slate-300'
                          : 'text-slate-700'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="text-center text-xs font-bold text-amber-500">
              {rating === 5 && 'Outstanding look and service'}
              {rating === 4 && 'Great experience'}
              {rating === 3 && 'Good service'}
              {rating === 2 && 'Room for improvement'}
              {rating === 1 && 'Not satisfied'}
            </div>

            <div>
              <label htmlFor="review-comment" className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Your Feedback
              </label>
              <textarea
                id="review-comment"
                required
                rows={4}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="How was your cut, style, and salon experience? What did you like best?"
                className={`w-full rounded-2xl p-3 text-xs border focus:outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-slate-400'
                    : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-slate-600'
                }`}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: currentThemeConfig.primaryHex,
                boxShadow: `0 4px 14px 0 ${currentThemeConfig.glowHex}`,
              }}
            >
              <Sparkles className="w-4 h-4" />
              <span>Post Review & Earn 20 Pts</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
