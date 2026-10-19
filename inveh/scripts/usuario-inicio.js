// Variable global para almacenar el identificador del vehículo a desvincular.
let vehiculoSeleccionadoParaDesvincular = null;

// document.addEventListener: Escucha el evento DOMContentLoaded para ejecutar el código cuando el árbol DOM esté completamente cargado.
document.addEventListener('DOMContentLoaded', function() {
    // localStorage.getItem y JSON.parse: Recupera la sesión activa y deserializa la cadena JSON en un objeto.
    const usuarioActivo = JSON.parse(localStorage.getItem('sesion_activa'));
    // Obtiene la base de datos centralizada llamando a la función global o directamente del almacenamiento local.
    const baseDeDatos = typeof obtenerBaseDatos === 'function' 
        ? obtenerBaseDatos() 
        : JSON.parse(localStorage.getItem('base_de_datos'));

    // Redirecciona al usuario a la pantalla de autenticación si no existe una sesión activa registrada.
    if (!usuarioActivo) {
        // window.location.href: Redirige la navegación del navegador hacia la página especificada.
        window.location.href = 'inicio-sesion.html';
        return;
    }

    // document.querySelector: Busca en el DOM el elemento que muestra el nombre del usuario en la barra de navegación.
    const etiquetaNombreNavegacion = document.querySelector('.nombre-usuario-sesion');
    if (etiquetaNombreNavegacion) {
        // Node.textContent: Asigna el nombre y apellido del usuario autenticado en la etiqueta.
        etiquetaNombreNavegacion.textContent = usuarioActivo.nombres_apellidos;
    }

    // Referencias a los elementos del DOM que muestran el perfil institucional del usuario.
    const etiquetaNombreRolPerfil = document.querySelector('.nombre-rol-usuario');
    const etiquetaIdentificadorUsuario = document.querySelector('.fila-datos-institucionales span:nth-child(1) .dato-valor');
    const etiquetaCorreoUsuario = document.querySelector('.fila-datos-institucionales span:nth-child(2) .dato-valor');
    const etiquetaFacultadUsuario = document.querySelector('.fila-datos-institucionales span:nth-child(3) .dato-valor');
    const etiquetaAvatarIniciales = document.querySelector('.avatar-iniciales-usuario');

    // Actualiza los valores de texto en los elementos del perfil del usuario.
    if (etiquetaNombreRolPerfil) {
        etiquetaNombreRolPerfil.textContent = `${usuarioActivo.nombres_apellidos} (${usuarioActivo.tipo_usuario})`;
    }
    if (etiquetaIdentificadorUsuario) {
        etiquetaIdentificadorUsuario.textContent = usuarioActivo.numero_identificacion;
    }
    if (etiquetaCorreoUsuario) {
        etiquetaCorreoUsuario.textContent = usuarioActivo.correo_institucional;
    }
    if (etiquetaFacultadUsuario) {
        etiquetaFacultadUsuario.textContent = usuarioActivo.facultad;
    }

    // String.prototype.trim y split: Divide el nombre completo en segmentos ignorando espacios repetidos para calcular las iniciales.
    const partesNombreCompleto = usuarioActivo.nombres_apellidos.trim().split(/\s+/);
    // Extrae la primera letra del primer nombre y la primera letra del apellido paterno o segundo nombre.
    const primeraLetraNombre = partesNombreCompleto[0] ? partesNombreCompleto[0][0] : '';
    const primeraLetraApellido = partesNombreCompleto[2] ? partesNombreCompleto[2][0] : (partesNombreCompleto[1] ? partesNombreCompleto[1][0] : '');
    // String.prototype.toUpperCase: Convierte los caracteres extraídos a mayúsculas para el avatar.
    const inicialesUsuario = (primeraLetraNombre + primeraLetraApellido).toUpperCase();
    if (etiquetaAvatarIniciales) {
        etiquetaAvatarIniciales.textContent = inicialesUsuario;
    }

    // Referencias a elementos del DOM relacionados con el listado de vehículos y acciones de registro.
    const contenedorRejillaVehiculos = document.querySelector('.rejilla-vehiculos-usuario');
    const contenedorAccionVehiculoAdicional = document.querySelector('.fila-accion-vehiculo-adicional');
    const botonSolicitarVehiculo = document.getElementById('boton-abrir-registro-vehiculo');
    const textoBotonSolicitarVehiculo = botonSolicitarVehiculo ? botonSolicitarVehiculo.querySelector('span') : null;

    // Array.isArray y Array.prototype.filter: Filtra los vehículos que pertenecen al número de identificación del usuario autenticado.
    const todosLosVehiculosUsuario = (baseDeDatos && Array.isArray(baseDeDatos.vehiculos))
        ? baseDeDatos.vehiculos.filter(function(vehiculo) {
            return vehiculo.propietario_id === usuarioActivo.numero_identificacion;
        })
        : [];

    // Array.prototype.filter: Discrimina únicamente aquellos vehículos cuyo estado de autorización sea 'Autorizado'.
    const vehiculosAutorizados = todosLosVehiculosUsuario.filter(function(vehiculo) {
        return vehiculo.estado_autorizacion === "Autorizado";
    });

    // Actualiza la etiqueta del contador mostrando la cantidad de vehículos autorizados frente al límite permitido.
    const etiquetaContadorVehiculos = document.querySelector('.indicador-contador-vehiculos');
    if (etiquetaContadorVehiculos) {
        etiquetaContadorVehiculos.textContent = `Registro de vehículos: ${vehiculosAutorizados.length} de 2 permitidos`;
    }

    // Evalúa si el usuario alcanzó el cupo máximo de vehículos registrados para mostrar u ocultar el botón de solicitud.
    if (todosLosVehiculosUsuario.length >= 2) {
        if (contenedorAccionVehiculoAdicional) {
            contenedorAccionVehiculoAdicional.style.display = 'none';
        }
        if (botonSolicitarVehiculo) {
            botonSolicitarVehiculo.style.display = 'none';
        }
    } else {
        if (contenedorAccionVehiculoAdicional) {
            contenedorAccionVehiculoAdicional.style.display = 'flex';
        }
        if (botonSolicitarVehiculo) {
            botonSolicitarVehiculo.style.display = 'inline-flex';
        }

        if (textoBotonSolicitarVehiculo) {
            textoBotonSolicitarVehiculo.textContent = vehiculosAutorizados.length === 0 
                ? "Registrar vehículo" 
                : "Requerir vehículo adicional";
        }
    }

    // Element.innerHTML: Limpia el contenido previo de la rejilla de tarjetas vehiculares.
    if (contenedorRejillaVehiculos) {
        contenedorRejillaVehiculos.innerHTML = '';
        // Array.prototype.forEach: Itera cada vehículo autorizado para construir y renderizar su tarjeta en el DOM.
        vehiculosAutorizados.forEach(function(vehiculo) {
            // Construye la estructura visual HTML correspondiente a la tarjeta vehicular.
            const codigoHtmlTarjeta = `
                <section class="tarjeta-vehiculo-registrado">
                    <div class="fila-cabecera-vehiculo">
                        <span class="etiqueta-placa-vehicular">${vehiculo.placa_vehicular}</span>
                        <span class="etiqueta-estado-instalaciones">${vehiculo.ubicacion_actual}</span>
                    </div>
                    <div class="bloque-identificador-sistema">
                        <span>Identificador: <span class="dato-valor">${vehiculo.identificador_sistema}</span></span>
                    </div>
                    <div class="rejilla-especificaciones-vehiculo">
                        <div class="columna-especificacion">
                            <p>Tipo de vehículo: <span>${vehiculo.tipo_vehiculo}</span></p>
                            <p>Color: <span>${vehiculo.color}</span></p>
                        </div>
                        <div class="columna-especificacion">
                            <p>Fabricante / Modelo: <span>${vehiculo.fabricante} ${vehiculo.modelo}</span></p>
                        </div>
                    </div>
                    <div class="fila-botones-accion-vehiculo">
                        <button type="button" class="boton-ficha-vehicular" onclick="abrirFichaVehiculo('${vehiculo.identificador_sistema}')">
                            <img src="recursos/imagenes/ficha-vehicular.svg" alt="" class="icono-imagen-boton">
                            <span>Ficha vehicular</span>
                        </button>
                        <button type="button" class="boton-desvincular-vehiculo" onclick="abrirConfirmarDesvinculo('${vehiculo.identificador_sistema}')">
                            <img src="recursos/imagenes/eliminar.svg" alt="" class="icono-imagen-boton">
                            <span>Desvincular vehículo</span>
                        </button>
                    </div>
                </section>`;
            // Element.insertAdjacentHTML: Inserta el fragmento HTML generado al final del contenedor sin destruir eventos existentes.
            contenedorRejillaVehiculos.insertAdjacentHTML('beforeend', codigoHtmlTarjeta);
        });
    }

    // Referencias y asignación de eventos a los botones de navegación y apertura de modales.
    const botonCerrarSesion = document.getElementById('boton-cerrar-sesion');
    if (botonCerrarSesion) {
        botonCerrarSesion.addEventListener('click', function() {
            // localStorage.removeItem: Elimina del almacenamiento local el registro de la sesión activa actual.
            localStorage.removeItem('sesion_activa');
            // Redirige al usuario al inicio de sesión tras revocar su sesión activa.
            window.location.href = 'inicio-sesion.html';
        });
    }

    const botonAbrirRegistroVehiculo = document.getElementById('boton-abrir-registro-vehiculo');
    if (botonAbrirRegistroVehiculo) {
        botonAbrirRegistroVehiculo.addEventListener('click', function() {
            // Invoca la función global para desplegar el modal de solicitud de vehículo.
            abrirModal('modal-registro-vehiculo');
        });
    }

    const botonAbrirCrearAutorizacion = document.getElementById('boton-abrir-crear-autorizacion');
    if (botonAbrirCrearAutorizacion) {
        botonAbrirCrearAutorizacion.addEventListener('click', function() {
            // Invoca la función global para desplegar el modal de solicitud de autorización de visita.
            abrirModal('modal-crear-autorizacion');
        });
    }

    // Gestiona la confirmación de desvinculación y eliminación del vehículo de la persistencia.
    const botonProcederDesvinculacion = document.getElementById('boton-proceder-desvincular');
    if (botonProcederDesvinculacion) {
        botonProcederDesvinculacion.addEventListener('click', function() {
            // Si no se ha seleccionado un vehículo válido, cancela la ejecución del proceso.
            if (!vehiculoSeleccionadoParaDesvincular) {
                return;
            }

            // Obtiene el estado más reciente de la base de datos.
            const baseDeDatosActual = typeof obtenerBaseDatos === 'function' 
                ? obtenerBaseDatos() 
                : JSON.parse(localStorage.getItem('base_de_datos'));

            if (baseDeDatosActual && Array.isArray(baseDeDatosActual.vehiculos)) {
                // Array.prototype.filter: Excluye el vehículo cuyo identificador coincida con el seleccionado para desvincular.
                baseDeDatosActual.vehiculos = baseDeDatosActual.vehiculos.filter(function(vehiculo) {
                    return vehiculo.identificador_sistema !== vehiculoSeleccionadoParaDesvincular;
                });

                // Persiste las modificaciones en el almacenamiento local.
                if (typeof guardarCambios === 'function') {
                    guardarCambios(baseDeDatosActual);
                } else {
                    localStorage.setItem('base_de_datos', JSON.stringify(baseDeDatosActual));
                }
            }

            // Invoca la función para ocultar el modal de confirmación de desvinculación.
            cerrarModal('modal-desvincular-vehiculo');

            // setTimeout: Aplica un breve retraso para desplegar el modal informativo de éxito de la operación.
            setTimeout(function() {
                abrirModal('modal-desvinculacion-exito');

                // document.querySelectorAll: Selecciona todos los botones encargados de cerrar el modal de éxito.
                const botonesCerrarExito = document.querySelectorAll('#modal-desvinculacion-exito [data-modal-cerrar]');
                // Array.prototype.forEach: Registra un escuchador de evento único en cada botón para recargar la interfaz.
                botonesCerrarExito.forEach(function(botonCerrar) {
                    // Element.addEventListener con 'once: true': Ejecuta la recarga de página exactamente una vez al cerrarse el modal.
                    botonCerrar.addEventListener('click', function() {
                        location.reload();
                    }, { once: true });
                });
            }, 400);
        });
    }
});

