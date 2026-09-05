import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Calendar,
  Star,
  Sparkles,
  ArrowRight,
  Info,
  Clock,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { NotificationItem } from '../../types';

interface BusinessNotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BusinessNotificationDrawer: React.FC<BusinessNotificationDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearAllNotifications,
    setActiveBusinessTab,
    colorThemeMode,
    currentThemeConfig,
  } = useApp();

  const isLight = colorThemeMode === 'light';
  const [filterType, setFilterType] = useState<'all' | 'booking' | 'review' | 'system'>('all');

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const businessNotifs = useMemo(() => {
    return notifications.filter(n => n.userType === 'business');
  }, [notifications]);

  const unreadCount = useMemo(() => {
    return businessNotifs.filter(n => !n.read).length;
  }, [businessNotifs]);

  const filteredNotifs = useMemo(() => {
    if (filterType === 'all') return businessNotifs;
    if (filterType === 'booking') {
      return businessNotifs.filter(n => n.type === 'booking' || n.title.toLowerCase().includes('booking') || n.title.toLowerCase().includes('appointment'));
    }
    if (filterType === 'review') {
      return businessNotifs.filter(n => n.type === 'review' || n.title.toLowerCase().includes('review') || n.title.toLowerCase().includes('rating'));
    }
    if (filterType === 'system') {
      return businessNotifs.filter(n => n.type !== 'booking' && n.type !== 'review');
    }
    return businessNotifs;
  }, [businessNotifs, filterType]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleNotificationClick = (n: NotificationItem) => {
    markNotificationRead(n.id);
    if (n.type === 'booking' || n.title.toLowerCase().includes('booking')) {
      setActiveBusinessTab('calendar');
    } else if (n.type === 'review' || n.title.toLowerCase().includes('review')) {
      setActiveBusinessTab('reviews');
    } else if (n.linkTab) {
      setActiveBusinessTab(n.linkTab as any);
    }
    onClose();
  };

  const getNotificationIcon = (type?: string, title?: string) => {
    const t = (title || '').toLowerCase();
    if (type === 'booking' || t.includes('booking') || t.includes('appointment')) {
      return <Calendar className="w-4 h-4 text-emerald-500" />;
    }
    if (type === 'review' || t.includes('review') || t.includes('rating') || t.includes('star')) {
      return <Star className="w-4 h-4 text-amber-400 fill-amber-400" />;
    }
    if (t.includes('vip') || t.includes('popular')) {
      return <Sparkles className="w-4 h-4 text-purple-400" />;
    }
    if (t.includes('verify') || t.includes('secure') || t.includes('verified')) {
      return <ShieldCheck className="w-4 h-4 text-blue-500" />;
    }
    return <Info className="w-4 h-4 text-indigo-400" />;
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        id="biz-notif-drawer-backdrop"
        onClick={onClose}
        className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-out Drawer Panel */}
      <aside
        id="biz-notif-slide-panel"
        aria-label="Notifications Panel"
        className={`fixed top-0 right-0 bottom-0 z-[9999] w-full max-w-md sm:max-w-lg border-l shadow-2xl flex flex-col transition-all duration-300 ease-out animate-in slide-in-from-right ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-slate-950 border-slate-800 text-white'
        }`}
        style={{
          boxShadow: `-10px 0 40px -10px ${currentThemeConfig.glowHex}`,
        }}
      >
        {/* Drawer Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
            isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
              style={{
                backgroundColor: currentThemeConfig.primaryHex,
                boxShadow: `0 4px 12px ${currentThemeConfig.glowHex}`,
              }}
            >
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight font-['Outfit',sans-serif]">
                  Shop Notifications
                </h2>
                {unreadCount > 0 && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-black text-white"
                    style={{ backgroundColor: currentThemeConfig.primaryHex }}
                  >
                    {unreadCount} New
                  </span>
                )}
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Live alerts, booking actions & salon updates
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-biz-notif-drawer-btn"
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-600'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            aria-label="Close Notifications"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Chips & Action Controls */}
        <div
          className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-2 shrink-0 ${
            isLight ? 'bg-white border-slate-100' : 'bg-slate-950 border-slate-850'
          }`}
        >
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-0.5">
            {[
              { id: 'all', label: 'All', count: businessNotifs.length },
              {
                id: 'booking',
                label: 'Bookings',
                count: businessNotifs.filter(n => n.type === 'booking' || n.title.toLowerCase().includes('booking')).length,
              },
              {
                id: 'review',
                label: 'Reviews',
                count: businessNotifs.filter(n => n.type === 'review' || n.title.toLowerCase().includes('review')).length,
              },
              {
                id: 'system',
                label: 'System',
                count: businessNotifs.filter(n => n.type !== 'booking' && n.type !== 'review').length,
              },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  filterType === tab.id
                    ? isLight
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-900 shadow-xs'
                    : isLight
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      filterType === tab.id
                        ? isLight
                          ? 'bg-slate-750 text-white'
                          : 'bg-slate-200 text-slate-900 font-black'
                        : isLight
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                id="biz-notif-mark-all-read-btn"
                onClick={() => markAllNotificationsRead('business')}
                className="text-[11px] font-bold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
            {businessNotifs.length > 0 && (
              <button
                type="button"
                id="biz-notif-clear-all-btn"
                onClick={() => clearAllNotifications('business')}
                className="text-[11px] font-semibold text-slate-400 hover:text-rose-500 flex items-center gap-1 cursor-pointer transition-colors"
                title="Clear all shop notifications"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
          {filteredNotifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div
                className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-4 ${
                  isLight ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-slate-600'
                }`}
              >
                <Bell className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className={`text-sm font-extrabold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                No Notifications Found
              </h3>
              <p className={`text-xs mt-1 max-w-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {filterType === 'all'
                  ? 'Your shop is fully caught up! New client bookings, reschedules, and feedback alerts will appear here.'
                  : `No notifications matching the "${filterType}" category.`}
              </p>
            </div>
          ) : (
            filteredNotifs.map(item => {
              const isUnread = !item.read;
              return (
                <div
                  key={item.id}
                  id={`biz-notif-item-${item.id}`}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                    isUnread
                      ? isLight
                        ? 'bg-indigo-50/40 border-indigo-200/80 shadow-xs hover:border-indigo-300'
                        : 'bg-indigo-950/20 border-indigo-900/60 shadow-xs hover:border-indigo-800'
                      : isLight
                      ? 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-100 hover:border-slate-300'
                      : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isUnread
                          ? isLight
                            ? 'bg-white border-indigo-200 shadow-xs'
                            : 'bg-slate-800 border-indigo-800'
                          : isLight
                          ? 'bg-white border-slate-200'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      {getNotificationIcon(item.type, item.title)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4
                            className={`text-xs font-black truncate ${
                              isLight ? 'text-slate-900' : 'text-white'
                            }`}
                          >
                            {item.title}
                          </h4>
                          {isUnread && (
                            <span
                              className="w-2 h-2 rounded-full shrink-0 animate-pulse"
                              style={{ backgroundColor: currentThemeConfig.primaryHex }}
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[10px] font-mono flex items-center gap-1 ${
                            isLight ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            <Clock className="w-3 h-3" />
                            {item.timestamp || 'Just now'}
                          </span>
                          <button
                            type="button"
                            id={`biz-notif-delete-icon-${item.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(item.id);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete this notification"
                            aria-label="Delete notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p
                        className={`text-xs leading-relaxed ${
                          isLight ? 'text-slate-600' : 'text-slate-300'
                        }`}
                      >
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                        <span
                          className="text-[11px] font-bold flex items-center gap-1 transition-transform group-hover:translate-x-0.5"
                          style={{ color: currentThemeConfig.primaryHex }}
                        >
                          <span>Take Action</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>

                        <div className="flex items-center gap-2">
                          {isUnread && (
                            <button
                              type="button"
                              id={`biz-notif-read-btn-${item.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                markNotificationRead(item.id);
                              }}
                              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-0.5 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                            >
                              Mark Read
                            </button>
                          )}
                          <button
                            type="button"
                            id={`biz-notif-del-btn-${item.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(item.id);
                            }}
                            className="text-[10px] font-bold text-slate-400 hover:text-rose-500 px-2 py-0.5 rounded-md hover:bg-rose-500/10 flex items-center gap-1 cursor-pointer transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div
          className={`p-4 border-t shrink-0 flex items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setActiveBusinessTab('settings');
              onClose();
            }}
            className={`flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
              isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Notification Settings</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-extrabold text-white shadow-sm transition-all active:scale-95 cursor-pointer"
            style={{
              backgroundColor: currentThemeConfig.primaryHex,
            }}
          >
            Close Panel
          </button>
        </div>
      </aside>
    </>,
    document.body
  );
};
