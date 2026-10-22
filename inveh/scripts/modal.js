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
        // Sincroniza el color de los campos de selección, fecha y hora contenidos en el modal.
        inicializarCamposSeleccionFechaHora(modalEncontrado);
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

// Actualiza la clase visual en campos select, date y time según contengan o no un valor seleccionado.
function sincronizarColorCamposSeleccion(elemento) {
    if (!elemento) return;
    // Element.matches: Determina si el elemento interactivo corresponde a una lista desplegable o selector de fecha u hora.
    if (elemento.matches && (elemento.matches('select') || elemento.matches('input[type="date"]') || elemento.matches('input[type="time"]'))) {
        if (!elemento.value) {
            // DOMTokenList.add: Asigna la clase de estado vacío para aplicar el color de marcador de posición.
            elemento.classList.add('campo-sin-seleccion');
        } else {
            // DOMTokenList.remove: Retira la clase para restablecer el color de texto habitual del campo.
            elemento.classList.remove('campo-sin-seleccion');
        }
    }
}

// Inicializa el estado visual de todos los campos de selección, fecha y hora del contenedor especificado.
function inicializarCamposSeleccionFechaHora(contenedor = document) {
    // Element.querySelectorAll: Obtiene todos los campos select, date y time presentes en el ámbito.
    const camposInteractivos = contenedor.querySelectorAll('select, input[type="date"], input[type="time"]');
    camposInteractivos.forEach(sincronizarColorCamposSeleccion);
}

// Asigna las funciones al objeto global window para permitir su invocación desde otros módulos.
window.sincronizarColorCamposSeleccion = sincronizarColorCamposSeleccion;
window.inicializarCamposSeleccionFechaHora = inicializarCamposSeleccionFechaHora;

// document.addEventListener: Supervisa eventos de cambio para actualizar el color del campo en tiempo real.
document.addEventListener('change', function(evento) {
    sincronizarColorCamposSeleccion(evento.target);
});

// document.addEventListener: Supervisa entradas de datos directas para actualizar campos de fecha y hora.
document.addEventListener('input', function(evento) {
    sincronizarColorCamposSeleccion(evento.target);
});

// document.addEventListener: Restablece el color de los campos cuando un formulario es reiniciado.
document.addEventListener('reset', function(evento) {
    setTimeout(function() {
        inicializarCamposSeleccionFechaHora(evento.target);
    }, 0);
});

// Ejecuta la sincronización inicial de forma inmediata para elementos ya presentes en el DOM.
inicializarCamposSeleccionFechaHora();

// document.addEventListener: Aplica la sincronización inicial al cargar el contenido del árbol DOM.
document.addEventListener('DOMContentLoaded', function() {
    inicializarCamposSeleccionFechaHora();
});