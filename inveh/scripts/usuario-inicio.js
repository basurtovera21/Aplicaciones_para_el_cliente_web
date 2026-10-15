 document.addEventListener('DOMContentLoaded', function() {
    const usuarioActivo = JSON.parse(localStorage.getItem('sesion_activa'));
    const datosGlobales = obtenerBaseDatos();

    if (!usuarioActivo) {
        window.location.href = 'inicio-sesion.html';
        return;
    }


    const nombreHeader = document.querySelector('.nombre-usuario-sesion');
    if (nombreHeader) {
        nombreHeader.textContent = usuarioActivo.nombres_apellidos;
    }


    const nombreRolPerfil = document.querySelector('.nombre-rol-usuario');
    const idUsuario = document.querySelector('.fila-datos-institucionales span:nth-child(1) .dato-valor');
    const correoUsuario = document.querySelector('.fila-datos-institucionales span:nth-child(2) .dato-valor');
    const facultadUsuario = document.querySelector('.fila-datos-institucionales span:nth-child(3) .dato-valor');
    const contenedorAvatar = document.querySelector('.avatar-iniciales-usuario');

    if (nombreRolPerfil) {
        nombreRolPerfil.textContent = `${usuarioActivo.nombres_apellidos} (${usuarioActivo.tipo_usuario})`;
    }
    if (idUsuario) idUsuario.textContent = usuarioActivo.numero_identificacion;
    if (correoUsuario) correoUsuario.textContent = usuarioActivo.correo_institucional;
    if (facultadUsuario) facultadUsuario.textContent = usuarioActivo.facultad;


    const partesNombre = usuarioActivo.nombres_apellidos.trim().split(/\s+/);
    const iniciales = (partesNombre[0][0] + (partesNombre[2] ? partesNombre[2][0] : (partesNombre[1] ? partesNombre[1][0] : ''))).toUpperCase();
    if (contenedorAvatar) contenedorAvatar.textContent = iniciales;


    const contenedorRejilla = document.querySelector('.rejilla-vehiculos-usuario');
    const contenedorFilaBoton = document.querySelector('.fila-accion-vehiculo-adicional');
    const botonRequerir = document.getElementById('boton-abrir-registro-vehiculo');
    const textoBotonRequerir = botonRequerir ? botonRequerir.querySelector('span') : null;


    const todosLosVehiculosUsuario = datosGlobales.vehiculos.filter(v => v.propietario_id === usuarioActivo.numero_identificacion);


    const vehiculosAutorizados = todosLosVehiculosUsuario.filter(v => v.estado_autorizacion === "Autorizado");


    const contadorTexto = document.querySelector('.indicador-contador-vehiculos');
    if (contadorTexto) {
        contadorTexto.textContent = `Registro de vehículos: ${vehiculosAutorizados.length} de 2 permitidos`;
    }

   
    if (todosLosVehiculosUsuario.length >= 2) {

        if (contenedorFilaBoton) contenedorFilaBoton.style.display = 'none';
        if (botonRequerir) botonRequerir.style.display = 'none';
    } else {
        if (contenedorFilaBoton) contenedorFilaBoton.style.display = 'flex';
        if (botonRequerir) botonRequerir.style.display = 'inline-flex';


        if (textoBotonRequerir) {
            if (vehiculosAutorizados.length === 0) {
                textoBotonRequerir.textContent = "Registrar vehículo";
            } else {
                textoBotonRequerir.textContent = "Requerir vehículo adicional";
            }
        }
    }


    if (contenedorRejilla) {
        contenedorRejilla.innerHTML = '';
        vehiculosAutorizados.forEach(vehiculo => {
            const tarjetaHTML = `
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
            contenedorRejilla.insertAdjacentHTML('beforeend', tarjetaHTML);
        });
    }

  
    document.getElementById('boton-cerrar-sesion')?.addEventListener('click', function() {
        localStorage.removeItem('sesion_activa');
        window.location.href = 'inicio-sesion.html';
    });

    document.getElementById('boton-abrir-registro-vehiculo')?.addEventListener('click', () => {
        abrirModal('modal-registro-vehiculo');
    });

    document.getElementById('boton-abrir-crear-autorizacion')?.addEventListener('click', () => {
        abrirModal('modal-crear-autorizacion');
    });

    document.getElementById('boton-proceder-desvincular')?.addEventListener('click', function() {
        cerrarModal('modal-desvincular-vehiculo');
        setTimeout(() => {
            abrirModal('modal-desvinculacion-exito');
        }, 400);
    });
});



function abrirFichaVehiculo(idVehiculo) {
    const db = obtenerBaseDatos();
    const vehiculo = db.vehiculos.find(v => v.identificador_sistema === idVehiculo);
    const usuario = JSON.parse(localStorage.getItem('sesion_activa'));

    if (!vehiculo) return;

    const etiquetaPlaca = document.querySelector('.etiqueta-placa-ficha');
    const identificadorModal = document.querySelector('.identificador-texto-modal .dato-valor');
    const imagenQr = document.querySelector('.imagen-qr-modal');

    if (etiquetaPlaca) etiquetaPlaca.textContent = vehiculo.placa_vehicular;
    if (identificadorModal) identificadorModal.textContent = vehiculo.identificador_sistema;
    if (imagenQr) imagenQr.src = vehiculo.codigo_qr_ruta || '';


    const itemsVehiculo = document.querySelectorAll('#modal-ficha-vehicular .columna-modal:first-child .tarjeta-informacion-modal .item-dato-modal span');
    if (itemsVehiculo.length >= 5) {
        itemsVehiculo[0].textContent = vehiculo.tipo_vehiculo;
        itemsVehiculo[1].textContent = `${vehiculo.fabricante} ${vehiculo.modelo}`;
        itemsVehiculo[2].textContent = vehiculo.anio_fabricacion;
        itemsVehiculo[3].textContent = vehiculo.color;
        itemsVehiculo[4].textContent = vehiculo.observaciones;
    }


    const itemsRegistro = document.querySelectorAll('#modal-ficha-vehicular .columna-modal:last-child .tarjeta-informacion-modal:nth-child(2) .item-dato-modal span');
    if (itemsRegistro.length >= 3) {
        itemsRegistro[0].textContent = vehiculo.fecha_registro;
        itemsRegistro[1].textContent = vehiculo.fecha_actualizacion;
        itemsRegistro[2].textContent = vehiculo.estado_autorizacion;
    }


    const itemsPropietario = document.querySelectorAll('#modal-ficha-vehicular .columna-modal:last-child .tarjeta-informacion-modal:nth-child(3) .item-dato-modal span');
    if (itemsPropietario.length >= 6 && usuario) {
        itemsPropietario[0].textContent = usuario.nombres_apellidos;
        itemsPropietario[1].textContent = usuario.numero_identificacion;
        itemsPropietario[2].textContent = usuario.correo_institucional;
        itemsPropietario[3].textContent = usuario.tipo_usuario;
        itemsPropietario[4].textContent = usuario.facultad;
        itemsPropietario[5].textContent = usuario.carrera;
    }

    abrirModal('modal-ficha-vehicular');
}

function abrirConfirmarDesvinculo(idVehiculo) {
    const contenedorTexto = document.querySelector('.identificador-vehiculo-enfasis .dato-valor');
    if (contenedorTexto) {
        contenedorTexto.textContent = idVehiculo;
    }
    abrirModal('modal-desvincular-vehiculo');
}