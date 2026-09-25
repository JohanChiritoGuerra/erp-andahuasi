/* Andahuasi — comportamiento del shell y componentes v1.0 (JavaScript puro, sin dependencias).
   Todo funciona por atributos data-*; no hace falta inicializar nada por página. */
(function () {
  'use strict';
  const html = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const setCookie = (k, v) => { document.cookie = k + '=' + v + ';path=/;max-age=31536000;samesite=lax'; };
  const isMobile = () => innerWidth < 768;
  const isRail = () => html.dataset.sidebar === 'rail' && !isMobile();
  const themeNow = html.dataset.theme === 'dark' || html.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light';
  $$('[data-theme-set]').forEach(b => b.classList.toggle('is-selected', b.dataset.themeSet === themeNow));

  /* ---------- Superposiciones: solo una abierta ---------- */
  let openEl = null, openTrigger = null;
  function closeAll() {
    if (openEl) { openEl.hidden = true; openEl.classList.remove('is-open'); }
    if (openTrigger) openTrigger.setAttribute('aria-expanded', 'false');
    $$('.dropdown.is-open').forEach(d => { d.classList.remove('is-open'); $('.dropdown-menu', d).hidden = true; });
    openEl = openTrigger = null;
  }
  function place(el, trigger, placement) {
    el.hidden = false;
    const r = trigger.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
    const sb = $('.sidebar').getBoundingClientRect();
    let top, left;
    if (placement === 'bottom-end') {                       // cabecera móvil
      left = r.right - w; top = r.bottom + 4;
    } else if (placement === 'right-start') {               // flyout del rail
      left = sb.right - 4; top = r.top;
    } else {                                               // foto y campana: al costado del botón
      left = r.right + 8; top = r.bottom - h;
    }
    el.style.width = '';
    el.style.left = Math.max(8, Math.min(left, innerWidth - el.offsetWidth - 8)) + 'px';
    el.style.top = Math.max(8, Math.min(top, innerHeight - el.offsetHeight - 8)) + 'px';
  }
  function open(el, trigger, placement) {
    const same = openEl === el && openTrigger === trigger;
    closeAll();
    if (same) return;
    place(el, trigger, placement);
    el.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    openEl = el; openTrigger = trigger;
  }
  document.addEventListener('mousedown', e => {
    if (!openEl && !$('.dropdown.is-open')) return;
    if (e.target.closest('.popover, .flyout, .dropdown.is-open, [data-popover], [data-flyout-all], .sb-nav .lvl-0')) return;
    closeAll();
  }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeAll(); html.classList.remove('drawer-open'); } });
  addEventListener('resize', closeAll);

  /* ---------- Sidebar: expandido / rail / drawer ---------- */
  function autoSidebar() {
    if (!document.cookie.includes('sidebar=')) html.dataset.sidebar = innerWidth >= 1280 ? 'expanded' : 'rail';
  }
  autoSidebar(); addEventListener('resize', autoSidebar);

  document.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('[data-sidebar-toggle]')) {
      html.dataset.sidebar = html.dataset.sidebar === 'rail' ? 'expanded' : 'rail';
      setCookie('sidebar', html.dataset.sidebar); closeAll(); return;
    }
    if (t.closest('[data-drawer-open]')) { closeAll(); html.classList.add('drawer-open'); return; }
    if (t.closest('[data-drawer-close]')) { html.classList.remove('drawer-open'); return; }

    const pop = t.closest('[data-popover]');
    if (pop) { open(document.getElementById(pop.dataset.popover), pop, pop.dataset.placement || 'bottom-end'); return; }

    const theme = t.closest('[data-theme-set]');
    if (theme) {
      const mode = theme.dataset.themeSet === 'dark' ? 'dark' : 'light';
      html.dataset.theme = mode;
      html.setAttribute('data-bs-theme', mode);
      setCookie('tema', mode);
      try { localStorage.setItem('sigerp-theme', mode); } catch (err) { /* ignore */ }
      $$('[data-theme-set]').forEach(b => b.classList.toggle('is-selected', b.dataset.themeSet === mode));
      closeAll(); return;
    }

    /* Árbol: en rail, el módulo abre el flyout; si no, expande/contrae */
    const row = t.closest('[data-toggle]');
    if (row) {
      if (row.classList.contains('lvl-0') && row.closest('.sb-nav') && isRail()) { openModuleFlyout(row); return; }
      toggleNode(row);
      if (row.closest('.sb-nav')) persistNav();
      return;
    }
    if (t.closest('[data-nav-expand-all]')) { expandAll($('.sb-nav .nav-tree')); persistNav(); return; }
    if (t.closest('[data-flyout-all]')) { openGlobalFlyout(t.closest('[data-flyout-all]')); return; }
    if (t.closest('[data-flyout-expand-all]')) { expandAll($('#nav-flyout .flyout-body')); return; }

    /* Desplegable propio */
    const ddBtn = t.closest('[data-dropdown-btn]');
    if (ddBtn) {
      const dd = ddBtn.closest('.dropdown'), wasOpen = dd.classList.contains('is-open');
      closeAll(); if (!wasOpen) { dd.classList.add('is-open'); $('.dropdown-menu', dd).hidden = false; } return;
    }
    const opt = t.closest('.dropdown-menu [data-value]');
    if (opt) {
      const dd = opt.closest('.dropdown');
      $('input[type=hidden]', dd).value = opt.dataset.value;
      $('[data-dropdown-label]', dd).textContent = opt.textContent.trim();
      $$('[data-value]', dd).forEach(o => o.classList.toggle('is-selected', o === opt));
      closeAll();
      if (dd.hasAttribute('data-submit')) dd.closest('form').submit();
      return;
    }

    /* Modales (<dialog>) */
    const mo = t.closest('[data-modal-open]');
    if (mo) { closeAll(); document.getElementById(mo.dataset.modalOpen).showModal(); return; }
    if (t.closest('[data-modal-close]')) { t.closest('dialog').close(); return; }
    if (t.tagName === 'DIALOG') t.close();                 // clic en el fondo

    /* Limpiar búsqueda */
    const clr = t.closest('[data-search-clear]');
    if (clr) { const i = $('input', clr.closest('.search')); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); i.focus(); }
  });

  /* ---------- Árbol ---------- */
  function toggleNode(row, force) {
    const kids = row.nextElementSibling;
    if (!kids || !kids.classList.contains('nav-children')) return;
    const openNow = force !== undefined ? force : row.getAttribute('aria-expanded') !== 'true';
    row.setAttribute('aria-expanded', String(openNow)); kids.hidden = !openNow;
  }
  const navOpenKey = 'erp-nav-open';
  function navKey(row) {
    const label = (($('.nav-label', row) || {}).textContent || '').trim();
    if (row.classList.contains('lvl-0')) return 'm:' + label;
    const mod = row.closest('.nav-mod');
    const modLabel = mod ? (($('.nav-label', mod) || {}).textContent || '').trim() : '';
    return 'c:' + modLabel + '|' + label;
  }
  function persistNav() {
    const tree = $('.sb-nav .nav-tree');
    if (!tree) return;
    const open = $$('[data-toggle]', tree).filter(r => r.getAttribute('aria-expanded') === 'true').map(navKey);
    try { sessionStorage.setItem(navOpenKey, JSON.stringify(open)); } catch (err) { /* ignore */ }
  }
  function restoreNav() {
    const tree = $('.sb-nav .nav-tree');
    if (!tree) return;
    let open = [];
    try { open = JSON.parse(sessionStorage.getItem(navOpenKey) || '[]'); } catch (err) { return; }
    if (!Array.isArray(open) || !open.length) return;
    const wanted = new Set(open);
    $$('[data-toggle]', tree).forEach(row => {
      if (wanted.has(navKey(row)) && row.getAttribute('aria-expanded') !== 'true') toggleNode(row, true);
    });
  }
  restoreNav();
  function expandAll(root) {
    const rows = $$('[data-toggle]', root);
    const allOpen = rows.every(r => r.getAttribute('aria-expanded') === 'true');
    rows.forEach(r => toggleNode(r, !allOpen));
  }
  function filterTree(root, q) {
    q = norm(q.trim());
    if (!root._snap) root._snap = $$('[data-toggle]', root).map(r => [r, r.getAttribute('aria-expanded') === 'true']);
    $$('.is-filtered-out', root).forEach(n => n.classList.remove('is-filtered-out'));
    if (!q) { root._snap.forEach(([r, o]) => toggleNode(r, o)); root._snap = null; setEmpty(root, false); return; }
    let any = false;
    $$('.nav-mod, .nav-cat', root).reverse().forEach(node => {       // de hojas hacia arriba
      const label = norm($('.nav-label', node).textContent);
      const acc = $$(':scope > .nav-children > .lvl-2', node);
      const labelHit = label.includes(q);
      let hit = labelHit;
      acc.forEach(a => { const m = labelHit || norm(a.textContent).includes(q); a.classList.toggle('is-filtered-out', !m); if (m) hit = true; });
      const subs = $$(':scope > .nav-children > .nav-cat', node).filter(c => !c.classList.contains('is-filtered-out'));
      hit = hit || subs.length > 0;
      node.classList.toggle('is-filtered-out', !hit);
      if (hit) { toggleNode($(':scope > [data-toggle]', node), true); any = true; }
    });
    setEmpty(root, !any);
  }
  function setEmpty(root, show) {
    let e = $(':scope > .nav-empty', root);
    if (!e) { e = document.createElement('div'); e.className = 'nav-empty'; e.textContent = 'Sin accesos que coincidan.'; root.appendChild(e); }
    e.hidden = !show;
  }
  document.addEventListener('input', e => {
    const inp = e.target;
    if (inp.matches('[data-nav-search]')) filterTree($('.sb-nav .nav-tree'), inp.value);
    if (inp.matches('[data-flyout-search]')) filterTree($('#nav-flyout .flyout-body'), inp.value);
    const s = inp.closest('.search'); const c = s && $('[data-search-clear]', s);
    if (c) c.hidden = !inp.value;
  });
  $$('.search input').forEach(i => { const c = $('[data-search-clear]', i.closest('.search')); if (c) c.hidden = !i.value; });

  /* ---------- Flyouts del rail ---------- */
  const fly = $('#nav-flyout');
  function fillFlyout(title, nodes, openCats, placeholder) {
    $('.flyout-title', fly).textContent = title;
    const inp = $('[data-flyout-search]', fly); inp.value = ''; inp.placeholder = placeholder;
    $('[data-search-clear]', fly).hidden = true;
    const body = $('.flyout-body', fly); body.innerHTML = ''; body._snap = null;
    nodes.forEach(n => body.appendChild(n));
    $$('[data-toggle]', body).forEach(r => toggleNode(r, openCats));
  }
  function openModuleFlyout(row) {
    if (openEl === fly && openTrigger === row) { closeAll(); return; }
    const mod = row.closest('.nav-mod');
    const cats = $$(':scope > .nav-children > .nav-cat', mod).map(c => c.cloneNode(true));
    cats.forEach(c => { const r = $(':scope > [data-toggle]', c); r.classList.remove('lvl-1'); r.style.paddingLeft = '8px'; $$('.lvl-2', c).forEach(a => a.style.paddingLeft = '24px'); });
    fillFlyout($('.nav-label', row).textContent, cats, true, 'Buscar en el módulo...');
    open(fly, row, 'right-start'); sizeFlyout();
  }
  function openGlobalFlyout(btn) {
    if (openEl === fly && openTrigger === btn) { closeAll(); return; }
    const tree = $('.sb-nav .nav-tree').cloneNode(true);
    fillFlyout('Todos los accesos', [tree], false, 'Buscar accesos...');
    open(fly, btn, 'right-start'); sizeFlyout();
  }
  function sizeFlyout() {
    const top = parseFloat(fly.style.top);
    fly.style.maxHeight = (innerHeight - top - 16) + 'px';
    if (fly.offsetHeight < 260 && top > innerHeight - 276) fly.style.top = Math.max(8, innerHeight - 276) + 'px';
  }
})();
