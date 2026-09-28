(function () {
  const root = document.getElementById('campos-campanias');
  if (!root || !window.erp) return;

  const API = '/paltos/campos-campanias';
  const desktopMq = window.matchMedia('(min-width: 1024px)');
  const isDesktop = () => desktopMq.matches;
  const mode = root.dataset.mode || 'lista';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const iso = (v) => String(v || '').slice(0, 10);
  const fmt = (v) => {
    const d = iso(v);
    if (!d || d.length < 10) return '—';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };
  const suggested = (start, end) => (start && end ? `${start.slice(2, 4)}-${end.slice(2, 4)}` : '');
  const byCode = (a, b) => String(a.codigoCampo).localeCompare(String(b.codigoCampo), 'es', { numeric: true });
  const ha = (n) => Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const estadoLabel = (estado) => ({
    ACTIVA: 'Activa',
    EN_PLANIFICACION: 'En planificación',
    CERRADA: 'Cerrada',
    RECONSTRUIDA: 'Reconstruida',
    CANCELADA: 'Cancelada'
  }[estado] || estado || '—');

  const estadoPill = (estado) => ({
    ACTIVA: 'pill-success',
    EN_PLANIFICACION: 'pill-info',
    RECONSTRUIDA: 'pill-warning',
    CANCELADA: 'pill-danger'
  }[estado] || '');

  let fields = [];
  let campaigns = [];
  let catalog = [];
  let preview = [];
  let selectedHistory = [];
  let tab = new URLSearchParams(location.search).get('estado') === 'inactivos' ? 'inactivos' : 'activos';
  let selectedId = mode === 'detalle' ? Number(root.dataset.id) : 0;
  let q = '';

  const panel = document.getElementById('campo-panel');
  const rowsEl = document.getElementById('cc-rows');
  const countEl = document.getElementById('cc-count');

  const fieldCampaigns = (field) => [
    ...(field.campaniaActiva ? [field.campaniaActiva] : []),
    ...(field.campaniaPlanificacion ? [field.campaniaPlanificacion] : []),
    ...(field.historial || [])
  ];

  const visible = () => fields
    .filter((f) => (tab === 'activos' ? f.activo : !f.activo))
    .filter((f) => {
      const n = q.trim().toLowerCase();
      if (!n) return true;
      return `${f.codigoCampo} ${f.nombreActual}`.toLowerCase().includes(n);
    })
    .sort(byCode);

  const toast = (ok, text) => erp.toast(ok ? 'success' : 'error', text || (ok ? 'Listo' : 'No se pudo completar'));

  let waitCount = 0;
  function waitEl() {
    let el = document.getElementById('cc-wait');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'cc-wait';
    el.className = 'cc-wait';
    el.hidden = true;
    el.innerHTML = '<div class="cc-wait__card" role="status" aria-live="polite"><span class="cc-wait__spin" aria-hidden="true"></span><p id="cc-wait-text">Procesando…</p></div>';
    root.appendChild(el);
    return el;
  }
  function confirmDs(title, text) {
    return new Promise((resolve) => {
      let dlg = document.getElementById('dlg-confirm');
      if (!dlg) {
        dlg = document.createElement('dialog');
        dlg.id = 'dlg-confirm';
        dlg.className = 'modal';
        dlg.innerHTML = '<div class="modal-head"><i class="ri ri-question-line"></i><span class="modal-title"></span><button type="button" class="icon-btn" data-confirm="no" aria-label="Cerrar"><i class="ri ri-close-line"></i></button></div><div class="modal-body"><p></p></div><div class="modal-foot"><button type="button" class="btn" data-confirm="no">Cancelar</button><button type="button" class="btn btn-primary" data-confirm="yes">Continuar</button></div>';
        root.appendChild(dlg);
        dlg.addEventListener('close', () => {
          const done = dlg._resolve;
          dlg._resolve = null;
          if (done) done(dlg.returnValue === 'yes');
        });
        dlg.addEventListener('click', (event) => {
          const btn = event.target.closest('[data-confirm]');
          if (!btn) return;
          dlg.close(btn.dataset.confirm);
        });
      }
      dlg.querySelector('.modal-title').textContent = title;
      dlg.querySelector('.modal-body p').textContent = text;
      dlg._resolve = resolve;
      dlg.showModal();
    });
  }

  async function busy(text, fn) {
    const el = waitEl();
    document.getElementById('cc-wait-text').textContent = text;
    waitCount += 1;
    el.hidden = false;
    try { return await fn(); }
    finally {
      waitCount = Math.max(0, waitCount - 1);
      if (!waitCount) el.hidden = true;
    }
  }

  async function reloadField(id) {
    const res = await erp.get(`${API}?handler=Campo&id=${id}`);
    if (!res?.success || !res.data) throw new Error(res?.message || 'No se pudo actualizar el campo.');
    const field = res.data;
    fields = fields.map((item) => (item.campoPaltoId === field.campoPaltoId ? field : item));
    if (!fields.some((item) => item.campoPaltoId === field.campoPaltoId)) fields.push(field);
    campaigns = [
      ...campaigns.filter((item) => item.campoPaltoId !== field.campoPaltoId),
      ...fieldCampaigns(field)
    ];
    return field;
  }

  function paintTabs() {
    const activos = fields.filter((f) => f.activo).length;
    const inactivos = fields.length - activos;
    const a = root.querySelector('[data-tab-label="activos"]');
    const i = root.querySelector('[data-tab-label="inactivos"]');
    if (a) a.textContent = `Activos (${activos})`;
    if (i) i.textContent = `Inactivos (${inactivos})`;
    const act = document.getElementById('cc-act');
    const ina = document.getElementById('cc-ina');
    if (act) act.checked = tab === 'activos';
    if (ina) ina.checked = tab === 'inactivos';
  }

  function campaignPills(field) {
    const bits = [];
    if (field.campaniaActiva) bits.push(`<span class="pill pill-success">Activa · ${esc(field.campaniaActiva.codigo)}</span>`);
    else bits.push('<span class="pill pill-warning">Sin campaña activa</span>');
    if (field.campaniaPlanificacion) bits.push(`<span class="pill pill-info">En planificación · ${esc(field.campaniaPlanificacion.codigo)}</span>`);
    const n = (field.historial || []).length;
    if (n) bits.push(`<span class="pill">${n} históricas</span>`);
    return bits.join('');
  }

  function renderList() {
    if (!rowsEl) return;
    paintTabs();
    const list = visible();
    if (!list.length) {
      rowsEl.innerHTML = '<div class="empty">No hay campos en este estado.</div>';
    } else {
      rowsEl.innerHTML = list.map((field) => `
        <button type="button" class="dt-row${field.campoPaltoId === selectedId ? ' is-selected' : ''}" data-field="${field.campoPaltoId}">
          <span><span class="dt-code">${esc(field.codigoCampo)}</span><span class="dt-desc">${esc(field.nombreActual)}</span></span>
          <span class="dt-muted">${ha(field.areaActualHa)}</span>
          <span class="chips">${campaignPills(field)}</span>
        </button>`).join('');
    }
    if (countEl) countEl.textContent = list.length ? `${list.length} campos` : 'Sin campos';
  }

  function timelineRow(c) {
    const links = [];
    if (c.estado !== 'EN_PLANIFICACION') {
      links.push(`<a class="btn btn-sm" href="/paltos/fertilizacion/control?campoCampaniaId=${c.campoCampaniaId}">Control</a>`);
    }
    if (c.estado === 'EN_PLANIFICACION') {
      links.push(`<a class="btn btn-sm" href="/paltos/fertilizacion/presupuesto?campoCampaniaId=${c.campoCampaniaId}">Presupuesto</a>`);
      links.push(`<button type="button" class="btn btn-sm btn-outline" data-accion="Activar" data-id="${c.campoCampaniaId}">Activar</button>`);
      links.push(`<button type="button" class="btn btn-sm" data-accion="Cancelar" data-id="${c.campoCampaniaId}">Cancelar</button>`);
    }
    if (c.estado === 'ACTIVA') {
      links.push(`<button type="button" class="btn btn-sm" data-accion="Cerrar" data-id="${c.campoCampaniaId}">Cerrar campaña</button>`);
    }
    const extra = [
      c.areaReferencial ? 'Área referencial' : '',
      c.tipoPresupuesto === 'REFERENCIAL_HEREDADO' ? 'Presupuesto referencial heredado' : ''
    ].filter(Boolean).join(' · ');
    return `
      <div class="card">
        <div class="chips"><span class="pill ${estadoPill(c.estado)}">${esc(estadoLabel(c.estado))}</span></div>
        <div>
          <span class="dt-code">${esc(c.codigo)} · ${fmt(c.fechaInicio)} al ${fmt(c.fechaFin)}</span>
          <span class="dt-desc">${ha(c.areaHa)} ha${extra ? ` · ${esc(extra)}` : ''}</span>
        </div>
        <span class="hint-text">${Number(c.coberturaPorcentaje || 0).toFixed(0)}% cobertura · ${c.mesesCerrados || 0}/12 cierres</span>
        <div class="cc-actions">${links.join('')}</div>
      </div>`;
  }

  function renderPanel(field) {
    if (!panel) return;
    if (!field) {
      panel.innerHTML = '<div class="panel-body"><div class="empty">Seleccione un campo para ver su ficha y el historial.</div></div>';
      return;
    }
    const fecha = iso(field.fechaPlantacion);
    const timeline = fieldCampaigns(field);
    const puedePlan = field.activo && !field.campaniaPlanificacion;
    panel.innerHTML = `
      <div class="panel-head">
        <span>Ficha de ${esc(field.nombreActual)}</span>
        <span class="pill ${field.activo ? 'pill-success' : ''}">${field.activo ? 'Activo' : 'Inactivo'}</span>
      </div>
      <div class="panel-body">
        <p class="hint-text">Los cambios actuales no alteran las campañas ya registradas.</p>
        <div class="field-grid">
          <div class="field"><label for="ficha-area">Área actual ha</label><input class="input" id="ficha-area" type="number" min="0" step="0.01" value="${esc(field.areaActualHa)}" /></div>
          <div class="field"><label for="ficha-var">Variedad</label><input class="input" id="ficha-var" type="text" value="${esc(field.variedad)}" /></div>
          <div class="field"><label for="ficha-pat">Patrón</label><input class="input" id="ficha-pat" type="text" value="${esc(field.patron)}" /></div>
          <div class="field"><label for="ficha-fecha">Fecha de plantación</label><input class="input" id="ficha-fecha" type="date" value="${esc(fecha)}" /></div>
          <div class="field field--full"><label for="ficha-obs">Observaciones</label><textarea class="input input--area" id="ficha-obs">${esc(field.observaciones)}</textarea></div>
        </div>
        <div class="cc-actions">
          ${puedePlan ? '<button type="button" class="btn btn-outline btn-sm" data-plan><i class="ri ri-add-line"></i>Nueva planificación</button>' : ''}
          <button type="button" class="btn btn-sm" data-toggle-estado>${field.activo ? 'Desactivar campo' : 'Reactivar campo'}</button>
        </div>
        <div class="step-head"><span class="step-num">1</span>Línea histórica</div>
        ${timeline.length ? timeline.map(timelineRow).join('') : '<div class="empty">Este campo todavía no tiene campañas registradas.</div>'}
      </div>
      <div class="panel-foot">
        <button type="button" class="btn btn-primary" data-guardar-ficha>Guardar ficha</button>
      </div>`;
    const title = document.getElementById('cc-title');
    const sub = document.getElementById('cc-sub');
    const back = document.getElementById('cc-back');
    if (title) title.textContent = field.nombreActual || 'Campo';
    if (sub) sub.textContent = `${field.codigoCampo} · ${ha(field.areaActualHa)} ha`;
    if (back) back.href = `/paltos/campos-campanias?estado=${field.activo ? 'activos' : 'inactivos'}`;
  }

  function selectField(field, navigate) {
    if (!isDesktop() && mode === 'lista' && navigate !== false) {
      location.href = `${API}/${field.campoPaltoId}?estado=${tab}`;
      return;
    }
    selectedId = field.campoPaltoId;
    renderList();
    renderPanel(field);
  }

  function fillOriginMenu(field) {
    const menu = document.getElementById('cc-origen-menu');
    const hidden = document.getElementById('cc-plan-origen');
    const label = document.querySelector('#cc-origen-dd [data-dropdown-label]');
    if (!menu || !hidden) return;
    const options = campaigns
      .filter((item) => item.estado === 'ACTIVA' || item.estado === 'CERRADA' || item.estado === 'RECONSTRUIDA')
      .sort((a, b) => byCode(a, b) || String(b.fechaInicio).localeCompare(String(a.fechaInicio)));
    menu.innerHTML = `<button type="button" class="menu-item is-selected" data-value="">Crear sin heredar presupuesto<i class="ri ri-check-line"></i></button>`
      + options.map((item) => `<button type="button" class="menu-item" data-value="${item.campoCampaniaId}">${esc(item.codigoCampo)} · ${esc(item.nombreCampo)} · ${esc(item.codigo)}<i class="ri ri-check-line"></i></button>`).join('');
    hidden.value = '';
    if (label) label.textContent = 'Crear sin heredar presupuesto';
    const last = field?.campaniaActiva || (field?.historial || [])[0];
    if (last) {
      hidden.value = String(last.campoCampaniaId);
      const match = menu.querySelector(`[data-value="${last.campoCampaniaId}"]`);
      if (match && label) {
        menu.querySelectorAll('[data-value]').forEach((el) => el.classList.toggle('is-selected', el === match));
        label.textContent = match.textContent.replace(/\s+$/, '');
      }
    }
  }

  function openPlan(field) {
    const last = field.campaniaActiva || (field.historial || [])[0];
    const endYear = last ? Number(iso(last.fechaFin).slice(0, 4)) + 1 : 2027;
    const start = `${endYear}-07-01`;
    const end = `${endYear + 1}-06-30`;
    const code = suggested(start, end);
    document.getElementById('cc-plan-ini').value = start;
    document.getElementById('cc-plan-fin').value = end;
    document.getElementById('cc-plan-cod').value = code;
    document.getElementById('cc-plan-nom').value = `Campaña ${code} · ${field.nombreActual}`;
    fillOriginMenu(field);
    document.getElementById('dlg-plan').showModal();
  }

  async function saveFicha(field) {
    const res = await busy('Guardando ficha…', () => erp.post(`${API}?handler=Guardar`, {
      campoPaltoId: field.campoPaltoId,
      codigoCampo: field.codigoCampo,
      areaActualHa: Number(document.getElementById('ficha-area').value),
      variedad: document.getElementById('ficha-var').value || null,
      patron: document.getElementById('ficha-pat').value || null,
      fechaPlantacion: document.getElementById('ficha-fecha').value || null,
      observaciones: document.getElementById('ficha-obs').value || null,
      activo: field.activo
    }));
    if (!res?.success) { toast(false, res?.message); return; }
    const updated = await reloadField(field.campoPaltoId);
    renderList();
    renderPanel(updated);
    toast(true, 'Datos complementarios actualizados.');
  }

  async function toggleEstado(field) {
    const next = !field.activo;
    const ok = next
      ? await confirmDs('Reactivar campo', 'El campo volverá a estar disponible para nuevas campañas. ¿Desea continuar?')
      : await confirmDs('Desactivar campo', 'Su historial seguirá disponible. ¿Desea continuar?');
    if (!ok) return;
    const res = await busy(next ? 'Reactivando campo…' : 'Desactivando campo…', () => erp.post(`${API}?handler=Estado`, { campoPaltoId: field.campoPaltoId, activo: next }));
    if (!res?.success) { toast(false, res?.message); return; }
    const updated = await reloadField(field.campoPaltoId);
    renderList();
    renderPanel(updated);
    toast(true, next ? 'Campo reactivado.' : 'Campo desactivado; el historial fue conservado.');
  }

  async function accionar(id, accion) {
    const asks = {
      Activar: ['Activar campaña', 'Pasará a ser la campaña operativa y empezará a recibir movimientos. ¿Desea continuar?'],
      Cerrar: ['Cerrar campaña', 'Dejará de recibir movimientos. ¿Desea continuar?'],
      Cancelar: ['Cancelar planificación', 'Permanecerá registrada para auditoría. ¿Desea continuar?']
    };
    const ask = asks[accion];
    if (ask && !await confirmDs(ask[0], ask[1])) return;
    const labels = { Activar: 'Activando campaña…', Cerrar: 'Cerrando campaña…', Cancelar: 'Cancelando planificación…' };
    const res = await busy(labels[accion] || 'Procesando…', () => erp.post(`${API}?handler=Accion&campoCampaniaId=${id}&accion=${accion}`, {
      motivo: accion === 'Cancelar' ? 'Cancelada desde Campos y campañas' : null
    }));
    if (!res?.success) { toast(false, res?.message); return; }
    const updated = await reloadField(selectedId);
    renderList();
    renderPanel(updated);
    const text = accion === 'Activar' ? 'Campaña activada.' : accion === 'Cerrar' ? 'Campaña cerrada.' : 'Planificación cancelada.';
    toast(true, text);
  }

  async function crearPlan() {
    const field = fields.find((f) => f.campoPaltoId === selectedId);
    if (!field) return;
    const origen = document.getElementById('cc-plan-origen').value;
    const res = await busy('Creando planificación…', () => erp.post(`${API}?handler=Campania`, {
      campoPaltoId: field.campoPaltoId,
      codigo: document.getElementById('cc-plan-cod').value,
      nombre: document.getElementById('cc-plan-nom').value,
      fechaInicio: document.getElementById('cc-plan-ini').value,
      fechaFin: document.getElementById('cc-plan-fin').value,
      areaHa: field.areaActualHa,
      heredarDeCampoCampaniaId: origen ? Number(origen) : null
    }));
    if (!res?.success) { toast(false, res?.message); return; }
    document.getElementById('dlg-plan').close();
    const updated = await reloadField(field.campoPaltoId);
    renderList();
    renderPanel(updated);
    toast(true, 'Campaña creada en planificación como copia independiente.');
  }

  function syncCodigo() {
    const ini = document.getElementById('cc-plan-ini')?.value;
    const fin = document.getElementById('cc-plan-fin')?.value;
    const cod = document.getElementById('cc-plan-cod');
    if (cod) cod.value = suggested(ini, fin);
  }

  const fold = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const masterLabel = (item) => (item ? `${item.codigoCampo} · ${item.nombreCampo}` : '');
  const CAT_LIMIT = 30;

  function highlight(text, query) {
    const raw = String(text ?? '');
    const needle = fold(query.trim());
    if (!needle) return esc(raw);
    const source = fold(raw);
    const at = source.indexOf(needle);
    if (at < 0) return esc(raw);
    let folded = 0;
    let start = -1;
    let end = -1;
    for (let i = 0; i < raw.length; i++) {
      const piece = fold(raw[i]);
      if (start < 0 && folded === at) start = i;
      folded += piece.length;
      if (start >= 0 && folded >= at + needle.length) { end = i + 1; break; }
    }
    if (start < 0 || end < 0) return esc(raw);
    return `${esc(raw.slice(0, start))}<span class="cc-cat-hit">${esc(raw.slice(start, end))}</span>${esc(raw.slice(end))}`;
  }

  function catalogRank(item, query) {
    const code = fold(item.codigoCampo);
    const name = fold(item.nombreCampo);
    if (code.startsWith(query)) return 0;
    if (code.includes(query)) return 1;
    if (name.startsWith(query)) return 2;
    if (name.split(/\s+/).some((word) => word.startsWith(query))) return 3;
    return 4;
  }

  function paintCatalog() {
    const input = document.getElementById('cc-cat-q');
    const list = document.getElementById('cc-cat-list');
    const hint = document.getElementById('cc-cat-hint');
    const selected = document.getElementById('cc-cat')?.value || '';
    if (!input || !list || !hint) return;
    const q = input.value.trim();
    if (!catalog.length) {
      list.hidden = true;
      list.innerHTML = '';
      hint.textContent = 'Todos los campos del maestro ya están incorporados.';
      return;
    }
    if (!q) {
      list.hidden = true;
      list.innerHTML = '';
      hint.textContent = `Escriba el código o el nombre. Hay ${catalog.length} campos sin incorporar.`;
      return;
    }
    const nq = fold(q);
    const matches = catalog
      .filter((item) => fold(item.codigoCampo).includes(nq) || fold(item.nombreCampo).includes(nq))
      .sort((a, b) => catalogRank(a, nq) - catalogRank(b, nq) || byCode(a, b));
    const shown = matches.slice(0, CAT_LIMIT);
    list.hidden = false;
    list.innerHTML = shown.map((item) => `
      <button type="button" class="cc-cat-row${item.codigoCampo === selected ? ' is-selected' : ''}" role="option" data-value="${esc(item.codigoCampo)}" aria-selected="${item.codigoCampo === selected ? 'true' : 'false'}">
        <span class="cc-cat-code">${highlight(item.codigoCampo, q)}</span>
        <span class="cc-cat-name">${highlight(item.nombreCampo, q)}</span>
        <span class="cc-cat-ha">${ha(item.areaHa)} ha</span>
        <i class="ri ri-check-line"></i>
      </button>`).join('') || '<div class="empty">Ningún campo coincide con esa búsqueda.</div>';
    if (!matches.length) hint.textContent = 'Pruebe con otro código o con parte del nombre.';
    else if (matches.length > CAT_LIMIT) hint.textContent = `Mostrando ${CAT_LIMIT} de ${matches.length}. Siga escribiendo para acotar.`;
    else hint.textContent = matches.length === 1 ? '1 campo. Pulse Entrar o elija la fila.' : `${matches.length} campos. Elija una fila.`;
  }

  function chooseMaster(code) {
    const master = catalog.find((item) => item.codigoCampo === code);
    const hidden = document.getElementById('cc-cat');
    const input = document.getElementById('cc-cat-q');
    if (!master || !hidden || !input) return;
    hidden.value = master.codigoCampo;
    input.value = masterLabel(master);
    const clear = input.parentElement.querySelector('[data-search-clear]');
    if (clear) clear.hidden = false;
    document.getElementById('cc-add-area').value = master.areaHa ?? '';
    document.getElementById('cc-add-var').value = '';
    document.getElementById('cc-add-pat').value = '';
    document.getElementById('cc-add-save').disabled = false;
    paintCatalog();
  }

  async function openAdd() {
    const res = await busy('Cargando campos…', () => erp.get(`${API}?handler=Catalogo`));
    if (!res?.success) { toast(false, res?.message || 'No se pudo cargar el maestro de campos.'); return; }
    catalog = (res?.data || []).filter((item) => !item.yaAdministrado).sort(byCode);
    const hidden = document.getElementById('cc-cat');
    const input = document.getElementById('cc-cat-q');
    hidden.value = '';
    input.value = '';
    const clear = input.parentElement.querySelector('[data-search-clear]');
    if (clear) clear.hidden = true;
    input.disabled = !catalog.length;
    document.getElementById('cc-add-area').value = '';
    document.getElementById('cc-add-var').value = '';
    document.getElementById('cc-add-pat').value = '';
    document.getElementById('cc-add-save').disabled = true;
    paintCatalog();
    document.getElementById('dlg-add').showModal();
    if (catalog.length) input.focus();
  }

  async function saveAdd() {
    const code = document.getElementById('cc-cat').value;
    if (!code) return;
    const master = catalog.find((item) => item.codigoCampo === code);
    const area = document.getElementById('cc-add-area').value;
    const res = await busy('Incorporando campo…', () => erp.post(`${API}?handler=Guardar`, {
      codigoCampo: code,
      areaActualHa: area === '' ? master?.areaHa : Number(area),
      variedad: document.getElementById('cc-add-var').value || null,
      patron: document.getElementById('cc-add-pat').value || null,
      activo: true
    }));
    if (!res?.success) { toast(false, res?.message); return; }
    document.getElementById('dlg-add').close();
    toast(true, 'Campo incorporado a la gestión de paltos.');
    await loadLista();
  }

  function paintHistory() {
    const host = document.getElementById('cc-hist-list');
    const codes = [...new Set(preview.map((item) => item.codigoCampo))].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
    host.innerHTML = codes.map((code) => {
      const rows = preview.filter((item) => item.codigoCampo === code);
      const locked = rows.every((item) => item.yaReconstruida);
      const on = selectedHistory.includes(code);
      const chips = rows.map((row) => {
        const pill = row.yaReconstruida ? 'pill-success' : Number(row.coberturaPorcentaje) < 100 ? 'pill-warning' : '';
        return `<span class="pill ${pill}">${esc(row.campania)}: ${row.salidas} salidas · ${Number(row.coberturaPorcentaje || 0).toFixed(0)}%${row.yaReconstruida ? ' · lista' : ''}</span>`;
      }).join('');
      return `
        <button type="button" class="card cc-pick${on && !locked ? ' is-selected' : ''}" data-hist="${esc(code)}" ${locked ? 'aria-disabled="true"' : ''}>
          <span class="dt-code">${on && !locked ? '<i class="ri ri-checkbox-circle-line"></i> ' : ''}${esc(code)} · ${esc(rows[0]?.nombreCampo)}</span>
          <span class="chips">${chips}</span>
        </button>`;
    }).join('') || '<div class="empty">No hay campañas para reconstruir.</div>';
    document.getElementById('cc-hist-save').disabled = !selectedHistory.length;
  }

  async function openHistory() {
    if (!await confirmDs('Reconstruir historial', 'Se revisarán las salidas de almacén para mostrar la vista previa. Puede demorar. ¿Desea continuar?')) return;
    const res = await busy('Revisando salidas de almacén…', () => erp.get(`${API}?handler=Preview`));
    if (!res?.success && res?.message) { toast(false, res.message); return; }
    preview = res?.data || [];
    selectedHistory = [...new Set(preview.filter((item) => !item.yaReconstruida).map((item) => item.codigoCampo))];
    paintHistory();
    document.getElementById('dlg-hist').showModal();
  }

  async function saveHistory() {
    if (!selectedHistory.length) return;
    if (!await confirmDs('Confirmar reconstrucción', `Se reconstruirán ${selectedHistory.length} campo(s). La operación puede demorar y no se puede cancelar a mitad. ¿Desea continuar?`)) return;
    const res = await busy('Reconstruyendo campañas…', () => erp.post(`${API}?handler=Reconstruir`, { codigosCampo: selectedHistory }));
    if (!res?.success) { toast(false, res?.message); return; }
    document.getElementById('dlg-hist').close();
    toast(true, 'Campañas 23-24, 24-25 y 25-26 reconstruidas y etiquetadas.');
    await loadLista();
  }

  async function loadLista() {
    const [fieldsRes, campsRes] = await Promise.all([
      erp.get(`${API}?handler=Lista`),
      erp.get(`${API}?handler=Campanias`)
    ]);
    if (!fieldsRes?.success) {
      if (rowsEl) rowsEl.innerHTML = `<div class="empty">${esc(fieldsRes?.message || 'No se pudo cargar los campos.')}</div>`;
      return;
    }
    fields = fieldsRes.data || [];
    campaigns = campsRes?.data || fields.flatMap(fieldCampaigns);
    const list = visible();
    if (isDesktop()) {
      const current = list.find((f) => f.campoPaltoId === selectedId) || list[0];
      selectedId = current?.campoPaltoId || 0;
      renderList();
      renderPanel(current || null);
    } else {
      selectedId = 0;
      renderList();
      renderPanel(null);
    }
  }

  async function loadDetalle() {
    try {
      const [fieldRes, campsRes] = await Promise.all([
        erp.get(`${API}?handler=Campo&id=${selectedId}`),
        erp.get(`${API}?handler=Campanias`)
      ]);
      if (!fieldRes?.success || !fieldRes.data) throw new Error(fieldRes?.message || 'El campo solicitado no existe.');
      fields = [fieldRes.data];
      campaigns = campsRes?.data || fieldCampaigns(fieldRes.data);
      renderPanel(fieldRes.data);
    } catch (err) {
      panel.innerHTML = `<div class="panel-body"><div class="note note-danger">${esc(err.message)}</div></div>`;
    }
  }

  root.addEventListener('click', async (event) => {
    const fieldBtn = event.target.closest('[data-field]');
    if (fieldBtn && rowsEl?.contains(fieldBtn)) {
      const field = fields.find((f) => f.campoPaltoId === Number(fieldBtn.dataset.field));
      if (field) selectField(field);
      return;
    }
    if (event.target.closest('[data-plan]')) {
      const field = fields.find((f) => f.campoPaltoId === selectedId);
      if (field) openPlan(field);
      return;
    }
    if (event.target.closest('[data-guardar-ficha]')) {
      const field = fields.find((f) => f.campoPaltoId === selectedId);
      if (field) await saveFicha(field);
      return;
    }
    if (event.target.closest('[data-toggle-estado]')) {
      const field = fields.find((f) => f.campoPaltoId === selectedId);
      if (field) await toggleEstado(field);
      return;
    }
    const accionBtn = event.target.closest('[data-accion]');
    if (accionBtn) {
      await accionar(Number(accionBtn.dataset.id), accionBtn.dataset.accion);
      return;
    }
    const hist = event.target.closest('[data-hist]');
    if (hist && hist.getAttribute('aria-disabled') !== 'true') {
      const code = hist.dataset.hist;
      selectedHistory = selectedHistory.includes(code)
        ? selectedHistory.filter((item) => item !== code)
        : [...selectedHistory, code];
      paintHistory();
    }
  });

  root.addEventListener('change', (event) => {
    if (event.target.name === 'cc-estado') {
      tab = event.target.value;
      const url = new URL(location.href);
      url.searchParams.set('estado', tab);
      history.replaceState(null, '', url);
      const list = visible();
      if (isDesktop()) {
        const current = list.find((f) => f.campoPaltoId === selectedId) || list[0];
        selectedId = current?.campoPaltoId || 0;
        renderList();
        renderPanel(current || null);
      } else {
        renderList();
      }
    }
    if (event.target.id === 'cc-plan-ini' || event.target.id === 'cc-plan-fin') syncCodigo();
  });

  document.getElementById('cc-q')?.addEventListener('input', (event) => {
    q = event.target.value;
    const clear = event.target.parentElement.querySelector('[data-search-clear]');
    if (clear) clear.hidden = !q;
    renderList();
  });

  document.getElementById('cc-cat-list')?.addEventListener('click', (event) => {
    const opt = event.target.closest('[data-value]');
    if (!opt) return;
    chooseMaster(opt.dataset.value);
  });

  document.getElementById('cc-cat-q')?.addEventListener('input', (event) => {
    const hidden = document.getElementById('cc-cat');
    const master = catalog.find((item) => item.codigoCampo === hidden.value);
    if (!master || event.target.value.trim() !== masterLabel(master)) {
      hidden.value = '';
      document.getElementById('cc-add-save').disabled = true;
    }
    paintCatalog();
  });

  document.getElementById('cc-cat-q')?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const nq = fold(event.target.value.trim());
    if (!nq) return;
    const matches = catalog.filter((item) => fold(item.codigoCampo).includes(nq) || fold(item.nombreCampo).includes(nq));
    const exact = matches.find((item) => fold(item.codigoCampo) === nq);
    if (exact) chooseMaster(exact.codigoCampo);
    else if (matches.length === 1) chooseMaster(matches[0].codigoCampo);
  });

  document.getElementById('cc-btn-add')?.addEventListener('click', openAdd);
  document.getElementById('cc-add-save')?.addEventListener('click', saveAdd);
  document.getElementById('cc-btn-hist')?.addEventListener('click', openHistory);
  document.getElementById('cc-hist-save')?.addEventListener('click', saveHistory);
  document.getElementById('cc-plan-save')?.addEventListener('click', crearPlan);

  desktopMq.addEventListener('change', () => { if (mode === 'lista') loadLista(); });

  if (mode === 'detalle') loadDetalle();
  else loadLista();
})();
