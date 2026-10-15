import { useEffect, useRef } from 'react';

/**
 * Custom hook to lock body scrolling when a modal, slide-over, or mobile drawer is open.
 * - On iOS Safari: Uses fixed body positioning + stored scroll offset to eliminate rubber-band bounce.
 * - On Android & Desktop: Uses standard overflow: hidden to avoid layout jumps and scroll traps.
 * - Uses a Set of active locks to guarantee it never gets stuck or leaks across page navigation.
 */

const activeLocks = new Set();
let savedScrollY = 0;

const isIOSDevice = () => {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent || '');
};

const applyLock = () => {
  if (typeof document === 'undefined') return;

  const isIOS = isIOSDevice();
  savedScrollY = window.scrollY || window.pageYOffset || 0;

  document.body.dataset.prevOverflow = document.body.style.overflow || '';
  document.body.dataset.prevPosition = document.body.style.position || '';
  document.body.dataset.prevTop = document.body.style.top || '';
  document.body.dataset.prevWidth = document.body.style.width || '';

  if (isIOS) {
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  }
  
  document.body.style.overflow = 'hidden';
  document.body.classList.add('body-scroll-lock');
};

const releaseLock = () => {
  if (typeof document === 'undefined') return;

  const isIOS = isIOSDevice();
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

  if (isIOS && scrollYToRestore) {
    window.scrollTo(0, scrollYToRestore);
  }
};

// Global safety cleanup on history navigation
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    activeLocks.clear();
    releaseLock();
  });
}

export const useLockBodyScroll = (isLocked = true) => {
  const lockIdRef = useRef(null);
  if (!lockIdRef.current) {
    lockIdRef.current = Symbol('scroll-lock');
  }

  useEffect(() => {
    const id = lockIdRef.current;

    if (isLocked) {
      const wasEmpty = activeLocks.size === 0;
      activeLocks.add(id);
      if (wasEmpty) {
        applyLock();
      }
    } else {
      activeLocks.delete(id);
      if (activeLocks.size === 0) {
        releaseLock();
      }
    }

    return () => {
      activeLocks.delete(id);
      if (activeLocks.size === 0) {
        releaseLock();
      }
    };
  }, [isLocked]);
};

export default useLockBodyScroll;
