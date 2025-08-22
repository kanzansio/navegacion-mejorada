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
    align: scriptTag?.dataset.align || 'start', // Nuevo: 'start' o 'center'
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
    let finalPosition = targetPosition - offset;

    // ¡NUEVA LÓGICA DE ALINEACIÓN!
    if (config.align === 'center') {
      const elementHeight = target.offsetHeight;
      const viewportHeight = window.innerHeight;
      // Calcula el espacio libre y lo divide para centrar.
      // Si la sección es más grande que la pantalla, se alinea arriba para no perder el título.
      if (elementHeight < viewportHeight) {
        finalPosition -= (viewportHeight - elementHeight) / 2;
      }
    }

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        window.scrollTo({ top: finalPosition, behavior: 'auto' });
    } else {
        window.scrollTo({ top: finalPosition, behavior: 'smooth' });
    }
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href*="/#"]');
    if (link) {
      const href = link.getAttribute('href');
      const parts = href.split('/#');
      const anchorId = parts[1];
      const linkPath = parts[0] || '/';

      if (anchorId && (window.location.pathname === linkPath || linkPath === '/')) {
        event.preventDefault();
        event.stopPropagation();
        scrollToElement(anchorId);
        if (window.history.pushState) {
          const cleanUrl = window.location.pathname + window.location.search;
          window.history.pushState({ path: cleanUrl }, '', cleanUrl);
        }
      }
    }
  }, { capture: true });

})();