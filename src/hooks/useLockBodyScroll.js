import { useEffect } from 'react';

/**
 * Custom hook to lock body scrolling when a modal, slide-over, or mobile drawer is open.
 * Prevents iOS Safari background rubber-banding and background scrolling.
 */
export const useLockBodyScroll = (isLocked = true) => {
  useEffect(() => {
    if (!isLocked) return;

    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.body.classList.add('body-scroll-lock');

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
      document.body.classList.remove('body-scroll-lock');
    };
  }, [isLocked]);
};

export default useLockBodyScroll;
