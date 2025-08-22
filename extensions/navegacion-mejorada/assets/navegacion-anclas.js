// navegacion-anclas.js
// Sistema completo de navegación con anclas sin hash para Shopify
(function() {
  'use strict';
  
  // ==============================================
  // CONFIGURACIÓN
  // ==============================================
  // Lee configuración desde los data attributes del script
  const script = document.currentScript;
  const config = {
    duration: parseInt(script?.dataset.duration || '600', 10),        // Duración del scroll en ms
    offset: script?.dataset.offset || '0',                           // Offset para headers fijos
    updateUrl: script?.dataset.updateUrl === 'true',                 // Si actualiza la URL con hash
    menuSelector: script?.dataset.menuSelector || '.anchor-navigation', // Selector del contenedor del menú
    activeClass: script?.dataset.activeClass || 'active-anchor',      // Clase CSS para elemento activo
    allowQuery: script?.dataset.allowQuery !== 'false'                // Permite ?sec=seccion en URL
  };

  // ==============================================
  // UTILIDADES
  // ==============================================
  const utils = {
    // Obtener el offset dinámicamente (puede ser un número o selector CSS)
    getOffset() {
      // Si es un selector CSS (empieza con #, . o [)
      if (/^[#.\[]/.test(config.offset)) {
        const el = document.querySelector(config.offset);
        return el ? el.getBoundingClientRect().height : 0;
      }
      // Si es un número
      return parseInt(config.offset, 10) || 0;
    },

    // Función de easing para animación suave (easeInOutCubic)
    easeInOutCubic(t) {
      return t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },

    // Detectar si el usuario prefiere movimiento reducido
    prefersReducedMotion() {
      return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    },

    // Obtener todas las anclas definidas en la página
    getAllAnchors() {
      return Array.from(document.querySelectorAll('.section-anchor[id]'))
        .map(el => ({
          id: el.id,
          name: el.dataset.anchorName || el.id,
          element: el,
          offset: parseInt(el.dataset.scrollOffset || '0', 10)
        }));
    }
  };

  // ==============================================
  // SISTEMA DE SCROLL SUAVE
  // ==============================================
  const smoothScroll = {
    // Realizar scroll animado a una posición Y específica
    scrollTo(targetY, duration, callback) {
      // Si duración es 0 o el usuario prefiere movimiento reducido
      if (duration <= 0 || utils.prefersReducedMotion()) {
        window.scrollTo({ top: targetY, behavior: 'auto' });
        if (callback) callback();
        return;
      }

      const startY = window.pageYOffset;
      const distance = targetY - startY;
      const startTime = performance.now();

      // Función de animación
      function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = utils.easeInOutCubic(progress);
        
        window.scrollTo(0, startY + (distance * eased));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else if (callback) {
          callback();
        }
      }

      requestAnimationFrame(animate);
    },

    // Scroll a un elemento específico por ID o referencia
    scrollToElement(elementOrId, customOffset) {
      const element = typeof elementOrId === 'string' 
        ? document.getElementById(elementOrId)
        : elementOrId;
        
      if (!element) return false;

      // Calcular posición del elemento
      const rect = element.getBoundingClientRect();
      const absoluteTop = rect.top + window.pageYOffset;
      const offset = customOffset !== undefined ? customOffset : utils.getOffset();
      const targetY = Math.max(0, absoluteTop - offset);

      // Realizar scroll con callback para actualizar estado
      this.scrollTo(targetY, config.duration, () => {
        this.updateActiveState(element.id);
      });

      return true;
    },

    // Actualizar qué ancla está activa en el menú
    updateActiveState(activeId) {
      // Remover todas las clases activas anteriores
      document.querySelectorAll(`.${config.activeClass}`).forEach(el => {
        el.classList.remove(config.activeClass);
      });

      // Agregar clase activa al enlace correspondiente
      if (activeId) {
        const links = document.querySelectorAll(`a[href="#${activeId}"], a[data-anchor="${activeId}"]`);
        links.forEach(link => {
          link.classList.add(config.activeClass);
          // También marcar el contenedor padre (li) si existe
          const parent = link.closest('li, .nav-item');
          if (parent) parent.classList.add(config.activeClass);
        });
      }
    }
  };

  // ==============================================
  // GENERADOR DE MENÚ DE NAVEGACIÓN
  // ==============================================
  const navigationBuilder = {
    updateTimeout: null,

    // Construir el menú de navegación dinámicamente
    buildMenu() {
      const container = document.querySelector(config.menuSelector);
      if (!container) return;

      const anchors = utils.getAllAnchors();
      if (anchors.length === 0) return;

      // Limpiar contenedor
      container.innerHTML = '';

      // Crear estructura del menú
      const nav = document.createElement('nav');
      nav.className = 'anchor-nav-list';
      nav.setAttribute('role', 'navigation');
      nav.setAttribute('aria-label', 'Navegación de página');

      const ul = document.createElement('ul');
      ul.className = 'anchor-nav-items';

      // Crear un item de menú por cada ancla
      anchors.forEach(anchor => {
        const li = document.createElement('li');
        li.className = 'anchor-nav-item';

        const a = document.createElement('a');
        a.href = `#${anchor.id}`;
        a.textContent = anchor.name;
        a.className = 'anchor-nav-link';
        a.dataset.anchor = anchor.id;
        a.setAttribute('aria-label', `Ir a ${anchor.name}`);

        li.appendChild(a);
        ul.appendChild(li);
      });

      nav.appendChild(ul);
      container.appendChild(nav);
    },

    // Actualizar menú con debounce para evitar múltiples actualizaciones
    updateMenu() {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = setTimeout(() => {
        this.buildMenu();
      }, 100);
    }
  };

  // ==============================================
  // OBSERVADOR DE SCROLL (INTERSECTION OBSERVER)
  // ==============================================
  const scrollObserver = {
    sections: new Map(),
    observer: null,

    // Inicializar el observador
    init() {
      // Configuración del Intersection Observer
      // rootMargin ajusta el área de detección
      const options = {
        rootMargin: `-${utils.getOffset()}px 0px -50% 0px`,
        threshold: [0, 0.1, 0.5, 1] // Múltiples puntos de detección
      };

      // Crear observador
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          // Guardar estado de visibilidad de cada sección
          this.sections.set(entry.target.id, entry.isIntersecting);
        });

        // Actualizar sección activa
        const visibleSection = this.getMostVisibleSection();
        if (visibleSection) {
          smoothScroll.updateActiveState(visibleSection);
        }
      }, options);

      // Observar todas las anclas
      utils.getAllAnchors().forEach(anchor => {
        if (anchor.element) {
          this.observer.observe(anchor.element);
        }
      });
    },

    // Obtener la sección más visible actualmente
    getMostVisibleSection() {
      const visible = Array.from(this.sections.entries())
        .filter(([, isVisible]) => isVisible)
        .map(([id]) => id);
      
      return visible[0] || null;
    },

    // Refrescar observador cuando cambian las anclas
    refresh() {
      if (this.observer) {
        this.observer.disconnect();
        this.sections.clear();
        this.init();
      }
    }
  };

  // ==============================================
  // MANEJADORES DE EVENTOS
  // ==============================================
  const eventHandlers = {
    // Manejar clicks en enlaces de ancla
    handleClick(e) {
      // Buscar si el click fue en un enlace de ancla
      const link = e.target.closest('a[href^="#"], a[data-anchor]');
      if (!link) return;

      // Obtener ID del ancla
      const anchorId = link.dataset.anchor || link.getAttribute('href')?.slice(1);
      if (!anchorId) return;

      // Buscar el elemento
      const element = document.getElementById(anchorId);
      if (!element) return;

      // Prevenir comportamiento por defecto
      e.preventDefault();
      
      // Realizar scroll suave
      const customOffset = element.closest('.section-anchor')?.dataset.scrollOffset;
      smoothScroll.scrollToElement(element, customOffset ? parseInt(customOffset, 10) : undefined);

      // Opcionalmente actualizar URL sin causar scroll
      if (config.updateUrl) {
        history.replaceState({ anchor: anchorId }, '', `#${anchorId}`);
      }

      // Disparar evento personalizado para que otros scripts puedan escuchar
      window.dispatchEvent(new CustomEvent('anchorNavigate', {
        detail: { anchor: anchorId, element }
      }));
    },

    // Manejar carga inicial con query parameter (?sec=seccion)
    handleInitialLoad() {
      if (!config.allowQuery) return;

      const params = new URLSearchParams(location.search);
      const section = params.get('sec') || params.get('section');
      
      if (section) {
        // Delay para asegurar que el DOM esté listo
        setTimeout(() => {
          if (smoothScroll.scrollToElement(section)) {
            // Limpiar URL después del scroll
            const cleanUrl = location.pathname + location.hash;
            history.replaceState(null, '', cleanUrl);
          }
        }, 100);
      } else if (location.hash) {
        // Manejar hash existente en la URL
        const anchorId = location.hash.slice(1);
        setTimeout(() => {
          smoothScroll.scrollToElement(anchorId);
        }, 100);
      }
    },

    // Manejar navegación con botones del navegador (back/forward)
    handlePopState() {
      if (location.hash) {
        const anchorId = location.hash.slice(1);
        smoothScroll.scrollToElement(anchorId);
      }
    }
  };

  // ==============================================
  // INICIALIZACIÓN
  // ==============================================
  function init() {
    // Construir menú de navegación inicial
    navigationBuilder.buildMenu();

    // Iniciar observador de scroll
    scrollObserver.init();

    // Registrar event listeners
    document.addEventListener('click', eventHandlers.handleClick);
    window.addEventListener('popstate', eventHandlers.handlePopState);
    
    // Manejar carga inicial
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', eventHandlers.handleInitialLoad);
    } else {
      eventHandlers.handleInitialLoad();
    }

    // Observar cambios en el DOM para actualizar menú automáticamente
    const domObserver = new MutationObserver(() => {
      navigationBuilder.updateMenu();
      scrollObserver.refresh();
    });

    // Configurar qué observar
    domObserver.observe(document.body, {
      childList: true,        // Cambios en hijos
      subtree: true,          // Cambios en todo el árbol
      attributes: true,       // Cambios en atributos
      attributeFilter: ['id', 'data-anchor-name'] // Solo estos atributos
    });

    // ==============================================
    // API PÚBLICA
    // ==============================================
    // Exponer funciones para uso externo
    window.AnchorNavigation = {
      // Navegar a un ancla programáticamente
      scrollTo: (anchor) => smoothScroll.scrollToElement(anchor),
      
      // Refrescar el menú y observadores
      refresh: () => {
        navigationBuilder.updateMenu();
        scrollObserver.refresh();
      },
      
      // Obtener lista de todas las anclas
      getAnchors: () => utils.getAllAnchors(),
      
      // Acceso a la configuración
      config
    };

    // Disparar evento cuando el sistema está listo
    window.dispatchEvent(new CustomEvent('anchorNavigationReady'));
  }

  // ==============================================
  // ARRANQUE
  // ==============================================
  // Iniciar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();