// Auto-hide + progress, scopiado por block.id
(() => {
  const root = document.currentScript.closest('.anchor-nav-block');
  if (!root) return;

  const blockId = root.dataset.blockId;
  const nav = root.querySelector('.anchor-navigation');

  // Auto-hide
  if (root.dataset.autoHide === 'true' && nav) {
    let timer = null;
    const delay = parseInt(root.dataset.autoHideDelay || '3000', 10);
    const show = () => {
      nav.classList.remove('nav-hidden');
      clearTimeout(timer);
      timer = setTimeout(() => nav.classList.add('nav-hidden'), delay);
    };
    ['scroll', 'mousemove', 'touchstart'].forEach(ev => window.addEventListener(ev, show, { passive: true }));
    show();
  }

  // Progress bar
  if (root.dataset.showProgress === 'true') {
    const bar = root.querySelector('.scroll-progress-bar');
    const onScroll = () => {
      const top = window.pageYOffset || document.documentElement.scrollTop;
      const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const pct = h > 0 ? (top / h) * 100 : 0;
      if (bar) bar.style.width = pct + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
