/* Organigrama de gestión (Pages/Rrhh/Organigrama).
   El árbol trae unidades con conteos directos por empresa y vínculo; el total de cada nodo se
   suma aquí según los filtros. Al hacer clic en una unidad se piden sus puestos y personas. */
(function () {
  const root = document.getElementById('org-page');
  if (!root || !window.d3 || !d3.OrgChart) return;

  const RAIZ = 'raiz';
  const NODO_W = 248;
  const NODO_H = 112;
  const VINCULO = {
    PLANILLA: { texto: 'Planilla', clase: '' },
    PRACTICANTE: { texto: 'Practicante', clase: 'pill-info' },
    RH_EVENTUAL: { texto: 'Recibo por honorarios', clase: 'pill-info' },
    RH_PARADA: { texto: 'Recibo · parada', clase: 'pill-info' }
  };
  const UBICACION = { PUESTO: 'Puesto asignado', CC: 'Centro de costo', GDS: 'GDS del contrato' };

  const $ = (s, c = root) => c.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const fmtFecha = f => f ? new Date(f).toLocaleDateString('es-PE', { timeZone: 'UTC' }) : '';

  const estado = { empresa: '', vinculo: '', suspendidos: false, q: '', coincidencias: [], indice: -1 };
  let datos = null;
  let tipos = new Map();
  let unidades = new Map();
  let hijos = new Map();
  let empresas = new Map();
  let chart = null;
  const puedeEditar = root.dataset.editar === '1';

  /* ---------- Conteos ----------
     Los conteos nunca incluyen a los suspendidos (tabla Suspendidos, "Suspendidos Huacho").
     Solo la lista de personal de una unidad puede mostrarlos, con su interruptor. */
  function pasaFiltro(c, incluirSuspendidos = false) {
    if (estado.empresa && c.empresaId !== estado.empresa) return false;
    if (c.suspendido && !incluirSuspendidos) return false;
    if (estado.vinculo === 'RH') return c.tipoVinculo === 'RH_EVENTUAL' || c.tipoVinculo === 'RH_PARADA';
    if (estado.vinculo) return c.tipoVinculo === estado.vinculo;
    return true;
  }
  const sumar = lista => (lista || []).filter(pasaFiltro).reduce((a, c) => a + c.cantidad, 0);

  /* Directos (sin cargos adicionales) e integrantes por cargo adicional; total = directos del subárbol. */
  /* alerta: personas de la unidad cuyo GDS no está vigente en AndahuasiBD (sin suspendidos,
     igual que los conteos). alertaDebajo: las mismas, en toda la rama, para avisar con la rama recogida. */
  function calcularTotales() {
    const totales = new Map();
    const visitar = id => {
      const u = unidades.get(id);
      const directo = sumar((u.conteos || []).filter(c => !c.adicional));
      const integrantes = sumar((u.conteos || []).filter(c => c.adicional));
      const alerta = sumar((u.conteos || []).filter(c => !c.adicional && c.gdsInactivo));
      let total = directo;
      let alertaDebajo = alerta;
      (hijos.get(id) || []).forEach(h => { const r = visitar(h); total += r.total; alertaDebajo += r.alertaDebajo; });
      const r = { directo, integrantes, total, alerta, alertaDebajo };
      totales.set(id, r);
      return r;
    };
    (hijos.get(null) || []).forEach(visitar);
    return totales;
  }

  /* ---------- Árbol ---------- */
  const nivelDe = u => (tipos.get(u.tipoUnidadId) || {}).nivel ?? 0;
  /* Ancho y alto de la tarjeta por nivel; el espaciador toma el alto de la fila que reemplaza. */
  const TAM = { 0: [NODO_W, NODO_H], 1: [NODO_W, NODO_H], 2: [224, NODO_H], 3: [192, 96] };
  const tam = d => TAM[d.data.espaciador ? d.data.nivel : nivelDe(d.data.unidad)] || TAM[3];

  /* Cada nivel va en su propia fila: Gerencia General → gerencias de línea → departamentos → secciones.
     Si una unidad salta niveles (departamento directo de Gerencia General, sección directa de una
     gerencia) cuelga de un espaciador invisible que solo prolonga la línea hasta su fila.
     Las secciones (último nivel) se apilan en columna bajo su padre: la primera cuelga de él y cada
     siguiente de la anterior, sin línea entre ellas (cadena). Así los departamentos quedan siempre
     en una sola fila y el árbol no crece tanto a lo ancho. */
  function nodos(totales) {
    const lista = [{ id: RAIZ, parentId: null, raiz: true, _expanded: true }];
    const espaciadores = new Map();
    const espaciador = (padreId, nivel, abueloId) => {
      const id = `e${padreId}-${nivel}`;
      if (!espaciadores.has(id)) {
        espaciadores.set(id, true);
        lista.push({ id, parentId: abueloId, espaciador: true, nivel, _expanded: nivel <= 1 });
      }
      return id;
    };

    const ultimaSeccion = new Map();
    [...unidades.values()]
      .sort((a, b) => (nivelDe(a) - nivelDe(b)) || (a.orden - b.orden) || a.nombre.localeCompare(b.nombre))
      .forEach(u => {
        const t = tipos.get(u.tipoUnidadId) || {};
        const padre = u.unidadPadreId ? unidades.get(u.unidadPadreId) : null;
        let parentId = padre ? String(padre.unidadId) : RAIZ;
        if (padre) {
          for (let n = nivelDe(padre) + 1; n < nivelDe(u); n++) parentId = espaciador(padre.unidadId, n, parentId);
        }
        let cadena = false;
        if (padre && nivelDe(u) >= 3) {
          const anterior = ultimaSeccion.get(parentId);
          ultimaSeccion.set(parentId, String(u.unidadId));
          if (anterior) { parentId = anterior; cadena = true; }
        }
        lista.push({
          id: String(u.unidadId),
          parentId,
          cadena,
          unidad: u,
          tipo: t,
          ...(totales.get(u.unidadId) || { directo: 0, integrantes: 0, total: 0, alerta: 0, alertaDebajo: 0 }),
          _expanded: visibleAlInicio(u)
        });
      });
    return lista;
  }

  /* Al abrir: raíces, gerencias de línea y todo lo que no cuelga de una gerencia de línea
     (Auditoría, los departamentos de Gerencia General y sus secciones). El detalle de cada
     gerencia se ve al expandirla. */
  function enGerencia(u) {
    for (let p = u.unidadPadreId ? unidades.get(u.unidadPadreId) : null; p; p = p.unidadPadreId ? unidades.get(p.unidadPadreId) : null) {
      if (nivelDe(p) === 1) return true;
    }
    return false;
  }
  const visibleAlInicio = u => nivelDe(u) <= 1 || !enGerencia(u);

  function contraer() {
    chart.data().forEach(n => {
      if (n.raiz) return;
      n._expanded = n.espaciador ? n.nivel <= 1 : visibleAlInicio(n.unidad);
    });
    chart.render().fit();
  }

  /* Al expandir una unidad se abre todo su detalle (departamentos y secciones). Si es una gerencia
     de línea, se recogen las demás para que la vista no se vuelva inmanejable, y se enfoca en ella. */
  function alExpandir(d) {
    if (!d.children || !d.data.unidad) return;
    const padres = new Map(chart.data().map(n => [n.id, n.parentId]));
    const desciende = (id, de) => { for (let p = padres.get(id); p; p = padres.get(p)) if (p === de) return true; return false; };
    const gerencia = nivelDe(d.data.unidad) === 1;
    const otras = gerencia
      ? chart.data().filter(n => n.unidad && n.id !== d.data.id && nivelDe(n.unidad) === 1).map(n => n.id)
      : [];
    chart.data().forEach(n => {
      if (desciende(n.id, d.data.id)) n._expanded = true;
      else if (otras.some(g => desciende(n.id, g))) n._expanded = false;
      n._centered = false;
    });
    chart.render();
    const foco = chart.getChartState().allNodes.filter(n => n.data.id === d.data.id || desciende(n.data.id, d.data.id));
    chart.fit({ nodes: foco });
  }

  function htmlNodo(d) {
    if (d.data.raiz) return '<div></div>';
    if (d.data.espaciador) return `<div class="org-espaciador" style="width:${d.width}px;height:${d.height}px"></div>`;
    const u = d.data.unidad;
    const t = d.data.tipo;
    const emp = u.empresaId ? empresas.get(u.empresaId) : null;
    const autonomo = t.esAutonomo ? ' is-autonomo' : '';
    const hit = estado.coincidencias.includes(String(u.unidadId)) ? ' is-hit' : '';
    const resp = t.nivel >= 3 ? ''
      : u.responsable
        ? `<span class="org-node-resp" title="${esc(u.responsablePuesto)}"><i class="ri ri-user-star-line"></i>${esc(u.responsable)}</span>`
        : '<span class="org-node-resp is-vacio">Sin responsable asignado</span>';
    const subtotal = d.data.total !== d.data.directo ? `<span class="org-node-sub">${d.data.total} en total</span>` : '';
    const integrantes = d.data.integrantes ? `<span class="org-node-sub">${d.data.integrantes} integrante${d.data.integrantes === 1 ? '' : 's'}</span>` : '';
    // Rojo en la unidad que tiene la gente; en la rama recogida, solo un aviso con el número.
    const alerta = d.data.alerta > 0;
    const avisoDebajo = !alerta && d.data.alertaDebajo > 0 && !d.children;
    const aviso = alerta || avisoDebajo
      ? `<span class="org-node-alerta" title="Personal con GDS no activo en AndahuasiBD${avisoDebajo ? ' en las unidades de abajo' : ''}"><i class="ri ri-error-warning-line"></i>${alerta ? d.data.alerta : d.data.alertaDebajo} GDS no activo</span>`
      : '';
    return `<div class="org-node nivel-${t.nivel ?? 0}${autonomo}${hit}${alerta ? ' is-alerta' : ''}" style="width:${d.width}px;height:${d.height}px">
      <div class="org-node-top">
        <i class="ri ${esc(t.icono || 'ri-node-tree')}"></i>
        <span class="org-node-tipo">${esc(t.nombre)}</span>
        ${emp ? `<span class="pill">${esc(u.empresaId)} · ${esc(emp.nombre)}</span>` : ''}
      </div>
      <div class="org-node-nombre" title="${esc(u.nombre)}">${esc(u.nombre)}</div>
      ${resp}
      <div class="org-node-foot">
        <span class="org-node-n"><i class="ri ri-group-line"></i>${d.data.directo}</span>
        ${subtotal}${integrantes}${aviso}
      </div>
    </div>`;
  }

  /* Las secciones apiladas no llevan botón: se abren y cierran con su departamento.
     El número es de unidades dependientes reales, no de nodos del gráfico. */
  function botonNodo({ node }) {
    if (!node.data.unidad || nivelDe(node.data.unidad) >= 3) return '';
    const abierto = !!node.children;
    const n = (hijos.get(node.data.unidad.unidadId) || []).length;
    return `<div class="org-node-btn"><i class="ri ${abierto ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}"></i>${abierto ? '' : n}</div>`;
  }

  function dibujar() {
    const totales = calcularTotales();
    const data = nodos(totales);
    const conexiones = (datos.relaciones || []).map(r => ({
      from: String(r.unidadOrigenId), to: String(r.unidadDestinoId), label: r.descripcion || r.tipo
    }));

    if (!chart) {
      chart = new d3.OrgChart()
        .container('#org-chart')
        .svgHeight($('#org-chart').clientHeight || 600)
        .nodeWidth(d => d.data.raiz ? 1 : d.data.espaciador ? 24 : tam(d)[0])
        .nodeHeight(d => d.data.raiz ? 1 : tam(d)[1])
        .onExpandOrCollapse(alExpandir)
        .compact(false)
        .childrenMargin(d => d.data.unidad && nivelDe(d.data.unidad) >= 3 ? 10 : 48)
        .siblingsMargin(() => 16)
        .neighbourMargin(() => 40)
        .compactMarginBetween(() => 24)
        .compactMarginPair(() => 64)
        .rootMargin(-40)
        .nodeButtonWidth(() => 44)
        .nodeButtonHeight(() => 22)
        .nodeButtonX(() => -22)
        .nodeButtonY(() => -11)
        .nodeContent(htmlNodo)
        .buttonContent(botonNodo)
        .defs(() => '')
        .nodeUpdate(function () {
          d3.select(this).select('.node-rect').attr('stroke', 'none');
        })
        .linkUpdate(function (d) {
          const oculto = (d.parent && d.parent.data.raiz) || d.data.cadena;
          d3.select(this)
            .style('stroke', oculto ? 'transparent' : 'var(--hint)')
            .attr('stroke-width', 1);
        })
        .connectionsUpdate(function () {
          d3.select(this)
            .style('stroke', 'var(--faint)')
            .style('stroke-dasharray', '6 4')
            .attr('stroke-width', 1.5)
            .attr('fill', 'none')
            .attr('marker-start', null)
            .attr('marker-end', null)
            .attr('pointer-events', 'none');
        })
        .onNodeClick(d => {
          if (d?.data?.unidad) abrirUnidad(d.data.unidad.unidadId);
        });
    }

    chart.data(data).connections(conexiones).render();
  }

  function redibujar() {
    if (!chart) return dibujar();
    const totales = calcularTotales();
    chart.data().forEach(n => {
      if (!n.unidad) return;
      Object.assign(n, totales.get(n.unidad.unidadId) || { directo: 0, integrantes: 0, total: 0, alerta: 0, alertaDebajo: 0 });
    });
    chart.render();
  }

  /* ---------- Búsqueda ---------- */
  function buscar(q) {
    estado.q = norm(q.trim());
    estado.coincidencias = estado.q
      ? [...unidades.values()].filter(u => norm(u.nombre).includes(estado.q) || norm(u.siglas).includes(estado.q)).map(u => String(u.unidadId))
      : [];
    estado.indice = -1;
    $('[data-org-limpiar]').hidden = !q;
    chart?.clearHighlighting();
    if (estado.coincidencias.length) siguiente();
    else chart?.render();
  }

  function siguiente() {
    if (!estado.coincidencias.length || !chart) return;
    estado.indice = (estado.indice + 1) % estado.coincidencias.length;
    const id = estado.coincidencias[estado.indice];
    estado.coincidencias.forEach(x => chart.setExpanded(x));
    chart.setHighlighted(id).render();
    chart.setCentered(id).render();
  }

  /* ---------- Unidad ---------- */
  const dlg = document.getElementById('org-unidad');
  let detalle = null;
  let puestoSel = null;
  let cargoSel = null;

  /* Agrupación por cargo: solo la planilla se agrupa por el cargo del contrato; practicantes y
     recibo por honorarios van en su propio grupo, para no mezclarlos con los cargos normales. */
  const VINCULO_PRACTICANTE = 'v:PRACTICANTE';
  const VINCULO_RH = 'v:RH';
  const grupoDe = p => p.tipoVinculo === 'PRACTICANTE' ? VINCULO_PRACTICANTE
    : p.tipoVinculo === 'RH_EVENTUAL' || p.tipoVinculo === 'RH_PARADA' ? VINCULO_RH
    : (p.cargoContrato || 'Sin cargo');
  const esGrupoVinculo = k => k === VINCULO_PRACTICANTE || k === VINCULO_RH;
  const nombreGrupo = k => k === VINCULO_PRACTICANTE ? 'Practicantes' : k === VINCULO_RH ? 'Recibo por honorarios' : k;
  let qPersona = '';

  async function abrirUnidad(id) {
    const u = unidades.get(id);
    if (!u) return;
    const t = tipos.get(u.tipoUnidadId) || {};
    detalle = null; puestoSel = null; cargoSel = null; qPersona = '';
    document.getElementById('org-unidad-t').textContent = u.nombre;
    document.getElementById('org-unidad-icono').className = 'ri ' + (t.icono || 'ri-node-tree');
    document.getElementById('org-unidad-tipo').textContent = t.nombre || '';
    const body = document.getElementById('org-unidad-body');
    body.innerHTML = '<div class="empty">Cargando personal de la unidad…</div>';
    if (!dlg.open) dlg.showModal();

    try {
      const r = await erp.get(`?handler=Unidad&id=${id}`);
      if (!r?.success) throw new Error(r?.message || 'No se pudo cargar la unidad.');
      detalle = r.datos;
      pintarUnidad();
    } catch (e) {
      body.innerHTML = `<div class="note note-danger">${esc(e.message)}</div>`;
    }
  }

  function personasFiltradas() {
    return (detalle.personas || []).filter(p => {
      if (!pasaFiltro({ empresaId: p.empresaId, tipoVinculo: p.tipoVinculo, suspendido: p.suspendido }, estado.suspendidos)) return false;
      if (puestoSel && p.puestoId !== puestoSel) return false;
      if (cargoSel && grupoDe(p) !== cargoSel) return false;
      if (qPersona && !norm(p.nombre).includes(qPersona) && !(p.dni || '').includes(qPersona) && !(p.trabId || '').includes(qPersona)) return false;
      return true;
    });
  }

  function pintarUnidad() {
    const u = detalle.unidad;
    const padre = u.unidadPadreId ? unidades.get(u.unidadPadreId) : null;
    const subs = (hijos.get(u.unidadId) || []).map(id => unidades.get(id));
    const quitarCriterio = c => puedeEditar
      ? `<button type="button" class="org-criterio-quitar" data-org-criterio-quitar="${c.criterioId}" aria-label="Quitar criterio" title="Quitar: ese personal pasa a la unidad superior que coincida"><i class="ri ri-close-line"></i></button>`
      : '';
    const criterios = (detalle.criterios || []).map(c => c.tipo === 'CC'
      ? `<span class="pill org-criterio">CC ${esc(c.centroCosto)}${c.empresaId ? ' · ' + esc(c.empresaId) : ''}${quitarCriterio(c)}</span>`
      : `<span class="pill org-criterio${c.gdsInactivo ? ' pill-danger' : ''}" title="${c.gdsInactivo ? 'Gerencia, departamento o sección no vigente en AndahuasiBD (Estad o UsadoActualmente)' : ''}">GDS ${esc(c.gerenciaId)}${esc(c.dptoId)}${esc(c.seccId)}${c.empresaId ? ' · ' + esc(c.empresaId) : ''}${c.gdsInactivo ? ' · no activo' : ''}${quitarCriterio(c)}</span>`);
    if (puedeEditar) criterios.push('<button type="button" class="pill org-chip" data-org-criterio-nuevo title="Agregar un GDS o centro de costo"><i class="ri ri-add-line"></i>Criterio</button>');
    const puestos = detalle.puestos || [];
    const body = document.getElementById('org-unidad-body');

    body.innerHTML = `
      <div class="org-resumen">
        ${padre ? `<span class="org-dato"><span class="stat-label">Depende de</span><button type="button" class="org-link" data-org-unidad="${padre.unidadId}">${esc(padre.nombre)}</button></span>` : '<span class="org-dato"><span class="stat-label">Depende de</span><b>Nadie (raíz)</b></span>'}
        <span class="org-dato"><span class="stat-label">Responsable</span><b>${esc(u.responsable || 'Sin asignar')}</b></span>
        <span class="org-dato"><span class="stat-label">Se ubica por</span><span class="chips">${criterios.length ? criterios.join('') : '<span class="pill">Solo puestos asignados</span>'}</span></span>
        ${puedeEditar ? `<span class="org-resumen-acciones">
          <button type="button" class="btn btn-sm" data-org-unidad-editar><i class="ri ri-pencil-line"></i>Editar unidad</button>
          <button type="button" class="btn btn-sm" data-org-unidad-nueva><i class="ri ri-add-line"></i>Unidad dependiente</button>
        </span>` : ''}
      </div>
      ${u.descripcion ? `<p class="hint-text">${esc(u.descripcion)}</p>` : ''}
      ${subs.length ? `<div class="org-subs"><span class="stat-label">Dependen de esta unidad</span><div class="chips">${subs.map(s => `<button type="button" class="pill org-chip" data-org-unidad="${s.unidadId}">${esc(s.nombre)}</button>`).join('')}</div></div>` : ''}
      <div class="org-unidad-grid">
        <section class="org-puestos">
          <div class="org-puestos-head">
            <div class="step-head">${puestos.length ? 'Puestos' : 'Cargos del contrato'}</div>
            <button type="button" class="btn btn-outline btn-sm" data-org-interno-abrir><i class="ri ri-organization-chart"></i>Organigrama interno</button>
          </div>
          ${puedeEditar ? `<div class="org-puestos-acciones">
            <button type="button" class="btn btn-sm" data-org-puesto-nuevo><i class="ri ri-add-line"></i>Puesto</button>
            ${puestos.length ? '' : '<button type="button" class="btn btn-sm" data-org-desde-cargos title="Crea un puesto por cada cargo de contrato de esta unidad, con la jerarquía deducida del nombre"><i class="ri ri-magic-line"></i>Crear desde cargos</button>'}
          </div>` : ''}
          <div id="org-puestos-lista">${puestos.length ? pintarPuestos() : pintarCargos()}</div>
        </section>
        <aside class="panel org-personal">
          <div class="panel-head"><span id="org-personal-t">Personal</span><span class="badge" id="org-personal-n">0</span></div>
          <div class="org-personal-filtro">
            <label class="search sm on-panel"><i class="ri ri-search-line"></i><input type="search" id="org-qp" placeholder="Nombre, código o DNI" aria-label="Buscar persona" /></label>
            <label class="switch org-susp" title="Personal registrado en Suspendidos. No entra en los conteos.">
              <input type="checkbox" id="org-susp"${estado.suspendidos ? ' checked' : ''} />
              <span class="switch-ui"></span>
              <span class="org-switch-text">Suspendidos Huacho <span class="badge" id="org-susp-n">0</span></span>
            </label>
            <div class="chips" id="org-personal-sel"></div>
          </div>
          <div class="panel-body" id="org-personal-lista"></div>
        </aside>
      </div>`;

    pintarPersonal();
  }

  /* Puestos como lista con sangría por jefe inmediato; el gráfico está en "Organigrama interno". */
  function pintarPuestos() {
    const puestos = detalle.puestos || [];
    const ids = new Set(puestos.map(p => p.puestoId));
    const debajo = new Map();
    puestos.forEach(p => {
      const sup = p.puestoSuperiorId && ids.has(p.puestoSuperiorId) ? p.puestoSuperiorId : null;
      if (!debajo.has(sup)) debajo.set(sup, []);
      debajo.get(sup).push(p);
    });
    const filas = [];
    const recorrer = (sup, nivel) => (debajo.get(sup) || []).forEach(p => { filas.push([p, nivel]); recorrer(p.puestoId, nivel + 1); });
    recorrer(null, 0);
    return `<div class="org-cargos">${filas.map(([p, nivel]) => {
      const plazas = p.plazas ? `${p.ocupados}/${p.plazas}` : `${p.ocupados}`;
      const falta = p.plazas && p.ocupados < p.plazas ? ' pill-warning' : '';
      return `<div class="org-cargo org-puesto-fila${p.puestoId === puestoSel ? ' is-selected' : ''}" style="--sangria:${nivel * 14}px">
        <button type="button" class="org-puesto-btn" data-org-puesto="${p.puestoId}">
          ${p.esJefatura ? '<i class="ri ri-user-star-line" title="Jefatura"></i>' : ''}<span>${esc(p.nombre)}</span>
          <span class="badge${falta}" title="Asignados${p.plazas ? ' / plazas' : ''}">${plazas}</span>
        </button>
        ${puedeEditar ? `<button type="button" class="icon-btn" data-org-puesto-editar="${p.puestoId}" aria-label="Editar puesto" title="Editar puesto"><i class="ri ri-pencil-line"></i></button>` : ''}
      </div>`;
    }).join('')}</div>`;
  }

  /* Sin puestos definidos: agrupa por el cargo del contrato para que la unidad igual se lea. */
  function pintarCargos() {
    const grupos = new Map();
    (detalle.personas || []).filter(p => pasaFiltro({ empresaId: p.empresaId, tipoVinculo: p.tipoVinculo, suspendido: p.suspendido }))
      .forEach(p => { const k = grupoDe(p); grupos.set(k, (grupos.get(k) || 0) + 1); });
    const boton = ([k, n]) => `<button type="button" class="org-cargo${k === cargoSel ? ' is-selected' : ''}" data-org-cargo="${esc(k)}"><span>${esc(nombreGrupo(k))}</span><span class="badge">${n}</span></button>`;
    const planilla = [...grupos.entries()].filter(([k]) => !esGrupoVinculo(k)).sort((a, b) => b[1] - a[1]);
    const otros = [VINCULO_PRACTICANTE, VINCULO_RH].filter(k => grupos.has(k)).map(k => [k, grupos.get(k)]);
    if (!planilla.length && !otros.length) return '<div class="dt-empty">Sin personal con los filtros actuales.</div>';
    return `<p class="hint-text">Aún no hay puestos definidos: el personal de planilla se agrupa por el cargo de su contrato.</p>
      ${planilla.length ? `<span class="stat-label">Cargos de planilla</span><div class="org-cargos">${planilla.map(boton).join('')}</div>` : ''}
      ${otros.length ? `<span class="stat-label">Otros vínculos</span><div class="org-cargos">${otros.map(boton).join('')}</div>` : ''}`;
  }

  function pintarPersonal() {
    const lista = personasFiltradas();
    const puesto = puestoSel ? (detalle.puestos || []).find(p => p.puestoId === puestoSel) : null;
    // El conteo es sin suspendidos, aunque el interruptor los muestre en la lista.
    document.getElementById('org-personal-n').textContent = lista.filter(p => !p.suspendido).length;
    document.getElementById('org-susp-n').textContent = (detalle.personas || [])
      .filter(p => p.suspendido && pasaFiltro({ empresaId: p.empresaId, tipoVinculo: p.tipoVinculo, suspendido: true }, true)).length;
    document.getElementById('org-personal-t').textContent = puesto ? puesto.nombre : 'Personal';
    document.getElementById('org-personal-sel').innerHTML =
      (puesto ? `<button type="button" class="pill pill-info org-chip" data-org-quitar="puesto">${esc(puesto.nombre)}<i class="ri ri-close-line"></i></button>` : '') +
      (cargoSel ? `<button type="button" class="pill pill-info org-chip" data-org-quitar="cargo">${esc(nombreGrupo(cargoSel))}<i class="ri ri-close-line"></i></button>` : '');

    const nombrePuesto = id => (detalle.puestos || []).find(p => p.puestoId === id)?.nombre;
    const cont = document.getElementById('org-personal-lista');
    cont.innerHTML = (puesto ? `<div class="card muted org-mof">
        <div class="org-puestos-head"><div class="step-head"><i class="ri ri-file-text-line"></i>MOF del puesto</div>
          ${puedeEditar ? `<button type="button" class="btn btn-sm" data-org-asignar-a="${puesto.puestoId}"><i class="ri ri-user-add-line"></i>Asignar persona</button>` : ''}</div>
        ${puesto.plazas ? `<p class="hint-text">Plazas: ${puesto.ocupados} de ${puesto.plazas} asignadas.</p>` : ''}
        <div id="org-mof-panel"><p class="hint-text">Cargando MOF…</p></div></div>` : '') +
      (lista.length ? lista.map(p => {
        const v = VINCULO[p.tipoVinculo] || { texto: p.tipoVinculo, clase: '' };
        const emp = empresas.get(p.empresaId);
        const pn = p.puestoId ? nombrePuesto(p.puestoId) : null;
        const puestoTxt = pn
          ? `<span>Puesto: <b>${esc(pn)}</b>${p.puestoOrigen === 'SUGERIDO' ? ' <span class="pill pill-warning">Sugerido</span>' : ''}${p.esEncargado ? ' <span class="pill">Encargado</span>' : ''}</span>`
          : '';
        return `<div class="org-persona${p.gdsInactivo ? ' is-alerta' : ''}">
          <div class="org-persona-top">
            <span class="org-persona-cod" title="Código de trabajador">${esc(p.trabId)}</span>
            <span class="org-persona-nombre">${esc(p.nombre)}</span>
            ${p.gdsInactivo ? `<span class="pill pill-danger" title="La gerencia, el departamento o la sección de su contrato no está vigente en AndahuasiBD">GDS ${esc(p.gds)} no activo</span>` : ''}
            ${p.suspendido ? '<span class="pill pill-warning">Suspendido</span>' : ''}
            ${p.adicional ? '<span class="pill pill-info">Integrante</span>' : ''}
          </div>
          <div class="org-persona-meta">
            <span class="pill" title="${esc(emp?.nombre || '')}">${esc(p.empresaId)}${emp ? ' · ' + esc(emp.nombre) : ''}</span>
            <span class="pill ${v.clase}">${esc(v.texto)}</span>
            ${p.dni ? `<span class="dt-muted">DNI ${esc(p.dni)}</span>` : ''}
          </div>
          <div class="org-persona-cargo">
            <span>Cargo en contrato: <b>${esc(p.cargoContrato || 'Sin cargo')}</b></span>
            ${puestoTxt}
            <span class="dt-muted">Desde ${fmtFecha(p.fechaInicio)}${p.fechaFin ? ' hasta ' + fmtFecha(p.fechaFin) : ''} · ${esc(UBICACION[p.ubicacion] || p.ubicacion)}</span>
            ${puedeEditar ? `<span class="org-persona-acciones">
              ${(detalle.puestos || []).length ? `<button type="button" class="btn btn-sm" data-org-asignar="${esc(p.empresaId)}-${esc(p.trabId)}"><i class="ri ri-user-settings-line"></i>${p.puestoOrigen === 'ASIGNADO' ? 'Cambiar puesto' : 'Asignar puesto'}</button>` : ''}
              ${p.asignacionId ? `<button type="button" class="btn btn-sm btn-ghost" data-org-terminar="${p.asignacionId}" title="Quita la asignación; vuelve a ubicarse por su centro de costo o GDS"><i class="ri ri-close-line"></i>Quitar puesto</button>` : ''}
            </span>` : ''}
          </div>
        </div>`;
      }).join('') : '<div class="empty">No hay personal con los filtros actuales.</div>');
    if (puesto) cargarMof(puesto);
  }

  /* ---------- MOF del puesto ----------
     Se pide al seleccionar el puesto y se guarda en memoria hasta que cambie. */
  const mofCache = new Map();

  async function cargarMof(puesto, forzar = false) {
    const id = puesto.puestoId;
    if (forzar || !mofCache.has(id)) {
      const r = await erp.get(`?handler=Mof&id=${id}`);
      mofCache.set(id, r?.success ? r.datos : { error: r?.message || 'No se pudo cargar el MOF.' });
    }
    const panel = document.getElementById('org-mof-panel');
    if (!panel || puestoSel !== id) return;
    panel.innerHTML = htmlMof(puesto, mofCache.get(id));
  }

  const lineas = s => String(s || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const fmtFechaHora = f => f ? new Date(f).toLocaleDateString('es-PE') : '';

  function seccionesMof(m) {
    const sec = (titulo, cuerpo) => cuerpo ? `<div class="org-mof-sec"><span class="stat-label">${titulo}</span>${cuerpo}</div>` : '';
    const texto = s => s ? `<p>${esc(s)}</p>` : '';
    const funciones = lineas(m.funciones);
    return sec('Objetivo', texto(m.objetivo))
      + sec('Funciones', funciones.length ? `<ol>${funciones.map(f => `<li>${esc(f)}</li>`).join('')}</ol>` : '')
      + sec('Requisitos', texto(m.requisitos))
      + sec('Competencias', texto(m.competencias))
      + sec('Relaciones', texto(m.relaciones));
  }

  function htmlMof(puesto, d) {
    if (d.error) return `<div class="note note-danger">${esc(d.error)}</div>`;
    const v = d.vigente;
    const b = d.borrador;
    const acciones = [];
    if (v) acciones.push(`<button type="button" class="btn btn-sm" data-org-mof-imprimir><i class="ri ri-printer-line"></i>Imprimir</button>`);
    if (puedeEditar) {
      acciones.push(`<button type="button" class="btn btn-sm" data-org-mof-editar><i class="ri ri-pencil-line"></i>${b ? 'Editar borrador' : v ? 'Nueva versión' : 'Registrar MOF'}</button>`);
      if (b) acciones.push(`<button type="button" class="btn btn-sm btn-outline" data-org-mof-aprobar><i class="ri ri-check-double-line"></i>Aprobar versión ${b.version}</button>`);
    }
    const historial = (d.historial || []).length
      ? `<span class="hint-text">Versiones anteriores: ${d.historial.map(h => `v${h.version} (${fmtFechaHora(h.fechaAprobacion)})`).join(', ')}</span>` : '';
    return `<div class="org-mof-ver">
      ${v ? `<div class="org-mof-pie"><span class="pill pill-success">Vigente · versión ${v.version}</span><span class="hint-text">Aprobado por ${esc(v.aprobadoPor || '')} el ${fmtFechaHora(v.fechaAprobacion)}</span></div>${seccionesMof(v)}`
          : '<p class="hint-text">Este puesto aún no tiene MOF aprobado.</p>'}
      ${b ? `<div class="org-mof-pie"><span class="pill pill-warning">Borrador · versión ${b.version}</span><span class="hint-text">Pendiente de aprobación.</span></div>` : ''}
      ${historial}
      ${acciones.length ? `<div class="org-mof-pie">${acciones.join('')}</div>` : ''}
    </div>`;
  }

  /* Imprimir: documento aparte, solo con el MOF vigente. */
  function imprimirMof(puesto) {
    const v = mofCache.get(puesto.puestoId)?.vigente;
    if (!v) return;
    const unidad = detalle.unidad;
    const w = window.open('', '_blank');
    if (!w) { aviso('El navegador bloqueó la ventana de impresión.', 'error'); return; }
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>MOF · ${esc(puesto.nombre)}</title>
      <style>body{font-family:"IBM Plex Sans",Arial,sans-serif;font-size:12pt;margin:24mm 18mm}h1{font-size:16pt;margin:0 0 4pt}
      .sub{color:#555;margin-bottom:14pt}h2{font-size:11pt;text-transform:uppercase;letter-spacing:.06em;margin:14pt 0 4pt}
      p{margin:0;white-space:pre-line}ol{margin:0;padding-left:18pt}.pie{margin-top:24pt;font-size:9pt;color:#555}</style></head><body>
      <h1>Manual de Organización y Funciones</h1>
      <div class="sub"><b>${esc(puesto.nombre)}</b> · ${esc(unidad.nombre)} · Versión ${v.version}</div>
      ${seccionesMof(v).replace(/<span class="stat-label">(.*?)<\/span>/g, '<h2>$1</h2>')}
      <div class="pie">Aprobado por ${esc(v.aprobadoPor || '')} el ${fmtFechaHora(v.fechaAprobacion)}. Organigrama de gestión — documento informativo.</div>
      </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }

  /* ---------- Organigrama interno ----------
     Con puestos definidos usa su jerarquía (PuestoSuperiorId). Sin puestos es provisional: agrupa
     por cargo del contrato y ordena los cargos por las palabras del nombre. */
  const dlgInterno = document.getElementById('org-interno');
  let chartInterno = null;

  const RANGO = [
    // "Administrador" no cuenta: es ambiguo (administrador de redes / de fundo); se resuelve con el puesto.
    { nivel: 1, texto: 'Jefatura', re: /\b(GERENTE|SUB ?GERENTE|SUPERINTENDENTE|JEFE|JEFA|DIRECTOR|DIRECTORA)\b/ },
    { nivel: 2, texto: 'Supervisión y coordinación', re: /\b(SUPERVISOR|SUPERVISORA|COORDINADOR|COORDINADORA|ENCARGADO|ENCARGADA|CAPATAZ|MAYORDOMO|RESPONSABLE)\b/ }
  ];
  const rangoCargo = nombre => RANGO.find(r => r.re.test(norm(nombre).toUpperCase())) || { nivel: 3, texto: 'Cargo' };

  function nodosInterno() {
    const personas = (detalle.personas || []).filter(p => pasaFiltro({ empresaId: p.empresaId, tipoVinculo: p.tipoVinculo, suspendido: p.suspendido }, estado.suspendidos));
    const lista = [{ id: RAIZ, parentId: null, raiz: true, _expanded: true }];
    const ultimo = new Map();
    /* Si el grupo tiene otros grupos debajo (un jefe con sus cargos), sus ocupantes van dentro de la
       tarjeta; si no, se apilan como tarjetas de trabajador debajo del grupo. */
    const conSubgrupos = () => new Set(lista.filter(n => n.grupo).map(n => n.parentId));
    const agregarPersonas = asignar => {
      const padres = conSubgrupos();
      asignar.forEach(([p, grupoId]) => {
        const grupo = lista.find(n => n.id === grupoId);
        if (padres.has(grupoId)) { (grupo.grupo.enTarjeta ||= []).push(p); return; }
        const anterior = ultimo.get(grupoId);
        const id = `p${p.empresaId}-${p.trabId}-${grupoId}`;
        ultimo.set(grupoId, id);
        lista.push({ id, parentId: anterior || grupoId, cadena: !!anterior, persona: p, _expanded: true });
      });
    };
    const puestos = detalle.puestos || [];

    if (puestos.length) {
      const ids = new Set(puestos.map(p => p.puestoId));
      puestos.forEach(p => lista.push({
        id: `q${p.puestoId}`,
        parentId: p.puestoSuperiorId && ids.has(p.puestoSuperiorId) ? `q${p.puestoSuperiorId}` : RAIZ,
        grupo: { nombre: p.nombre, nivel: p.esJefatura ? 1 : rangoCargo(p.nombre).nivel, plazas: p.plazas, ocupados: p.ocupados, total: 0 },
        _expanded: true
      }));
      const sinPuesto = personas.filter(p => !p.puestoId || !ids.has(p.puestoId));
      if (sinPuesto.length) lista.push({ id: 'qsin', parentId: RAIZ, grupo: { nombre: 'Sin puesto asignado', nivel: 3, vacio: true, total: 0 }, _expanded: true });
      const asignar = personas.map(p => [p, p.puestoId && ids.has(p.puestoId) ? `q${p.puestoId}` : 'qsin']);
      asignar.forEach(([, g]) => lista.find(n => n.id === g).grupo.total++);
      agregarPersonas(asignar);
      return { lista, provisional: false };
    }

    // Provisional: un grupo por cargo; cada nivel cuelga del primer grupo del nivel superior.
    const grupos = new Map();
    personas.forEach(p => {
      const k = grupoDe(p);
      const rango = esGrupoVinculo(k) ? { nivel: 3, texto: 'Otro vínculo', vinculo: true } : rangoCargo(k);
      if (!grupos.has(k)) grupos.set(k, { nombre: nombreGrupo(k), ...rango, personas: [] });
      grupos.get(k).personas.push(p);
    });
    const ordenados = [...grupos.values()].sort((a, b) => (a.nivel - b.nivel) || ((a.vinculo ? 1 : 0) - (b.vinculo ? 1 : 0)) || (b.personas.length - a.personas.length) || a.nombre.localeCompare(b.nombre));
    const primeroDe = new Map();
    const asignar = [];
    ordenados.forEach((g, i) => {
      const id = `g${i}`;
      if (!primeroDe.has(g.nivel)) primeroDe.set(g.nivel, id);
      const superior = [...primeroDe.entries()].filter(([n]) => n < g.nivel).sort((a, b) => b[0] - a[0])[0];
      lista.push({ id, parentId: superior ? superior[1] : RAIZ, grupo: { nombre: g.nombre, nivel: g.nivel, total: g.personas.length, vinculo: !!g.vinculo }, _expanded: true });
      g.personas.forEach(p => asignar.push([p, id]));
    });
    agregarPersonas(asignar);
    return { lista, provisional: true };
  }

  function htmlInterno(d) {
    if (d.data.raiz) return '<div></div>';
    if (d.data.persona) {
      const p = d.data.persona;
      const v = VINCULO[p.tipoVinculo] || { texto: p.tipoVinculo, clase: '' };
      return `<div class="org-tarjeta-persona${p.suspendido ? ' is-suspendido' : ''}${p.gdsInactivo ? ' is-alerta' : ''}" title="${p.gdsInactivo ? 'GDS ' + esc(p.gds) + ' no activo' : ''}" style="width:${d.width}px;height:${d.height}px">
        <span class="org-tarjeta-linea"><span class="org-persona-cod">${esc(p.trabId)}</span><span class="org-tarjeta-nombre" title="${esc(p.nombre)}">${esc(p.nombre)}</span></span>
        <span class="org-tarjeta-meta">${esc(p.empresaId)} · ${esc(v.texto)}${p.suspendido ? ' · Suspendido' : ''}</span>
      </div>`;
    }
    const g = d.data.grupo;
    const rango = g.vinculo ? 'Otro vínculo' : g.nivel === 1 ? 'Jefatura' : g.nivel === 2 ? 'Supervisión' : 'Cargo';
    const plazas = g.plazas ? ` · ${g.ocupados}/${g.plazas} plazas` : '';
    const ocupantes = (g.enTarjeta || []).slice(0, MAX_EN_TARJETA).map(p =>
      `<span class="org-tarjeta-linea${p.suspendido ? ' is-suspendido' : ''}"><span class="org-persona-cod">${esc(p.trabId)}</span><span class="org-tarjeta-nombre" title="${esc(p.nombre)}">${esc(p.nombre)}</span></span>`).join('');
    const mas = (g.enTarjeta || []).length > MAX_EN_TARJETA ? `<span class="org-tarjeta-meta">y ${g.enTarjeta.length - MAX_EN_TARJETA} más</span>` : '';
    return `<div class="org-node org-grupo nivel-${g.nivel}${g.vacio || g.vinculo ? ' is-autonomo' : ''}" style="width:${d.width}px;height:${d.height}px">
      <div class="org-node-top"><span class="org-node-tipo">${rango}</span></div>
      <div class="org-node-nombre" title="${esc(g.nombre)}">${esc(g.nombre)}</div>
      ${ocupantes ? `<div class="org-ocupantes">${ocupantes}${mas}</div>` : ''}
      <div class="org-node-foot"><span class="org-node-n"><i class="ri ri-group-line"></i>${g.total ?? 0}</span>${plazas}</div>
    </div>`;
  }
  const MAX_EN_TARJETA = 3;
  const altoGrupo = g => 98 + Math.min((g.enTarjeta || []).length, MAX_EN_TARJETA) * 18 + ((g.enTarjeta || []).length > MAX_EN_TARJETA ? 16 : 0);

  function abrirInterno() {
    if (!detalle) return;
    const { lista, provisional } = nodosInterno();
    document.getElementById('org-interno-t').textContent = 'Organigrama interno · ' + detalle.unidad.nombre;
    document.getElementById('org-interno-origen').textContent = provisional ? 'Provisional' : 'Por puestos';
    document.getElementById('org-interno-origen').className = 'pill ' + (provisional ? 'pill-warning' : 'pill-success');
    const nota = document.getElementById('org-interno-nota');
    nota.hidden = !provisional;
    nota.textContent = 'Provisional: la unidad aún no tiene puestos definidos. Se agrupa por el cargo del contrato y los niveles se deducen del nombre del cargo (Jefe, Supervisor, Coordinador, Encargado…).';
    dlgInterno.showModal();

    const cont = document.getElementById('org-interno-chart');
    cont.innerHTML = '';
    if (lista.length === 1) {
      cont.innerHTML = '<div class="org-estado"><div class="empty">No hay personal con los filtros actuales.</div></div>';
      return;
    }
    chartInterno = new d3.OrgChart()
      .container(cont)
      .svgHeight(cont.clientHeight || 600)
      .compact(false)
      .nodeWidth(d => d.data.raiz ? 1 : d.data.persona ? 216 : 232)
      .nodeHeight(d => d.data.raiz ? 1 : d.data.persona ? 52 : altoGrupo(d.data.grupo))
      .childrenMargin(d => d.data.persona ? 6 : 40)
      .siblingsMargin(() => 16)
      .neighbourMargin(() => 32)
      .rootMargin(-30)
      .nodeContent(htmlInterno)
      .buttonContent(({ node }) => node.data.grupo
        ? `<div class="org-node-btn"><i class="ri ${node.children ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}"></i></div>`
        : '')
      .nodeButtonWidth(() => 44).nodeButtonHeight(() => 22).nodeButtonX(() => -22).nodeButtonY(() => -11)
      .defs(() => '')
      .nodeUpdate(function () { d3.select(this).select('.node-rect').attr('stroke', 'none'); })
      .linkUpdate(function (d) {
        const oculto = (d.parent && d.parent.data.raiz) || d.data.cadena;
        d3.select(this).style('stroke', oculto ? 'transparent' : 'var(--hint)').attr('stroke-width', 1);
      })
      .data(lista)
      .render();
    chartInterno.fit({ animate: false });
  }

  dlgInterno.addEventListener('click', e => {
    const b = e.target.closest('[data-org-interno]');
    if (!b || !chartInterno) return;
    switch (b.dataset.orgInterno) {
      case 'acercar': chartInterno.zoomIn(); break;
      case 'alejar': chartInterno.zoomOut(); break;
      case 'ajustar': chartInterno.fit(); break;
      case 'exportar': chartInterno.exportImg({ full: true, scale: 2, backgroundColor: getComputedStyle(root).getPropertyValue('--bg').trim() || 'white' }); break;
    }
  });
  dlgInterno.addEventListener('close', () => { chartInterno = null; });

  const repintarPuestos = () => {
    const cont = document.getElementById('org-puestos-lista');
    if (cont) cont.innerHTML = (detalle.puestos || []).length ? pintarPuestos() : pintarCargos();
  };

  dlg.addEventListener('click', e => {
    if (e.target.closest('[data-org-interno-abrir]')) { abrirInterno(); return; }
    const unidad = e.target.closest('[data-org-unidad]');
    if (unidad) { abrirUnidad(Number(unidad.dataset.orgUnidad)); return; }
    const cargo = e.target.closest('[data-org-cargo]');
    if (cargo) {
      cargoSel = cargoSel === cargo.dataset.orgCargo ? null : cargo.dataset.orgCargo;
      repintarPuestos();
      pintarPersonal();
      return;
    }
    const puesto = e.target.closest('[data-org-puesto]');
    if (puesto) {
      const id = Number(puesto.dataset.orgPuesto);
      puestoSel = puestoSel === id ? null : id;
      repintarPuestos();
      pintarPersonal();
      return;
    }
    const quitar = e.target.closest('[data-org-quitar]');
    if (quitar) {
      if (quitar.dataset.orgQuitar === 'puesto') puestoSel = null; else cargoSel = null;
      repintarPuestos();
      pintarPersonal();
      return;
    }
    if (e.target.closest('[data-org-mof-imprimir]')) { imprimirMof(detalle.puestos.find(p => p.puestoId === puestoSel)); return; }
    if (!puedeEditar) return;
    if (e.target.closest('[data-org-mof-editar]')) { abrirMof(detalle.puestos.find(p => p.puestoId === puestoSel)); return; }
    const aprobar = e.target.closest('[data-org-mof-aprobar]');
    if (aprobar) { aprobarMof(puestoSel, aprobar); return; }
    if (e.target.closest('[data-org-unidad-editar]')) { abrirUnidadForm(detalle.unidad, null); return; }
    if (e.target.closest('[data-org-unidad-nueva]')) { abrirUnidadForm(null, detalle.unidad); return; }
    if (e.target.closest('[data-org-criterio-nuevo]')) { abrirCriterio(); return; }
    const qc = e.target.closest('[data-org-criterio-quitar]');
    if (qc) { quitarCriterio(Number(qc.dataset.orgCriterioQuitar), qc); return; }
    if (e.target.closest('[data-org-puesto-nuevo]')) { abrirPuesto(null); return; }
    const editar = e.target.closest('[data-org-puesto-editar]');
    if (editar) { abrirPuesto((detalle.puestos || []).find(p => p.puestoId === Number(editar.dataset.orgPuestoEditar))); return; }
    if (e.target.closest('[data-org-desde-cargos]')) { crearDesdeCargos(); return; }
    const asignar = e.target.closest('[data-org-asignar]');
    if (asignar) { abrirAsignar({ persona: (detalle.personas || []).find(p => `${p.empresaId}-${p.trabId}` === asignar.dataset.orgAsignar) }); return; }
    const asignarA = e.target.closest('[data-org-asignar-a]');
    if (asignarA) { abrirAsignar({ puesto: (detalle.puestos || []).find(p => p.puestoId === Number(asignarA.dataset.orgAsignarA)) }); return; }
    const terminar = e.target.closest('[data-org-terminar]');
    if (terminar) { terminarAsignacion(Number(terminar.dataset.orgTerminar), terminar); }
  });
  dlg.addEventListener('input', e => {
    if (e.target.id === 'org-qp') { qPersona = norm(e.target.value.trim()); pintarPersonal(); }
  });
  dlg.addEventListener('change', e => {
    if (e.target.id === 'org-susp') { estado.suspendidos = e.target.checked; pintarPersonal(); }
  });

  /* ---------- Mantenimiento (acceso /rrhh/organigrama-edicion) ----------
     Después de cada cambio se recarga la unidad abierta y los conteos del árbol. */
  const aviso = (texto, tipo = 'success') => {
    const body = document.getElementById('org-unidad-body');
    body.querySelector('.org-aviso')?.remove();
    body.insertAdjacentHTML('afterbegin', `<div class="note ${tipo === 'success' ? '' : 'note-danger'} org-aviso" role="status">${esc(texto)}</div>`);
    setTimeout(() => body.querySelector('.org-aviso')?.remove(), 5000);
  };
  const errorEn = (dialogo, texto) => {
    const n = dialogo.querySelector('[data-org-error]');
    n.textContent = texto || '';
    n.hidden = !texto;
  };

  async function refrescar(mensaje) {
    const id = detalle?.unidad?.unidadId;
    const sel = puestoSel;
    try {
      const r = await erp.get('?handler=Arbol');
      if (r?.success) {
        datos = r.datos;
        (datos.unidades || []).forEach(u => { const actual = unidades.get(u.unidadId); if (actual) Object.assign(actual, u); });
        pintarSinUbicar();
        redibujar();
      }
    } catch { /* el árbol se actualiza en la próxima carga */ }
    if (id) {
      const r = await erp.get(`?handler=Unidad&id=${id}`);
      if (r?.success) {
        detalle = r.datos;
        puestoSel = (detalle.puestos || []).some(p => p.puestoId === sel) ? sel : null;
        pintarUnidad();
      }
    }
    if (mensaje) aviso(mensaje);
  }

  async function enviar(handler, body, boton) {
    if (boton) boton.disabled = true;
    try {
      const r = await erp.post(`?handler=${handler}`, body);
      return r || { success: false, message: 'Sin respuesta.' };
    } catch (e) {
      return { success: false, message: e.message };
    } finally {
      if (boton) boton.disabled = false;
    }
  }

  /* Desplegable propio: llena las opciones y deja marcada la elegida. */
  function llenarDropdown(id, opciones, valor) {
    const dd = document.getElementById(id);
    const menu = dd.querySelector('.dropdown-menu');
    menu.innerHTML = opciones.map(o => `<button type="button" class="menu-item${String(o.valor) === String(valor ?? '') ? ' is-selected' : ''}" data-value="${esc(o.valor)}">${esc(o.texto)}<i class="ri ri-check-line"></i></button>`).join('');
    dd.querySelector('input[type=hidden]').value = valor ?? '';
    dd.querySelector('[data-dropdown-label]').textContent = (opciones.find(o => String(o.valor) === String(valor ?? '')) || opciones[0] || { texto: '' }).texto.trim();
  }
  const valorDropdown = id => document.getElementById(id).querySelector('input[type=hidden]').value;

  /* Puesto: crear o editar */
  const dlgPuesto = document.getElementById('org-dlg-puesto');
  let puestoEditando = null;

  function abrirPuesto(p) {
    puestoEditando = p || null;
    errorEn(dlgPuesto, '');
    document.getElementById('org-dlg-puesto-t').textContent = p ? 'Editar puesto' : 'Nuevo puesto · ' + detalle.unidad.nombre;
    document.getElementById('org-p-nombre').value = p?.nombre || '';
    document.getElementById('org-p-plazas').value = p?.plazas || '';
    document.getElementById('org-p-jefatura').checked = !!p?.esJefatura;
    // Jefe inmediato: cualquier puesto activo de la unidad salvo el mismo (la API valida ciclos).
    llenarDropdown('org-p-superior',
      [{ valor: '', texto: 'Ninguno (encabeza la unidad)' }].concat((detalle.puestos || []).filter(x => x.puestoId !== p?.puestoId).map(x => ({ valor: x.puestoId, texto: x.nombre }))),
      p?.puestoSuperiorId ?? '');
    const cargos = new Map();
    (detalle.personas || []).forEach(x => { if (x.cargTraId) cargos.set(x.cargTraId, x.cargoContrato || x.cargTraId); });
    if (p?.cargTraIdSugerido && !cargos.has(p.cargTraIdSugerido)) cargos.set(p.cargTraIdSugerido, 'Cargo ' + p.cargTraIdSugerido);
    llenarDropdown('org-p-cargo',
      [{ valor: '', texto: 'Ninguno' }].concat([...cargos.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([valor, texto]) => ({ valor, texto }))),
      p?.cargTraIdSugerido ?? '');
    document.getElementById('org-p-desactivar').hidden = !p;
    dlgPuesto.showModal();
    document.getElementById('org-p-nombre').focus();
  }

  async function guardarPuesto(activo = true) {
    const nombre = document.getElementById('org-p-nombre').value.trim();
    if (!nombre) { errorEn(dlgPuesto, 'Escribe el nombre del puesto.'); return; }
    const plazas = Number(document.getElementById('org-p-plazas').value) || null;
    const superior = valorDropdown('org-p-superior');
    const r = await enviar('Puesto', {
      puestoId: puestoEditando?.puestoId ?? null,
      unidadId: detalle.unidad.unidadId,
      nombre,
      puestoSuperiorId: superior ? Number(superior) : null,
      plazas,
      cargTraIdSugerido: valorDropdown('org-p-cargo') || null,
      esJefatura: document.getElementById('org-p-jefatura').checked,
      orden: puestoEditando?.orden ?? (detalle.puestos || []).length + 1,
      activo
    }, document.getElementById(activo ? 'org-p-guardar' : 'org-p-desactivar'));
    if (!r.success) { errorEn(dlgPuesto, r.message); return; }
    dlgPuesto.close();
    await refrescar(activo ? r.message : 'Puesto desactivado.');
  }

  async function crearDesdeCargos() {
    const grupos = new Map();
    // Solo planilla: practicantes y recibo por honorarios no definen puestos por su cargo.
    (detalle.personas || []).filter(p => !p.suspendido && p.tipoVinculo === 'PLANILLA').forEach(p => {
      const nombre = p.cargoContrato || 'Sin cargo';
      if (!grupos.has(nombre)) grupos.set(nombre, { nombre, cargTraId: p.cargTraId, nivel: rangoCargo(nombre).nivel });
    });
    if (!grupos.size) { aviso('La unidad no tiene personal vigente para deducir los puestos.', 'error'); return; }
    const r = await enviar('PuestosDesdeCargos', { unidadId: detalle.unidad.unidadId, cargos: [...grupos.values()] }, dlg.querySelector('[data-org-desde-cargos]'));
    if (!r.success) { aviso(r.message, 'error'); return; }
    await refrescar(r.message);
  }

  /* Asignación: desde una persona (elige puesto de la unidad) o desde un puesto (busca a cualquiera). */
  const dlgAsignar = document.getElementById('org-dlg-asignar');
  let asignando = null;
  let elegido = null;

  function tarjetaPersona(p) {
    return `<div class="card muted org-a-persona"><span class="org-tarjeta-linea"><span class="org-persona-cod">${esc(p.trabId)}</span><b>${esc(p.nombre)}</b></span>
      <span class="hint-text">${esc(p.empresaId)} · ${esc(p.cargoContrato || 'Sin cargo')}${p.unidadNombre ? ' · hoy en ' + esc(p.unidadNombre) : ''}</span></div>`;
  }

  function abrirAsignar({ persona, puesto }) {
    asignando = { persona, puesto };
    elegido = persona || null;
    errorEn(dlgAsignar, '');
    const desdePuesto = !!puesto;
    document.getElementById('org-dlg-asignar-t').textContent = desdePuesto ? 'Asignar persona a ' + puesto.nombre : 'Asignar puesto';
    document.getElementById('org-a-quien').innerHTML = persona ? tarjetaPersona(persona) : '';
    document.getElementById('org-a-puesto-campo').hidden = desdePuesto;
    document.getElementById('org-a-buscar-campo').hidden = !desdePuesto;
    document.getElementById('org-a-q').value = '';
    document.getElementById('org-a-resultados').innerHTML = '';
    if (!desdePuesto) {
      llenarDropdown('org-a-puesto', [{ valor: '', texto: 'Elige un puesto' }].concat((detalle.puestos || []).map(p => ({ valor: p.puestoId, texto: p.nombre }))),
        persona.puestoOrigen === 'SUGERIDO' ? persona.puestoId : '');
    }
    document.getElementById('org-a-fecha').value = new Date().toISOString().slice(0, 10);
    // En un órgano autónomo (Comité Fiscalizador) lo normal es el cargo adicional.
    document.getElementById('org-a-adicional').checked = !!(tipos.get(detalle.unidad.tipoUnidadId) || {}).esAutonomo && detalle.unidad.empresaId == null;
    document.getElementById('org-a-encargado').checked = false;
    dlgAsignar.showModal();
    (desdePuesto ? document.getElementById('org-a-q') : document.getElementById('org-a-fecha')).focus();
  }

  let esperaBusqueda = null;
  dlgAsignar?.addEventListener('input', e => {
    if (e.target.id !== 'org-a-q') return;
    clearTimeout(esperaBusqueda);
    const q = e.target.value.trim();
    const cont = document.getElementById('org-a-resultados');
    if (q.length < 2) { cont.innerHTML = ''; return; }
    esperaBusqueda = setTimeout(async () => {
      cont.innerHTML = '<div class="hint-text">Buscando…</div>';
      const r = await erp.get(`?handler=Personal&q=${encodeURIComponent(q)}`);
      const lista = r?.datos?.personas || [];
      cont.innerHTML = r?.success === false && !lista.length
        ? `<div class="hint-text">${esc(r.message)}</div>`
        : lista.length
          ? lista.map(p => `<button type="button" class="org-cargo" data-org-elegir="${esc(p.empresaId)}-${esc(p.trabId)}"><span><span class="org-persona-cod">${esc(p.trabId)}</span> ${esc(p.nombre)}<span class="hint-text" style="display:block">${esc(p.empresaId)} · ${esc(p.cargoContrato || 'Sin cargo')} · ${esc(p.unidadNombre || '')}</span></span></button>`).join('')
          : '<div class="hint-text">Sin resultados.</div>';
      cont._lista = lista;
    }, 300);
  });
  dlgAsignar?.addEventListener('click', e => {
    const b = e.target.closest('[data-org-elegir]');
    if (b) {
      const cont = document.getElementById('org-a-resultados');
      elegido = (cont._lista || []).find(p => `${p.empresaId}-${p.trabId}` === b.dataset.orgElegir) || null;
      document.getElementById('org-a-quien').innerHTML = elegido ? tarjetaPersona(elegido) : '';
      cont.innerHTML = '';
      document.getElementById('org-a-q').value = '';
      return;
    }
    if (e.target.closest('#org-a-guardar')) guardarAsignacion();
  });

  async function guardarAsignacion() {
    const puestoId = asignando.puesto ? asignando.puesto.puestoId : Number(valorDropdown('org-a-puesto'));
    if (!elegido) { errorEn(dlgAsignar, 'Busca y elige al trabajador.'); return; }
    if (!puestoId) { errorEn(dlgAsignar, 'Elige el puesto.'); return; }
    const r = await enviar('Asignar', {
      puestoId,
      empresaTrabajador: elegido.empresaId,
      trabId: elegido.trabId,
      esPrincipal: !document.getElementById('org-a-adicional').checked,
      esEncargado: document.getElementById('org-a-encargado').checked,
      fechaInicio: document.getElementById('org-a-fecha').value || null
    }, document.getElementById('org-a-guardar'));
    if (!r.success) { errorEn(dlgAsignar, r.message); return; }
    dlgAsignar.close();
    await refrescar(r.message);
  }

  async function terminarAsignacion(id, boton) {
    const r = await enviar('Terminar', { asignacionId: id }, boton);
    if (!r.success) { aviso(r.message, 'error'); return; }
    await refrescar(r.message);
  }

  /* ---------- MOF: borrador y aprobación ---------- */
  const dlgMof = document.getElementById('org-dlg-mof');
  let mofPuesto = null;

  function abrirMof(puesto) {
    mofPuesto = puesto;
    errorEn(dlgMof, '');
    const d = mofCache.get(puesto.puestoId) || {};
    const base = d.borrador || d.vigente || {};
    document.getElementById('org-dlg-mof-t').textContent = `MOF · ${puesto.nombre}${d.borrador ? ` (borrador v${d.borrador.version})` : d.vigente ? ' (nueva versión)' : ''}`;
    document.getElementById('org-m-objetivo').value = base.objetivo || '';
    document.getElementById('org-m-funciones').value = base.funciones || '';
    document.getElementById('org-m-requisitos').value = base.requisitos || '';
    document.getElementById('org-m-competencias').value = base.competencias || '';
    document.getElementById('org-m-relaciones').value = base.relaciones || '';
    dlgMof.showModal();
    document.getElementById('org-m-objetivo').focus();
  }

  async function guardarMof() {
    const valor = id => document.getElementById(id).value;
    const r = await enviar('Mof', {
      puestoId: mofPuesto.puestoId,
      objetivo: valor('org-m-objetivo'),
      funciones: valor('org-m-funciones'),
      requisitos: valor('org-m-requisitos'),
      competencias: valor('org-m-competencias'),
      relaciones: valor('org-m-relaciones')
    }, document.getElementById('org-m-guardar'));
    if (!r.success) { errorEn(dlgMof, r.message); return; }
    dlgMof.close();
    await cargarMof(mofPuesto, true);
    aviso(r.message);
  }

  async function aprobarMof(puestoId, boton) {
    const r = await enviar('AprobarMof', { puestoId }, boton);
    if (!r.success) { aviso(r.message, 'error'); return; }
    await cargarMof(detalle.puestos.find(p => p.puestoId === puestoId), true);
    aviso(r.message);
  }

  document.getElementById('org-m-guardar')?.addEventListener('click', guardarMof);

  /* ---------- Unidades: crear, editar, mover, desactivar ---------- */
  const dlgUnidad = document.getElementById('org-dlg-unidad');
  let unidadEditando = null;

  /* Después de cambiar la estructura se rearma el árbol completo y se reabre la unidad. */
  async function recargarArbol(abrirId, mensaje) {
    const r = await erp.get('?handler=Arbol');
    if (!r?.success) return;
    datos = r.datos;
    tipos = new Map((datos.tipos || []).map(t => [t.tipoUnidadId, t]));
    unidades = new Map((datos.unidades || []).map(u => [u.unidadId, u]));
    armarHijos();
    ocultarSoloSuspendidos().forEach(id => unidades.delete(id));
    armarHijos();
    pintarSinUbicar();
    chart.data(nodos(calcularTotales()))
      .connections((datos.relaciones || []).map(x => ({ from: String(x.unidadOrigenId), to: String(x.unidadDestinoId), label: x.descripcion || x.tipo })))
      .render();
    if (abrirId && unidades.has(abrirId)) {
      chart.setCentered(String(abrirId)).render();
      await abrirUnidad(abrirId);
      if (mensaje) aviso(mensaje);
    } else {
      dlg.close();
    }
  }

  /* Opciones de "Depende de": todas las unidades con sangría, menos la propia y sus dependientes. */
  function opcionesPadre(excluir) {
    const fuera = new Set();
    if (excluir) {
      const marcar = id => { fuera.add(id); (hijos.get(id) || []).forEach(marcar); };
      marcar(excluir);
    }
    const lista = [{ valor: '', texto: 'Ninguna (raíz)' }];
    const recorrer = (padre, nivel) => (hijos.get(padre) || []).forEach(id => {
      if (fuera.has(id)) return;
      lista.push({ valor: id, texto: ' '.repeat(nivel) + unidades.get(id).nombre });
      recorrer(id, nivel + 1);
    });
    recorrer(null, 0);
    return lista;
  }

  function abrirUnidadForm(u, padre) {
    unidadEditando = u || null;
    errorEn(dlgUnidad, '');
    document.getElementById('org-dlg-unidad-t').textContent = u ? 'Editar unidad' : 'Nueva unidad bajo ' + padre.nombre;
    document.getElementById('org-u-nombre').value = u?.nombre || '';
    document.getElementById('org-u-siglas').value = u?.siglas || '';
    document.getElementById('org-u-descripcion').value = u?.descripcion || '';
    // Tipo sugerido para una nueva: el siguiente nivel permitido bajo el padre.
    const permitidos = new Set((datos.reglas || []).filter(x => padre && x.tipoPadreId === padre.tipoUnidadId).map(x => x.tipoHijoId));
    const sugerido = u?.tipoUnidadId ?? [...tipos.values()].filter(t => permitidos.has(t.tipoUnidadId)).sort((a, b) => a.nivel - b.nivel)[0]?.tipoUnidadId ?? '';
    llenarDropdown('org-u-tipo', [...tipos.values()].map(t => ({ valor: t.tipoUnidadId, texto: t.nombre + (padre && !permitidos.has(t.tipoUnidadId) ? ' (no permitido aquí)' : '') })), sugerido);
    llenarDropdown('org-u-padre', opcionesPadre(u?.unidadId), u ? (u.unidadPadreId ?? '') : padre.unidadId);
    llenarDropdown('org-u-empresa', [{ valor: '', texto: 'Corporativa (todas)' }].concat([...empresas.values()].map(e => ({ valor: e.empresaId, texto: `${e.empresaId} · ${e.nombre}` }))), u?.empresaId ?? '');
    document.getElementById('org-u-desactivar').hidden = !u;
    dlgUnidad.showModal();
    document.getElementById('org-u-nombre').focus();
  }

  async function guardarUnidad(activo = true) {
    const nombre = document.getElementById('org-u-nombre').value.trim();
    if (!nombre) { errorEn(dlgUnidad, 'Escribe el nombre de la unidad.'); return; }
    const tipo = Number(valorDropdown('org-u-tipo'));
    if (!tipo) { errorEn(dlgUnidad, 'Elige el tipo de unidad.'); return; }
    const padre = valorDropdown('org-u-padre');
    const r = await enviar('Unidad', {
      unidadId: unidadEditando?.unidadId ?? null,
      nombre,
      siglas: document.getElementById('org-u-siglas').value.trim() || null,
      tipoUnidadId: tipo,
      unidadPadreId: padre ? Number(padre) : null,
      empresaUnidad: valorDropdown('org-u-empresa') || null,
      descripcion: document.getElementById('org-u-descripcion').value.trim() || null,
      orden: unidadEditando?.orden ?? ((hijos.get(padre ? Number(padre) : null) || []).length + 1),
      activo
    }, document.getElementById(activo ? 'org-u-guardar' : 'org-u-desactivar'));
    if (!r.success) { errorEn(dlgUnidad, r.message); return; }
    dlgUnidad.close();
    await recargarArbol(activo ? r.datos?.id : null, r.message);
    if (!activo) mostrarAvisoPagina(r.message);
  }

  /* Aviso fuera de la ventana (cuando la unidad ya no existe para reabrirla). */
  function mostrarAvisoPagina(texto) {
    const n = document.getElementById('org-sin-ubicar');
    const previo = { hidden: n.hidden, texto: n.textContent, clase: n.className };
    n.className = 'note';
    n.textContent = texto;
    n.hidden = false;
    setTimeout(() => { n.className = previo.clase; n.textContent = previo.texto; n.hidden = previo.hidden; }, 6000);
  }

  /* ---------- Criterios de ubicación (GDS o centro de costo) ---------- */
  const dlgCriterio = document.getElementById('org-dlg-criterio');
  let gdsCatalogo = null;
  let gdsElegido = null;

  async function abrirCriterio() {
    errorEn(dlgCriterio, '');
    gdsElegido = null;
    dlgCriterio.querySelector('#org-c-gds').checked = true;
    tipoCriterio();
    document.getElementById('org-c-q').value = '';
    document.getElementById('org-c-cc-valor').value = '';
    llenarDropdown('org-c-empresa', [{ valor: '', texto: 'Todas las empresas' }].concat([...empresas.values()].map(e => ({ valor: e.empresaId, texto: `Solo ${e.empresaId} · ${e.nombre}` }))), detalle.unidad.empresaId ?? '');
    dlgCriterio.showModal();
    if (!gdsCatalogo) {
      document.getElementById('org-c-lista').innerHTML = '<div class="hint-text">Cargando GDS…</div>';
      const r = await erp.get('?handler=Gds');
      gdsCatalogo = r?.datos?.gds || [];
    }
    pintarGds();
    document.getElementById('org-c-q').focus();
  }

  function tipoCriterio() {
    const tipo = dlgCriterio.querySelector('[name=org-c-tipo]:checked').value;
    dlgCriterio.querySelectorAll('[data-org-c]').forEach(x => { x.hidden = x.dataset.orgC !== tipo; });
  }

  function pintarGds() {
    const q = norm(document.getElementById('org-c-q').value.trim());
    const lista = (gdsCatalogo || []).filter(g => !q || g.gds.includes(q) || norm(`${g.gerencia} ${g.departamento} ${g.seccion}`).includes(q)).slice(0, 60);
    document.getElementById('org-c-lista').innerHTML = lista.length
      ? lista.map(g => `<button type="button" class="org-cargo${gdsElegido?.gds === g.gds ? ' is-selected' : ''}" data-org-gds="${esc(g.gds)}">
          <span><span class="org-persona-cod">${esc(g.gds)}</span> ${esc(g.seccion || '')}
            <span class="hint-text" style="display:block">${esc(g.gerencia || '')} · ${esc(g.departamento || '')}${g.unidadNombre ? ' · en ' + esc(g.unidadNombre) : ''}</span></span>
          ${g.activo ? '' : '<span class="pill pill-danger">No activo</span>'}
        </button>`).join('')
      : '<div class="hint-text">Sin resultados.</div>';
  }

  dlgCriterio?.addEventListener('input', e => { if (e.target.id === 'org-c-q') pintarGds(); });
  dlgCriterio?.addEventListener('change', e => { if (e.target.name === 'org-c-tipo') tipoCriterio(); });
  dlgCriterio?.addEventListener('click', e => {
    const b = e.target.closest('[data-org-gds]');
    if (b) { gdsElegido = gdsCatalogo.find(g => g.gds === b.dataset.orgGds) || null; pintarGds(); return; }
    if (e.target.closest('#org-c-guardar')) guardarCriterio();
  });

  async function guardarCriterio() {
    const tipo = dlgCriterio.querySelector('[name=org-c-tipo]:checked').value;
    const body = { unidadId: detalle.unidad.unidadId, tipo, empresaCriterio: valorDropdown('org-c-empresa') || null };
    if (tipo === 'GDS') {
      if (!gdsElegido) { errorEn(dlgCriterio, 'Elige un GDS de la lista.'); return; }
      Object.assign(body, { gerenciaId: gdsElegido.gerenciaId, dptoId: gdsElegido.dptoId, seccId: gdsElegido.seccId });
    } else {
      const cc = document.getElementById('org-c-cc-valor').value.trim();
      if (!/^\d{15}$/.test(cc)) { errorEn(dlgCriterio, 'El centro de costo tiene 15 dígitos.'); return; }
      body.centroCosto = cc;
    }
    const r = await enviar('AgregarCriterio', body, document.getElementById('org-c-guardar'));
    if (!r.success) { errorEn(dlgCriterio, r.message); return; }
    dlgCriterio.close();
    gdsCatalogo = null;
    await recargarArbol(detalle.unidad.unidadId, r.message);
  }

  async function quitarCriterio(id, boton) {
    // Segundo clic para confirmar: el personal de ese criterio cambia de unidad.
    if (boton.dataset.confirmar !== '1') {
      boton.dataset.confirmar = '1';
      boton.innerHTML = '<i class="ri ri-check-line"></i>';
      boton.title = 'Clic otra vez para quitar';
      setTimeout(() => { if (boton.isConnected) { boton.dataset.confirmar = ''; boton.innerHTML = '<i class="ri ri-close-line"></i>'; } }, 4000);
      return;
    }
    const r = await enviar('QuitarCriterio', { criterioId: id }, boton);
    if (!r.success) { aviso(r.message, 'error'); return; }
    gdsCatalogo = null;
    await recargarArbol(detalle.unidad.unidadId, r.message);
  }

  if (dlgUnidad) {
    document.getElementById('org-u-guardar').addEventListener('click', () => guardarUnidad(true));
    const desactivarU = document.getElementById('org-u-desactivar');
    desactivarU.addEventListener('click', () => {
      if (desactivarU.dataset.confirmar !== '1') {
        desactivarU.dataset.confirmar = '1';
        desactivarU.innerHTML = '<i class="ri ri-error-warning-line"></i>Confirmar: desactivar';
        return;
      }
      guardarUnidad(false);
    });
    dlgUnidad.addEventListener('close', () => {
      desactivarU.dataset.confirmar = '';
      desactivarU.innerHTML = '<i class="ri ri-delete-bin-line"></i>Desactivar';
    });
  }

  if (dlgPuesto) {
    document.getElementById('org-p-guardar').addEventListener('click', () => guardarPuesto(true));
    // Desactivar pide un segundo clic: el puesto deja de verse y sus asignaciones dejan de contar.
    const desactivar = document.getElementById('org-p-desactivar');
    desactivar.addEventListener('click', () => {
      if (desactivar.dataset.confirmar !== '1') {
        desactivar.dataset.confirmar = '1';
        desactivar.innerHTML = '<i class="ri ri-error-warning-line"></i>Confirmar: desactivar';
        return;
      }
      guardarPuesto(false);
    });
    dlgPuesto.addEventListener('close', () => {
      desactivar.dataset.confirmar = '';
      desactivar.innerHTML = '<i class="ri ri-delete-bin-line"></i>Desactivar';
    });
  }

  /* ---------- Página ---------- */
  root.addEventListener('click', e => {
    const opt = e.target.closest('[data-org-filtro]');
    if (opt) {
      estado[opt.dataset.orgFiltro] = opt.dataset.value;
      redibujar();
      return;
    }
    const acc = e.target.closest('[data-org-accion]');
    if (acc && chart) {
      switch (acc.dataset.orgAccion) {
        case 'expandir': chart.expandAll().fit(); break;
        case 'contraer': contraer(); break;
        case 'acercar': chart.zoomIn(); break;
        case 'alejar': chart.zoomOut(); break;
        case 'ajustar': chart.fit(); break;
        case 'exportar': chart.exportImg({ full: true, scale: 2, backgroundColor: getComputedStyle(root).getPropertyValue('--bg').trim() || 'white' }); break;
      }
      return;
    }
    if (e.target.closest('[data-org-limpiar]')) {
      const q = document.getElementById('org-q');
      q.value = ''; buscar(''); q.focus();
    }
  });

  const q = document.getElementById('org-q');
  let espera = null;
  q.addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(() => buscar(q.value), 250); });
  q.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); siguiente(); } });

  window.addEventListener('resize', () => {
    if (!chart) return;
    chart.svgHeight($('#org-chart').clientHeight || 600).render();
  });

  function pintarSinUbicar() {
    const aviso = document.getElementById('org-sin-ubicar');
    const n = sumar(datos.sinUbicar);
    aviso.hidden = n === 0;
    aviso.textContent = `${n} persona${n === 1 ? '' : 's'} con un GDS que no corresponde a ninguna unidad. Revisa la carga de criterios del organigrama.`;
  }

  function pintarEmpresas() {
    const menu = $('#org-empresa .dropdown-menu');
    menu.insertAdjacentHTML('beforeend', [...empresas.values()].map(e =>
      `<button type="button" class="menu-item" data-value="${esc(e.empresaId)}" data-org-filtro="empresa">${esc(e.empresaId)} · ${esc(e.nombre)}<i class="ri ri-check-line"></i></button>`).join(''));
  }

  function armarHijos() {
    hijos = new Map();
    [...unidades.values()]
      .sort((a, b) => (a.orden - b.orden) || a.nombre.localeCompare(b.nombre))
      .forEach(u => {
        const p = u.unidadPadreId && unidades.has(u.unidadPadreId) ? u.unidadPadreId : null;
        if (!hijos.has(p)) hijos.set(p, []);
        hijos.get(p).push(u.unidadId);
      });
  }

  /* Ids de las unidades sin ningún trabajador activo en su rama pero con suspendidos: así no
     aparecen secciones que hoy solo guardan personal suspendido (Santa Inés, El Triunfo…).
     Las unidades sin nadie se siguen mostrando. Sin filtros de empresa ni vínculo. */
  function ocultarSoloSuspendidos() {
    const ocultas = new Set();
    const visitar = id => {
      const u = unidades.get(id);
      let activos = 0, suspendidos = 0;
      (u.conteos || []).forEach(c => { if (c.suspendido) suspendidos += c.cantidad; else activos += c.cantidad; });
      (hijos.get(id) || []).forEach(h => { const r = visitar(h); activos += r.activos; suspendidos += r.suspendidos; });
      if (activos === 0 && suspendidos > 0) ocultas.add(id);
      return { activos, suspendidos };
    };
    (hijos.get(null) || []).forEach(visitar);
    // Si se oculta una unidad, se ocultan también sus dependientes.
    let cambio = true;
    while (cambio) {
      cambio = false;
      unidades.forEach(u => { if (!ocultas.has(u.unidadId) && ocultas.has(u.unidadPadreId)) { ocultas.add(u.unidadId); cambio = true; } });
    }
    return ocultas;
  }

  async function cargar() {
    const aviso = document.getElementById('org-estado');
    try {
      const r = await erp.get('?handler=Arbol');
      if (!r?.success) throw new Error(r?.message || 'No se pudo cargar el organigrama.');
      datos = r.datos;
      tipos = new Map((datos.tipos || []).map(t => [t.tipoUnidadId, t]));
      unidades = new Map((datos.unidades || []).map(u => [u.unidadId, u]));
      empresas = new Map((datos.empresas || []).map(e => [e.empresaId, e]));
      armarHijos();
      // Unidades cuyo personal (con todo lo de abajo) está completo en Suspendidos: no se muestran.
      ocultarSoloSuspendidos().forEach(id => unidades.delete(id));
      armarHijos();

      if (!unidades.size) {
        aviso.innerHTML = '<div class="empty">Aún no hay unidades en el organigrama. Ejecuta la carga inicial (03_Carga_Inicial.sql) para crearlas desde las gerencias, departamentos y secciones.</div>';
        return;
      }
      aviso.hidden = true;
      pintarEmpresas();
      pintarSinUbicar();
      dibujar();
      chart.fit({ animate: false });
    } catch (e) {
      aviso.hidden = false;
      aviso.innerHTML = `<div class="note note-danger">${esc(e.message || 'No se pudo cargar el organigrama.')}</div>`;
    }
  }

  ['org-empresa', 'org-vinculo'].forEach(id => document.getElementById(id).addEventListener('click', e => {
    if (e.target.closest('[data-org-filtro]') && datos) setTimeout(pintarSinUbicar);
  }));

  cargar();
})();
