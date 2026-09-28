(function () {
  const root = document.getElementById('fert-control');
  if (!root || !window.erp) return;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const PRINCIPAL = ['N', 'P', 'K', 'Ca', 'Mg'];
  const estadoLabel = (estado) => ({ ACTIVA: 'Activa', EN_PLANIFICACION: 'En planificación', CERRADA: 'Cerrada', RECONSTRUIDA: 'Reconstruida', CANCELADA: 'Cancelada' }[estado] || (estado || '').replaceAll('_', ' '));
  const mobile = () => window.matchMedia('(max-width: 767px)').matches;

  let fields = [];
  let campaigns = [];
  let tab = 'activos';
  let fieldId = 0;
  let campaignId = Number(new URLSearchParams(location.search).get('campoCampaniaId')) || 0;
  let control = null;
  let reopen = null;
  let vista = 'nutrientes';

  const body = document.getElementById('fc-body');
  const toast = (ok, text) => erp.toast(ok ? 'success' : 'error', text || (ok ? 'Listo' : 'No se pudo completar'));
  const mq = window.matchMedia('(max-width: 767px)');

  function placeSwitch() {
    const sw = root.querySelector('.switch');
    const tools = root.querySelector('.fp-tools');
    const actions = root.querySelector('.page-actions');
    if (!sw || !tools || !actions) return;
    if (mq.matches) actions.prepend(sw);
    else tools.prepend(sw);
  }
  placeSwitch();
  mq.addEventListener('change', placeSwitch);

  function confirmDs(title, text) {
    return new Promise((resolve) => {
      let dlg = document.getElementById('dlg-fc-confirm');
      if (!dlg) {
        dlg = document.createElement('dialog');
        dlg.id = 'dlg-fc-confirm';
        dlg.className = 'modal';
        dlg.innerHTML = `<div class="modal-head"><i class="ri ri-question-line"></i><span class="modal-title"></span><button type="button" class="icon-btn" data-no aria-label="Cerrar"><i class="ri ri-close-line"></i></button></div><div class="modal-body"></div><div class="modal-foot"><button type="button" class="btn" data-no>Cancelar</button><button type="button" class="btn btn-primary" data-yes>Continuar</button></div>`;
        root.appendChild(dlg);
        dlg.addEventListener('click', (event) => {
          if (event.target === dlg || event.target.closest('[data-no]')) dlg.close('no');
          if (event.target.closest('[data-yes]')) dlg.close('yes');
        });
        dlg.addEventListener('close', () => { const done = dlg._resolve; dlg._resolve = null; if (done) done(dlg.returnValue === 'yes'); });
      }
      dlg.querySelector('.modal-title').textContent = title;
      dlg.querySelector('.modal-body').textContent = text;
      dlg._resolve = resolve;
      dlg.showModal();
    });
  }

  let waitCount = 0;
  function busy(text, fn) {
    let el = document.getElementById('fc-wait');
    if (!el) {
      el = document.createElement('div');
      el.id = 'fc-wait';
      el.className = 'cc-wait';
      el.hidden = true;
      el.innerHTML = '<div class="cc-wait__card" role="status"><span class="cc-wait__spin" aria-hidden="true"></span><p id="fc-wait-text">Procesando…</p></div>';
      root.appendChild(el);
    }
    document.getElementById('fc-wait-text').textContent = text;
    waitCount += 1;
    el.hidden = false;
    return Promise.resolve().then(fn).finally(() => {
      waitCount = Math.max(0, waitCount - 1);
      if (!waitCount) el.hidden = true;
    });
  }

  const eligible = () => campaigns.filter((c) => c.presupuestoVersion && c.estado !== 'EN_PLANIFICACION' && c.estado !== 'CANCELADA');
  const selectableFields = () => {
    const ids = new Set(eligible().map((c) => c.campoPaltoId));
    return fields
      .filter((f) => ids.has(f.campoPaltoId) && (tab === 'activos' ? f.activo : !f.activo))
      .sort((a, b) => String(a.codigoCampo).localeCompare(String(b.codigoCampo), 'es', { numeric: true }));
  };
  const fieldCampaigns = () => eligible()
    .filter((c) => c.campoPaltoId === fieldId)
    .sort((a, b) => String(b.fechaInicio).localeCompare(String(a.fechaInicio)));

  function setDropdown(menuId, hiddenId, value, label) {
    const hidden = document.getElementById(hiddenId);
    const host = hidden.closest('.dropdown');
    hidden.value = value ? String(value) : '';
    host.querySelector('[data-dropdown-label]').textContent = label;
    document.getElementById(menuId).querySelectorAll('[data-value]').forEach((opt) => opt.classList.toggle('is-selected', opt.dataset.value === String(value)));
  }

  function paintFields() {
    const list = selectableFields();
    document.getElementById('fc-campo-menu').innerHTML = list.map((f) => `<button type="button" class="menu-item" data-value="${f.campoPaltoId}">${esc(f.codigoCampo)} · ${esc(f.nombreActual)}<i class="ri ri-check-line"></i></button>`).join('') || '<div class="empty">No hay campos con presupuesto.</div>';
    const current = list.find((f) => f.campoPaltoId === fieldId);
    setDropdown('fc-campo-menu', 'fc-campo', current?.campoPaltoId || '', current ? `${current.codigoCampo} · ${current.nombreActual}` : 'Seleccionar campo');
  }

  function paintCampaigns() {
    const list = fieldCampaigns();
    document.getElementById('fc-camp-menu').innerHTML = list.map((c) => `<button type="button" class="menu-item" data-value="${c.campoCampaniaId}">${esc(c.codigo)} · ${esc(estadoLabel(c.estado))}<i class="ri ri-check-line"></i></button>`).join('') || '<div class="empty">Este campo no tiene campañas con presupuesto.</div>';
    const current = list.find((c) => c.campoCampaniaId === campaignId);
    setDropdown('fc-camp-menu', 'fc-camp', current?.campoCampaniaId || '', current ? `${current.codigo} · ${estadoLabel(current.estado)}` : 'Seleccionar campaña');
    const link = document.getElementById('fc-presupuesto');
    if (link) link.href = campaignId ? `/paltos/fertilizacion/presupuesto?campoCampaniaId=${campaignId}` : '/paltos/fertilizacion/presupuesto';
  }

  function rangeOf(item, referential) {
    if (Number(item.presupuestoKgHa) === 0 && Number(item.ejecutadoKgHa) > 0) return { pill: 'pill-info', label: 'Sin presupuesto' };
    const pct = Number(item.avancePorcentaje || 0);
    if (referential) return pct > 110 ? { pill: 'pill-info', label: 'Sobre referencia' } : pct >= 90 ? { pill: 'pill-info', label: 'En referencia' } : { pill: 'pill-info', label: 'Bajo referencia' };
    if (pct >= 90 && pct <= 110) return { pill: 'pill-success', label: 'En rango' };
    if (pct > 110) return { pill: 'pill-danger', label: 'Sobre presupuesto' };
    return { pill: 'pill-warning', label: 'Bajo presupuesto' };
  }

  function paintFacts() {
    let facts = document.getElementById('fc-facts');
    if (!facts) {
      const tools = root.querySelector('.fp-tools');
      if (!tools) return;
      facts = document.createElement('div');
      facts.id = 'fc-facts';
      facts.className = 'fc-facts';
      facts.hidden = true;
      tools.appendChild(facts);
    }
    if (!control) {
      facts.hidden = true;
      facts.innerHTML = '';
      return;
    }
    facts.hidden = false;
    facts.innerHTML = `
      <div class="field fc-out">
        <span class="field-label">Salidas</span>
        <button type="button" class="fp-box fc-link" data-salidas="todas" aria-label="Ver salidas de la campaña">${control.salidasConsideradas}<i class="ri ri-eye-line" aria-hidden="true"></i></button>
      </div>
      <div class="field fc-cov">
        <span class="field-label">Cobertura</span>
        <span class="fp-box">${Number(control.coberturaPorcentaje || 0).toFixed(1)}%</span>
      </div>`;
  }

  function render() {
    paintFacts();
    if (!control) {
      body.innerHTML = '<div class="empty">Seleccione una campaña con presupuesto.</div>';
      return;
    }
    const ref = control.tipoPresupuesto === 'REFERENCIAL_HEREDADO';
    const nuts = (control.totales || []).map((item) => {
      const info = rangeOf(item, ref);
      const width = Math.max(0, Math.min(100, Number(item.avancePorcentaje || 0)));
      return `<article class="card fc-nut">
        <div class="fc-nut-top">
          <span class="fc-code">${esc(item.elementoCodigo)}</span>
          <span class="fp-name">${esc(item.elementoNombre)}</span>
          <span class="pill ${info.pill}">${info.label}</span>
        </div>
        <p class="fc-nut-line"><span>${Number(item.ejecutadoKgHa || 0).toFixed(2)}</span> ejec. · <span>${Number(item.presupuestoKgHa || 0).toFixed(2)}</span> ppto kg/ha</p>
        <div class="fc-bar fc-bar--${info.pill.replace('pill-', '')}" aria-hidden="true"><span style="width:${width}%"></span></div>
        <div class="fc-nut-foot"><span>Av. ${Number(item.avancePorcentaje || 0).toFixed(1)}%</span><span>Desv. ${Number(item.desviacionKgHa || 0) >= 0 ? '+' : ''}${Number(item.desviacionKgHa || 0).toFixed(2)}</span></div>
      </article>`;
    }).join('');

    const rows = (control.meses || []).map((month) => {
      const ended = new Date(month.anio, month.mes, 0) < new Date();
      const pill = month.tieneDiscrepancia ? 'pill-danger' : month.estadoCierre === 'CERRADO' ? 'pill-success' : '';
      const label = month.tieneDiscrepancia ? 'Discrepancia' : month.estadoCierre === 'CERRADO' ? 'Cerrado' : 'Abierto';
      const cols = PRINCIPAL.map((code) => {
        const n = (month.nutrientes || []).find((item) => item.elementoCodigo === code);
        return `<td class="fp-num">${n ? `${Number(n.presupuestoKgHa).toFixed(1)}<span class="fp-exec">${Number(n.ejecutadoKgHa).toFixed(1)}</span>` : '—'}</td>`;
      }).join('');
      let action = '';
      if (control.campaniaEstado === 'ACTIVA') {
        if (month.estadoCierre === 'CERRADO') action = `<button type="button" class="btn btn-sm" data-reabrir="${month.anio}-${month.mes}">Reabrir</button>`;
        else action = `<button type="button" class="btn btn-sm" data-cerrar="${month.anio}-${month.mes}" ${(month.itemsPendientes > 0 || !ended) ? 'disabled' : ''}>Cerrar</button>`;
      }
      return `<tr class="${month.tieneDiscrepancia ? 'is-alert' : ''}">
        <td class="fc-mes"><span class="fp-code">${MESES[month.mes - 1]} ${month.anio}</span><span class="fp-name">${esc(month.fenologia || 'Sin etapa')}</span></td>
        <td><span class="pill ${pill}">${label}</span></td>
        <td class="fp-num"><button type="button" class="fc-link" data-salidas="${month.anio}-${month.mes}" ${month.salidas ? '' : 'disabled'} aria-label="Ver salidas de ${MESES[month.mes - 1]} ${month.anio}">${month.salidas}${month.salidas ? '<i class="ri ri-eye-line" aria-hidden="true"></i>' : ''}</button></td>
        <td class="fp-num">${Number(month.coberturaPorcentaje || 0).toFixed(0)}%</td>
        ${cols}
        <td>${action}</td>
      </tr>`;
    }).join('');

    body.innerHTML = `
      ${ref ? '<div class="note">Campaña reconstruida. El ejecutado sale de la vista de almacén y el presupuesto es referencial.</div>' : ''}
      ${control.itemsPendientes > 0 ? `<div class="note note-danger fc-pending"><span>Hay ${control.itemsPendientes} ítem(s) sin configuración técnica. No se pueden cerrar los meses afectados.</span><a class="btn btn-sm" href="/paltos/fertilizacion/configuracion-items?clasificacion=pendiente"><i class="ri ri-settings-3-line"></i>Configurar ítems</a></div>` : ''}
      <div class="segmented fc-vista">
        <input type="radio" name="fc-vista" id="fc-vista-nut" ${vista === 'nutrientes' ? 'checked' : ''} />
        <label for="fc-vista-nut">Nutrientes</label>
        <input type="radio" name="fc-vista" id="fc-vista-cie" ${vista === 'cierre' ? 'checked' : ''} />
        <label for="fc-vista-cie">Cierre mensual</label>
      </div>
      <div class="fc-nuts">${nuts}</div>
      <div class="card fp-sheet">
        <div class="fp-sheet-head">
          <div>
            <div class="step-head"><span class="step-num">2</span>Seguimiento y cierre mensual</div>
            <p class="hint-text">N, P, K, Ca y Mg muestran presupuesto arriba y ejecutado abajo, en kg/ha.</p>
          </div>
          <span class="pill">${(control.meses || []).length} periodos</span>
        </div>
        <div class="fp-matrix">
          <table>
            <thead><tr><th class="fc-mes">Mes</th><th>Estado</th><th>Salidas</th><th>Cobertura</th>${PRINCIPAL.map((c) => `<th>${c}</th>`).join('')}<th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
    root.classList.toggle('is-cierre', vista === 'cierre');
  }

  function paintSalidas(detail) {
    const host = document.getElementById('fc-salidas-body');
    if (!detail) { host.innerHTML = '<div class="empty">No existe información para la selección.</div>'; return; }
    const title = document.getElementById('dlg-salidas-t');
    title.textContent = detail.anio && detail.mes ? `Salidas ${String(detail.mes).padStart(2, '0')}/${detail.anio}` : 'Salidas de la campaña';
    const rows = (detail.salidas || []).map((item) => `
      <tr>
        <td class="fc-sal-id">${esc(item.numeroSalida || item.salMatCabId || 'Histórico')}</td>
        <td class="fc-sal-date">${esc(String(item.fecha || '').slice(0, 10).split('-').reverse().join('/'))}</td>
        <td class="fc-sal-item"><span class="fp-code">${esc(item.codigoItem)}</span><span class="fp-name">${esc(item.nombreItem)}</span></td>
        <td class="fp-num fc-sal-qty">${Number(item.cantidadSalida || 0).toFixed(2)} ${esc(item.unidad)}</td>
        <td class="fp-num fc-sal-cost">${Number(item.costoTotal || 0).toFixed(2)}</td>
        <td class="fp-num fc-sal-kg">${Number(item.kgProducto || 0).toFixed(2)}</td>
        <td class="fc-sal-cfg"><span class="pill ${item.estado === 'PENDIENTE' ? 'pill-warning' : item.estado === 'REFERENCIAL' ? 'pill-info' : 'pill-success'}">${esc(item.estado)}</span></td>
        <td class="fc-sal-apt">${(item.aportes || []).length ? `<span class="chips">${item.aportes.map((a) => `<span class="pill">${esc(a.elementoCodigo)} ${Number(a.ejecutadoKgHa || 0).toFixed(3)}</span>`).join('')}</span>` : '<span class="fp-name">Sin aportes</span>'}</td>
      </tr>`).join('');
    host.innerHTML = `
      ${detail.esSnapshot ? `<div class="note ${detail.tieneDiscrepancia ? 'note-danger' : ''}">${detail.tieneDiscrepancia ? 'El cierre conserva su snapshot, pero almacén presenta cambios posteriores.' : 'Información recuperada del snapshot del cierre mensual.'}</div>` : '<p class="hint-text">Cantidad, costo y fecha salen de la vista de salidas de fertilizante.</p>'}
      ${rows ? `<div class="fp-matrix fc-sal"><table><thead><tr><th class="fc-sal-id">Salida</th><th class="fc-sal-date">Fecha</th><th class="fc-sal-item">Producto</th><th class="fp-num fc-sal-qty">Cantidad</th><th class="fp-num fc-sal-cost">Costo</th><th class="fp-num fc-sal-kg">kg</th><th class="fc-sal-cfg">Configuración</th><th class="fc-sal-apt">Aportes</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="empty">No se encontraron salidas para el periodo.</div>'}`;
  }

  async function openSalidas(anio, mes) {
    if (!campaignId) return;
    if (mobile()) {
      const q = anio && mes ? `?anio=${anio}&mes=${mes}` : '';
      location.href = `/paltos/fertilizacion/control/${campaignId}/salidas${q}`;
      return;
    }
    const q = anio && mes ? `&anio=${anio}&mes=${mes}` : '';
    const res = await busy('Cargando salidas…', () => erp.get(`?handler=Salidas&campoCampaniaId=${campaignId}${q}`));
    if (!res?.success && res?.message) { toast(false, res.message); return; }
    paintSalidas(res?.data);
    document.getElementById('dlg-salidas').showModal();
  }

  async function loadControl() {
    if (!campaignId) { control = null; render(); return; }
    body.innerHTML = '<div class="empty">Calculando control…</div>';
    const res = await erp.get(`?handler=Data&campoCampaniaId=${campaignId}`);
    if (!res?.success) { body.innerHTML = `<div class="note note-danger">${esc(res?.message || 'No se pudo calcular el control.')}</div>`; control = null; return; }
    control = res.data;
    const url = new URL(location.href);
    url.searchParams.set('campoCampaniaId', String(campaignId));
    history.replaceState(null, '', url);
    render();
  }

  function chooseField(id) {
    fieldId = Number(id);
    const list = fieldCampaigns();
    campaignId = list.some((c) => c.campoCampaniaId === campaignId) ? campaignId : (list[0]?.campoCampaniaId || 0);
    control = null;
    paintFields();
    paintCampaigns();
    loadControl();
  }

  document.getElementById('fc-campo-menu').addEventListener('click', (event) => {
    const opt = event.target.closest('[data-value]');
    if (!opt) return;
    const id = opt.dataset.value;
    setTimeout(() => chooseField(id), 0);
  });
  document.getElementById('fc-camp-menu').addEventListener('click', (event) => {
    const opt = event.target.closest('[data-value]');
    if (!opt) return;
    const id = Number(opt.dataset.value);
    setTimeout(() => {
      campaignId = id;
      paintCampaigns();
      loadControl();
    }, 0);
  });
  function paintActivoSwitch(activos) {
    const input = document.getElementById('fc-activos');
    input.checked = activos;
    input.setAttribute('aria-checked', activos ? 'true' : 'false');
    input.closest('.switch').querySelector('.switch-text').textContent = activos ? 'Activos' : 'Inactivos';
  }

  root.addEventListener('change', (event) => {
    if (event.target.name === 'fc-vista') {
      vista = event.target.id === 'fc-vista-cie' ? 'cierre' : 'nutrientes';
      root.classList.toggle('is-cierre', vista === 'cierre');
      return;
    }
    if (event.target.id !== 'fc-activos') return;
    tab = event.target.checked ? 'activos' : 'inactivos';
    paintActivoSwitch(event.target.checked);
    fieldId = selectableFields()[0]?.campoPaltoId || 0;
    campaignId = 0;
    chooseField(fieldId);
  });

  root.addEventListener('click', async (event) => {
    const salidas = event.target.closest('[data-salidas]');
    if (salidas) {
      if (salidas.dataset.salidas === 'todas') openSalidas();
      else {
        const [anio, mes] = salidas.dataset.salidas.split('-').map(Number);
        openSalidas(anio, mes);
      }
      return;
    }
    const cerrar = event.target.closest('[data-cerrar]');
    if (cerrar && control) {
      const [anio, mes] = cerrar.dataset.cerrar.split('-').map(Number);
      if (!await confirmDs('Cerrar mes', `Se congelará ${MESES[mes - 1]} ${anio} con las salidas actuales. ¿Desea continuar?`)) return;
      const res = await busy('Cerrando mes…', () => erp.post(`?handler=Cerrar&campoCampaniaId=${campaignId}`, { anio, mes }));
      if (!res?.success) { toast(false, res?.message); return; }
      control = res.data || control;
      toast(true, res.message || 'Mes cerrado.');
      render();
      return;
    }
    const re = event.target.closest('[data-reabrir]');
    if (re) {
      reopen = re.dataset.reabrir.split('-').map(Number);
      document.getElementById('fc-motivo').value = '';
      document.getElementById('dlg-reabrir').showModal();
    }
  });

  document.getElementById('fc-reabrir-save').addEventListener('click', async () => {
    const motivo = document.getElementById('fc-motivo').value.trim();
    if (!motivo || !reopen) { toast(false, 'Indique el motivo de la reapertura.'); return; }
    const [anio, mes] = reopen;
    document.getElementById('dlg-reabrir').close();
    const res = await busy('Reabriendo mes…', () => erp.post(`?handler=Reabrir&campoCampaniaId=${campaignId}`, { anio, mes, motivo }));
    if (!res?.success) { toast(false, res?.message); return; }
    control = res.data || control;
    toast(true, res.message || 'Mes reabierto.');
    render();
  });

  async function start() {
    const [fieldRes, campRes] = await Promise.all([erp.get('?handler=Campos'), erp.get('?handler=Campanias')]);
    if (!campRes?.success) { body.innerHTML = `<div class="note note-danger">${esc(campRes?.message || 'No se pudieron cargar las campañas.')}</div>`; return; }
    fields = fieldRes?.data || [];
    campaigns = campRes.data || [];
    const pool = eligible();
    const preferred = pool.find((c) => c.campoCampaniaId === campaignId) || pool.find((c) => c.estado === 'ACTIVA') || [...pool].sort((a, b) => String(b.fechaInicio).localeCompare(String(a.fechaInicio)))[0];
    const field = fields.find((f) => f.campoPaltoId === preferred?.campoPaltoId);
    tab = field && !field.activo ? 'inactivos' : 'activos';
    paintActivoSwitch(tab === 'activos');
    fieldId = field?.campoPaltoId || selectableFields()[0]?.campoPaltoId || 0;
    campaignId = preferred?.campoCampaniaId || fieldCampaigns()[0]?.campoCampaniaId || 0;
    paintFields();
    paintCampaigns();
    await loadControl();
  }

  start();
})();
