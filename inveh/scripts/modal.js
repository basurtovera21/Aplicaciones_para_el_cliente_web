// Despliega una ventana modal en pantalla a partir de su identificador en el DOM.
function abrirModal(identificadorDelModal) {
    // document.getElementById: Localiza el elemento modal en el árbol del documento.
    const modalEncontrado = document.getElementById(identificadorDelModal);

    if (modalEncontrado) {
        // DOMTokenList.add: Agrega la clase 'activo' para activar las transiciones CSS de visibilidad.
        modalEncontrado.classList.add('activo');
        // Element.setAttribute: Modifica el atributo de accesibilidad para lectores de pantalla.
        modalEncontrado.setAttribute('aria-hidden', 'false');
        // Bloquea el desplazamiento del cuerpo de la página mientras el modal permanezca abierto.
        document.body.style.overflow = 'hidden';
    }
}

// Oculta una ventana modal activa recibiendo su identificador o el nodo del elemento.
function cerrarModal(referenciaDelModal) {
    let modalParaCerrar;

    // Determina si el parámetro recibido es una cadena de texto con el ID o el objeto nodo directamente.
    if (typeof referenciaDelModal === 'string') {
        modalParaCerrar = document.getElementById(referenciaDelModal);
    } else {
        modalParaCerrar = referenciaDelModal;
    }

    if (modalParaCerrar) {
        // DOMTokenList.remove: Remueve la clase 'activo' para ocultar el modal con transición CSS.
        modalParaCerrar.classList.remove('activo');
        modalParaCerrar.setAttribute('aria-hidden', 'true');

        // document.querySelectorAll: Comprueba si quedan otros modales superpuestos aún abiertos.
        const listaDeModalesActivos = document.querySelectorAll('.superposicion-modal.activo');

        // Si no quedan modales abiertos, restablece el scroll vertical de la página.
        if (listaDeModalesActivos.length === 0) {
            document.body.style.overflow = '';
        }
    }
}

// document.addEventListener: Escucha clics globales para cerrar modales al pulsar botones o el fondo oscuro.
document.addEventListener('click', function(evento) {
    // Element.closest: Detecta si el elemento cliqueado o sus ancestros poseen el atributo data-modal-cerrar.
    const botonCerrarPresionado = evento.target.closest('[data-modal-cerrar]');

    if (botonCerrarPresionado) {
        const modalDondeEstaElBoton = botonCerrarPresionado.closest('.superposicion-modal');
        cerrarModal(modalDondeEstaElBoton);
    }

    // DOMTokenList.contains: Cierra el modal si el clic se efectuó directamente sobre el fondo exterior.
    if (evento.target.classList.contains('superposicion-modal')) {
        cerrarModal(evento.target);
    }
});

// document.addEventListener: Permite cerrar el modal activo al presionar la tecla Escape del teclado.
document.addEventListener('keydown', function(evento) {
    if (evento.key === 'Escape') {
        // document.querySelector: Busca el modal activo en primer plano para cerrarlo.
        const modalActualAbierto = document.querySelector('.superposicion-modal.activo');
        
        if (modalActualAbierto) {
            cerrarModal(modalActualAbierto);
        }
    }
});