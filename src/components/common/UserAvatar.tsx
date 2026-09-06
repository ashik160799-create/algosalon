import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export interface UserAvatarProps {
  name: string;
  avatar?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  style?: React.CSSProperties;
  badge?: React.ReactNode;
  shape?: 'circle' | 'rounded';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatar,
  size = 'md',
  className = '',
  style = {},
  badge,
  shape = 'rounded',
}) => {
  const { currentThemeConfig } = useApp();
  const [imageError, setImageError] = useState(false);

  const sizeClasses: Record<string, { box: string; text: string; radius: string }> = {
    xs: { box: 'w-7 h-7', text: 'text-xs', radius: shape === 'circle' ? 'rounded-full' : 'rounded-lg' },
    sm: { box: 'w-9 h-9', text: 'text-sm', radius: shape === 'circle' ? 'rounded-full' : 'rounded-xl' },
    md: { box: 'w-12 h-12', text: 'text-base', radius: shape === 'circle' ? 'rounded-full' : 'rounded-2xl' },
    lg: { box: 'w-16 h-16', text: 'text-xl', radius: shape === 'circle' ? 'rounded-full' : 'rounded-2xl' },
    xl: { box: 'w-20 h-20', text: 'text-2xl', radius: shape === 'circle' ? 'rounded-full' : 'rounded-3xl' },
    '2xl': { box: 'w-24 h-24', text: 'text-3xl', radius: shape === 'circle' ? 'rounded-full' : 'rounded-3xl' },
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  // Filter out legacy stock AI unsplash avatars
  const isLegacyStockImage =
    typeof avatar === 'string' &&
    (avatar.includes('photo-1534528741775-53994a69daeb') ||
      avatar.includes('photo-1507003211169-0a1dd7228f2d') ||
      avatar.includes('photo-1500648767791-00dcc994a43e') ||
      avatar.includes('photo-1494790108377-be9c29b29330') ||
      avatar.includes('photo-1517841905240-472988babdf9') ||
      avatar.includes('photo-1539571696357-5a69c17a67c6'));

  const hasValidImage = !!avatar && avatar.trim() !== '' && !isLegacyStockImage && !imageError;
  const initial = (name || 'U').trim().charAt(0).toUpperCase() || 'U';

  return (
    <div className={`relative inline-flex shrink-0 select-none ${className}`} style={style}>
      {hasValidImage ? (
        <img
          src={avatar!}
          alt={name || 'User avatar'}
          onError={() => setImageError(true)}
          className={`${currentSize.box} ${currentSize.radius} object-cover ring-1 ring-black/10 dark:ring-white/10 shrink-0`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className={`${currentSize.box} ${currentSize.radius} ${currentSize.text} flex items-center justify-center font-black select-none shrink-0 shadow-xs border border-white/20 dark:border-white/10`}
          style={{
            backgroundColor: `${currentThemeConfig.primaryHex}22`,
            color: currentThemeConfig.primaryHex,
          }}
          title={name || 'User Profile'}
        >
          {initial}
        </div>
      )}

      {badge && <div className="absolute -bottom-1 -right-1 z-10">{badge}</div>}
    </div>
  );
};
