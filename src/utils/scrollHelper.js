/**
 * Smoothly scrolls to the first invalid field or element with an error in a modal/form,
 * and sets focus on it.
 * @param {HTMLElement|string|null} containerOrSelector 
 */
export const scrollToFirstError = (containerOrSelector) => {
  setTimeout(() => {
    let root = document;
    if (typeof containerOrSelector === 'string') {
      root = document.querySelector(containerOrSelector) || document;
    } else if (containerOrSelector && containerOrSelector.querySelector) {
      root = containerOrSelector;
    }

    const selector = [
      '[data-error="true"]',
      '.border-red-500',
      '[aria-invalid="true"]',
      '.animate-shake',
      'input:invalid',
      'select:invalid',
      'textarea:invalid'
    ].join(', ');

    const targetEl = root.querySelector(selector);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const focusable = targetEl.matches('input, select, textarea, button') 
        ? targetEl 
        : targetEl.querySelector('input, select, textarea, button');
      if (focusable && typeof focusable.focus === 'function') {
        try {
          focusable.focus({ preventScroll: true });
        } catch (e) {
          focusable.focus();
        }
      }
    }
  }, 60);
};
