// assets/navegacion-anclas.js
// Sistema unificado de navegación por anclas para Shopify.
// Incluye smooth scroll, scroll spy, menú dinámico, auto-ocultado y barra de progreso.

(() => {
  'use strict';

  // Solo se ejecuta una vez, incluso si el script se carga varias veces.
  if (window.AnchorNavigationInitialized) return;
  window.AnchorNavigationInitialized = true;

  class AnchorNavigation {
    constructor(blockElement) {
      this.block = blockElement;
      if (!this.block) return;

      this.config = this.loadConfig();
      this.init();
    }

    /**
     * Carga la configuración desde los atributos de datos del elemento del bloque.
     */
    loadConfig() {
      const dataset = this.block.dataset;
      return {
        // --- Configuración de Scroll ---
        headerOffset: dataset.headerOffset || '80',

        // --- Configuración del Menú ---
        menuSelector: '.anchor-navigation', // Selector local al bloque
        activeClass: 'active-anchor',
        
        // --- Funcionalidades Adicionales ---
        autoHide: dataset.autoHide === 'true',
        autoHideDelay: parseInt(dataset.autoHideDelay || '3000', 10),
        showProgress: dataset.showProgress === 'true',
      };
    }

    /**
     * Inicializa todas las funcionalidades.
     */
    init() {
      this.menuContainer = this.block.querySelector(this.config.menuSelector);
      this.anchors = this.getAllAnchors();
      
      this.buildMenu();
      this.setupEventListeners();
      
      if (this.config.showProgress) this.setupProgressBar();
      if (this.config.autoHide) this.setupAutoHide();
      
      this.setupScrollSpy();
      this.handleInitialLoad();

      // Exponer API pública
      window.AnchorNavigation = {
        scrollTo: this.scrollToElement.bind(this),
        refresh: this.refresh.bind(this),
        getAnchors: this.getAllAnchors.bind(this),
      };
      
      window.dispatchEvent(new CustomEvent('anchorNavigationReady'));
    }

    // ==============================================
    // LÓGICA DEL MENÚ Y ANCLAS
    // ==============================================

    getAllAnchors() {
      return Array.from(document.querySelectorAll('.section-anchor[id]'))
        .filter(el => el.dataset.showInNav !== 'false')
        .map(el => ({
          id: el.id,
          name: el.dataset.anchorName || el.id.replace(/-/g, ' '),
          element: el
        }));
    }

    buildMenu() {
      if (!this.menuContainer || this.anchors.length === 0) return;

      this.menuContainer.innerHTML = '';
      const nav = document.createElement('nav');
      nav.className = 'anchor-nav-list';
      nav.setAttribute('aria-label', 'Navegación de página');

      const ul = document.createElement('ul');
      ul.className = 'anchor-nav-items';

      this.anchors.forEach(anchor => {
        const li = document.createElement('li');
        li.className = 'anchor-nav-item';
        const a = document.createElement('a');
        a.href = `#${anchor.id}`;
        a.className = 'anchor-nav-link';
        a.dataset.anchorTarget = anchor.id;
        a.setAttribute('aria-label', `Ir a ${anchor.name}`);
        const span = document.createElement('span');
        span.className = 'anchor-nav-label';
        span.textContent = anchor.name;
        a.appendChild(span);
        li.appendChild(a);
        ul.appendChild(li);
      });

      nav.appendChild(ul);
      this.menuContainer.appendChild(nav);
    }
    
    refresh() {
        this.anchors = this.getAllAnchors();
        this.buildMenu();
        this.setupScrollSpy();
    }

    // ==============================================
    // LÓGICA DE SCROLL Y ESTADO ACTIVO
    // ==============================================

    getOffset(targetElement) {
      // Prioridad 1: Offset específico del ancla.
      const anchorSpecificOffset = targetElement?.dataset.scrollOffset;
      if (anchorSpecificOffset && anchorSpecificOffset !== '0') {
        return parseInt(anchorSpecificOffset, 10);
      }
      
      // Prioridad 2: Offset global del menú.
      const globalOffset = this.config.headerOffset;
      if (globalOffset.startsWith('#') || globalOffset.startsWith('.')) {
        const el = document.querySelector(globalOffset);
        return el ? el.getBoundingClientRect().height : 0;
      }
      return parseInt(globalOffset, 10) || 0;
    }
    
    scrollToElement(elementId) {
      const target = document.getElementById(elementId);
      if (!target) return;

      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
      const offset = this.getOffset(target); // Pasa el elemento para leer su offset específico.
      const finalPosition = targetPosition - offset;

      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
          window.scrollTo({ top: finalPosition, behavior: 'auto' });
      } else {
          window.scrollTo({
              top: finalPosition,
              behavior: 'smooth'
          });
      }
    }
    
    updateActiveState(targetId) {
        this.block.querySelectorAll(`.${this.config.activeClass}`).forEach(el => {
            el.classList.remove(this.config.activeClass);
        });

        if (targetId) {
            const activeLink = this.block.querySelector(`a[href="#${targetId}"]`);
            if (activeLink) {
                activeLink.classList.add(this.config.activeClass);
                activeLink.closest('li')?.classList.add(this.config.activeClass);
            }
        }
    }

    // ==============================================
    // FUNCIONALIDADES EXTRA
    // ==============================================

    setupProgressBar() {
      this.progressBar = this.block.querySelector('.scroll-progress-bar');
      if (!this.progressBar) return;
      const onScroll = () => {
        const h = document.documentElement;
        const percent = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
        this.progressBar.style.width = `${percent}%`;
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    setupAutoHide() {
      if (!this.menuContainer) return;
      let timer = null;
      const show = () => {
        this.menuContainer.classList.remove('nav-hidden');
        clearTimeout(timer);
        timer = setTimeout(() => this.menuContainer.classList.add('nav-hidden'), this.config.autoHideDelay);
      };
      ['scroll', 'mousemove', 'touchstart'].forEach(ev => window.addEventListener(ev, show, { passive: true }));
      show();
    }

    // ==============================================
    // MANEJADORES DE EVENTOS
    // ==============================================

    setupEventListeners() {
      this.block.addEventListener('click', (e) => {
        const link = e.target.closest('a[data-anchor-target]');
        if (link) {
          e.preventDefault();
          this.scrollToElement(link.dataset.anchorTarget);
        }
      });
    }
    
    setupScrollSpy() {
      if (this.observer) this.observer.disconnect();
      const options = { rootMargin: `-${this.getOffset()}px 0px -40% 0px`, threshold: 0.1 };
      let lastActiveId = null;
      this.observer = new IntersectionObserver(entries => {
        let bestEntry = null;
        entries.forEach(entry => {
            if (entry.isIntersecting && (!bestEntry || entry.boundingClientRect.top < bestEntry.boundingClientRect.top)) {
                bestEntry = entry;
            }
        });
        const newActiveId = bestEntry ? bestEntry.target.id : lastActiveId;
        if (newActiveId !== lastActiveId) {
            this.updateActiveState(newActiveId);
            lastActiveId = newActiveId;
        }
      }, options);
      this.anchors.forEach(anchor => this.observer.observe(anchor.element));
    }
    
    handleInitialLoad() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            setTimeout(() => this.scrollToElement(hash), 100);
        }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.anchor-nav-block').forEach(block => new AnchorNavigation(block));
  });

})();