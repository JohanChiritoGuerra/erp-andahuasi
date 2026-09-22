'use strict';

(function () {
  const color = document.documentElement.getAttribute('data-tenant-primary');
  if (!color) return;

  if (window.templateCustomizer && typeof window.templateCustomizer.setColor === 'function') {
    if (typeof window.templateCustomizer._setSetting === 'function') {
      window.templateCustomizer._setSetting('Color', color);
    }
    window.templateCustomizer.setColor(color, true);
  } else if (window.Helpers && typeof window.Helpers.setColor === 'function') {
    window.Helpers.setColor(color, true);
  }
})();
