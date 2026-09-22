$(function () {
  const params = new URLSearchParams(location.search);
  let current = null;

  function monthName(mes) {
    return ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][mes - 1] || mes;
  }

  function render(p) {
    current = p;
    $('#rendimiento').val(p.objetivoRendimientoTonHa ?? '');
    $('#observaciones').val(p.observaciones ?? '');
    const elementos = [];
    p.periodos.forEach(per => (per.objetivos || []).forEach(o => {
      if (!elementos.find(e => e.codigo === o.elementoCodigo))
        elementos.push({ codigo: o.elementoCodigo, nombre: o.elementoNombre });
    }));
    let html = '<table class="table table-sm paltos-matriz"><thead><tr><th>Periodo</th>';
    elementos.forEach(e => html += `<th>${e.codigo}</th>`);
    html += '<th>Fenología</th></tr></thead><tbody>';
    (p.periodos || []).forEach((per, i) => {
      html += `<tr data-i="${i}"><td>${monthName(per.mes)} ${per.anio}</td>`;
      elementos.forEach(e => {
        const obj = (per.objetivos || []).find(o => o.elementoCodigo === e.codigo);
        html += `<td><input type="number" step="0.01" class="form-control form-control-sm obj" data-el="${e.codigo}" data-nombre="${e.nombre}" value="${obj ? obj.objetivoKgHa : 0}" /></td>`;
      });
      html += `<td><input class="form-control form-control-sm feno" value="${per.fenologia || ''}" /></td></tr>`;
    });
    html += '</tbody></table>';
    $('#matrizWrap').html(html);
  }

  async function load(id) {
    const res = await erp.get('?handler=Data&campoCampaniaId=' + id);
    if (!res?.success || !res.data) {
      $('#matrizWrap').html('<p class="text-muted mb-0">' + (res?.message || 'Sin presupuesto') + '</p>');
      current = null;
      return;
    }
    render(res.data);
  }

  erp.get('?handler=Campanias').then(res => {
    const items = res?.data || [];
    $('#campoCampaniaId').html(items.map(c => `<option value="${c.campoCampaniaId}">${c.codigoCampo} · ${c.codigo} ${c.nombre}</option>`).join(''));
    const selected = params.get('campoCampaniaId') || items[0]?.campoCampaniaId;
    if (selected) {
      $('#campoCampaniaId').val(selected);
      load(selected);
    }
  });

  $('#campoCampaniaId').on('change', function () { load(this.value); });

  $('#btnGuardar').on('click', async () => {
    if (!current) return;
    const periodos = [];
    $('#matrizWrap tbody tr').each(function (idx) {
      const per = current.periodos[idx];
      const objetivos = [];
      $(this).find('.obj').each(function () {
        objetivos.push({
          elementoCodigo: $(this).data('el'),
          elementoNombre: $(this).data('nombre'),
          objetivoKgHa: Number($(this).val() || 0)
        });
      });
      periodos.push({
        orden: per.orden, anio: per.anio, mes: per.mes,
        fenologia: $(this).find('.feno').val(),
        desarrolloYemas: per.desarrolloYemas,
        objetivos
      });
    });
    const res = await erp.post('?handler=Guardar', {
      campoCampaniaId: Number($('#campoCampaniaId').val()),
      versionEsperada: current.version,
      objetivoRendimientoTonHa: $('#rendimiento').val() ? Number($('#rendimiento').val()) : null,
      observaciones: $('#observaciones').val(),
      periodos
    });
    erp.toast(res.success ? 'success' : 'error', res.message || 'Guardado');
    if (res.success && res.data) render(res.data);
  });
});
