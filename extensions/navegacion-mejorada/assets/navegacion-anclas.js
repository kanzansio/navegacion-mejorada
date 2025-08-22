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
        duration: parseInt(dataset.scrollDuration || '600', 10),
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

    /**
     * Obtiene todas las anclas de la página.
     */
    getAllAnchors() {
      return Array.from(document.querySelectorAll('.section-anchor[id]'))
        .filter(el => el.dataset.showInNav !== 'false')
        .map(el => ({
          id: el.id,
          name: el.dataset.anchorName || el.id.replace(/-/g, ' '),
          element: el
        }));
    }

    /**
     * Construye el menú de navegación dinámicamente.
     */
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
    
    /**
     * Refresca la lista de anclas y reconstruye el menú.
     */
    refresh() {
        this.anchors = this.getAllAnchors();
        this.buildMenu();
        this.setupScrollSpy();
    }

    // ==============================================
    // LÓGICA DE SCROLL Y ESTADO ACTIVO
    // ==============================================

    /**
     * Obtiene el offset para el scroll.
     */
    getOffset() {
      const offsetValue = this.config.headerOffset;
      if (offsetValue.startsWith('#') || offsetValue.startsWith('.')) {
        const el = document.querySelector(offsetValue);
        return el ? el.getBoundingClientRect().height : 0;
      }
      return parseInt(offsetValue, 10) || 0;
    }
    
    /**
     * Scroll suave a un elemento.
     */
    scrollToElement(elementId) {
      const target = document.getElementById(elementId);
      if (!target) return;

      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
      const offset = this.getOffset();
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
    
    /**
     * Actualiza la clase activa en el menú.
     */
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

    /**
     * Configura la barra de progreso de scroll.
     */
    setupProgressBar() {
      this.progressBar = this.block.querySelector('.scroll-progress-bar');
      if (!this.progressBar) return;

      const onScroll = () => {
        const top = window.pageYOffset || document.documentElement.scrollTop;
        const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const percent = h > 0 ? (top / h) * 100 : 0;
        this.progressBar.style.width = `${percent}%`;
      };
      
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll(); // Llama una vez para estado inicial
    }

    /**
     * Configura el auto-ocultado del menú.
     */
    setupAutoHide() {
      if (!this.menuContainer) return;
      
      let timer = null;
      const show = () => {
        this.menuContainer.classList.remove('nav-hidden');
        clearTimeout(timer);
        timer = setTimeout(() => this.menuContainer.classList.add('nav-hidden'), this.config.autoHideDelay);
      };
      
      ['scroll', 'mousemove', 'touchstart'].forEach(ev => window.addEventListener(ev, show, { passive: true }));
      show(); // Llama una vez para estado inicial
    }

    // ==============================================
    // MANEJADORES DE EVENTOS
    // ==============================================

    /**
     * Configura todos los listeners.
     */
    setupEventListeners() {
      this.block.addEventListener('click', (e) => {
        const link = e.target.closest('a[data-anchor-target]');
        if (link) {
          e.preventDefault();
          const targetId = link.dataset.anchorTarget;
          this.scrollToElement(targetId);
        }
      });
    }
    
    /**
     * Configura el Intersection Observer para el scroll spy.
     */
    setupScrollSpy() {
      if (this.observer) this.observer.disconnect();

      const options = {
        rootMargin: `-${this.getOffset()}px 0px -40% 0px`,
        threshold: 0.1
      };
      
      let lastActiveId = null;

      this.observer = new IntersectionObserver(entries => {
        let bestEntry = null;
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!bestEntry || entry.boundingClientRect.top < bestEntry.boundingClientRect.top) {
                    bestEntry = entry;
                }
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
    
    /**
     * Maneja el scroll inicial si hay un hash o parámetro en la URL.
     */
    handleInitialLoad() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            setTimeout(() => this.scrollToElement(hash), 100);
        }
    }
  }

  // Inicializa la clase para cada bloque de navegación en la página
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.anchor-nav-block').forEach(blockElement => {
      new AnchorNavigation(blockElement);
    });
  });

})();