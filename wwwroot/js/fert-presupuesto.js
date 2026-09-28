(function () {
  const root = document.getElementById('fert-presupuesto');
  if (!root || !window.erp) return;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
  const FENO = ['IF-DIF', 'DIF-COL', 'DIF-FL', 'FL-CJ 30%', 'FL-CJ 100%', 'CF', 'CF', 'CF', 'CF', 'CF-IF', 'CF-IF', 'IF-DIF'];
  const YEMAS = ['Y-E07/E08', 'Y-E08/E09/E10', 'Y-E011', 'Y-E011/E01', 'Y-E02/E03', 'Y-E03/E04', 'Y-E03/E04', 'Y-E03/E04', 'Y-E03/E04', 'Y-E03/E04', 'Y-E04/E05', 'Y-E04/E05/E06'];
  const BASE = [['N', 'Nitrógeno'], ['P', 'Fósforo'], ['K', 'Potasio'], ['Ca', 'Calcio'], ['Mg', 'Magnesio'], ['Zn', 'Zinc'], ['B', 'Boro'], ['Fe', 'Hierro'], ['Mn', 'Manganeso']];
  const estadoLabel = (estado) => ({ ACTIVA: 'Activa', EN_PLANIFICACION: 'En planificación', CERRADA: 'Cerrada', RECONSTRUIDA: 'Reconstruida', CANCELADA: 'Cancelada' }[estado] || estado || '—');

  let fields = [];
  let campaigns = [];
  let elements = [];
  let tab = 'activos';
  let fieldId = 0;
  let campaignId = Number(new URLSearchParams(location.search).get('campoCampaniaId')) || 0;
  let budget = null;
  let inheritId = 0;

  const body = document.getElementById('fp-body');
  const toast = (ok, text) => erp.toast(ok ? 'success' : 'error', text || (ok ? 'Listo' : 'No se pudo completar'));
  const mobile = window.matchMedia('(max-width: 767px)');

  function placeSwitch() {
    const sw = root.querySelector('.switch');
    const tools = root.querySelector('.fp-tools');
    const actions = root.querySelector('.page-actions');
    if (!sw || !tools || !actions) return;
    if (mobile.matches) actions.prepend(sw);
    else tools.prepend(sw);
  }
  placeSwitch();
  mobile.addEventListener('change', placeSwitch);

  function confirmDs(title, text) {
    return new Promise((resolve) => {
      let dlg = document.getElementById('dlg-fp-confirm');
      if (!dlg) {
        dlg = document.createElement('dialog');
        dlg.id = 'dlg-fp-confirm';
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
    let el = document.getElementById('fp-wait');
    if (!el) {
      el = document.createElement('div');
      el.id = 'fp-wait';
      el.className = 'cc-wait';
      el.hidden = true;
      el.innerHTML = '<div class="cc-wait__card" role="status"><span class="cc-wait__spin" aria-hidden="true"></span><p id="fp-wait-text">Procesando…</p></div>';
      root.appendChild(el);
    }
    document.getElementById('fp-wait-text').textContent = text;
    waitCount += 1;
    el.hidden = false;
    return Promise.resolve()
      .then(fn)
      .finally(() => {
        waitCount = Math.max(0, waitCount - 1);
        if (!waitCount) el.hidden = true;
      });
  }

  const selectableFields = () => fields
    .filter((f) => (tab === 'activos' ? f.activo : !f.activo))
    .sort((a, b) => String(a.codigoCampo).localeCompare(String(b.codigoCampo), 'es', { numeric: true }));

  const fieldCampaigns = () => campaigns
    .filter((c) => c.campoPaltoId === fieldId && c.estado !== 'CANCELADA')
    .sort((a, b) => String(b.fechaInicio).localeCompare(String(a.fechaInicio)));

  function setDropdown(menuId, hiddenId, value, label) {
    const hidden = document.getElementById(hiddenId);
    const menu = document.getElementById(menuId);
    const host = hidden.closest('.dropdown');
    if (hidden) hidden.value = value ? String(value) : '';
    const lab = host.querySelector('[data-dropdown-label]');
    if (lab) lab.textContent = label;
    menu.querySelectorAll('[data-value]').forEach((opt) => opt.classList.toggle('is-selected', opt.dataset.value === String(value)));
  }

  function paintFields() {
    const list = selectableFields();
    const menu = document.getElementById('fp-campo-menu');
    menu.innerHTML = list.map((f) => `<button type="button" class="menu-item" data-value="${f.campoPaltoId}">${esc(f.codigoCampo)} · ${esc(f.nombreActual)}<i class="ri ri-check-line"></i></button>`).join('') || '<div class="empty">No hay campos en este estado.</div>';
    const current = list.find((f) => f.campoPaltoId === fieldId);
    setDropdown('fp-campo-menu', 'fp-campo', current?.campoPaltoId || '', current ? `${current.codigoCampo} · ${current.nombreActual}` : 'Seleccionar campo');
  }

  function paintCampaigns() {
    const list = fieldCampaigns();
    const menu = document.getElementById('fp-camp-menu');
    menu.innerHTML = list.map((c) => `<button type="button" class="menu-item" data-value="${c.campoCampaniaId}">${esc(c.codigo)} · ${esc(estadoLabel(c.estado))}<i class="ri ri-check-line"></i></button>`).join('') || '<div class="empty">Este campo no tiene campañas.</div>';
    const current = list.find((c) => c.campoCampaniaId === campaignId);
    setDropdown('fp-camp-menu', 'fp-camp', current?.campoCampaniaId || '', current ? `${current.codigo} · ${estadoLabel(current.estado)}` : 'Seleccionar campaña');
    const link = document.getElementById('fp-control');
    if (link) link.href = campaignId ? `/paltos/fertilizacion/control?campoCampaniaId=${campaignId}` : '/paltos/fertilizacion/control';
  }

  function baseBudget(campaign) {
    const start = String(campaign.fechaInicio || '').slice(0, 10);
    const [y, m] = start.split('-').map(Number);
    const periodos = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(y, (m - 1) + index, 1);
      return {
        orden: index + 1,
        anio: date.getFullYear(),
        mes: date.getMonth() + 1,
        fenologia: FENO[index],
        desarrolloYemas: YEMAS[index],
        objetivos: BASE.map(([codigo, nombre]) => ({ elementoCodigo: codigo, elementoNombre: nombre, objetivoKgHa: 0 }))
      };
    });
    return {
      presupuestoId: 0,
      campoCampaniaId: campaign.campoCampaniaId,
      codigoCampo: campaign.codigoCampo,
      nombreCampo: campaign.nombreCampo,
      campaniaCodigo: campaign.codigo,
      campaniaNombre: campaign.nombre,
      campaniaEstado: campaign.estado,
      areaHa: campaign.areaHa,
      version: 0,
      tipoPresupuesto: campaign.tipoPresupuesto || 'ORIGINAL',
      observaciones: 'Presupuesto nutricional pendiente de completar.',
      objetivoRendimientoTonHa: null,
      periodos
    };
  }

  function elementsOf(current) {
    const map = new Map();
    (current?.periodos || []).forEach((period) => (period.objetivos || []).forEach((o) => map.set(o.elementoCodigo, o.elementoNombre)));
    return [...map.entries()].map(([code, name]) => ({ code, name }));
  }

  function render() {
    const pills = document.getElementById('fp-pills');
    let facts = document.getElementById('fp-facts');
    if (!facts && pills) {
      facts = document.createElement('div');
      facts.id = 'fp-facts';
      facts.className = 'fp-facts';
      facts.hidden = true;
      pills.before(facts);
    }
    if (!budget) {
      pills.hidden = true;
      pills.innerHTML = '';
      facts.hidden = true;
      facts.innerHTML = '';
      body.innerHTML = '<div class="empty">No hay campañas disponibles para este campo.</div>';
      return;
    }
    const readonly = budget.campaniaEstado === 'CERRADA' || budget.campaniaEstado === 'RECONSTRUIDA';
    facts.hidden = false;
    facts.innerHTML = `
      <div class="field fp-area">
        <span class="field-label">Área ha</span>
        <span class="fp-box">${Number(budget.areaHa || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div class="field fp-yield">
        <label for="fp-rend">Rendimiento t/ha</label>
        <input class="input" id="fp-rend" type="number" min="0" step="0.01" value="${budget.objetivoRendimientoTonHa ?? ''}" ${readonly ? 'disabled' : ''} />
      </div>
      <div class="field fp-rev">
        <span class="field-label">Revisión</span>
        <span class="fp-box">${esc(budget.version || 'nueva')}</span>
      </div>`;
    pills.hidden = true;
    pills.innerHTML = '';
    const cols = elementsOf(budget);
    const available = elements.filter((el) => el.activo && !cols.some((c) => c.code === el.codigo));
    const sources = campaigns
      .filter((c) => c.campoCampaniaId !== budget.campoCampaniaId && ['ACTIVA', 'CERRADA', 'RECONSTRUIDA'].includes(c.estado))
      .sort((a, b) => String(a.codigoCampo).localeCompare(String(b.codigoCampo), 'es', { numeric: true }) || String(b.fechaInicio).localeCompare(String(a.fechaInicio)));

    const head = budget.periodos.map((period, index) => `
      <th>
        <span class="fp-month">${MESES[period.mes - 1]} ${period.anio}</span>
        <input class="input fp-mini" data-feno="${index}" value="${esc(period.fenologia || '')}" ${readonly ? 'disabled' : ''} aria-label="Fenología ${MESES[period.mes - 1]}" />
      </th>`).join('');

    const rows = cols.map(({ code, name }) => {
      const cells = budget.periodos.map((period, index) => {
        const obj = (period.objetivos || []).find((o) => o.elementoCodigo === code);
        return `<td><input class="input fp-kg" type="number" min="0" step="0.01" data-kg="${index}" data-el="${esc(code)}" value="${Number(obj?.objetivoKgHa || 0)}" ${readonly ? 'disabled' : ''} aria-label="${esc(code)} ${MESES[period.mes - 1]}" /></td>`;
      }).join('');
      const total = budget.periodos.reduce((sum, period) => sum + Number((period.objetivos || []).find((o) => o.elementoCodigo === code)?.objetivoKgHa || 0), 0);
      return `<tr>
        <th><span class="fp-code">${esc(code)}</span><span class="fp-name">${esc(name)}</span></th>
        ${cells}
        <td class="fp-num" data-total="${esc(code)}">${total.toFixed(2)}</td>
        <td><button type="button" class="icon-btn" data-remove="${esc(code)}" aria-label="Retirar ${esc(name)}" ${readonly ? 'disabled' : ''}><i class="ri ri-delete-bin-line"></i></button></td>
      </tr>`;
    }).join('');

    const yemas = budget.periodos.map((period, index) => `<td><input class="input fp-mini" data-yema="${index}" value="${esc(period.desarrolloYemas || '')}" ${readonly ? 'disabled' : ''} aria-label="Yemas ${MESES[period.mes - 1]}" /></td>`).join('');

    body.innerHTML = `
      ${readonly ? `<div class="note">${budget.tipoPresupuesto === 'REFERENCIAL_HEREDADO' ? 'Esta campaña es historial reconstruido. El presupuesto es referencial y no corresponde al original.' : 'Esta campaña forma parte del historial y el presupuesto no se edita.'}</div>` : ''}
      ${budget.campaniaEstado === 'EN_PLANIFICACION' ? `
        <div class="card">
          <div class="step-head"><span class="step-num">2</span>Reimportar de otra campaña</div>
          <p class="hint-text">Copia fenología, desarrollo de yemas y objetivos. No copia salidas ni cierres.</p>
          <div class="fp-tools">
            <div class="dropdown" id="fp-src-dd">
              <input type="hidden" id="fp-src" value="${inheritId || ''}" />
              <button type="button" class="dropdown-btn" data-dropdown-btn><span data-dropdown-label>${esc(sources.find((s) => s.campoCampaniaId === inheritId) ? `${sources.find((s) => s.campoCampaniaId === inheritId).codigoCampo} · ${sources.find((s) => s.campoCampaniaId === inheritId).codigo}` : 'Seleccionar campaña fuente')}</span><i class="ri ri-arrow-down-s-line"></i></button>
              <div class="dropdown-menu" id="fp-src-menu" hidden>
                ${sources.map((s) => `<button type="button" class="menu-item${s.campoCampaniaId === inheritId ? ' is-selected' : ''}" data-value="${s.campoCampaniaId}">${esc(s.codigoCampo)} · ${esc(s.nombreCampo)} · ${esc(s.codigo)}<i class="ri ri-check-line"></i></button>`).join('') || '<div class="empty">No hay campañas fuente.</div>'}
              </div>
            </div>
            <button type="button" class="btn" id="fp-reimport" ${inheritId ? '' : 'disabled'}>Reimportar</button>
          </div>
        </div>` : ''}
      <div class="card fp-sheet">
        <div class="fp-sheet-head">
          <div>
            <div class="step-head"><span class="step-num">${budget.campaniaEstado === 'EN_PLANIFICACION' ? '3' : '2'}</span>Presupuesto nutricional</div>
            <p class="hint-text">Cada columna es un mes de la campaña. El total suma los kg/ha del elemento.</p>
          </div>
          <div class="fp-tools">
            <div class="dropdown" id="fp-el-dd">
              <input type="hidden" id="fp-el" value="" />
              <button type="button" class="dropdown-btn" data-dropdown-btn ${readonly ? 'disabled' : ''}><span data-dropdown-label>Agregar otro elemento</span><i class="ri ri-arrow-down-s-line"></i></button>
              <div class="dropdown-menu" id="fp-el-menu" hidden>
                ${available.map((el) => `<button type="button" class="menu-item" data-value="${esc(el.codigo)}">${esc(el.codigo)} · ${esc(el.nombre)}<i class="ri ri-check-line"></i></button>`).join('') || '<div class="empty">No quedan elementos activos.</div>'}
              </div>
            </div>
            <button type="button" class="btn" id="fp-add" disabled>Agregar elemento</button>
          </div>
        </div>
        <div class="fp-matrix">
          <table>
            <thead><tr><th>Elemento</th>${head}<th>Total</th><th></th></tr></thead>
            <tbody>
              ${rows || '<tr><td colspan="14"><div class="empty">Agregue al menos un elemento.</div></td></tr>'}
              <tr><th>Desarrollo de yemas</th>${yemas}<td colspan="2"></td></tr>
            </tbody>
          </table>
        </div>
        <div class="field">
          <label for="fp-obs">Observaciones</label>
          <textarea class="input input--area" id="fp-obs" ${readonly ? 'disabled' : ''}>${esc(budget.observaciones || '')}</textarea>
        </div>
        <div class="fp-foot">
          <button type="button" class="btn btn-primary" id="fp-save" ${readonly ? 'disabled' : ''}><i class="ri ri-save-line"></i>Guardar nueva revisión</button>
        </div>
      </div>`;
  }

  async function loadBudget() {
    const campaign = campaigns.find((c) => c.campoCampaniaId === campaignId);
    if (!campaign) { budget = null; render(); return; }
    body.innerHTML = '<div class="empty">Cargando presupuesto…</div>';
    const res = await erp.get(`?handler=Data&campoCampaniaId=${campaignId}`);
    budget = res?.success && res.data ? res.data : baseBudget(campaign);
    inheritId = 0;
    const url = new URL(location.href);
    url.searchParams.set('campoCampaniaId', String(campaignId));
    history.replaceState(null, '', url);
    render();
  }

  function chooseField(id) {
    fieldId = Number(id);
    const list = fieldCampaigns();
    const keep = list.find((c) => c.campoCampaniaId === campaignId);
    campaignId = keep?.campoCampaniaId || list[0]?.campoCampaniaId || 0;
    budget = null;
    paintFields();
    paintCampaigns();
    if (campaignId) loadBudget();
    else render();
  }

  document.getElementById('fp-campo-menu').addEventListener('click', (event) => {
    const opt = event.target.closest('[data-value]');
    if (!opt) return;
    const id = opt.dataset.value;
    setTimeout(() => chooseField(id), 0);
  });
  document.getElementById('fp-camp-menu').addEventListener('click', (event) => {
    const opt = event.target.closest('[data-value]');
    if (!opt) return;
    const id = Number(opt.dataset.value);
    setTimeout(() => {
      campaignId = id;
      paintCampaigns();
      loadBudget();
    }, 0);
  });
  function paintActivoSwitch(activos) {
    const input = document.getElementById('fp-activos');
    input.checked = activos;
    input.setAttribute('aria-checked', activos ? 'true' : 'false');
    input.closest('.switch').querySelector('.switch-text').textContent = activos ? 'Activos' : 'Inactivos';
  }

  root.addEventListener('change', (event) => {
    if (event.target.id !== 'fp-activos') return;
    tab = event.target.checked ? 'activos' : 'inactivos';
    paintActivoSwitch(event.target.checked);
    const list = selectableFields();
    fieldId = list[0]?.campoPaltoId || 0;
    campaignId = 0;
    chooseField(fieldId);
  });

  root.addEventListener('click', async (event) => {
    const src = event.target.closest('#fp-src-menu [data-value]');
    if (src) {
      const id = Number(src.dataset.value);
      setTimeout(() => { inheritId = id; render(); }, 0);
      return;
    }
    const el = event.target.closest('#fp-el-menu [data-value]');
    if (el) {
      document.getElementById('fp-el').value = el.dataset.value;
      document.querySelector('#fp-el-dd [data-dropdown-label]').textContent = el.textContent.trim();
      document.getElementById('fp-add').disabled = false;
      return;
    }
    if (event.target.closest('#fp-add')) {
      const code = document.getElementById('fp-el').value;
      const element = elements.find((item) => item.codigo === code);
      if (!element || !budget || elementsOf(budget).some((item) => item.code === code)) return;
      budget.periodos.forEach((period) => period.objetivos.push({ elementoCodigo: element.codigo, elementoNombre: element.nombre, objetivoKgHa: 0 }));
      render();
      return;
    }
    const remove = event.target.closest('[data-remove]');
    if (remove && budget) {
      const code = remove.dataset.remove;
      budget.periodos.forEach((period) => { period.objetivos = period.objetivos.filter((o) => o.elementoCodigo !== code); });
      render();
      return;
    }
    if (event.target.closest('#fp-reimport')) {
      if (!budget || !inheritId) return;
      if (!await confirmDs('Reimportar presupuesto', 'Se reemplazará la planificación actual con una copia independiente de la campaña fuente. ¿Desea continuar?')) return;
      const res = await busy('Reimportando presupuesto…', () => erp.post(`?handler=Reimportar&campoCampaniaId=${budget.campoCampaniaId}`, { campoCampaniaFuenteId: inheritId }));
      if (!res?.success) { toast(false, res?.message); return; }
      toast(true, 'Presupuesto reimportado como una nueva revisión.');
      await loadBudget();
      return;
    }
    if (event.target.closest('#fp-save')) {
      if (!budget) return;
      if (!await confirmDs('Guardar revisión', 'Se creará una revisión nueva del presupuesto. La revisión anterior se conserva. ¿Desea continuar?')) return;
      const res = await busy('Guardando revisión…', () => erp.post('?handler=Guardar', {
        campoCampaniaId: budget.campoCampaniaId,
        versionEsperada: budget.version || null,
        objetivoRendimientoTonHa: budget.objetivoRendimientoTonHa,
        observaciones: budget.observaciones,
        periodos: budget.periodos
      }));
      if (!res?.success || !res.data) { toast(false, res?.message); return; }
      budget = res.data;
      toast(true, `Presupuesto guardado como revisión ${budget.version}.`);
      render();
    }
  });

  root.addEventListener('input', (event) => {
    if (!budget) return;
    const t = event.target;
    if (t.id === 'fp-rend') budget.objetivoRendimientoTonHa = t.value === '' ? null : Number(t.value);
    if (t.id === 'fp-obs') budget.observaciones = t.value;
    if (t.dataset.feno != null) budget.periodos[Number(t.dataset.feno)].fenologia = t.value;
    if (t.dataset.yema != null) budget.periodos[Number(t.dataset.yema)].desarrolloYemas = t.value;
    if (t.dataset.kg != null) {
      const period = budget.periodos[Number(t.dataset.kg)];
      const obj = period.objetivos.find((o) => o.elementoCodigo === t.dataset.el);
      if (obj) obj.objetivoKgHa = Number(t.value || 0);
      const total = budget.periodos.reduce((sum, item) => sum + Number((item.objetivos || []).find((o) => o.elementoCodigo === t.dataset.el)?.objetivoKgHa || 0), 0);
      const cell = body.querySelector(`[data-total="${CSS.escape(t.dataset.el)}"]`);
      if (cell) cell.textContent = total.toFixed(2);
    }
  });

  async function start() {
    const [fieldRes, campRes, elRes] = await Promise.all([
      erp.get('?handler=Campos'),
      erp.get('?handler=Campanias'),
      erp.get('?handler=Elementos')
    ]);
    if (!campRes?.success) { body.innerHTML = `<div class="note note-danger">${esc(campRes?.message || 'No se pudieron cargar las campañas.')}</div>`; return; }
    fields = fieldRes?.data || [];
    campaigns = campRes.data || [];
    elements = (elRes?.data || []).filter((item) => item.activo);
    const preferred = campaigns.find((c) => c.campoCampaniaId === campaignId && c.estado !== 'CANCELADA')
      || campaigns.find((c) => c.estado === 'ACTIVA')
      || [...campaigns].filter((c) => c.estado !== 'CANCELADA').sort((a, b) => String(b.fechaInicio).localeCompare(String(a.fechaInicio)))[0];
    const field = fields.find((f) => f.campoPaltoId === preferred?.campoPaltoId);
    tab = field && !field.activo ? 'inactivos' : 'activos';
    paintActivoSwitch(tab === 'activos');
    fieldId = field?.campoPaltoId || selectableFields()[0]?.campoPaltoId || 0;
    campaignId = preferred?.campoCampaniaId || fieldCampaigns()[0]?.campoCampaniaId || 0;
    paintFields();
    paintCampaigns();
    if (campaignId) await loadBudget();
    else render();
  }

  start();
})();
