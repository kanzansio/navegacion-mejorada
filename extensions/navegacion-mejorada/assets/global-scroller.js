    // assets/global-scroller.js
// Script global para hashless smooth scrolling desde cualquier enlace.

(() => {
  'use strict';
  if (window.globalScrollerInitialized) return;
  window.globalScrollerInitialized = true;

  const scriptTag = document.currentScript;
  const config = {
    offset: scriptTag?.dataset.offset || '80',
    duration: parseInt(scriptTag?.dataset.duration || '600', 10),
  };

  function getOffset(targetElement) {
    const anchorSpecificOffset = targetElement?.dataset.scrollOffset;
    if (anchorSpecificOffset && anchorSpecificOffset !== '0') {
      return parseInt(anchorSpecificOffset, 10);
    }
    
    if (config.offset.startsWith('#') || config.offset.startsWith('.')) {
      const el = document.querySelector(config.offset);
      return el ? el.getBoundingClientRect().height : 0;
    }
    return parseInt(config.offset, 10) || 0;
  }
  
  function scrollToElement(elementId) {
    const target = document.getElementById(elementId);
    if (!target) return;

    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
    const offset = getOffset(target);
    const finalPosition = targetPosition - offset;

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        window.scrollTo({ top: finalPosition, behavior: 'auto' });
    } else {
        window.scrollTo({ top: finalPosition, behavior: 'smooth' });
    }
  }

  document.addEventListener('click', (event) => {
    // Busca un enlace padre que cumpla la condición.
    const link = event.target.closest('a[href*="/#"]');

    if (link) {
      const href = link.getAttribute('href');
      const parts = href.split('/#');
      const anchorId = parts[1];

      // Si hay un ID de ancla y estamos en la página correcta (o es solo un ancla)
      if (anchorId && (parts[0] === '' || window.location.pathname === parts[0])) {
        event.preventDefault();
        scrollToElement(anchorId);
      }
    }
  }, { capture: true });

})();