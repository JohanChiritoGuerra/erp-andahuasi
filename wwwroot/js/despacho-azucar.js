(function () {
  const $ = (id) => document.getElementById(id);
  let tab = 'despacho';
  let items = [];
  let seleccion = null;
  let ocupado = false;
  let cargaToken = 0;

  function hoyLocal() {
    const fecha = new Date();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }

  const columnas = {
    despacho: 'minmax(160px,1.3fr) minmax(120px,1fr) 120px 90px',
    orden: 'minmax(140px,1.1fr) minmax(140px,1fr) 120px 90px',
    reporte: 'minmax(160px,1.3fr) minmax(120px,.8fr) 120px 90px'
  };

  function fechaCorta(valor) {
    if (!valor) return '—';
    const texto = String(valor);
    const match = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : texto;
  }

  function unidades(valor) {
    const numero = Number(valor || 0);
    return numero.toLocaleString('es-PE', { maximumFractionDigits: 0 });
  }

  function texto(valor) {
    const limpio = String(valor || '').trim();
    return limpio || '—';
  }

  function aviso(id, mensaje) {
    const nodo = $(id);
    nodo.hidden = !mensaje;
    nodo.textContent = mensaje || '';
  }

  function espera(mensaje) {
    $('da-espera-txt').textContent = mensaje;
    if (!$('da-espera').open) $('da-espera').showModal();
  }

  function finEspera() {
    if ($('da-espera').open) $('da-espera').close();
  }

  function articulo() {
    return Number($('da-prod').value || 2);
  }

  function tabActual() {
    return document.querySelector('input[name="da-tab"]:checked')?.value || 'despacho';
  }

  function aplicarTab() {
    tab = tabActual();
    const reporte = tab === 'reporte';
    $('da-periodo').hidden = !reporte;
    $('da-fecha').hidden = !reporte;
    $('da-registrar-abrir').hidden = tab !== 'orden';
    $('da-q').placeholder = tab === 'orden' ? 'Número de la orden interna' : 'Número del comprobante';
    $('da-table').style.setProperty('--dt-cols', columnas[tab]);
    if (tab === 'orden') {
      $('da-titulo').textContent = 'Órdenes internas';
      $('da-subtitulo').textContent = 'Transferencias entre tiendas y racionamiento';
      $('da-h1').textContent = 'Número';
      $('da-h2').textContent = 'Destino';
      $('da-h3').textContent = 'Fecha';
      $('da-stat-a-lbl').textContent = 'Órdenes';
    } else if (tab === 'reporte') {
      $('da-titulo').textContent = 'Despachados';
      $('da-subtitulo').textContent = 'Comprobantes ya atendidos en el periodo';
      $('da-h1').textContent = 'Comprobante';
      $('da-h2').textContent = 'Despacho';
      $('da-h3').textContent = 'Fecha';
      $('da-stat-a-lbl').textContent = 'Comprobantes';
    } else {
      $('da-titulo').textContent = 'Por despachar';
      $('da-subtitulo').textContent = 'Comprobantes de venta pendientes de despacho';
      $('da-h1').textContent = 'Comprobante';
      $('da-h2').textContent = 'Cliente';
      $('da-h3').textContent = 'Fecha';
      $('da-stat-a-lbl').textContent = 'Comprobantes';
    }
    cargar();
  }

  function coincide(item, consulta) {
    if (!consulta) return true;
    const bolsa = tab === 'orden' ? item.numero : item.comprobante;
    return String(bolsa || '').toLowerCase().includes(consulta);
  }

  function celda(btn, codigo, detalle, clase) {
    const span = document.createElement('span');
    if (clase) span.className = clase;
    if (codigo) {
      const fuerte = document.createElement('span');
      fuerte.className = 'dt-code';
      fuerte.textContent = codigo;
      span.appendChild(fuerte);
    }
    if (detalle) {
      const secundario = document.createElement('span');
      secundario.className = 'dt-desc';
      secundario.textContent = detalle;
      span.appendChild(secundario);
    }
    btn.appendChild(span);
  }

  function celdaTexto(btn, valor, clase) {
    const span = document.createElement('span');
    span.className = clase || 'dt-muted';
    span.textContent = valor;
    btn.appendChild(span);
  }

  function pintar() {
    const consulta = $('da-q').value.trim().toLowerCase();
    const lista = items.filter((item) => coincide(item, consulta));
    const cuerpo = $('da-rows');
    cuerpo.replaceChildren();

    if (!lista.length) {
      const vacio = document.createElement('div');
      vacio.className = 'empty';
      vacio.textContent = items.length
        ? 'Ningún registro coincide con la búsqueda.'
        : 'No hay registros para este producto. Actualice el listado o cambie el producto.';
      cuerpo.appendChild(vacio);
    }

    lista.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dt-row';
      if (tab === 'orden') {
        celda(btn, texto(item.numero), texto(item.producto));
        celdaTexto(btn, texto(item.destino), 'dt-muted');
        celdaTexto(btn, fechaCorta(item.fecha), 'dt-muted');
      } else if (tab === 'reporte') {
        celda(btn, texto(item.comprobante), texto(item.cliente));
        celdaTexto(btn, fechaCorta(item.fechaAtencion), 'dt-muted');
        celdaTexto(btn, fechaCorta(item.fecha), 'dt-muted');
      } else {
        celda(btn, texto(item.comprobante), texto(item.cliente));
        celdaTexto(btn, texto(item.tipo), 'dt-muted');
        celdaTexto(btn, fechaCorta(item.fecha), 'dt-muted');
      }
      celdaTexto(btn, unidades(item.cantidad), 'da-num');
      btn.addEventListener('click', () => abrir(item));
      cuerpo.appendChild(btn);
    });

    const totalUnidades = items.reduce((suma, item) => suma + Number(item.cantidad || 0), 0);
    $('da-stat-a').textContent = unidades(items.length);
    $('da-stat-b').textContent = unidades(totalUnidades);
    const etiqueta = tab === 'orden' ? 'órdenes' : 'comprobantes';
    $('da-count').textContent = consulta
      ? `${lista.length} de ${items.length} ${etiqueta}`
      : `${items.length} ${etiqueta} · ${unidades(totalUnidades)} unidades`;
  }

  function ficha(destino, pares) {
    destino.replaceChildren();
    pares.forEach(([etiqueta, valor]) => {
      const dt = document.createElement('dt');
      dt.textContent = etiqueta;
      const dd = document.createElement('dd');
      dd.textContent = valor;
      destino.appendChild(dt);
      destino.appendChild(dd);
    });
  }

  function abrir(item) {
    seleccion = item;
    if (tab === 'orden') {
      ficha($('da-ver-ficha'), [
        ['Número', texto(item.numero)],
        ['Fecha', fechaCorta(item.fecha)],
        ['Destino', texto(item.destino)],
        ['Cantidad', unidades(item.cantidad)],
        ['Producto', texto(item.producto)]
      ]);
      $('da-ver').showModal();
      return;
    }
    if (tab === 'reporte') {
      aviso('da-anular-aviso', '');
      ficha($('da-anular-ficha'), [
        ['Número', texto(item.comprobante)],
        ['Fecha', fechaCorta(item.fecha)],
        ['Cliente', texto(item.cliente)],
        ['DNI / RUC', texto(item.dniRuc)],
        ['Tipo', texto(item.tipo)],
        ['Condición', texto(item.condicion)],
        ['Cantidad', unidades(item.cantidad)],
        ['Producto', texto(item.producto)],
        ['Fecha de despacho', fechaCorta(item.fechaAtencion)]
      ]);
      $('da-anular').showModal();
      return;
    }
    aviso('da-despachar-aviso', '');
    $('da-despachar-fecha').value = hoyLocal();
    ficha($('da-despachar-ficha'), [
      ['Número', texto(item.comprobante)],
      ['Fecha', fechaCorta(item.fecha)],
      ['Cliente', texto(item.cliente)],
      ['DNI / RUC', texto(item.dniRuc)],
      ['Tipo', texto(item.tipo)],
      ['Condición', texto(item.condicion)],
      ['Cantidad', unidades(item.cantidad)],
      ['Producto', texto(item.producto)]
    ]);
    $('da-despachar').showModal();
  }

  async function cargar() {
    const token = ++cargaToken;
    const vista = tab;
    aviso('da-error', '');
    $('da-count').textContent = 'Cargando…';
    const handler = vista === 'orden' ? 'Ordenes' : vista === 'reporte' ? 'Despachados' : 'PorDespachar';
    const cuerpo = { idArticulo: articulo() };
    if (vista === 'reporte') {
      cuerpo.fecha = $('da-fecha').value;
      cuerpo.todoElMes = document.getElementById('da-mes').checked;
    }
    const respuesta = await window.erp.post(`?handler=${handler}`, cuerpo);
    if (token !== cargaToken || vista !== tab) return;
    if (!respuesta || respuesta.success === false) {
      items = [];
      pintar();
      aviso('da-error', (respuesta && respuesta.message) || 'No se pudo cargar el listado.');
      return;
    }
    items = Array.isArray(respuesta.items) ? respuesta.items : [];
    pintar();
  }

  async function despachar() {
    if (!seleccion || ocupado) return;
    const fecha = $('da-despachar-fecha').value;
    if (!fecha) {
      aviso('da-despachar-aviso', 'Seleccione la fecha de despacho.');
      return;
    }
    aviso('da-despachar-aviso', '');
    $('da-despachar').close();
    espera('Despachando el comprobante…');
    ocupado = true;
    const respuesta = await window.erp.post('?handler=Despachar', {
      idFactdetal: seleccion.idFactdetal,
      fecha
    });
    ocupado = false;
    finEspera();
    if (!respuesta || !respuesta.success) {
      $('da-despachar').showModal();
      aviso('da-despachar-aviso', (respuesta && respuesta.message) || 'No se pudo despachar el comprobante.');
      return;
    }
    cargar();
  }

  function validarOrden() {
    const errores = [];
    const numero = $('da-reg-numero').value.trim();
    const fecha = $('da-reg-fecha').value;
    const destino = $('da-dest').value;
    const producto = $('da-reg-prod').value;
    const cantidad = Number($('da-reg-cantidad').value);
    const hoy = hoyLocal();
    if (!numero) errores.push('Ingrese el número.');
    if (!fecha) errores.push('Seleccione la fecha.');
    else if (fecha > hoy) errores.push('La fecha no puede ser mayor que la fecha actual.');
    if (!destino) errores.push('Seleccione el destino.');
    if (!producto) errores.push('Seleccione el producto.');
    if (!Number.isFinite(cantidad) || cantidad <= 0) errores.push('La cantidad tiene que ser mayor que cero.');
    return { errores, numero, fecha, destino, producto, cantidad };
  }

  async function registrar() {
    if (ocupado) return;
    const datos = validarOrden();
    if (datos.errores.length) {
      aviso('da-reg-aviso', datos.errores.join(' '));
      return;
    }
    aviso('da-reg-aviso', '');
    $('da-registrar').close();
    espera('Registrando la orden interna…');
    ocupado = true;
    const respuesta = await window.erp.post('?handler=Registrar', {
      idArticulo: Number(datos.producto),
      numero: datos.numero,
      fecha: datos.fecha,
      destino: datos.destino,
      cantidad: datos.cantidad
    });
    ocupado = false;
    finEspera();
    if (!respuesta || !respuesta.success) {
      $('da-registrar').showModal();
      aviso('da-reg-aviso', (respuesta && respuesta.message) || 'No se pudo registrar la orden.');
      return;
    }
    $('da-reg-numero').value = '';
    $('da-reg-cantidad').value = '';
    if ($('da-prod').value !== datos.producto) {
      $('da-prod').value = datos.producto;
      const opcion = document.querySelector(`#da-prod-dd [data-value="${datos.producto}"]`);
      if (opcion) document.querySelector('#da-prod-dd [data-dropdown-label]').textContent = opcion.textContent.trim();
    }
    cargar();
  }

  async function anular() {
    if (!seleccion || ocupado) return;
    if (!seleccion.idInvmaest) {
      aviso('da-anular-aviso', 'Este despacho no tiene un movimiento para anular.');
      return;
    }
    aviso('da-anular-aviso', '');
    $('da-anular').close();
    espera('Anulando el despacho…');
    ocupado = true;
    const respuesta = await window.erp.post('?handler=Anular', { idInvmaest: seleccion.idInvmaest });
    ocupado = false;
    finEspera();
    if (!respuesta || !respuesta.success) {
      $('da-anular').showModal();
      aviso('da-anular-aviso', (respuesta && respuesta.message) || 'No se pudo anular el despacho.');
      return;
    }
    cargar();
  }

  document.querySelectorAll('input[name="da-tab"]').forEach((input) => {
    input.addEventListener('change', aplicarTab);
  });
  document.querySelectorAll('input[name="da-periodo"]').forEach((input) => {
    input.addEventListener('change', cargar);
  });
  $('da-fecha').addEventListener('change', cargar);
  $('da-q').addEventListener('input', pintar);
  $('da-refrescar').addEventListener('click', cargar);
  $('da-prod-dd').addEventListener('click', (ev) => {
    const opcion = ev.target.closest('[data-value]');
    if (!opcion) return;
    $('da-prod').value = opcion.getAttribute('data-value') || '2';
    cargar();
  });
  $('da-registrar-abrir').addEventListener('click', () => {
    aviso('da-reg-aviso', '');
    $('da-registrar').showModal();
  });
  $('da-despachar-ok').addEventListener('click', despachar);
  $('da-reg-ok').addEventListener('click', registrar);
  $('da-anular-ok').addEventListener('click', anular);

  aplicarTab();
})();
