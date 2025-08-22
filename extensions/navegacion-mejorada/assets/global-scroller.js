// assets/global-scroller.js
// Script optimizado para navegación suave sin hash en URL

(() => {
  'use strict';
  
  if (window.globalScrollerInitialized) return;
  window.globalScrollerInitialized = true;

  const scriptTag = document.currentScript;
  const config = {
    offset: scriptTag?.dataset.offset || '80',
    align: scriptTag?.dataset.align || 'start',
    duration: parseInt(scriptTag?.dataset.duration) || 600
  };

  function getOffset(targetElement) {
    const anchorOffset = targetElement?.dataset.scrollOffset;
    if (anchorOffset) return parseInt(anchorOffset, 10);
    
    if (config.offset.startsWith('#') || config.offset.startsWith('.')) {
      const el = document.querySelector(config.offset);
      return el ? el.getBoundingClientRect().height : 0;
    }
    return parseInt(config.offset, 10) || 0;
  }
  
  function smoothScrollTo(target, duration) {
    const startPosition = window.pageYOffset;
    const offset = getOffset(target);
    const targetPosition = target.getBoundingClientRect().top + startPosition - offset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
      if (!startTime) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const ease = progress < 0.5 
        ? 2 * progress * progress 
        : -1 + (4 - 2 * progress) * progress;
      
      window.scrollTo(0, startPosition + distance * ease);
      
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    }
    
    requestAnimationFrame(animation);
  }

  function handleAnchorClick(e) {
    const link = e.target.closest('a[href*="/#"], a[href^="#"]');
    if (!link) return;

    const href = link.getAttribute('href');
    let anchorId;
    
    if (href.includes('/#')) {
      const parts = href.split('/#');
      anchorId = parts[1];
      const linkPath = parts[0] || window.location.pathname;
      
      if (linkPath !== window.location.pathname && linkPath !== '/') {
        return; // Diferente página, dejar navegación normal
      }
    } else if (href.startsWith('#')) {
      anchorId = href.substring(1);
    }
    
    if (!anchorId) return;
    
    const target = document.getElementById(anchorId);
    if (!target) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const isReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    
    if (isReducedMotion || !config.duration) {
      target.style.scrollMarginTop = `${getOffset(target)}px`;
      target.scrollIntoView({ 
        behavior: 'auto', 
        block: config.align 
      });
    } else {
      smoothScrollTo(target, config.duration);
    }
    
    // Mantener URL limpia
    if (window.history.replaceState) {
      const cleanUrl = window.location.pathname + window.location.search;
      window.history.replaceState(null, '', cleanUrl);
    }
    
    return false;
  }

  // Usar capture para interceptar antes que otros scripts
  document.addEventListener('click', handleAnchorClick, true);
  
  // Manejar navegación al cargar con hash
  if (window.location.hash) {
    const anchorId = window.location.hash.substring(1);
    const target = document.getElementById(anchorId);
    
    if (target) {
      setTimeout(() => {
        smoothScrollTo(target, config.duration);
        // Limpiar hash después del scroll
        if (window.history.replaceState) {
          const cleanUrl = window.location.pathname + window.location.search;
          window.history.replaceState(null, '', cleanUrl);
        }
      }, 100);
    }
  }
})();