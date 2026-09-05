import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface StaffAvatarProps {
  name: string;
  avatar?: string | null;
  gender?: 'Male' | 'Female' | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  badge?: React.ReactNode;
}

export const StaffAvatar: React.FC<StaffAvatarProps> = ({
  name,
  avatar,
  gender,
  size = 'md',
  className = '',
  badge,
}) => {
  const { currentThemeConfig } = useApp();
  const [imageError, setImageError] = useState(false);

  const sizeMap = {
    xs: 'w-7 h-7 text-xs rounded-lg',
    sm: 'w-9 h-9 text-sm rounded-xl',
    md: 'w-12 h-12 text-base rounded-2xl',
    lg: 'w-16 h-16 text-xl rounded-2xl',
    xl: 'w-20 h-20 text-2xl rounded-3xl',
  };

  const initial = (name || 'S').trim().charAt(0).toUpperCase() || 'S';
  const hasValidImage = !!avatar && avatar.trim() !== '' && !imageError;

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {hasValidImage ? (
        <img
          src={avatar!}
          alt={name}
          onError={() => setImageError(true)}
          className={`${sizeMap[size]} object-cover ring-1 ring-black/10 dark:ring-white/10 shrink-0`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className={`${sizeMap[size]} flex items-center justify-center font-black select-none shrink-0 shadow-xs border border-white/20 dark:border-white/10`}
          style={{
            backgroundColor: `${currentThemeConfig.primaryHex}25`,
            color: currentThemeConfig.primaryHex,
          }}
        >
          {initial}
        </div>
      )}

      {badge && <div className="absolute -bottom-1 -right-1 z-10">{badge}</div>}
    </div>
  );
};
