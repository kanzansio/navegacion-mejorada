// assets/global-scroller.js
// VERSIÓN ROBUSTA
// Script global para hashless smooth scrolling desde cualquier enlace.

(() => {
  'use strict';
  if (window.globalScrollerInitialized) return;
  window.globalScrollerInitialized = true;

  const scriptTag = document.currentScript;
  const config = {
    offset: scriptTag?.dataset.offset || '80',
    align: scriptTag?.dataset.align || 'start',
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

    // Usar scrollIntoView que es más moderno y maneja la alineación
    const isReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // El offset se maneja con un scroll-margin-top en el CSS del ancla
    target.style.scrollMarginTop = `${getOffset(target)}px`;

    target.scrollIntoView({
      behavior: isReducedMotion ? 'auto' : 'smooth',
      block: config.align === 'center' ? 'center' : 'start',
      inline: 'nearest'
    });
  }

  // Se usa 'mousedown' en lugar de 'click' para actuar ANTES que otros scripts.
  document.addEventListener('mousedown', (event) => {
    const link = event.target.closest('a[href*="/#"]');

    if (link) {
      const href = link.getAttribute('href');
      const parts = href.split('/#');
      const anchorId = parts[1];
      const linkPath = parts[0] || '/';

      const isCurrentPage = window.location.pathname === linkPath || linkPath === '/';
      const targetElement = document.getElementById(anchorId);

      if (anchorId && isCurrentPage && targetElement) {
        // Prevenimos la acción por defecto de la forma más agresiva posible.
        event.preventDefault();
        event.stopPropagation();
        
        scrollToElement(anchorId);

        // Limpiamos la URL
        if (window.history.replaceState) {
          const cleanUrl = window.location.pathname + window.location.search;
          window.history.replaceState(null, '', cleanUrl);
        }
        
        return false; // Buena práctica para detener la propagación del evento.
      }
    }
  }, true); // El 'true' al final (useCapture) hace que nuestro script se ejecute primero.

})();