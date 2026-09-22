'use strict';

(function () {
  const shell = document.getElementById('sigerp-shell');
  const pin = document.getElementById('sigerp-pin');
  const pinIcon = document.getElementById('sigerp-pin-icon');
  const mobileToggle = document.getElementById('sigerp-mobile-toggle');
  const backdrop = document.getElementById('sigerp-backdrop');
  const key = 'sigerp-sidebar-collapsed';

  if (!shell) return;

  const setCollapsed = collapsed => {
    shell.classList.toggle('is-collapsed', collapsed);
    if (pin) pin.setAttribute('aria-label', collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral');
    if (pinIcon) {
      pinIcon.classList.toggle('ri-pushpin-fill', !collapsed);
      pinIcon.classList.toggle('ri-menu-unfold-line', collapsed);
    }
    try { localStorage.setItem(key, collapsed ? '1' : '0'); } catch { /* ignore */ }
  };

  try {
    if (localStorage.getItem(key) === '1') setCollapsed(true);
  } catch { /* ignore */ }

  pin?.addEventListener('click', () => setCollapsed(!shell.classList.contains('is-collapsed')));

  const setMobileOpen = open => {
    shell.classList.toggle('is-mobile-open', open);
    if (backdrop) backdrop.hidden = !open;
    if (mobileToggle) {
      mobileToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      const icon = mobileToggle.querySelector('i');
      if (icon) icon.className = open ? 'ri-close-line' : 'ri-menu-line';
    }
  };

  mobileToggle?.addEventListener('click', () => setMobileOpen(!shell.classList.contains('is-mobile-open')));
  backdrop?.addEventListener('click', () => setMobileOpen(false));

  document.querySelectorAll('[data-sigerp-toggle="module"]').forEach(button => {
    button.addEventListener('click', () => {
      if (shell.classList.contains('is-collapsed') && window.matchMedia('(min-width: 768px)').matches) {
        setCollapsed(false);
        return;
      }
      button.closest('.sigerp-module')?.classList.toggle('is-closed');
    });
  });

  document.querySelectorAll('[data-sigerp-toggle="category"]').forEach(button => {
    button.addEventListener('click', () => {
      button.closest('.sigerp-category')?.classList.toggle('is-open');
    });
  });
})();