// Despliega y llena los datos del vehículo y su propietario en la ficha modal.
function abrirFichaVehiculo(identificadorVehiculo) {
    // Obtiene la base de datos centralizada del sistema.
    const baseDeDatos = typeof obtenerBaseDatos === 'function'
        ? obtenerBaseDatos()
        : JSON.parse(localStorage.getItem('base_de_datos'));

    // Array.prototype.find: Busca en la base de datos el vehículo con el identificador recibido.
    const vehiculoEncontrado = baseDeDatos.vehiculos.find(function(vehiculo) {
        return vehiculo.identificador_sistema === identificadorVehiculo;
    });
    // Recupera la sesión activa actual para cargar los datos del propietario.
    const usuarioActivo = JSON.parse(localStorage.getItem('sesion_activa'));

    // Si no se encuentra el registro del vehículo, detiene la apertura de la ficha.
    if (!vehiculoEncontrado) {
        return;
    }

    // Referencias a los elementos de cabecera del modal de la ficha vehicular.
    const etiquetaPlaca = document.querySelector('.etiqueta-placa-ficha');
    const etiquetaIdentificadorModal = document.querySelector('.identificador-texto-modal .dato-valor');
    const imagenCodigoQr = document.querySelector('.imagen-qr-modal');

    // Asigna la información en los elementos de cabecera si están presentes en el DOM.
    if (etiquetaPlaca) {
        etiquetaPlaca.textContent = vehiculoEncontrado.placa_vehicular;
    }
    if (etiquetaIdentificadorModal) {
        etiquetaIdentificadorModal.textContent = vehiculoEncontrado.identificador_sistema;
    }
    if (imagenCodigoQr) {
        imagenCodigoQr.src = vehiculoEncontrado.codigo_qr_ruta || '';
    }

    // document.querySelectorAll: Selecciona los campos de datos de especificación técnica del vehículo en la primera columna.
    const elementosDatosVehiculo = document.querySelectorAll('#modal-ficha-vehicular .columna-modal:first-child .tarjeta-informacion-modal .item-dato-modal span');
    if (elementosDatosVehiculo.length >= 5) {
        elementosDatosVehiculo[0].textContent = vehiculoEncontrado.tipo_vehiculo;
        elementosDatosVehiculo[1].textContent = `${vehiculoEncontrado.fabricante} ${vehiculoEncontrado.modelo}`;
        elementosDatosVehiculo[2].textContent = vehiculoEncontrado.anio_fabricacion;
        elementosDatosVehiculo[3].textContent = vehiculoEncontrado.color;
        elementosDatosVehiculo[4].textContent = vehiculoEncontrado.observaciones;
    }

    // document.querySelectorAll: Selecciona los campos de datos de auditoría y autorización en la segunda columna.
    const elementosDatosRegistro = document.querySelectorAll('#modal-ficha-vehicular .columna-modal:last-child .tarjeta-informacion-modal:nth-child(2) .item-dato-modal span');
    if (elementosDatosRegistro.length >= 3) {
        elementosDatosRegistro[0].textContent = vehiculoEncontrado.fecha_registro;
        elementosDatosRegistro[1].textContent = vehiculoEncontrado.fecha_actualizacion;
        elementosDatosRegistro[2].textContent = vehiculoEncontrado.estado_autorizacion;
    }

    // document.querySelectorAll: Selecciona los campos de datos personales e institucionales del propietario del vehículo.
    const elementosDatosPropietario = document.querySelectorAll('#modal-ficha-vehicular .columna-modal:last-child .tarjeta-informacion-modal:nth-child(3) .item-dato-modal span');
    if (elementosDatosPropietario.length >= 6 && usuarioActivo) {
        elementosDatosPropietario[0].textContent = usuarioActivo.nombres_apellidos;
        elementosDatosPropietario[1].textContent = usuarioActivo.numero_identificacion;
        elementosDatosPropietario[2].textContent = usuarioActivo.correo_institucional;
        elementosDatosPropietario[3].textContent = usuarioActivo.tipo_usuario;
        elementosDatosPropietario[4].textContent = usuarioActivo.facultad;
        elementosDatosPropietario[5].textContent = usuarioActivo.carrera;
    }

    // Despliega la ventana modal de la ficha técnica vehicular.
    abrirModal('modal-ficha-vehicular');
}

// Configura y despliega el modal de confirmación antes de desvincular un vehículo.
function abrirConfirmarDesvinculo(identificadorVehiculo) {
    // Almacena en la variable global el identificador del vehículo seleccionado.
    vehiculoSeleccionadoParaDesvincular = identificadorVehiculo;

    // Actualiza el texto visual del identificador en el modal de confirmación.
    const etiquetaIdentificadorDesvinculo = document.querySelector('.identificador-vehiculo-enfasis .dato-valor');
    if (etiquetaIdentificadorDesvinculo) {
        etiquetaIdentificadorDesvinculo.textContent = identificadorVehiculo;
    }

    // Despliega el modal de advertencia y confirmación de desvinculación.
    abrirModal('modal-desvincular-vehiculo');
}

// Asigna las funciones al objeto global window para permitir su invocación desde atributos HTML.
window.abrirFichaVehiculo = abrirFichaVehiculo;
window.abrirConfirmarDesvinculo = abrirConfirmarDesvinculo;