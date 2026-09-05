import { useState, useEffect } from 'react';

export type DeviceFormFactor =
  | 'mobile-portrait'
  | 'mobile-landscape'
  | 'tablet-portrait'
  | 'tablet-landscape'
  | 'laptop'
  | 'desktop'
  | 'ultrawide';

export interface ScreenAdaptationProfile {
  width: number;
  height: number;
  aspectRatio: number;
  isLandscape: boolean;
  isPortrait: boolean;
  formFactor: DeviceFormFactor;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  pixelRatio: number;
  scaleFactor: number;
  maxContainerWidth: string;
}

function calculateScreenProfile(): ScreenAdaptationProfile {
  if (typeof window === 'undefined') {
    return {
      width: 390,
      height: 844,
      aspectRatio: 390 / 844,
      isLandscape: false,
      isPortrait: true,
      formFactor: 'mobile-portrait',
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      isTouch: true,
      pixelRatio: 1,
      scaleFactor: 1,
      maxContainerWidth: 'max-w-md',
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspectRatio = width / (height || 1);
  const isLandscape = width > height;
  const isPortrait = !isLandscape;
  const isTouch =
    'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const pixelRatio = window.devicePixelRatio || 1;

  let formFactor: DeviceFormFactor = 'mobile-portrait';
  let isMobile = false;
  let isTablet = false;
  let isDesktop = false;
  let maxContainerWidth = 'max-w-md';
  let scaleFactor = 1;

  if (width < 640) {
    if (isLandscape && height < 500) {
      formFactor = 'mobile-landscape';
      isMobile = true;
      scaleFactor = 0.85;
      maxContainerWidth = 'max-w-2xl';
    } else {
      formFactor = 'mobile-portrait';
      isMobile = true;
      scaleFactor = width < 375 ? 0.9 : 1;
      maxContainerWidth = 'max-w-md';
    }
  } else if (width >= 640 && width < 1024) {
    if (isLandscape) {
      formFactor = 'tablet-landscape';
      isTablet = true;
      scaleFactor = 1.05;
      maxContainerWidth = 'max-w-3xl';
    } else {
      formFactor = 'tablet-portrait';
      isTablet = true;
      scaleFactor = 1;
      maxContainerWidth = 'max-w-lg';
    }
  } else if (width >= 1024 && width < 1536) {
    formFactor = 'laptop';
    isDesktop = true;
    scaleFactor = 1.1;
    maxContainerWidth = 'max-w-4xl';
  } else {
    formFactor = width >= 2000 ? 'ultrawide' : 'desktop';
    isDesktop = true;
    scaleFactor = 1.2;
    maxContainerWidth = 'max-w-5xl';
  }

  return {
    width,
    height,
    aspectRatio,
    isLandscape,
    isPortrait,
    formFactor,
    isMobile,
    isTablet,
    isDesktop,
    isTouch,
    pixelRatio,
    scaleFactor,
    maxContainerWidth,
  };
}

export function useScreenAdaptation(): ScreenAdaptationProfile {
  const [profile, setProfile] = useState<ScreenAdaptationProfile>(calculateScreenProfile);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setProfile(calculateScreenProfile());
      }, 50);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    // Initial sync
    handleResize();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return profile;
}
