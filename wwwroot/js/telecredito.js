(function () {
  const root = document.getElementById('tc-page');
  if (!root || !window.erp) return;

  const tipos = { M: 'Mensualidad', L: 'Liquidación', ML: 'Mensualidad y liquidación' };
  let operaciones = [];
  let actual = null;
  let detalle = [];
  let totales = null;
  let quitar = new Set();
  let candidatos = [];
  let marcar = new Set();
  let carga = 0;

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const soles = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function fecha(iso) {
    if (!iso) return '—';
    const p = String(iso).slice(0, 10).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : '—';
  }

  function corta(iso) {
    return fecha(iso).slice(0, 5);
  }

  /* Sin boleta o liquidación calculada viene null y se muestra "—"; si existe, su neto aunque sea 0.00. */
  function monto(v) {
    return v === null || v === undefined
      ? '<span class="tc-sin" title="Todavía no calculado">—</span>'
      : soles.format(v);
  }

  const borrador = () => !!actual && actual.estado === 'B';
  const incluyeM = () => !!actual && (actual.tipoOperacion === 'M' || actual.tipoOperacion === 'ML');
  const incluyeL = () => !!actual && (actual.tipoOperacion === 'L' || actual.tipoOperacion === 'ML');

  function error(texto, lista) {
    const box = $('tc-error');
    box.hidden = !texto;
    box.innerHTML = texto
      ? esc(texto) + (lista && lista.length ? '<ul class="tc-lista">' + lista.map((e) => '<li>' + esc(e) + '</li>').join('') + '</ul>' : '')
      : '';
  }

  function avisos(lista) {
    const box = $('tc-avisos');
    box.hidden = !(lista && lista.length);
    box.innerHTML = box.hidden ? '' : '<ul class="tc-lista">' + lista.map((e) => '<li>' + esc(e) + '</li>').join('') + '</ul>';
  }

  /* Confirmación en un modal propio: el ERP no carga SweetAlert y confirm() es una alerta del navegador.
     Con fechaProceso: true resuelve la fecha ISO (yyyy-MM-dd) o null si cancela. */
  function confirmar(op) {
    const dlg = $('tc-confirma');
    $('tc-confirma-titulo').textContent = op.titulo;
    $('tc-confirma-icono').className = 'ri ' + (op.icono || 'ri-question-line');
    $('tc-confirma-texto').textContent = op.texto;
    const lista = $('tc-confirma-lista');
    const items = (op.lista || []).slice(0, 8);
    lista.hidden = !items.length;
    lista.innerHTML = items.map((n) => '<li>' + esc(n) + '</li>').join('') +
      ((op.lista || []).length > items.length ? '<li>y ' + (op.lista.length - items.length) + ' más</li>' : '');
    // Casilla opcional (por ejemplo, bloquear boletas al cerrar). Su valor se lee luego en $('tc-confirma-casilla').checked.
    $('tc-confirma-casilla-field').hidden = !op.casilla;
    if (op.casilla) {
      $('tc-confirma-casilla-texto').textContent = op.casilla.texto;
      $('tc-confirma-casilla').checked = !!op.casilla.marcada;
    }
    const campoFecha = $('tc-confirma-fecha-field');
    const inputFecha = $('tc-confirma-fecha');
    if (op.fechaProceso) {
      campoFecha.hidden = false;
      inputFecha.value = root.dataset.hoy || inputFecha.value;
    } else {
      campoFecha.hidden = true;
    }
    const ok = $('tc-confirma-ok');
    ok.textContent = op.boton || 'Aceptar';
    ok.className = 'btn ' + (op.peligro ? 'btn-danger' : 'btn-primary');
    return new Promise((resolve) => {
      let respuesta = op.fechaProceso ? null : false;
      const aceptar = () => {
        if (op.fechaProceso) {
          if (!inputFecha.value) {
            inputFecha.focus();
            return;
          }
          respuesta = inputFecha.value;
        } else {
          respuesta = true;
        }
        dlg.close();
      };
      ok.addEventListener('click', aceptar);
      dlg.addEventListener('close', () => {
        ok.removeEventListener('click', aceptar);
        resolve(respuesta);
      }, { once: true });
      dlg.showModal();
      if (op.fechaProceso) inputFecha.focus();
    });
  }

  /* Aviso emergente que se cierra solo; no bloquea la pantalla. */
  let avisoTimer = 0;
  function aviso(texto) {
    if (!texto) return;
    const t = $('tc-toast');
    $('tc-toast-texto').textContent = texto;
    t.hidden = false;
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => { t.hidden = true; }, 3500);
  }

  function rango(o) {
    return o.fechaDesde === o.fechaHasta
      ? 'Cese el ' + fecha(o.fechaDesde)
      : 'Cese del ' + corta(o.fechaDesde) + ' al ' + fecha(o.fechaHasta);
  }

  function estadoPill(o) {
    return o.estado === 'C'
      ? '<span class="pill pill-success">Cerrada</span>'
      : '<span class="pill pill-warning">Borrador</span>';
  }

  /* ---------- Operaciones ---------- */

  function pintarOperaciones() {
    const lista = $('tc-ops-lista');
    if (!operaciones.length) {
      lista.innerHTML = '<div class="dt-empty">No hay operaciones en este periodo.</div>';
      return;
    }
    lista.innerHTML = operaciones.map((o) => {
      const sel = actual && actual.operacionId === o.operacionId;
      return `<button type="button" class="tc-op${sel ? ' is-selected' : ''}" role="option" aria-selected="${sel}" data-op="${o.operacionId}">
        <span class="tc-op-top"><strong>Operación ${o.correlativo} · ${esc(rango(o))}</strong>${estadoPill(o)}</span>
        <span class="tc-op-tipo">${esc(tipos[o.tipoOperacion] || o.tipoOperacion)}</span>
        <span class="dt-muted">Registrada el ${fecha(o.fechaRegistro)}</span>
        <span class="dt-muted">${o.trabajadores} ${o.trabajadores === 1 ? 'trabajador' : 'trabajadores'}${o.observacion ? ' · ' + esc(o.observacion) : ''}</span>
      </button>`;
    }).join('');
  }

  async function cargarOperaciones() {
    const ticket = ++carga;
    const data = await erp.post('?handler=Listar', {
      anio: String($('tc-anio').value || ''),
      mes: $('tc-mes').value || null
    });
    if (ticket !== carga) return;
    if (!data || !data.success) {
      operaciones = [];
      pintarOperaciones();
      error((data && data.message) || 'No se pudieron cargar las operaciones.');
      return;
    }
    if (data.datos.empresa && data.datos.empresa.nombre)
      $('tc-empresa-nombre').textContent = data.datos.empresa.nombre;
    operaciones = data.datos.operaciones || [];
    pintarOperaciones();
  }

  async function abrir(id) {
    error('');
    const data = await erp.post('?handler=Obtener', { operacionId: id });
    if (!data || !data.success) {
      error((data && data.message) || 'No se pudo abrir la operación.');
      return;
    }
    aplicar(data.datos);
  }

  /* Vuelve a pedir la operación: en borrador el servidor recalcula montos y cuentas. */
  async function actualizarMontos() {
    if (!borrador()) return;
    const btn = $('tc-actualizar');
    btn.disabled = true;
    btn.querySelector('i').classList.add('tc-girando');
    error('');
    const data = await erp.post('?handler=Obtener', { operacionId: actual.operacionId });
    btn.querySelector('i').classList.remove('tc-girando');
    if (!data || !data.success) {
      btn.disabled = !borrador();
      error((data && data.message) || 'No se pudieron actualizar los montos.');
      return;
    }
    aplicar(data.datos);
    aviso('Montos actualizados.');
  }

  function aplicar(datos) {
    actual = datos.operacion;
    detalle = datos.detalle || [];
    totales = datos.totales || null;
    quitar = new Set();
    avisos(datos.avisos);
    const i = operaciones.findIndex((o) => o.operacionId === actual.operacionId);
    if (i >= 0) operaciones[i] = actual;
    pintarOperaciones();
    pintarDetalle();
  }

  /* ---------- Detalle ---------- */

  function pintarDetalle() {
    $('tc-sin-sel').hidden = !!actual;
    $('tc-det').hidden = !actual;
    if (!actual) return;

    $('tc-det-titulo').textContent = 'Operación ' + actual.correlativo + ' · ' + (tipos[actual.tipoOperacion] || actual.tipoOperacion);
    $('tc-det-sub').textContent = rango(actual) + ' · registrada el ' + fecha(actual.fechaRegistro) +
      (actual.estado === 'C' && actual.fecCierre ? ' · cerrada el ' + fecha(actual.fecCierre) + ' por ' + (actual.usrCierre || '') : '') +
      (actual.fecArchivo ? ' · archivos del ' + fecha(actual.fecArchivo) : '');
    $('tc-det-estado').innerHTML = estadoPill(actual);

    const editable = borrador();
    $('tc-agregar').disabled = !editable;
    const esM = actual.tipoOperacion === 'M';
    $('tc-cargar').querySelector('span').textContent = esM ? 'Cargar pendientes del mes' : 'Cargar cesados del rango';
    $('tc-cargar').title = esM
      ? 'Carga a todos los que trabajaron en el mes y aún no cobran su mensualidad, incluidos los que cesaron sin operación propia. Excluye a los ya liquidados.'
      : 'Carga a todos los que cesan en el rango de la operación, menos los que ya están en otra operación.';
    $('tc-cargar').disabled = !editable;
    $('tc-quitar').disabled = !editable || quitar.size === 0;
    $('tc-actualizar').disabled = !editable || detalle.length === 0;
    $('tc-cerrar').disabled = !editable || detalle.length === 0 || !actual.fecArchivo;
    $('tc-cerrar').title = editable && !actual.fecArchivo ? 'Primero genere los archivos.' : '';
    $('tc-generar').hidden = !editable;
    $('tc-generar').disabled = !editable || detalle.length === 0;
    $('tc-excel').disabled = !actual.fecArchivo;
    $('tc-eliminar').disabled = !editable;
    $('tc-correo').disabled = detalle.length === 0;

    const cols = [];
    const head = [];
    if (editable) {
      cols.push('28px');
      const todos = detalle.length > 0 && detalle.every((d) => quitar.has(d.trabId));
      const alguno = detalle.some((d) => quitar.has(d.trabId));
      head.push('<button type="button" class="tc-check-todos" id="tc-quitar-todos" title="Marcar o desmarcar a todos para quitar"' + (detalle.length ? '' : ' disabled') +
        '><i class="ri ri-' + (todos ? 'checkbox-line' : (alguno ? 'checkbox-indeterminate-line' : 'checkbox-blank-line')) + '"></i></button>');
    }
    cols.push('3.75rem', 'minmax(8rem, 1fr)', '8.25rem', '5.25rem');
    head.push('<span>Código</span>', '<span>Trabajador</span>', '<span>Cuenta</span>', '<span>Cese</span>');
    if (incluyeM()) { cols.push('5.75rem'); head.push('<span class="tc-num">Mensualidad</span>'); }
    if (incluyeL()) { cols.push('5.75rem'); head.push('<span class="tc-num">Liquidación</span>'); }
    $('tc-table').style.setProperty('--dt-cols', cols.join(' '));
    $('tc-table-head').innerHTML = head.join('');

    const body = $('tc-body');
    if (!detalle.length) {
      body.innerHTML = '<div class="dt-empty">' + (editable
        ? 'Agregue los trabajadores uno a uno con el buscador.'
        : 'La operación no tiene trabajadores.') + '</div>';
    } else {
      body.innerHTML = detalle.map((d) => {
        const id = esc(d.trabId);
        const sel = quitar.has(d.trabId);
        const celdas = [];
        if (editable) celdas.push(`<span class="pl-check"><i class="ri ri-checkbox-${sel ? '' : 'blank-'}line"></i></span>`);
        celdas.push(`<span class="dt-code">${id}</span>`,
          `<span class="tc-trab"><span class="dt-desc">${esc(d.nombre)}</span><span class="dt-muted">DNI ${esc(d.dni || '—')}</span></span>`,
          d.cuenta ? `<span class="dt-muted tc-cuenta">${esc(d.cuenta)}</span>` : '<span><span class="pill pill-warning">Sin cuenta</span></span>',
          `<span class="dt-muted">${fecha(d.fechaCese)}</span>`);
        if (incluyeM()) celdas.push(`<span class="tc-num">${monto(d.montoMensualidad)}</span>`);
        if (incluyeL()) celdas.push(`<span class="tc-num">${monto(d.montoLiquidacion)}</span>`);
        return editable
          ? `<button type="button" class="dt-row tc-row${sel ? ' is-selected' : ''}${d.cuenta ? '' : ' tc-sin-cuenta'}" data-trab="${id}" aria-pressed="${sel}">${celdas.join('')}</button>`
          : `<div class="dt-row tc-row${d.cuenta ? '' : ' tc-sin-cuenta'}">${celdas.join('')}</div>`;
      }).join('');
    }

    const n = detalle.length;
    const sinCuenta = detalle.filter((d) => !d.cuenta).length;
    $('tc-conteo').innerHTML = esc(n + (n === 1 ? ' trabajador' : ' trabajadores') + (quitar.size ? ' · ' + quitar.size + ' marcado(s)' : '')) +
      (sinCuenta ? ' · <span class="tc-falta">' + sinCuenta + ' sin cuenta</span>' : '');
    // Totales del procedimiento: lo que se deposita (montos > 0).
    const t = totales || {};
    const partes = [];
    if (incluyeM()) partes.push('Mensualidad S/ ' + soles.format(t.totalMensualidad || 0) + ' (' + (t.cantidadMensualidad || 0) + ')');
    if (incluyeL()) partes.push('Liquidación S/ ' + soles.format(t.totalLiquidacion || 0) + ' (' + (t.cantidadLiquidacion || 0) + ')');
    if (incluyeM() && incluyeL()) partes.push('Total S/ ' + soles.format(t.total || 0));
    $('tc-total').textContent = partes.join(' · ');
    $('tc-total').title = editable ? 'Montos al momento; se fijan al cerrar la operación.' : 'Montos fijados al cerrar.';
  }

  /* ---------- Crear ---------- */

  function elegirMes(mes) {
    const dd = $('tc-mes-dd');
    $('tc-mes').value = mes;
    dd.querySelectorAll('[data-value]').forEach((o) => {
      const sel = o.getAttribute('data-value') === mes;
      o.classList.toggle('is-selected', sel);
      if (sel) dd.querySelector('[data-dropdown-label]').textContent = o.textContent.trim();
    });
  }

  function modoRango() {
    return root.querySelector('input[name="tc-modo"]:checked')?.value === 'rango';
  }

  function pintarModo() {
    const r = modoRango();
    $('tc-hasta-field').hidden = !r;
    $('tc-desde-label').textContent = r ? 'Desde' : 'Día';
  }

  function abrirCrear() {
    const hoy = root.dataset.hoy;
    $('tc-desde').value = hoy;
    $('tc-hasta').value = hoy;
    $('tc-obs').value = '';
    $('tc-crear-error').hidden = true;
    pintarModo();
    $('tc-crear').showModal();
  }

  async function crear() {
    const tipo = root.querySelector('input[name="tc-tipo"]:checked')?.value || 'ML';
    const desde = $('tc-desde').value;
    const hasta = modoRango() ? $('tc-hasta').value : desde;
    const falla = (t) => { $('tc-crear-error').textContent = t; $('tc-crear-error').hidden = false; };
    if (!desde || !hasta) return falla('Complete las fechas.');
    if (hasta < desde) return falla('La fecha final no puede ser anterior a la inicial.');
    if (desde.slice(0, 7) !== hasta.slice(0, 7)) return falla('El rango debe quedar dentro de un mismo mes.');

    $('tc-crear-ok').disabled = true;
    const data = await erp.post('?handler=Crear', {
      tipoOperacion: tipo, fechaDesde: desde, fechaHasta: hasta, observacion: $('tc-obs').value
    });
    $('tc-crear-ok').disabled = false;
    if (!data || !data.success) return falla((data && data.message) || 'No se pudo crear la operación.');

    $('tc-crear').close();
    const op = data.datos.operacion;
    $('tc-anio').value = op.anio;
    if ($('tc-mes').value && $('tc-mes').value !== op.mes) elegirMes(op.mes);
    await cargarOperaciones();
    await abrir(op.operacionId);
  }

  /* ---------- Buscar y agregar ---------- */

  function soloSugeridos() {
    return root.querySelector('input[name="tc-busca-filtro"]:checked')?.value === 'sug';
  }

  /* Candidatos que se ven con el filtro y la búsqueda actuales. */
  function candidatosVisibles() {
    const q = $('tc-busca-q').value.trim().toLowerCase();
    const sug = soloSugeridos();
    return candidatos.filter((c) => {
      if (sug && !c.sugerido) return false;
      if (!q) return true;
      return [c.trabId, c.nombre, c.dni].some((v) => String(v || '').toLowerCase().includes(q));
    });
  }

  /* Ícono de la casilla de encabezado: vacía, parcial o completa. */
  function iconoTodos(boton, total, marcados) {
    boton.disabled = total === 0;
    boton.querySelector('i').className = 'ri ri-' + (marcados === 0 ? 'checkbox-blank-line' : (marcados === total ? 'checkbox-line' : 'checkbox-indeterminate-line'));
  }

  function pintarBusqueda() {
    const sug = soloSugeridos();
    const rows = candidatosVisibles();
    const body = $('tc-busca-body');
    if (!rows.length) {
      body.innerHTML = '<div class="dt-empty">' + (sug
        ? 'Nadie cesa en el rango de la operación. Elija "Todos" para buscar a cualquier trabajador del periodo.'
        : 'Sin resultados.') + '</div>';
    } else {
      body.innerHTML = rows.map((c) => {
        const bloqueado = c.enOperacion || !!c.ocupado;
        const sel = marcar.has(c.trabId);
        const estado = c.enOperacion
          ? '<span class="pill">En la lista</span>'
          : c.ocupado
            ? `<span class="pill pill-danger" title="${esc(c.ocupado)}">En otra operación</span>`
            : c.sugerido ? '<span class="pill pill-info">Cesa en el rango</span>' : '';
        return `<button type="button" class="dt-row${sel ? ' is-selected' : ''}" data-trab="${esc(c.trabId)}" ${bloqueado ? 'disabled' : ''} title="${esc(c.ocupado || '')}">
          <span class="pl-check"><i class="ri ri-checkbox-${sel ? '' : 'blank-'}line"></i></span>
          <span class="dt-code">${esc(c.trabId)}</span>
          <span class="dt-desc">${esc(c.nombre)}</span>
          <span class="dt-muted">${esc(c.dni || '—')}</span>
          <span class="dt-muted">${fecha(c.fechaCese)}</span>
          <span>${estado}</span>
        </button>`;
      }).join('');
    }
    const elegibles = rows.filter((c) => !c.enOperacion && !c.ocupado);
    iconoTodos($('tc-busca-todos-chk'), elegibles.length, elegibles.filter((c) => marcar.has(c.trabId)).length);
    $('tc-busca-add').disabled = marcar.size === 0;
    $('tc-busca-conteo').textContent = marcar.size ? marcar.size + ' marcado(s)' : '';
  }

  async function abrirBusqueda() {
    if (!borrador()) return;
    marcar = new Set();
    candidatos = [];
    $('tc-busca-error').hidden = true;
    $('tc-busca-q').value = '';
    $('tc-busca-body').innerHTML = '<div class="dt-empty">Cargando trabajadores del periodo.</div>';
    $('tc-busca').showModal();
    const data = await erp.post('?handler=Candidatos', { operacionId: actual.operacionId });
    if (!data || !data.success) {
      $('tc-busca-body').innerHTML = '<div class="dt-empty">' + esc((data && data.message) || 'No se pudo cargar la lista.') + '</div>';
      return;
    }
    candidatos = data.datos.candidatos || [];
    if (!candidatos.some((c) => c.sugerido)) $('tc-busca-todos').checked = true;
    pintarBusqueda();
    $('tc-busca-q').focus();
  }

  async function agregar() {
    if (!marcar.size) return;
    $('tc-busca-add').disabled = true;
    const data = await erp.post('?handler=Agregar', { operacionId: actual.operacionId, trabIds: [...marcar] });
    $('tc-busca-add').disabled = false;
    const box = $('tc-busca-error');
    if (!data || !data.success) {
      const errores = (data && data.errores) || [];
      box.innerHTML = esc((data && data.message) || 'No se pudo agregar.') +
        (errores.length ? '<ul class="tc-lista">' + errores.map((e) => '<li>' + esc(e) + '</li>').join('') + '</ul>' : '');
      box.hidden = false;
      return;
    }
    box.hidden = true;
    $('tc-busca').close();
    aplicar(data.datos);
  }

  /* ---------- Acciones ---------- */

  async function accion(handler, extra) {
    error('');
    const data = await erp.post('?handler=' + handler, Object.assign({ operacionId: actual.operacionId }, extra || {}));
    if (!data || !data.success) {
      error((data && data.message) || 'No se pudo completar la acción.', data && data.errores);
      return null;
    }
    return data;
  }

  async function cargarActivos() {
    const data = await accion('CargarMensualidad');
    if (!data) return;
    aplicar(data.datos);
    aviso(data.message);
  }

  function nombreOperacion(o) {
    return 'Operación ' + o.correlativo + ' · ' + (tipos[o.tipoOperacion] || o.tipoOperacion) + ' · ' + rango(o).toLowerCase();
  }

  async function quitarMarcados() {
    if (!quitar.size) return;
    const nombres = detalle.filter((d) => quitar.has(d.trabId)).map((d) => d.nombre);
    const ok = await confirmar({
      titulo: 'Quitar de la lista',
      icono: 'ri-user-unfollow-line',
      texto: (nombres.length === 1 ? 'Se quitará 1 trabajador' : 'Se quitarán ' + nombres.length + ' trabajadores') +
        ' de la ' + nombreOperacion(actual) + '. La operación se conserva con el resto de la lista.',
      lista: nombres,
      boton: 'Quitar de la lista'
    });
    if (!ok) return;
    const data = await accion('Quitar', { trabIds: [...quitar] });
    if (!data) return;
    aplicar(data.datos);
  }

  async function cerrar() {
    const conMensualidad = actual.tipoOperacion === 'M' || actual.tipoOperacion === 'ML';
    const ok = await confirmar({
      titulo: 'Cerrar operación',
      icono: 'ri-lock-line',
      texto: 'Se cerrará la ' + nombreOperacion(actual) + ' con los archivos generados el ' + fecha(actual.fecArchivo) +
        '. Antes se comprueba que los montos y cuentas sigan iguales; si algo cambió, habrá que volver a generarlos. ' +
        'Después no se podrá editar la lista ni volver a generar los archivos: solo descargarlos.',
      casilla: {
        texto: 'Bloquear las boletas de ' + actual.mes + '/' + actual.anio + ' de los ' + detalle.length +
          ' trabajadores de la lista (ProcesoPlanilla y MovimientoPlanillaCabecera).',
        marcada: conMensualidad
      },
      boton: 'Cerrar operación'
    });
    if (!ok) return;
    const bloquearBoletas = $('tc-confirma-casilla').checked;
    const data = await accion('Cerrar', { bloquearBoletas });
    if (!data) return;
    aplicar(data.datos);
    aviso(data.message);
  }

  function descargar(archivo) {
    const bin = atob(archivo.contenidoBase64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: /\.xls$/i.test(archivo.nombre) ? 'application/vnd.ms-excel' : 'application/octet-stream' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = archivo.nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* Descarga lo guardado en la operación, tal como quedó. No genera nada. */
  async function excel() {
    $('tc-excel').disabled = true;
    const data = await accion('Archivos');
    pintarDetalle();
    if (!data) return;
    (data.datos.archivos || []).forEach(descargar);
  }

  /* Solo en borrador: arma los archivos con los montos del momento y los guarda. No descarga. */
  async function generar() {
    if (!borrador()) return;
    // Sin cuenta no hay abono: se avisa antes y se ofrece marcarlos para quitarlos de la lista.
    const sinCuenta = detalle.filter((d) => !d.cuenta);
    if (sinCuenta.length) {
      const marcarlos = await confirmar({
        titulo: 'Trabajadores sin cuenta bancaria',
        icono: 'ri-error-warning-line',
        texto: 'No se pueden generar los archivos: ' + (sinCuenta.length === 1 ? 'este trabajador no tiene' : 'estos ' + sinCuenta.length + ' trabajadores no tienen') +
          ' cuenta bancaria. Quítelos de la lista (o registre su cuenta y pulse «Actualizar montos») y vuelva a generar.',
        lista: sinCuenta.map((d) => d.trabId + ' · ' + d.nombre),
        boton: sinCuenta.length === 1 ? 'Marcarlo para quitar' : 'Marcarlos para quitar'
      });
      if (marcarlos) {
        quitar = new Set(sinCuenta.map((d) => d.trabId));
        pintarDetalle();
        aviso((sinCuenta.length === 1 ? '1 trabajador marcado' : sinCuenta.length + ' trabajadores marcados') + '. Revise y pulse «Quitar de la lista».');
      }
      return;
    }
    const fechaProceso = await confirmar({
      titulo: actual.fecArchivo ? 'Generar y reemplazar' : 'Generar archivos',
      icono: 'ri-file-excel-2-line',
      texto: actual.fecArchivo
        ? 'Ya hay archivos guardados del ' + fecha(actual.fecArchivo) + '. Se reemplazarán por unos nuevos con los montos de este momento.'
        : 'Se armarán los archivos del banco con los montos actuales y se guardarán en la operación.',
      boton: actual.fecArchivo ? 'Generar y reemplazar' : 'Generar archivos',
      fechaProceso: true
    });
    if (!fechaProceso) return;
    $('tc-generar').disabled = true;
    const data = await accion('Generar', { fechaProceso });
    if (!data) { pintarDetalle(); return; }
    await abrir(actual.operacionId);
    aviso(data.message + ' Use «Descargar archivos» para bajarlos.');
  }

  async function eliminar() {
    const n = detalle.length;
    const ok = await confirmar({
      titulo: 'Eliminar toda la operación',
      icono: 'ri-delete-bin-line',
      texto: 'Se eliminará la ' + nombreOperacion(actual) + ' completa' +
        (n ? ', junto con su lista de ' + n + (n === 1 ? ' trabajador' : ' trabajadores') : '') + '. ' +
        'Los trabajadores no se borran del sistema; solo deja de existir esta operación. ' +
        'Si solo quiere sacar a algunos trabajadores, use «Quitar de la lista».',
      boton: 'Eliminar operación',
      peligro: true
    });
    if (!ok) return;
    const data = await accion('Eliminar');
    if (!data) return;
    aviso(data.message);
    actual = null;
    detalle = [];
    avisos([]);
    pintarDetalle();
    await cargarOperaciones();
  }

  /* ---------- Correo ---------- */

  const mesesCorreo = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];

  function partesFecha(iso) {
    const p = String(iso).slice(0, 10).split('-');
    return { anio: p[0], mes: Number(p[1]), dia: p[2] };
  }

  /* "el 09 de octubre de 2026" o "del 03 al 06 de octubre de 2026". */
  function textoCese(desde, hasta) {
    const d = partesFecha(desde), h = partesFecha(hasta);
    const cola = ' de ' + mesesCorreo[h.mes - 1] + ' de ' + h.anio;
    return d.dia === h.dia && d.mes === h.mes ? 'el ' + d.dia + cola : 'del ' + d.dia + ' al ' + h.dia + cola;
  }

  const cruzaMensualidad = (t) => t === 'M' || t === 'ML';
  const cruzaLiquidacion = (t) => t === 'L' || t === 'ML';

  /* Operaciones anteriores del mismo periodo que pagan lo mismo y cuyo cese se cruza: esta es un adicional. */
  function esAdicional(op, delPeriodo) {
    return delPeriodo.some((o) => o.operacionId !== op.operacionId && o.correlativo < op.correlativo &&
      (op.tipoOperacion === 'M'
        ? o.tipoOperacion === 'M'
        : cruzaLiquidacion(o.tipoOperacion) &&
          o.fechaDesde.slice(0, 10) <= op.fechaHasta.slice(0, 10) && o.fechaHasta.slice(0, 10) >= op.fechaDesde.slice(0, 10)));
  }

  /* Para la mensualidad de fin de mes: rango de cese de los ya liquidados en el periodo. */
  function rangoLiquidados(op, delPeriodo) {
    const liq = delPeriodo.filter((o) => o.operacionId !== op.operacionId && cruzaLiquidacion(o.tipoOperacion));
    if (!liq.length) return null;
    const desde = liq.map((o) => o.fechaDesde.slice(0, 10)).sort()[0];
    const hasta = liq.map((o) => o.fechaHasta.slice(0, 10)).sort().pop();
    return textoCese(desde, hasta);
  }

  function nombresEmpresa() {
    const largo = ($('tc-empresa-nombre').textContent || '').trim().replace(/^EMPRESA\s+/i, '');
    const corto = largo.replace(/\s*S\.?A\.?C\.?$/i, '').trim();
    return { largo, corto: corto.toUpperCase() };
  }

  function armarCorreo(op, filas, delPeriodo) {
    const emp = nombresEmpresa();
    const color = (getComputedStyle(root).getPropertyValue('--planilla-brand') || '#0067c0').trim() || '#0067c0';
    const conM = cruzaMensualidad(op.tipoOperacion) && filas.some((d) => d.montoMensualidad > 0);
    const conL = cruzaLiquidacion(op.tipoOperacion) && filas.some((d) => d.montoLiquidacion > 0);
    const n = filas.length;
    const uno = n === 1;
    const adicional = esAdicional(op, delPeriodo);
    const hora = new Date().getHours();
    const saludo = hora < 12 ? 'Buenos días,' : (hora < 19 ? 'Buenas tardes,' : 'Buenas noches,');
    const archivos = conM && conL ? 'los archivos' : 'el archivo';
    let asunto, parrafo, nota = '';

    if (op.tipoOperacion === 'M') {
      const f = partesFecha(op.fechaHasta);
      const periodo = mesesCorreo[f.mes - 1] + ' de ' + f.anio;
      const excluye = rangoLiquidados(op, delPeriodo);
      asunto = emp.corto + ' - ARCHIVO PARA PAGO DE MENSUALIDAD' + (adicional ? ' ADICIONAL' : '') + ' DE ' +
        mesesCorreo[f.mes - 1].toUpperCase() + ' ' + f.anio + ' VÍA TELECRÉDITO BCP';
      parrafo = 'Alcanzo ' + archivos + ' para el pago de haberes correspondiente a <b>' + periodo + '</b> de la empresa <b>' +
        esc(emp.largo) + '</b> vía Telecrédito BCP' +
        (excluye ? ', <b>excluyendo a los trabajadores liquidados ' + excluye + '</b>.' : '.');
      if (adicional) nota = 'La presente remesa complementa el archivo de haberes remitido previamente para el mismo periodo.';
    } else {
      const pagos = conM && conL ? 'mensualidad y liquidación' : (conL ? 'liquidación' : 'mensualidad');
      const cese = textoCese(op.fechaDesde, op.fechaHasta);
      const trab = uno ? 'trabajador' : 'trabajadores';
      const liq = uno ? 'liquidado' : 'liquidados';
      asunto = emp.corto + ' - ARCHIVO PARA PAGO DE ' + pagos.toUpperCase() + ' DE ' + trab.toUpperCase() +
        (adicional ? ' ADICIONAL' + (uno ? '' : 'ES') : '') + ' ' + liq.toUpperCase() + ' ' + cese.toUpperCase() + ' VÍA TELECRÉDITO BCP';
      const quien = adicional
        ? (uno ? 'de un trabajador <b>adicional</b>' : 'de ' + n + ' trabajadores <b>adicionales</b>')
        : (uno ? 'del trabajador' : 'de los ' + n + ' trabajadores');
      const ceseHtml = cese.replace(/^(el |del )/, (m) => m + '<b>') + '</b>';
      parrafo = 'Alcanzo ' + archivos + ' para el pago de ' + pagos + ' ' + quien + ' ' + liq + ' ' + ceseHtml +
        ' de la empresa <b>' + esc(emp.largo) + '</b>, vía Telecrédito BCP.';
      if (adicional) nota = 'La presente remesa complementa ' + (conM && conL ? 'los archivos de mensualidad y liquidaciones' : (conL ? 'el archivo de liquidaciones' : 'el archivo de haberes')) +
        (conM && conL ? ' remitidos' : ' remitido') + ' previamente para ' + (op.fechaDesde.slice(0, 10) === op.fechaHasta.slice(0, 10) ? 'la misma fecha.' : 'el mismo periodo.');
    }

    /* Tabla de detalle. Para una mensualidad grande basta el resumen. */
    const th = 'style="background:' + color + ';color:#ffffff;padding:6px 10px;border:1px solid ' + color + ';font-weight:bold;text-align:left;"';
    const thNum = th.replace('text-align:left', 'text-align:right');
    const td = 'style="padding:5px 10px;border:1px solid #d0d7de;"';
    const tdNum = 'style="padding:5px 10px;border:1px solid #d0d7de;text-align:right;white-space:nowrap;"';
    const tfoot = 'style="padding:6px 10px;border:1px solid #d0d7de;background:#f3f4f6;font-weight:bold;text-align:right;white-space:nowrap;"';
    const colM = cruzaMensualidad(op.tipoOperacion);
    const colL = cruzaLiquidacion(op.tipoOperacion);
    const m = (v) => soles.format(v > 0 ? v : 0);
    const totM = filas.reduce((s, d) => s + (d.montoMensualidad > 0 ? d.montoMensualidad : 0), 0);
    const totL = filas.reduce((s, d) => s + (d.montoLiquidacion > 0 ? d.montoLiquidacion : 0), 0);
    let tabla;
    if (op.tipoOperacion === 'M' && n > 30) {
      tabla = '<table style="border-collapse:collapse;font-family:Calibri,Arial,sans-serif;font-size:10.5pt;">' +
        '<tr><th ' + th + '>Trabajadores</th><th ' + thNum + '>Monto total (S/)</th></tr>' +
        '<tr><td ' + td + '>' + n + '</td><td ' + tdNum + '><b>' + soles.format(totM) + '</b></td></tr></table>';
    } else {
      const cab = ['N°', 'Código', 'Trabajador', 'DNI', 'Cese'].map((t) => '<th ' + th + '>' + t + '</th>').join('') +
        (colM ? '<th ' + thNum + '>Mensualidad (S/)</th>' : '') + (colL ? '<th ' + thNum + '>Liquidación (S/)</th>' : '') +
        (colM && colL ? '<th ' + thNum + '>Total (S/)</th>' : '');
      const cuerpo = filas.map((d, i) => '<tr>' +
        '<td ' + td + '>' + (i + 1) + '</td><td ' + td + '>' + esc(d.trabId) + '</td><td ' + td + '>' + esc(d.nombre) + '</td>' +
        '<td ' + td + '>' + esc(d.dni || '') + '</td><td ' + td + '>' + fecha(d.fechaCese) + '</td>' +
        (colM ? '<td ' + tdNum + '>' + m(d.montoMensualidad) + '</td>' : '') +
        (colL ? '<td ' + tdNum + '>' + m(d.montoLiquidacion) + '</td>' : '') +
        (colM && colL ? '<td ' + tdNum + '><b>' + soles.format((d.montoMensualidad > 0 ? d.montoMensualidad : 0) + (d.montoLiquidacion > 0 ? d.montoLiquidacion : 0)) + '</b></td>' : '') +
        '</tr>').join('');
      const pie = '<tr><td colspan="5" ' + tfoot + '>Total (' + n + (uno ? ' trabajador' : ' trabajadores') + ')</td>' +
        (colM ? '<td ' + tfoot + '>' + soles.format(totM) + '</td>' : '') +
        (colL ? '<td ' + tfoot + '>' + soles.format(totL) + '</td>' : '') +
        (colM && colL ? '<td ' + tfoot + '>' + soles.format(totM + totL) + '</td>' : '') + '</tr>';
      tabla = '<table style="border-collapse:collapse;font-family:Calibri,Arial,sans-serif;font-size:10.5pt;">' +
        '<tr>' + cab + '</tr>' + cuerpo + pie + '</table>';
    }

    const sinM = colM && !conM, sinL = colL && !conL;
    const noVa = sinM || sinL
      ? '<p style="margin:12px 0 0 0;font-family:Calibri,Arial,sans-serif;font-size:10.5pt;color:#9a6700;"><b>Nota:</b> no se adjunta el archivo de ' +
        (sinM ? 'mensualidad' : 'liquidación') + ' porque ' + (uno ? 'el trabajador no tiene monto' : 'ningún trabajador tiene monto') +
        ' de ' + (sinM ? 'mensualidad' : 'liquidación') + ' a pagar (S/ 0.00).</p>'
      : '';
    const p = 'style="margin:0 0 12px 0;font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#1f2328;"';
    const cuerpo = '<div style="font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#1f2328;">' +
      '<p ' + p + '>' + saludo + '</p>' +
      '<p ' + p + '>' + parrafo + (nota ? ' ' + nota : '') + '</p>' +
      '<p ' + p + '>Detalle ' + (op.tipoOperacion === 'M' && n > 30 ? 'de la planilla' : (uno ? 'del trabajador' : 'de los trabajadores')) + ':</p>' +
      tabla + noVa +
      '<p ' + p.replace('margin:0 0 12px 0', 'margin:16px 0 0 0') + '>Atentamente.</p></div>';
    return { asunto, cuerpo };
  }

  async function abrirCorreo() {
    if (!actual) return;
    const filas = detalle.filter((d) =>
      (cruzaMensualidad(actual.tipoOperacion) && d.montoMensualidad > 0) ||
      (cruzaLiquidacion(actual.tipoOperacion) && d.montoLiquidacion > 0));
    if (!filas.length) {
      error('No hay montos mayores a cero para armar el correo. Actualice los montos primero.');
      return;
    }
    const data = await erp.post('?handler=Listar', { anio: actual.anio, mes: actual.mes });
    const delPeriodo = (data && data.success && data.datos.operaciones) || [];
    const correo = armarCorreo(actual, filas, delPeriodo);
    $('tc-correo-asunto').value = correo.asunto;
    $('tc-correo-cuerpo').innerHTML = correo.cuerpo;
    $('tc-correo-dlg').showModal();
  }

  async function copiarAsunto() {
    const t = $('tc-correo-asunto').value;
    try { await navigator.clipboard.writeText(t); } catch { $('tc-correo-asunto').select(); document.execCommand('copy'); }
    aviso('Asunto copiado.');
  }

  /* Copia como HTML para que Outlook conserve negritas, colores y la tabla. */
  async function copiarCuerpo() {
    const el = $('tc-correo-cuerpo');
    try {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([el.innerHTML], { type: 'text/html' }),
        'text/plain': new Blob([el.innerText], { type: 'text/plain' })
      })]);
    } catch {
      const r = document.createRange();
      r.selectNodeContents(el);
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
      document.execCommand('copy');
      s.removeAllRanges();
    }
    aviso('Cuerpo copiado. Péguelo en el correo.');
  }

  /* ---------- Eventos ---------- */

  let anioTimer = 0;
  $('tc-anio').addEventListener('input', () => {
    clearTimeout(anioTimer);
    anioTimer = setTimeout(cargarOperaciones, 400);
  });
  $('tc-mes-dd').addEventListener('click', (ev) => {
    const opt = ev.target.closest('[data-value]');
    if (!opt) return;
    $('tc-mes').value = opt.getAttribute('data-value') || '';
    cargarOperaciones();
  });
  $('tc-ops-lista').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-op]');
    if (b) abrir(Number(b.dataset.op));
  });
  $('tc-body').addEventListener('click', (ev) => {
    const row = ev.target.closest('[data-trab]');
    if (!row || !borrador()) return;
    const id = row.dataset.trab;
    if (quitar.has(id)) quitar.delete(id); else quitar.add(id);
    pintarDetalle();
  });

  $('tc-nueva').addEventListener('click', abrirCrear);
  root.querySelectorAll('input[name="tc-modo"]').forEach((r) => r.addEventListener('change', pintarModo));
  $('tc-desde').addEventListener('change', () => {
    if (!modoRango() || $('tc-hasta').value < $('tc-desde').value) $('tc-hasta').value = $('tc-desde').value;
  });
  $('tc-crear-ok').addEventListener('click', crear);

  $('tc-agregar').addEventListener('click', abrirBusqueda);
  $('tc-busca-q').addEventListener('input', pintarBusqueda);
  root.querySelectorAll('input[name="tc-busca-filtro"]').forEach((r) => r.addEventListener('change', pintarBusqueda));
  $('tc-busca-body').addEventListener('click', (ev) => {
    const row = ev.target.closest('[data-trab]');
    if (!row || row.disabled) return;
    const id = row.dataset.trab;
    if (marcar.has(id)) marcar.delete(id); else marcar.add(id);
    pintarBusqueda();
  });
  $('tc-busca-todos-chk').addEventListener('click', () => {
    const elegibles = candidatosVisibles().filter((c) => !c.enOperacion && !c.ocupado);
    const todos = elegibles.length > 0 && elegibles.every((c) => marcar.has(c.trabId));
    elegibles.forEach((c) => (todos ? marcar.delete(c.trabId) : marcar.add(c.trabId)));
    pintarBusqueda();
  });
  $('tc-table-head').addEventListener('click', (ev) => {
    if (!ev.target.closest('#tc-quitar-todos') || !borrador()) return;
    const todos = detalle.length > 0 && detalle.every((d) => quitar.has(d.trabId));
    quitar = todos ? new Set() : new Set(detalle.map((d) => d.trabId));
    pintarDetalle();
  });
  $('tc-busca-add').addEventListener('click', agregar);

  $('tc-cargar').addEventListener('click', cargarActivos);
  $('tc-quitar').addEventListener('click', quitarMarcados);
  $('tc-actualizar').addEventListener('click', actualizarMontos);
  $('tc-cerrar').addEventListener('click', cerrar);
  $('tc-generar').addEventListener('click', generar);
  $('tc-excel').addEventListener('click', excel);
  $('tc-eliminar').addEventListener('click', eliminar);
  $('tc-correo').addEventListener('click', abrirCorreo);
  $('tc-correo-copiar-asunto').addEventListener('click', copiarAsunto);
  $('tc-correo-copiar-cuerpo').addEventListener('click', copiarCuerpo);

  pintarDetalle();
  cargarOperaciones();
})();
