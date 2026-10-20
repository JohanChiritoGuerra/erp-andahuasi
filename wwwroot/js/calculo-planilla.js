(function () {
  const root = document.getElementById('pl-calc');
  if (!root || !window.erp) return;

  const hub = root.dataset.hub === '1';
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const empresas = {
    '02': { nombre: 'Andahuasi', motor: false },
    '05': { nombre: 'San Nicolás', motor: true },
    '06': { nombre: 'Andahuasi KM 41.5', motor: true }
  };
  let catalogo = [];
  let elegidos = [];
  let secciones = [];
  let menuTrab = '';
  let marcar = new Set();
  let carga = 0;

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const idDe = (t) => String(t.trabId || '').trim();

  function forma() {
    return root.querySelector('input[name="pl-forma"]:checked')?.value || 'Todos';
  }

  function empresaDestino() {
    return root.querySelector('input[name="pl-empresa"]:checked')?.value || root.dataset.empresa || '02';
  }

  function motorDe(id) {
    return !!(empresas[id] && empresas[id].motor);
  }

  function error(texto) {
    const box = $('pl-error');
    box.hidden = !texto;
    box.textContent = texto || '';
  }

  function cerrarMenu() {
    $('pl-menu').hidden = true;
    menuTrab = '';
  }

  function estadoHtml(t) {
    if (t.bloqueado) return '<span class="pill pill-danger">Bloqueada</span>';
    if (t.procesadoExitoso) return '<span class="pill pill-success">Procesada</span>';
    return '<span class="pill pill-warning">Pendiente</span>';
  }

  function estadoTexto(t) {
    if (t.bloqueado) return 'Bloqueada';
    if (t.procesadoExitoso) return 'Procesada';
    return 'Pendiente';
  }

  function listaVisible() {
    const f = forma();
    if (f === 'PorTrabajador') return elegidos.slice();
    const seccion = $('pl-seccion').value.trim();
    if (f === 'PorSeccion' && seccion)
      return catalogo.filter((t) => String(t.seccionId || '').trim() === seccion);
    return catalogo.slice();
  }

  function textoSeccion(id, nombre) {
    const codigo = String(id || '').trim();
    const desc = String(nombre || '').trim();
    if (!codigo) return '—';
    return desc ? codigo + ' · ' + desc : codigo;
  }

  function seccionPorId(id) {
    return secciones.find((s) => s.id === id);
  }

  function pintarSecciones() {
    const menu = $('pl-seccion-menu');
    const actual = $('pl-seccion').value;
    menu.innerHTML = secciones.map((s) =>
      `<button type="button" class="menu-item${s.id === actual ? ' is-selected' : ''}" data-value="${esc(s.id)}">${esc(textoSeccion(s.id, s.nombre))}<i class="ri ri-check-line"></i></button>`
    ).join('');
    const label = root.querySelector('#pl-seccion-dd [data-dropdown-label]');
    if (secciones.length && !actual) {
      $('pl-seccion').value = secciones[0].id;
      menu.querySelector('[data-value]')?.classList.add('is-selected');
      if (label) label.textContent = textoSeccion(secciones[0].id, secciones[0].nombre);
    } else if (label) {
      const s = seccionPorId(actual);
      label.textContent = s ? textoSeccion(s.id, s.nombre) : (actual || 'Sección');
    }
  }

  function pintar() {
    const f = forma();
    const manual = f === 'PorTrabajador';
    $('pl-seccion-field').hidden = f !== 'PorSeccion';
    $('pl-abrir-busqueda').hidden = !manual;
    const table = $('pl-table');
    table.classList.toggle('is-manual', manual);
    root.querySelector('.pl-col-quitar').hidden = !manual;

    const rows = listaVisible();
    const body = $('pl-body');
    if (!rows.length) {
      body.innerHTML = '<div class="dt-empty">' + (manual
        ? 'Añada trabajadores con el buscador.'
        : 'No hay trabajadores en este alcance.') + '</div>';
    } else {
      body.innerHTML = rows.map((t) => {
        const id = idDe(t);
        const quitar = manual
          ? `<button type="button" class="icon-btn" data-quitar="${esc(id)}" aria-label="Quitar de la lista"><i class="ri ri-close-line"></i></button>`
          : '';
        return `<div class="dt-row" data-trab="${esc(id)}">
          <span class="dt-code">${esc(id)}</span>
          <span class="dt-desc">${esc(t.nombre)}</span>
          <span class="dt-muted">${esc(textoSeccion(t.seccionId, t.seccionNombre))}</span>
          <span>${estadoHtml(t)}</span>
          ${manual ? '<span class="pl-quitar">' + quitar + '</span>' : ''}
        </div>`;
      }).join('');
    }
    const n = rows.length;
    $('pl-conteo').textContent = n + (n === 1 ? ' trabajador' : ' trabajadores');
    const todasOk = rows.length > 0 && rows.every((t) => t.procesadoExitoso || t.bloqueado);
    const hayPorBloquear = rows.some((t) => t.procesadoExitoso && !t.bloqueado);
    $('pl-bloquear-lote').disabled = !(todasOk && hayPorBloquear);
    $('pl-cerrar-planilla').disabled = !(forma() === 'Todos' && todasOk);
  }

  function pintarBusqueda() {
    const q = $('pl-busca-q').value.trim().toLowerCase();
    const puestos = new Set(elegidos.map(idDe));
    const rows = catalogo.filter((t) => {
      if (!q) return true;
      return idDe(t).toLowerCase().includes(q) || String(t.nombre || '').toLowerCase().includes(q);
    });
    $('pl-busca-clear').hidden = !q;
    const body = $('pl-busca-body');
    if (!rows.length) {
      body.innerHTML = '<div class="dt-empty">No hay trabajadores con ese criterio.</div>';
      return;
    }
    body.innerHTML = rows.map((t) => {
      const id = idDe(t);
      const ya = puestos.has(id);
      const on = marcar.has(id) ? ' is-selected' : '';
      return `<button type="button" class="dt-row${on}" data-marca="${esc(id)}" ${ya ? 'disabled' : ''}>
        <span class="pl-check">${ya ? '' : '<i class="ri ri-check-line"></i>'}</span>
        <span class="dt-code">${esc(id)}</span>
        <span class="dt-desc">${esc(t.nombre)}</span>
        <span class="dt-muted">${ya ? 'En la lista' : esc(textoSeccion(t.seccionId, t.seccionNombre))}</span>
      </button>`;
    }).join('');
  }

  function abrirBusqueda() {
    marcar = new Set();
    $('pl-busca-q').value = '';
    pintarBusqueda();
    $('pl-busca').showModal();
    $('pl-busca-q').focus();
  }

  async function cargar() {
    const ticket = ++carga;
    error('');
    $('pl-body').innerHTML = '<div class="dt-empty">Cargando trabajadores del periodo.</div>';
    const data = await erp.post('?handler=Previsualizar', {
      empresaCalculoId: empresaDestino(),
      anio: String($('pl-anio').value || ''),
      mes: $('pl-mes').value,
      forma: 'Todos'
    });
    if (ticket !== carga) return;
    if (!data || !data.success) {
      catalogo = [];
      secciones = [];
      pintarSecciones();
      pintar();
      error((data && data.message) || 'No se pudo cargar el periodo.');
      return;
    }
    catalogo = data.trabajadores || [];
    secciones = data.secciones || [];
    elegidos = elegidos
      .map((t) => catalogo.find((c) => idDe(c) === idDe(t)))
      .filter((t) => !!t);
    if ($('pl-seccion').value && !seccionPorId($('pl-seccion').value))
      $('pl-seccion').value = '';
    pintarSecciones();
    pintar();
  }

  function aplicarEmpresa() {
    const id = empresaDestino();
    const info = empresas[id] || empresas['02'];
    root.dataset.empresa = id;
    const marca = root.querySelector('.pl-marca');
    const nombre = root.querySelector('.pl-empresa-nombre');
    if (marca) marca.textContent = id;
    if (nombre) nombre.textContent = info.nombre;
    $('pl-calcular').disabled = !info.motor;
    $('pl-individual').disabled = !info.motor;
    elegidos = [];
    cargar();
  }

  function trabDe(id) {
    return catalogo.find((t) => idDe(t) === id) || elegidos.find((t) => idDe(t) === id);
  }

  let bloqueoIds = [];

  function pedirBloqueo(ids, texto) {
    bloqueoIds = ids.slice();
    $('pl-bloqueo-texto').textContent = texto;
    $('pl-confirma-bloqueo').showModal();
  }

  function mostrarDetalle(id) {
    const t = trabDe(id);
    if (!t || !t.observacion) return;
    $('pl-boleta-titulo').textContent = 'Detalle del error';
    $('pl-boleta-icono').className = 'ri ri-error-warning-line';
    $('pl-boleta-texto').textContent = idDe(t) + ' · ' + (t.nombre || '') + '. ' + t.observacion;
    $('pl-boleta').showModal();
  }

  async function visualizarBoleta(id) {
    const body = $('pl-visor-body');
    body.innerHTML = '<p class="pl-bol-vacio">Cargando la boleta.</p>';
    $('pl-visor').showModal();
    const data = await erp.post('?handler=Boleta', {
      empresaCalculoId: empresaDestino(),
      anio: String($('pl-anio').value || ''),
      mes: $('pl-mes').value,
      trabId: id
    });
    if (!data || !data.success || !data.boleta) {
      body.innerHTML = '<p class="pl-bol-vacio">' + esc((data && data.message) || 'No hay boleta calculada para este trabajador.') + '</p>' +
        '<footer class="pl-bol-foot"><span></span><div class="pl-bol-acciones"><button type="button" class="btn btn-primary" data-modal-close>Cerrar</button></div></footer>';
      return;
    }
    body.innerHTML = htmlBoleta(data.boleta, id);
    body.querySelectorAll('[data-bol-print]').forEach((btn) => btn.addEventListener('click', imprimirBoleta));
  }

  function numBol(s) {
    let t = String(s ?? '').trim().replace(/[^\d,.-]/g, '');
    if (!t) return 0;
    const coma = t.lastIndexOf(',');
    const punto = t.lastIndexOf('.');
    if (coma > punto) t = t.replace(/\./g, '').replace(',', '.');
    else t = t.replace(/,/g, '');
    const n = Number(t);
    return Number.isFinite(n) ? n : 0;
  }

  function fmtBol(n) {
    const v = Math.round((Number(n) || 0) * 100) / 100;
    const neg = v < 0 ? '-' : '';
    const partes = Math.abs(v).toFixed(2).split('.');
    return neg + partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + partes[1];
  }

  function fechaCorta(s) {
    return String(s || '').replace(/\s+\d{1,2}:\d{2}:\d{2}(\s*[ap]\.?\s*m\.?)?/i, '').trim();
  }

  function tituloNombre(s) {
    const t = String(s || '').trim();
    if (!t) return '—';
    if (t !== t.toUpperCase()) return t;
    return t.toLowerCase().replace(/(^|[\s,.'’-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
  }

  function solesEnLetras(n) {
    const u = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'];
    const d = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    function trozo(x) {
      if (x < 21) return u[x];
      if (x < 30) return 'veinti' + u[x - 20];
      if (x < 100) return d[Math.floor(x / 10)] + (x % 10 ? ' y ' + u[x % 10] : '');
      const c = Math.floor(x / 100);
      const r = x % 100;
      const cien = ['', c === 1 ? (r ? 'ciento' : 'cien') : '', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'][c];
      return cien + (r ? ' ' + trozo(r) : '');
    }
    function letras(x) {
      if (x === 0) return 'cero';
      if (x >= 1000000) {
        const m = Math.floor(x / 1000000);
        return (m === 1 ? 'un millón' : letras(m) + ' millones') + (x % 1000000 ? ' ' + letras(x % 1000000) : '');
      }
      if (x >= 1000) {
        const m = Math.floor(x / 1000);
        return (m === 1 ? 'mil' : letras(m) + ' mil') + (x % 1000 ? ' ' + trozo(x % 1000) : '');
      }
      return trozo(x);
    }
    const v = Math.abs(Number(n) || 0);
    const entero = Math.floor(v + 1e-8);
    const cents = Math.round((v - entero) * 100);
    return 'Son: ' + letras(entero).toUpperCase() + ' CON ' + String(cents).padStart(2, '0') + '/100 SOLES';
  }

  function htmlBoleta(b, id) {
    const horas = {};
    (b.horas || []).forEach((h) => { horas[h.etiqueta] = h.valor; });
    const caja = (etq, key, texto) => {
      const raw = String(horas[key] ?? '').trim();
      const n = numBol(raw);
      const esTexto = !!texto;
      const vacio = !raw || raw === '0' || raw === '0.00' || raw === '0.0';
      const vis = esTexto ? (vacio ? '—' : raw) : fmtBol(n);
      const gris = esTexto ? vacio : Math.abs(n) < 0.0005;
      return '<div class="pl-bol-caja"><span>' + esc(etq) + '</span><strong class="' + (gris ? 'is-cero' : '') + '">' + esc(vis) + '</strong></div>';
    };
    const grupo = (titulo, celdas) =>
      '<div class="pl-bol-linea"><span>' + titulo + '</span><div class="pl-bol-cajas">' + celdas + '</div></div>';
    const dato = (etq, val, cero) =>
      '<div class="pl-bol-dato"><span>' + esc(etq) + '</span><strong class="' + (cero ? 'is-cero' : '') + '">' + esc(val || '—') + '</strong></div>';
    const lineasDe = (campo, monto) => (b.conceptos || [])
      .map((c) => ({ nombre: String(c[campo] || '').trim(), monto: c[monto] }))
      .filter((c) => c.nombre);
    const ingresos = lineasDe('ganancia', 'montoGanancia');
    const descuentos = lineasDe('descuento', 'montoDescuento');
    const suma = (lista) => lista.reduce((a, c) => a + numBol(c.monto), 0);
    const movs = (lista) => lista.map((c) =>
      '<div class="pl-bol-mov"><span>' + esc(c.nombre) + '</span><b>' + esc(fmtBol(numBol(c.monto))) + '</b></div>'
    ).join('') || '<div class="pl-bol-mov"><span class="is-cero">—</span><b></b></div>';
    const sub = (lista) => '<div class="pl-bol-sub"><span>SUBTOTAL</span><b>' + esc(fmtBol(suma(lista))) + '</b></div>';
    const aporte = numBol(b.aporteEmpleador);
    const neto = b.neto ? numBol(b.neto) : suma(ingresos) - suma(descuentos);
    let nombre = String(b.trabajador || '').trim();
    if (id && nombre.indexOf(id) === 0) nombre = nombre.slice(id.length).replace(/^[\s\-·]+/, '');
    const regimen = [b.regimen, 'CUSPP ' + (b.cuspp || '—')].filter(Boolean).join(' · ');
    const basico = b.basico ? (/s\//i.test(b.basico) ? b.basico : 'S/ ' + fmtBol(numBol(b.basico))) : '—';
    const trab = trabDe(id);
    const estado = trab && trab.procesadoExitoso ? 'Procesada' : 'Sin procesar';
    return '<article class="pl-bol" id="pl-bol">' +
      '<header class="pl-bol-top">' +
        '<div class="pl-bol-marca">' + esc(empresaDestino()) + '</div>' +
        '<div class="pl-bol-emp"><strong>' + esc(b.nombreEmpresa) + '</strong><span>' + esc(b.direccionEmpresa) + '</span></div>' +
        '<div class="pl-bol-doc"><strong>BOLETA DE PAGO</strong><span>Periodo ' + esc(nombrePeriodo()) + '</span></div>' +
        '<button type="button" class="pl-bol-x" data-modal-close aria-label="Cerrar"><i class="ri ri-close-line"></i></button>' +
      '</header>' +
      '<h2 class="pl-bol-secbar">DATOS DEL TRABAJADOR</h2>' +
      '<div class="pl-bol-trab">' +
        '<div class="pl-bol-foto"><i class="ri ri-user-line"></i>Foto</div>' +
        '<div class="pl-bol-facts">' +
          dato('Apellidos y nombres', tituloNombre(nombre)) +
          dato('Código', id) +
          dato('DNI', b.dni) +
          dato('Ocupación', tituloNombre(b.ocupacion)) +
          dato('Sección', tituloNombre(b.seccion)) +
          dato('Categoría', b.categoria) +
          dato('Fecha de ingreso', fechaCorta(b.fechaIngreso)) +
          dato('Fecha de cese', fechaCorta(b.fechaCese), !b.fechaCese || b.fechaCese === '—') +
          dato('Básico', basico) +
          dato('Régimen pensionario', regimen) +
          dato('Carné EsSalud', b.esSalud, !b.esSalud || b.esSalud === '—') +
          dato('Dirección', tituloNombre(b.direccion)) +
        '</div>' +
      '</div>' +
      '<h2 class="pl-bol-secbar">DATOS DEL PERIODO<span>Valores en cero en gris</span></h2>' +
      '<div class="pl-bol-periodo">' +
        grupo('Horas', caja('Hr. Norm', 'HN') + caja('HR 1.00', 'H100') + caja('HR 1.25', 'H125') + caja('HR 1.35', 'H135') + caja('HR 2.00', 'H200') + caja('HE', 'HE')) +
        grupo('Días', caja('Sub.', 'Sub') + caja('Vac.', 'Vac') + caja('Enf.', 'Enf') + caja('Sus.', 'Sus') + caja('Per.', 'Per') + caja('Fal.', 'Fal') + caja('Lic.', 'Lic') + caja('Mat.', 'Mat') + caja('Ing.', 'Ing') + caja('Ces.', 'Ces')) +
        '<div class="pl-bol-linea pl-bol-linea-2"><span>Producción</span><div class="pl-bol-cajas">' +
          caja('TonCa', 'TonCa') + caja('Ter.Se', 'TerSe') + caja('Sie.Se', 'SieSe') + caja('Ton.Cb', 'TonCb') +
          '</div><span>Vacaciones</span><div class="pl-bol-cajas">' +
          caja('Sal. Vac.', 'SalVac', true) + caja('Ing. Vac.', 'IngVac', true) + caja('Periodo', 'PeriodoVac', true) +
          '</div></div>' +
      '</div>' +
      '<div class="pl-bol-cols">' +
        '<section class="pl-bol-col"><h3><span>INGRESOS</span><span>S/</span></h3>' + movs(ingresos) + sub(ingresos) + '</section>' +
        '<section class="pl-bol-col"><h3><span>DESCUENTOS</span><span>S/</span></h3>' + movs(descuentos) + sub(descuentos) + '</section>' +
        '<section class="pl-bol-col"><h3><span>APORTES EMPLEADOR</span><span>S/</span></h3>' +
          '<div class="pl-bol-mov"><span>Cuota empleador (EsSalud 9%)</span><b>' + esc(fmtBol(aporte)) + '</b></div>' +
          '<p class="pl-bol-nota">Informativo: no afecta el neto a pagar.</p>' +
          '<div class="pl-bol-sub"><span>SUBTOTAL</span><b>' + esc(fmtBol(aporte)) + '</b></div>' +
        '</section>' +
      '</div>' +
      '<div class="pl-bol-totales">' +
        '<div class="pl-bol-total"><span>TOTAL INGRESOS (BRUTO)</span><strong>S/ ' + esc(fmtBol(suma(ingresos))) + '</strong></div>' +
        '<div class="pl-bol-total"><span>TOTAL DESCUENTOS</span><strong>S/ ' + esc(fmtBol(suma(descuentos))) + '</strong></div>' +
        '<div class="pl-bol-total is-neto"><span>NETO A PAGAR</span><strong>S/ ' + esc(fmtBol(neto)) + '</strong></div>' +
      '</div>' +
      '<p class="pl-bol-letras">' + esc(solesEnLetras(neto)) + '</p>' +
      '<footer class="pl-bol-foot">' +
        '<span class="pl-bol-estado"><i class="ri ri-checkbox-circle-line"></i>' + esc(estado) + '</span>' +
        '<div class="pl-bol-acciones">' +
          '<button type="button" class="btn" data-bol-print><i class="ri ri-printer-line"></i> Imprimir</button>' +
          '<button type="button" class="btn" data-bol-print><i class="ri ri-download-2-line"></i> Descargar PDF</button>' +
          '<button type="button" class="btn btn-primary" data-modal-close>Cerrar</button>' +
        '</div>' +
      '</footer>' +
      '</article>';
  }

  function imprimirBoleta() {
    const art = document.getElementById('pl-bol');
    if (!art) return;
    const brand = getComputedStyle(root).getPropertyValue('--planilla-brand').trim() || '#0067c0';
    const hoja = document.createElement('iframe');
    hoja.setAttribute('title', 'Boleta de pago');
    hoja.style.position = 'fixed';
    hoja.style.left = '-1200px';
    hoja.style.top = '0';
    hoja.style.width = '980px';
    hoja.style.height = '800px';
    hoja.style.border = '0';
    document.body.appendChild(hoja);
    const doc = hoja.contentDocument;
    doc.open();
    doc.write('<!DOCTYPE html><html><head><title>Boleta de pago ' + esc(nombrePeriodo()) + '</title>' +
      '<style>' + estiloBoleta(brand) + '</style></head><body>' + art.outerHTML + '</body></html>');
    doc.close();
    const marco = hoja.contentWindow;
    const limpiar = () => hoja.remove();
    marco.addEventListener('afterprint', limpiar);
    setTimeout(() => { marco.focus(); marco.print(); }, 150);
  }

  function estiloBoleta(brand) {
    return 'body{margin:0;font-family:"IBM Plex Sans",sans-serif;color:#1c2421}' +
      '.pl-bol-x,.pl-bol-acciones{display:none}' +
      '.pl-bol-top{display:flex;align-items:center;gap:12px;padding:14px 16px;background:' + brand + ';color:#fff}' +
      '.pl-bol-marca{display:grid;place-items:center;width:46px;height:46px;border:1px solid rgba(255,255,255,.75);font-weight:700}' +
      '.pl-bol-emp{flex:1}.pl-bol-emp strong{font-size:16px;text-transform:uppercase}.pl-bol-emp span{font-size:11px}' +
      '.pl-bol-doc{text-align:right}.pl-bol-doc strong{display:block;font-size:16px}.pl-bol-doc span{display:inline-block;margin-top:4px;padding:2px 8px;border-radius:10px;background:rgba(255,255,255,.18)}' +
      '.pl-bol-secbar{display:flex;justify-content:space-between;margin:0;padding:6px 16px;background:' + brand + '22;color:' + brand + ';font-size:11px;letter-spacing:.06em}' +
      '.pl-bol-trab{display:grid;grid-template-columns:72px 1fr;gap:8px 16px;padding:12px 16px}' +
      '.pl-bol-foto{display:flex;flex-direction:column;align-items:center;justify-content:center;height:72px;border:1px solid #e5e7eb;color:#9ca3af;font-size:11px}' +
      '.pl-bol-facts{display:grid;grid-template-columns:1.3fr repeat(4,minmax(0,1fr));gap:10px 12px}' +
      '.pl-bol-dato span,.pl-bol-caja span,.pl-bol-total span{display:block;font-size:10px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#6b7280}' +
      '.pl-bol-dato strong{font-size:12.5px}.is-cero{color:#9ca3af;font-weight:500}' +
      '.pl-bol-periodo{padding:8px 16px 12px}.pl-bol-linea{display:grid;grid-template-columns:72px 1fr;gap:8px;margin-top:6px}' +
      '.pl-bol-cajas{display:grid;grid-template-columns:repeat(auto-fit,minmax(52px,1fr));border:1px solid #e5e7eb}' +
      '.pl-bol-caja{padding:4px 6px;border-right:1px solid #e5e7eb;text-align:center}' +
      '.pl-bol-cols{display:grid;grid-template-columns:1.15fr 1.15fr .9fr;gap:10px;padding:0 16px 12px}' +
      '.pl-bol-col{border:1px solid #e5e7eb;display:flex;flex-direction:column;min-height:160px}' +
      '.pl-bol-col h3{display:flex;justify-content:space-between;margin:0;padding:6px 8px;background:' + brand + ';color:#fff;font-size:11px}' +
      '.pl-bol-mov{display:flex;justify-content:space-between;padding:4px 8px;font-size:12px}' +
      '.pl-bol-nota{margin:4px 8px;color:#6b7280;font-size:11px;font-style:italic}' +
      '.pl-bol-sub{display:flex;justify-content:space-between;margin-top:auto;padding:6px 8px;border-top:2px solid ' + brand + ';color:' + brand + ';font-weight:700}' +
      '.pl-bol-totales{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:0 16px}' +
      '.pl-bol-total{padding:8px 10px;border:1px solid #e5e7eb}.pl-bol-total strong{font-size:16px}' +
      '.pl-bol-total.is-neto{background:' + brand + ';color:#fff}.pl-bol-total.is-neto span{color:#fff}' +
      '.pl-bol-letras{margin:8px 16px 0;padding:6px 8px;border:1px solid #d1d5db}' +
      '.pl-bol-foot{padding:12px 16px}.pl-bol-estado{color:' + brand + '}';
  }

  root.querySelectorAll('input[name="pl-forma"]').forEach((el) => el.addEventListener('change', () => {
    cerrarMenu();
    pintar();
    if (forma() === 'PorTrabajador') abrirBusqueda();
  }));

  if (hub) {
    root.querySelectorAll('input[name="pl-empresa"]').forEach((el) => {
      el.addEventListener('change', aplicarEmpresa);
    });
  }

  let anioTimer = 0;
  $('pl-anio').addEventListener('change', cargar);
  $('pl-anio').addEventListener('input', () => {
    clearTimeout(anioTimer);
    anioTimer = setTimeout(cargar, 400);
  });
  $('pl-mes-dd').addEventListener('click', (ev) => {
    const opt = ev.target.closest('[data-value]');
    if (!opt) return;
    $('pl-mes').value = opt.getAttribute('data-value') || '';
    cargar();
  });
  $('pl-seccion-dd').addEventListener('click', (ev) => {
    if (ev.target.closest('[data-value]')) pintar();
  });

  $('pl-abrir-busqueda').addEventListener('click', abrirBusqueda);
  $('pl-busca-q').addEventListener('input', pintarBusqueda);
  $('pl-busca-clear').addEventListener('click', () => {
    $('pl-busca-q').value = '';
    pintarBusqueda();
  });
  $('pl-busca-body').addEventListener('click', (ev) => {
    const row = ev.target.closest('[data-marca]');
    if (!row || row.disabled) return;
    const id = row.dataset.marca;
    if (marcar.has(id)) marcar.delete(id);
    else marcar.add(id);
    pintarBusqueda();
  });
  $('pl-busca-add').addEventListener('click', () => {
    const puestos = new Set(elegidos.map(idDe));
    catalogo.forEach((t) => {
      const id = idDe(t);
      if (marcar.has(id) && !puestos.has(id)) elegidos.push(t);
    });
    $('pl-busca').close();
    pintar();
  });

  $('pl-body').addEventListener('click', (ev) => {
    const quitar = ev.target.closest('[data-quitar]');
    if (!quitar || forma() !== 'PorTrabajador') return;
    elegidos = elegidos.filter((t) => idDe(t) !== quitar.dataset.quitar);
    pintar();
  });
  $('pl-body').addEventListener('contextmenu', (ev) => {
    const row = ev.target.closest('[data-trab]');
    if (!row) return;
    ev.preventDefault();
    menuTrab = row.dataset.trab || '';
    const trab = trabDe(menuTrab);
    $('pl-menu-detalle').hidden = !(trab && trab.observacion);
    const menu = $('pl-menu');
    menu.hidden = false;
    const rect = menu.getBoundingClientRect();
    const x = Math.min(ev.clientX, window.innerWidth - rect.width - 8);
    const y = Math.min(ev.clientY, window.innerHeight - rect.height - 8);
    menu.style.left = Math.max(8, x) + 'px';
    menu.style.top = Math.max(8, y) + 'px';
  });
  $('pl-menu').addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-accion]');
    if (!btn) return;
    const id = menuTrab;
    const accion = btn.dataset.accion;
    cerrarMenu();
    if (accion === 'bloquear') {
      const t = trabDe(id);
      if (!t || t.bloqueado || !t.procesadoExitoso) {
        error(t && t.bloqueado ? 'La boleta ya está bloqueada.' : 'Solo se bloquea una boleta procesada.');
        return;
      }
      pedirBloqueo([id], '¿Bloquear la boleta de ' + idDe(t) + ' ' + (t.nombre || '') + '? No se volverá a calcular en este periodo.');
      return;
    }
    if (accion === 'ver') { visualizarBoleta(id); return; }
    if (accion === 'detalle') mostrarDetalle(id);
  });
  document.addEventListener('pointerdown', (ev) => {
    if (!ev.target.closest('#pl-menu')) cerrarMenu();
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') cerrarMenu();
  });

  $('pl-bloquear-lote').addEventListener('click', () => {
    const rows = listaVisible();
    const todasOk = rows.length > 0 && rows.every((t) => t.procesadoExitoso || t.bloqueado);
    const porBloquear = rows.filter((t) => t.procesadoExitoso && !t.bloqueado);
    if (!todasOk || !porBloquear.length) return;
    pedirBloqueo(porBloquear.map(idDe), '¿Bloquear las ' + porBloquear.length + ' boletas de la lista? Todas están procesadas y no se volverán a calcular en este periodo.');
  });

  $('pl-bloqueo-ok').addEventListener('click', async () => {
    const ids = bloqueoIds.slice();
    $('pl-confirma-bloqueo').close();
    if (!ids.length) return;
    const data = await erp.post('?handler=Bloquear', {
      empresaCalculoId: empresaDestino(),
      anio: String($('pl-anio').value || ''),
      mes: $('pl-mes').value,
      trabIds: ids
    });
    if (!data || !data.success) {
      error((data && data.message) || 'No se pudo bloquear la boleta.');
      return;
    }
    error('');
    cargar();
  });

  $('pl-cerrar-planilla').addEventListener('click', () => {
    const rows = listaVisible();
    const todasOk = rows.length > 0 && rows.every((t) => t.procesadoExitoso || t.bloqueado);
    if (forma() !== 'Todos' || !todasOk) return;
    const dd = $('pl-cierre-dd');
    dd.classList.remove('is-open');
    dd.querySelector('.dropdown-menu').hidden = true;
    $('pl-boleta-titulo').textContent = 'Cerrar planilla';
    $('pl-boleta-icono').className = 'ri ri-calendar-check-line';
    $('pl-boleta-texto').textContent = 'Se cerraría ' + nombrePeriodo() + ' para toda la planilla (' + rows.length + ' boletas procesadas). El cierre del mes todavía no se escribe en la base.';
    $('pl-boleta').dataset.lote = '';
    $('pl-boleta').showModal();
  });

  function nombrePeriodo() {
    const m = Number($('pl-mes').value);
    return (meses[m - 1] || $('pl-mes').value) + ' ' + $('pl-anio').value;
  }

  $('pl-calcular').addEventListener('click', () => {
    if (!motorDe(empresaDestino())) return;
    error('');
    const f = forma();
    const rows = listaVisible().filter((t) => !t.bloqueado);
    if (f === 'PorSeccion' && !$('pl-seccion').value) {
      error('Elija una sección.');
      return;
    }
    if (f === 'PorTrabajador' && !elegidos.length) {
      error('Añada al menos un trabajador.');
      return;
    }
    if (!rows.length) {
      error('No hay boletas libres para calcular con este alcance.');
      return;
    }
    const cierre = root.querySelector('input[name="pl-cierre"]:checked')?.value === '1' ? 'definitivo' : 'de reproceso';
    $('pl-confirma-texto').textContent = 'Se calcularán ' + rows.length + ' boleta(s) de ' + nombrePeriodo() + ' en modo ' + cierre + '. Las bloqueadas quedan igual.';
    $('pl-confirma').showModal();
  });

  $('pl-confirma-ok').addEventListener('click', async () => {
    $('pl-confirma').close();
    const espera = $('pl-espera');
    espera.showModal();
    $('pl-calcular').disabled = true;
    const f = forma();
    const data = await erp.post('?handler=Ejecutar', {
      empresaCalculoId: empresaDestino(),
      anio: String($('pl-anio').value || ''),
      mes: $('pl-mes').value,
      forma: f,
      seccionId: $('pl-seccion').value,
      trabIds: f === 'PorTrabajador' ? elegidos.map(idDe) : [],
      esProcesoFinal: root.querySelector('input[name="pl-cierre"]:checked')?.value === '1'
    });
    espera.close();
    $('pl-calcular').disabled = !motorDe(empresaDestino());
    const box = $('pl-resultado');
    box.hidden = false;
    const ok = !!(data && data.success);
    $('pl-resultado-texto').textContent = (data && data.message) || (ok ? 'Planilla calculada.' : 'El cálculo no terminó.');
    const excesos = (data && data.excesos) || [];
    $('pl-excesos').innerHTML = excesos.length
      ? '<div class="note note-danger">' + excesos.length + ' descuento(s) no se pudieron cobrar por completo.' +
        '<ul class="pl-exceso-lista">' + excesos.map((e) =>
          '<li>' + esc(e.trabId) + ' ' + esc(e.nombre) + ': ' + esc(e.descripcion || e.conPllaId) + ' S/ ' + esc(e.monto) + '</li>'
        ).join('') + '</ul></div>'
      : '';
    $('pl-log').textContent = ((data && data.log) || []).join('\n');
    if (!ok) error((data && data.message) || 'El cálculo no terminó.');
    if (ok) cargar();
  });

  let indPasos = [];
  let indIdx = 0;
  let indTrab = '';

  function soles(n) {
    return 'S/ ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function pintarIndLista() {
    const q = ($('pl-ind-q').value || '').trim().toLowerCase();
    const rows = catalogo.filter((t) => {
      if (!q) return true;
      return (idDe(t) + ' ' + (t.nombre || '')).toLowerCase().includes(q);
    }).sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es', { sensitivity: 'base' }));
    $('pl-ind-lista').innerHTML = rows.length
      ? rows.map((t) =>
          '<button type="button" class="pl-ind-item' + (idDe(t) === indTrab ? ' is-on' : '') + '" data-trab="' + esc(idDe(t)) + '">' +
          '<strong>' + esc(idDe(t)) + '</strong><span>' + esc(t.nombre) + '</span></button>'
        ).join('')
      : '<p class="pl-ind-formula">No hay trabajadores en este periodo.</p>';
  }

  function pintarIndPaso() {
    const p = indPasos[indIdx];
    if (!p) return;
    $('pl-ind-elige').hidden = true;
    $('pl-ind-paso').hidden = false;
    $('pl-ind-atras').hidden = false;
    $('pl-ind-progreso').textContent = 'Paso ' + (indIdx + 1) + ' de ' + indPasos.length;
    $('pl-ind-grupo').textContent = p.grupo || '';
    const codigo = p.codigo ? p.codigo + ' · ' : '';
    $('pl-ind-titulo').textContent = codigo + (p.nombre || '');
    $('pl-ind-formula').textContent = p.formula || '';
    const origen = $('pl-ind-origen');
    const origenes = p.origenes || [];
    if (!origenes.length) {
      origen.hidden = true;
      origen.innerHTML = '';
    } else {
      const fuentes = [];
      origenes.forEach((o) => { if (o.fuente && fuentes.indexOf(o.fuente) < 0) fuentes.push(o.fuente); });
      origen.hidden = false;
      origen.innerHTML = fuentes.map((f) =>
        '<p class="pl-ind-grupo">Registrado en ' + esc(f) + '</p>' +
        origenes.filter((o) => o.fuente === f).map((o) =>
          '<div class="pl-ind-origen-row"><span>' + esc(o.dato) + '</span><span>' + esc(o.usuario || 'Sin usuario') + '</span><span>' + esc(o.cuando) + '</span></div>'
        ).join('')
      ).join('');
    }
    const monto = $('pl-ind-monto');
    if (p.monto === null || p.monto === undefined) {
      monto.hidden = true;
    } else {
      monto.hidden = false;
      monto.textContent = soles(p.monto);
    }
    $('pl-ind-siguiente').textContent = indIdx === indPasos.length - 1 ? 'Cerrar' : 'Siguiente';
    $('pl-ind-siguiente').disabled = false;
  }

  function avisoInd(texto) {
    const box = $('pl-ind-aviso');
    box.hidden = !texto;
    box.textContent = texto || '';
  }

  function abrirIndividual() {
    if (!motorDe(empresaDestino())) {
      error('El cálculo individual está disponible para las empresas 05 y 06.');
      return;
    }
    indPasos = [];
    indIdx = 0;
    indTrab = '';
    $('pl-ind-q').value = '';
    $('pl-ind-elige').hidden = false;
    $('pl-ind-paso').hidden = true;
    $('pl-ind-atras').hidden = true;
    $('pl-ind-siguiente').textContent = 'Ver cálculo';
    $('pl-ind-siguiente').disabled = true;
    avisoInd('');
    $('pl-ind-periodo').textContent = nombrePeriodo();
    pintarIndLista();
    $('pl-ind').showModal();
    // showModal enfoca el primer control (el botón cerrar); el usuario empieza escribiendo en la búsqueda.
    $('pl-ind-q').focus();
  }

  $('pl-individual').disabled = !motorDe(empresaDestino());
  $('pl-individual').addEventListener('click', abrirIndividual);
  $('pl-ind-q').addEventListener('input', () => pintarIndLista());
  $('pl-ind-lista').addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-trab]');
    if (!btn) return;
    indTrab = btn.getAttribute('data-trab') || '';
    $('pl-ind-siguiente').disabled = !indTrab;
    pintarIndLista();
  });
  $('pl-ind-atras').addEventListener('click', () => {
    if (indIdx <= 0) {
      $('pl-ind-elige').hidden = false;
      $('pl-ind-paso').hidden = true;
      $('pl-ind-atras').hidden = true;
      $('pl-ind-siguiente').textContent = 'Ver cálculo';
      $('pl-ind-siguiente').disabled = !indTrab;
      return;
    }
    indIdx -= 1;
    pintarIndPaso();
  });
  $('pl-ind-siguiente').addEventListener('click', async () => {
    if (indPasos.length && indIdx === indPasos.length - 1 && !$('pl-ind-paso').hidden) {
      $('pl-ind').close();
      return;
    }
    if ($('pl-ind-paso').hidden) {
      if (!indTrab) return;
      avisoInd('');
      $('pl-ind-siguiente').disabled = true;
      $('pl-ind-siguiente').textContent = 'Calculando…';
      const data = await erp.post('?handler=Explicar', {
        empresaCalculoId: empresaDestino(),
        anio: String($('pl-anio').value || ''),
        mes: $('pl-mes').value,
        trabId: indTrab
      });
      $('pl-ind-siguiente').disabled = false;
      $('pl-ind-siguiente').textContent = 'Ver cálculo';
      if (!data || !data.success) {
        avisoInd((data && data.message) || 'No se pudo armar el cálculo.');
        return;
      }
      indPasos = data.pasos || [];
      indIdx = 0;
      if (!indPasos.length) {
        error('Este trabajador no tiene conceptos para mostrar.');
        return;
      }
      pintarIndPaso();
      return;
    }
    indIdx += 1;
    pintarIndPaso();
  });

  cargar();
})();
