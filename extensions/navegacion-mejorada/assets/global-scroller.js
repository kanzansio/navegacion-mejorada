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
    const link = event.target.closest('a[href*="/#"]');

    if (link) {
      const href = link.getAttribute('href');
      const parts = href.split('/#');
      const anchorId = parts[1];
      const linkPath = parts[0] || '/'; // Asumimos la raíz si no hay nada antes del #

      // Comprueba si el enlace es para la página actual.
      if (anchorId && (window.location.pathname === linkPath || linkPath === '/')) {
        // Previene tanto el salto como la actualización de la URL.
        event.preventDefault();
        event.stopPropagation();

        scrollToElement(anchorId);

        // ¡LA MAGIA ESTÁ AQUÍ!
        // Asegura que la URL permanezca limpia después del click.
        if (window.history.pushState) {
          const cleanUrl = window.location.pathname + window.location.search;
          // Usamos pushState para mantener el comportamiento del botón "atrás" intacto.
          window.history.pushState({ path: cleanUrl }, '', cleanUrl);
        }
      }
    }
  }, { capture: true });

})();