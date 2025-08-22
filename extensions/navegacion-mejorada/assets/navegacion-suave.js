// assets/navegacion-suave.js
(function () {
  // Lee configuración desde el <script data-...>
  const cfg = document.currentScript?.dataset || {};
  const selector = cfg.selector || 'a[href^="#"]';
  const duration = Math.max(0, parseInt(cfg.duration || '500', 10) || 0);

  // Offset superior: número o función que resuelve el alto del header fijo
  // Puedes pasar un número (px) o un selector CSS en data-offset (ej. "#site-header")
  let offsetValue = cfg.offset || '0';

  function getOffset() {
    // Si enviaron un selector de elemento (empieza con # o . o [)
    if (/^[#.\[]/.test(offsetValue)) {
      const el = document.querySelector(offsetValue);
      return el ? el.getBoundingClientRect().height : 0;
    }
    // Si enviaron un número (cadena "80" -> 80)
    const n = parseInt(offsetValue + '', 10);
    return isNaN(n) ? 0 : n;
  }

  // Prefiere respetar prefers-reduced-motion
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Easing estándar (easeInOutQuad)
  function ease(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function smoothScrollTo(targetY, ms) {
    if (ms <= 0 || prefersReduced) {
      window.scrollTo({ top: targetY });
      return;
    }
    const startY = window.scrollY || window.pageYOffset;
    const delta = targetY - startY;
    const start = performance.now();

    function step(now) {
      const p = Math.min((now - start) / ms, 1);
      const y = startY + delta * ease(p);
      window.scrollTo(0, y);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function scrollToHash(hash) {
    if (!hash || hash === '#') return;
    const el = document.querySelector(hash);
    if (!el) return;

    const top = (el.getBoundingClientRect().top + (window.scrollY || window.pageYOffset)) - getOffset();
    smoothScrollTo(Math.max(0, top), duration);
  }

  // Click handler para enlaces con ancla
  document.addEventListener('click', (e) => {
    const a = e.target.closest(selector);
    if (!a) return;

    const href = a.getAttribute('href') || '';
    if (!href.startsWith('#')) return;

    const el = document.querySelector(href);
    if (!el) return;

    e.preventDefault();
    // Actualiza el hash de forma accesible sin saltar bruscamente
    history.pushState(null, '', href);
    scrollToHash(href);
  });

  // Si la página carga con hash, desplázate suavemente
  window.addEventListener('load', () => {
    if (location.hash) {
      // Pequeño delay para permitir layout/imagenes
      setTimeout(() => scrollToHash(location.hash), 0);
    }
  });

  // Soporte Back/Forward del navegador manteniendo desplazamiento suave
  window.addEventListener('popstate', () => {
    scrollToHash(location.hash);
  });
})();
