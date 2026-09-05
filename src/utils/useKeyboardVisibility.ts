import { useState, useEffect } from 'react';

/**
 * Hook to detect when mobile virtual keyboard is ACTUALLY open and taking up screen space.
 * Only hides the bottom navigation when the keyboard is physically occupying screen space.
 * When the keyboard is closed (even if input cursor is still active), the navigation is restored immediately.
 */
export function useKeyboardVisibility(): boolean {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let initialHeight = window.innerHeight;

    const checkKeyboardState = () => {
      // 1. Check visualViewport (modern mobile browsers / Chrome / Safari)
      if (window.visualViewport) {
        const vpHeight = window.visualViewport.height;
        const fullHeight = window.innerHeight;
        // Keyboard is only considered open if the viewport has physically shrunk by > 120px
        const isShrunk = (fullHeight - vpHeight) > 120 || (initialHeight - vpHeight) > 120;
        setIsKeyboardVisible(isShrunk);
        return;
      }

      // 2. Fallback for older browsers using window.innerHeight vs initialHeight
      const currentHeight = window.innerHeight;
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement).isContentEditable
      );

      if (isInput && (initialHeight - currentHeight > 120)) {
        setIsKeyboardVisible(true);
      } else {
        setIsKeyboardVisible(false);
      }
    };

    // When focus leaves or user taps outside
    const handleFocusOut = () => {
      setTimeout(() => {
        checkKeyboardState();
      }, 50);
    };

    const handleWindowResize = () => {
      // If height returned to normal, update initialHeight baseline
      if (window.innerHeight > initialHeight) {
        initialHeight = window.innerHeight;
      }
      checkKeyboardState();
    };

    // Also auto-blur when scrolling if user scrolls past input
    const handleScroll = () => {
      checkKeyboardState();
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', checkKeyboardState);
      window.visualViewport.addEventListener('scroll', checkKeyboardState);
    }

    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('focusout', handleFocusOut);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Periodic safety check for edge cases on mobile webviews/iframes
    const interval = setInterval(checkKeyboardState, 300);

    return () => {
      clearInterval(interval);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', checkKeyboardState);
        window.visualViewport.removeEventListener('scroll', checkKeyboardState);
      }
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('focusout', handleFocusOut);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return isKeyboardVisible;
}
