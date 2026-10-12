(function () {
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const pop = document.createElement('div');
  pop.className = 'fecha-pop';
  pop.setAttribute('popover', 'manual');
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', 'Elegir fecha');
  document.body.appendChild(pop);
  pop.addEventListener('pointerdown', (ev) => ev.stopPropagation());
  pop.addEventListener('mousedown', (ev) => ev.stopPropagation());
  pop.addEventListener('click', (ev) => ev.stopPropagation());

  let ancla = null;
  let vista = new Date();

  function local(fecha) {
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }

  function leer(valor) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor || '');
    if (!match) return null;
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  function mismo(a, b) {
    return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function aplicar(fecha) {
    if (!ancla) return;
    ancla.value = fecha ? local(fecha) : '';
    ancla.dispatchEvent(new Event('input', { bubbles: true }));
    ancla.dispatchEvent(new Event('change', { bubbles: true }));
    // El popover se cierra después del clic: si se oculta en el mismo
    // evento, el navegador entrega ese clic al control que queda debajo.
    const anclaClic = ancla;
    queueMicrotask(() => {
      if (ancla === anclaClic) cerrar();
    });
  }

  function pintar() {
    const elegida = ancla ? leer(ancla.value) : null;
    const hoy = new Date();
    const anio = vista.getFullYear();
    const mes = vista.getMonth();
    const primero = new Date(anio, mes, 1);
    const inicio = (primero.getDay() + 6) % 7;
    const total = new Date(anio, mes + 1, 0).getDate();
    pop.replaceChildren();

    const cabeza = document.createElement('div');
    cabeza.className = 'fecha-pop__head';
    const anterior = document.createElement('button');
    anterior.type = 'button';
    anterior.className = 'fecha-pop__nav';
    anterior.setAttribute('aria-label', 'Mes anterior');
    anterior.innerHTML = '<i class="ri ri-arrow-left-s-line"></i>';
    anterior.addEventListener('click', () => {
      vista = new Date(anio, mes - 1, 1);
      pintar();
    });
    const titulo = document.createElement('span');
    titulo.className = 'fecha-pop__titulo';
    titulo.textContent = `${meses[mes]} ${anio}`;
    const siguiente = document.createElement('button');
    siguiente.type = 'button';
    siguiente.className = 'fecha-pop__nav';
    siguiente.setAttribute('aria-label', 'Mes siguiente');
    siguiente.innerHTML = '<i class="ri ri-arrow-right-s-line"></i>';
    siguiente.addEventListener('click', () => {
      vista = new Date(anio, mes + 1, 1);
      pintar();
    });
    cabeza.append(anterior, titulo, siguiente);
    pop.appendChild(cabeza);

    const grilla = document.createElement('div');
    grilla.className = 'fecha-pop__grid';
    ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'].forEach((nombre) => {
      const etiqueta = document.createElement('span');
      etiqueta.className = 'fecha-pop__dow';
      etiqueta.textContent = nombre;
      grilla.appendChild(etiqueta);
    });
    for (let i = 0; i < inicio; i += 1) {
      const vacio = document.createElement('span');
      grilla.appendChild(vacio);
    }
    for (let dia = 1; dia <= total; dia += 1) {
      const fecha = new Date(anio, mes, dia);
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'fecha-pop__dia';
      if (mismo(fecha, elegida)) boton.classList.add('is-selected');
      if (mismo(fecha, hoy)) boton.classList.add('is-hoy');
      boton.textContent = String(dia);
      boton.addEventListener('click', () => aplicar(fecha));
      grilla.appendChild(boton);
    }
    pop.appendChild(grilla);

    const pie = document.createElement('div');
    pie.className = 'fecha-pop__foot';
    const borrar = document.createElement('button');
    borrar.type = 'button';
    borrar.className = 'fecha-pop__link';
    borrar.textContent = 'Borrar';
    borrar.addEventListener('click', () => aplicar(null));
    const hoyBtn = document.createElement('button');
    hoyBtn.type = 'button';
    hoyBtn.className = 'fecha-pop__link';
    hoyBtn.textContent = 'Hoy';
    hoyBtn.addEventListener('click', () => aplicar(hoy));
    pie.append(borrar, hoyBtn);
    pop.appendChild(pie);
  }

  function colocar() {
    if (!ancla) return;
    const rect = ancla.getBoundingClientRect();
    const alto = pop.offsetHeight || 280;
    const ancho = pop.offsetWidth || 252;
    let arriba = rect.bottom + 4;
    if (arriba + alto > window.innerHeight - 8) arriba = Math.max(8, rect.top - alto - 4);
    let izquierda = rect.left;
    if (izquierda + ancho > window.innerWidth - 8) izquierda = window.innerWidth - ancho - 8;
    if (izquierda < 8) izquierda = 8;
    pop.style.top = `${arriba}px`;
    pop.style.left = `${izquierda}px`;
  }

  function abierto() {
    return pop.matches(':popover-open');
  }

  function cerrar() {
    const tragado = (ev) => {
      if (pop.contains(ev.target)) return;
      ev.preventDefault();
      ev.stopPropagation();
    };
    document.addEventListener('click', tragado, true);
    setTimeout(() => document.removeEventListener('click', tragado, true), 0);
    if (abierto()) pop.hidePopover();
    ancla = null;
  }

  function abrir(input) {
    if (input.disabled || input.readOnly) return;
    if (abierto() && ancla === input) {
      cerrar();
      return;
    }
    ancla = input;
    // Un <dialog> modal vuelve inerte todo lo que está fuera de él: el calendario
    // debe vivir dentro del diálogo del input para recibir clics.
    const contenedor = input.closest('dialog[open]') || document.body;
    if (pop.parentElement !== contenedor) {
      if (abierto()) pop.hidePopover();
      contenedor.appendChild(pop);
    }
    const actual = leer(input.value) || new Date();
    vista = new Date(actual.getFullYear(), actual.getMonth(), 1);
    pintar();
    if (!abierto()) pop.showPopover();
    colocar();
  }

  document.addEventListener('click', (ev) => {
    if (ev.target.closest?.('.erp-ds input[type="date"]')) ev.preventDefault();
  }, true);

  document.addEventListener('mousedown', (ev) => {
    const input = ev.target.closest?.('.erp-ds input[type="date"]');
    if (input) {
      ev.preventDefault();
      input.focus({ preventScroll: true });
      abrir(input);
      return;
    }
    if (abierto() && !pop.contains(ev.target)) cerrar();
  }, true);

  document.addEventListener('keydown', (ev) => {
    const input = ev.target.closest?.('.erp-ds input[type="date"]');
    if (input && (ev.key === 'ArrowDown' || ev.key === ' ' || (ev.altKey && ev.key === 'ArrowDown'))) {
      ev.preventDefault();
      abrir(input);
      return;
    }
    if (ev.key === 'Escape' && abierto()) {
      ev.preventDefault();
      ev.stopPropagation();
      cerrar();
    }
  }, true);

  window.addEventListener('resize', () => {
    if (abierto()) colocar();
  });
})();
