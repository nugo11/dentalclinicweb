import { useEffect } from 'react';

/**
 * Custom hook to lock body scrolling when a modal, slide-over, or mobile drawer is open.
 * Bulletproof iOS Safari implementation:
 * Uses fixed body positioning + stored scroll offset so the background
 * cannot rubber-band or scroll beneath partial-height mobile modals.
 */
let lockCount = 0;
let savedScrollY = 0;

export const useLockBodyScroll = (isLocked = true) => {
  useEffect(() => {
    if (!isLocked) return;

    if (lockCount === 0) {
      savedScrollY = window.scrollY || window.pageYOffset || 0;
      
      // Store inline styles to restore cleanly
      document.body.dataset.prevOverflow = document.body.style.overflow || '';
      document.body.dataset.prevPosition = document.body.style.position || '';
      document.body.dataset.prevTop = document.body.style.top || '';
      document.body.dataset.prevWidth = document.body.style.width || '';

      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.body.classList.add('body-scroll-lock');
    }
    lockCount++;

    return () => {
      lockCount--;
      if (lockCount <= 0) {
        lockCount = 0;
        const scrollYToRestore = savedScrollY;

        document.body.style.position = document.body.dataset.prevPosition || '';
        document.body.style.top = document.body.dataset.prevTop || '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = document.body.dataset.prevWidth || '';
        document.body.style.overflow = document.body.dataset.prevOverflow || '';
        document.body.classList.remove('body-scroll-lock');

        delete document.body.dataset.prevOverflow;
        delete document.body.dataset.prevPosition;
        delete document.body.dataset.prevTop;
        delete document.body.dataset.prevWidth;

        window.scrollTo(0, scrollYToRestore);
      }
    };
  }, [isLocked]);
};

export default useLockBodyScroll;
