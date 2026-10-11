function abrirModal(identificadorDelModal) {
  const modalEncontrado = document.getElementById(identificadorDelModal);

  if (modalEncontrado) {
    modalEncontrado.classList.add('activo');
    modalEncontrado.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

function cerrarModal(referenciaDelModal) {
  let modalParaCerrar;

  if (typeof referenciaDelModal === 'string') {
    modalParaCerrar = document.getElementById(referenciaDelModal);
  } else {
    modalParaCerrar = referenciaDelModal;
  }

  if (modalParaCerrar) {
    modalParaCerrar.classList.remove('activo');
    modalParaCerrar.setAttribute('aria-hidden', 'true');

    const listaDeModalesActivos = document.querySelectorAll('.superposicion-modal.activo');

    if (listaDeModalesActivos.length === 0) {
      document.body.style.overflow = '';
    }
  }
}

document.addEventListener('click', function(evento) {
  const botonCerrarPresionado = evento.target.closest('[data-modal-cerrar]');

  if (botonCerrarPresionado) {
    const modalDondeEstaElBoton = botonCerrarPresionado.closest('.superposicion-modal');
    cerrarModal(modalDondeEstaElBoton);
  }

  if (evento.target.classList.contains('superposicion-modal')) {
    cerrarModal(evento.target);
  }
});

document.addEventListener('keydown', function(evento) {
  if (evento.key === 'Escape') {
    const modalActualAbierto = document.querySelector('.superposicion-modal.activo');
    
    if (modalActualAbierto) {
      cerrarModal(modalActualAbierto);
    }
  }
});