let vehiculoActualEnFicha = null;
let vehiculoParaDesvincularAdmin = null;
let placaVehiculoEnRevision = null;
let idAutorizacionEnRevision = null;

// Funciones seguras para lectura y escritura de la base de datos
function obtenerDB() {
    const datos = typeof obtenerBaseDatos === 'function' 
        ? obtenerBaseDatos() 
        : JSON.parse(localStorage.getItem('base_de_datos') || localStorage.getItem('inveh_db'));
    return datos || { usuarios: [], vehiculos: [], autorizaciones_visitas: [] };
}

function guardarDB(datosActualizados) {
    if (typeof guardarCambios === 'function') {
        guardarCambios(datosActualizados);
    } else {
        localStorage.setItem('base_de_datos', JSON.stringify(datosActualizados));
        localStorage.setItem('inveh_db', JSON.stringify(datosActualizados));
    }
}

// Formato de fecha DD/MM/YYYY y hora HH:MM
function obtenerFechaHoraActual() {
    const ahora = new Date();
    const dia = String(ahora.getDate()).padStart(2, '0');
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const anio = ahora.getFullYear();
    const horas = String(ahora.getHours()).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    return {
        fecha: `${dia}/${mes}/${anio}`,
        textoCompleto: `${dia}/${mes}/${anio} a las ${horas}:${minutos}.`
    };
}

// Generador de identificador consecutivo formal (VEH-000640, VEH-000641...)
function generarSiguienteIdentificador(listaVehiculos) {
    let maxNum = 639;
    if (Array.isArray(listaVehiculos)) {
        listaVehiculos.forEach(v => {
            if (v.identificador_sistema && v.identificador_sistema.startsWith('VEH-')) {
                const num = parseInt(v.identificador_sistema.replace('VEH-', ''), 10);
                if (!isNaN(num) && num > maxNum) maxNum = num;
            }
        });
    }
    return `VEH-${String(maxNum + 1).padStart(6, '0')}`;
}

document.addEventListener('DOMContentLoaded', function() {
    // 1. VERIFICAR SESIÓN DE ADMINISTRADOR
    const sesion = JSON.parse(localStorage.getItem('sesion_activa'));
    if (!sesion || sesion.rol_sistema !== 'admin') {
        window.location.href = 'inicio-sesion.html';
        return;
    }

    // 2. CERRAR SESIÓN
    document.getElementById('boton-cerrar-sesion')?.addEventListener('click', () => {
        localStorage.removeItem('sesion_activa');
        window.location.href = 'inicio-sesion.html';
    });

    // 3. CALCULAR Y PINTAR MÉTRICAS EN VIVO
    function actualizarMetricas() {
        const db = obtenerDB();
        const vehiculos = db.vehiculos || [];
        const autorizaciones = db.autorizaciones_visitas || [];

        // Conteo 1: Vehículos autorizados
        const totalAutorizados = vehiculos.filter(v => v.estado_autorizacion === "Autorizado").length;
        const elem1 = document.getElementById('metrica-vehiculos-autorizados');
        if (elem1) elem1.textContent = totalAutorizados;

        // Conteo 2: Vehículos dentro de las instalaciones
        const totalEnInstalaciones = vehiculos.filter(v => 
            v.estado_autorizacion === "Autorizado" && v.ubicacion_actual === "Dentro de las instalaciones"
        ).length;
        const elem2 = document.getElementById('metrica-vehiculos-instalaciones');
        if (elem2) elem2.textContent = totalEnInstalaciones;

        // Conteo 3: Solicitudes pendientes totales
        const vehiculosPendientes = vehiculos.filter(v => v.estado_autorizacion === "Pendiente").length;
        const visitasPendientes = autorizaciones.filter(a => a.estado_solicitud === "Pendiente").length;
        const elem3 = document.getElementById('metrica-solicitudes-pendientes');
        if (elem3) elem3.textContent = vehiculosPendientes + visitasPendientes;

        // Conteo 4: Visitas autorizadas para hoy
        const hoyISO = new Date().toISOString().split('T')[0];
        const visitasHoy = autorizaciones.filter(a => 
            a.estado_solicitud === "Autorizado" && a.visita && a.visita.fecha_programada === hoyISO
        ).length;
        const elem4 = document.getElementById('metrica-visitas-hoy');
        if (elem4) elem4.textContent = visitasHoy;
    }

    // 4. RENDERIZAR TABLA DE SOLICITUDES PENDIENTES (TARJETA 2)
    function renderizarSolicitudesPendientes() {
        const contenedor = document.getElementById('cuerpo-tabla-pendientes');
        if (!contenedor) return;

        const db = obtenerDB();
        const vehiculosPendientes = (db.vehiculos || []).filter(v => v.estado_autorizacion === "Pendiente");
        const visitasPendientes = (db.autorizaciones_visitas || []).filter(a => a.estado_solicitud === "Pendiente");

        contenedor.innerHTML = '';

        if (vehiculosPendientes.length === 0 && visitasPendientes.length === 0) {
            contenedor.innerHTML = `<tr><td colspan="5" class="mensaje-tabla-vacia">No existen registros de solicitudes pendientes para revisión</td></tr>`;
            return;
        }

        // Solicitudes de Registro Vehicular
        vehiculosPendientes.forEach(solicitud => {
            const propietario = (db.usuarios || []).find(u => u.numero_identificacion === solicitud.propietario_id);
            const nombre = propietario ? `${propietario.nombres_apellidos} (${propietario.tipo_usuario})` : "Usuario institucional";

            const fila = `
                <tr>
                    <td>${solicitud.fecha_registro}</td>
                    <td>${nombre}</td>
                    <td><strong>${solicitud.placa_vehicular}</strong></td>
                    <td>${solicitud.tipo_vehiculo}</td>
                    <td class="columna-centrada">
                        <button type="button" class="boton-tabla-icono" title="Revisar solicitud vehicular" onclick="abrirRevisionRegistro('${solicitud.identificador_sistema || solicitud.placa_vehicular}')">
                            <img src="recursos/imagenes/crear-autorizacion.svg" alt="Revisar">
                        </button>
                    </td>
                </tr>`;
            contenedor.insertAdjacentHTML('beforeend', fila);
        });

        // Solicitudes de Visitas
        visitasPendientes.forEach(solicitud => {
            const solicitante = (db.usuarios || []).find(u => u.numero_identificacion === solicitud.solicitante_id);
            const tipoUsuario = (solicitante && solicitante.tipo_usuario) ? ` (${solicitante.tipo_usuario})` : "";
            const nombreSolicitante = solicitante 
                ? `${solicitante.nombres_apellidos}${tipoUsuario} <strong>(Visita)</strong>` 
                : `Solicitante institucional <strong>(Visita)</strong>`;

            const valorPlaca = (solicitud.vehiculo && solicitud.vehiculo.placa_vehicular) ? solicitud.vehiculo.placa_vehicular : "S/P";
            const tipoVehiculo = (solicitud.vehiculo && solicitud.vehiculo.tipo_vehiculo) ? solicitud.vehiculo.tipo_vehiculo : "Peatonal / Otro";

            const fila = `
                <tr>
                    <td>${solicitud.fecha_registro}</td>
                    <td>${nombreSolicitante}</td>
                    <td><strong>${valorPlaca}</strong></td>
                    <td>${tipoVehiculo}</td>
                    <td class="columna-centrada">
                        <button type="button" class="boton-tabla-icono" title="Revisar autorización de visita" onclick="abrirRevisionAutorizacion('${solicitud.identificador_solicitud}')">
                            <img src="recursos/imagenes/crear-autorizacion.svg" alt="Revisar">
                        </button>
                    </td>
                </tr>`;
            contenedor.insertAdjacentHTML('beforeend', fila);
        });
    }

    // 5. RENDERIZAR REGISTRO VEHICULAR CON FILTROS (TARJETA 3: EXCLUSIVAMENTE VEHÍCULOS DE USUARIOS)
    function renderizarRegistroVehicular(filtroTexto = '', filtroUsuario = '', filtroVehiculo = '') {
        const contenedor = document.getElementById('cuerpo-tabla-registro-institucional');
        if (!contenedor) return;

        const db = obtenerDB();
        // Solo vehículos autorizados de los usuarios institucionales (no visitas ni temporales)
        const vehiculosAutorizados = (db.vehiculos || []).filter(v => v.estado_autorizacion === "Autorizado");

        contenedor.innerHTML = '';

        const normalizar = (txt) => (txt || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
        const filtroNorm = normalizar(filtroTexto);

        const resultados = vehiculosAutorizados.filter(v => {
            const propietario = (db.usuarios || []).find(u => u.numero_identificacion === v.propietario_id);
            const nombrePropietario = propietario ? propietario.nombres_apellidos : '';
            const tipoUsuario = propietario ? propietario.tipo_usuario : '';

            const idTexto = (v.identificador_sistema || '').toLowerCase();
            const idNorm = normalizar(v.identificador_sistema);
            const placaTexto = (v.placa_vehicular || '').toLowerCase();
            const placaNorm = normalizar(v.placa_vehicular);
            const nombreTexto = nombrePropietario.toLowerCase();
            const nombreNorm = normalizar(nombrePropietario);

            const coincideTexto = !filtroTexto || 
                idTexto.includes(filtroTexto) ||
                idNorm.includes(filtroNorm) ||
                placaTexto.includes(filtroTexto) ||
                placaNorm.includes(filtroNorm) ||
                nombreTexto.includes(filtroTexto) ||
                nombreNorm.includes(filtroNorm);

            const coincideUsuario = !filtroUsuario || tipoUsuario === filtroUsuario;
            const coincideVehiculo = !filtroVehiculo || v.tipo_vehiculo === filtroVehiculo;

            return coincideTexto && coincideUsuario && coincideVehiculo;
        });

        if (resultados.length === 0) {
            contenedor.innerHTML = `<tr><td colspan="5" class="mensaje-tabla-vacia">No se encontraron registros de vehículos con los criterios seleccionados</td></tr>`;
            return;
        }

        resultados.forEach(v => {
            const propietario = (db.usuarios || []).find(u => u.numero_identificacion === v.propietario_id);
            const nombreCompleto = propietario 
                ? `${propietario.nombres_apellidos} (${propietario.tipo_usuario})` 
                : "Sin propietario asignado";

            const fila = `
                <tr>
                    <td><span class="dato-valor">${v.identificador_sistema}</span></td>
                    <td>${nombreCompleto}</td>
                    <td><strong>${v.placa_vehicular}</strong></td>
                    <td>${v.tipo_vehiculo}</td>
                    <td class="columna-centrada">
                        <button type="button" class="boton-tabla-icono" title="Ver ficha técnica" onclick="abrirFichaVehiculoAdmin('${v.identificador_sistema}')">
                            <img src="recursos/imagenes/ficha-vehicular.svg" alt="Ver">
                        </button>
                    </td>
                </tr>`;
            contenedor.insertAdjacentHTML('beforeend', fila);
        });
    }

    // 6. FILTRADO DINÁMICO
    function ejecutarFiltros() {
        const texto = document.getElementById('filtro-busqueda-general')?.value.trim().toLowerCase() || '';
        const tipoUsr = document.getElementById('filtro-tipo-usuario')?.value || '';
        const tipoVeh = document.getElementById('filtro-tipo-vehiculo')?.value || '';
        renderizarRegistroVehicular(texto, tipoUsr, tipoVeh);
    }

    document.getElementById('boton-ejecutar-filtro')?.addEventListener('click', ejecutarFiltros);
    document.getElementById('filtro-busqueda-general')?.addEventListener('input', ejecutarFiltros);
    document.getElementById('filtro-tipo-usuario')?.addEventListener('change', ejecutarFiltros);
    document.getElementById('filtro-tipo-vehiculo')?.addEventListener('change', ejecutarFiltros);


    document.getElementById('boton-registro-actividades')?.addEventListener('click', () => {
        renderizarRegistroActividadesModal();
        abrirModal('modal-registro-actividades');
    });

    // 2. Función para pintar la tabla y aplicar filtros en vivo (Solo usuarios institucionales)
    function renderizarRegistroActividadesModal() {
        const contenedor = document.getElementById('cuerpo-tabla-actividades-modal');
        if (!contenedor) return;

        // Capturar filtros
        const filtroTexto = document.getElementById('filtro-modal-act-texto')?.value.trim().toLowerCase() || '';
        const filtroFecha = document.getElementById('filtro-modal-act-fecha')?.value || ''; // Viene en formato YYYY-MM-DD
        const filtroPunto = document.getElementById('filtro-modal-act-punto')?.value || '';
        const filtroMov = document.getElementById('filtro-modal-act-mov')?.value || '';

        const dbActual = obtenerDB();
        const historial = dbActual.historial_movimientos || [];

        contenedor.innerHTML = '';

        // Formatear la fecha seleccionada de YYYY-MM-DD a DD/MM/YYYY para comparar con la BD
        let fechaFormateada = '';
        if (filtroFecha) {
            const [y, m, d] = filtroFecha.split('-');
            fechaFormateada = `${d}/${m}/${y}`;
        }

        const normalizar = (txt) => (txt || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
        const filtroNorm = normalizar(filtroTexto);

        // Filtrar exclusivamente los movimientos de usuarios institucionales (excluyendo visitantes y temporales con acceso)
        const historialUsuarios = historial.filter(item => {
            const esVisitante = item.tipo_usuario === "Visitante" || 
                (item.identificador && item.identificador.startsWith("AUT-")) ||
                (item.identificador_solicitud && item.identificador_solicitud.startsWith("AUT-"));
            return !esVisitante;
        });

        // Pre-procesar cada movimiento con su identificador institucional y tipo de vehículo exacto
        const movimientosConInfo = historialUsuarios.slice().reverse().map(item => {
            const vehiculoReal = (dbActual.vehiculos || []).find(v => 
                v.placa_vehicular === item.placa_vehicular || 
                (v.identificador_sistema && item.identificador && v.identificador_sistema === item.identificador)
            );
            
            const identificador = vehiculoReal ? vehiculoReal.identificador_sistema : (item.identificador || "-");
            const tipoVehiculo = vehiculoReal ? vehiculoReal.tipo_vehiculo : (item.tipo_vehiculo || "-");

            return {
                ...item,
                identificadorCalculado: identificador,
                tipoVehiculoCalculado: tipoVehiculo
            };
        });

        // Filtrar array con todos los criterios de búsqueda
        const resultados = movimientosConInfo.filter(item => {
            const idTexto = item.identificadorCalculado.toLowerCase();
            const idNorm = normalizar(item.identificadorCalculado);
            const placaTexto = (item.placa_vehicular || '').toLowerCase();
            const placaNorm = normalizar(item.placa_vehicular);
            const propTexto = (item.propietario || '').toLowerCase();
            const propNorm = normalizar(item.propietario);

            const coincideTexto = !filtroTexto || 
                idTexto.includes(filtroTexto) ||
                idNorm.includes(filtroNorm) ||
                placaTexto.includes(filtroTexto) ||
                placaNorm.includes(filtroNorm) ||
                propTexto.includes(filtroTexto) ||
                propNorm.includes(filtroNorm);
            
            const coincideFecha = !fechaFormateada || item.fecha === fechaFormateada;
            
            // "Punto de control N01" -> "N01"
            const ptoItem = item.punto_control ? item.punto_control.replace('Punto de control ', '') : 'N01';
            const coincidePunto = !filtroPunto || ptoItem === filtroPunto;
            
            const coincideMov = !filtroMov || item.tipo_movimiento === filtroMov;

            return coincideTexto && coincideFecha && coincidePunto && coincideMov;
        });

        if (resultados.length === 0) {
            contenedor.innerHTML = `<tr><td colspan="7" class="mensaje-tabla-vacia">No se encontraron movimientos de usuarios registrados con estos criterios.</td></tr>`;
            return;
        }

        resultados.forEach(item => {
            const botonFichaHtml = (item.identificadorCalculado && item.identificadorCalculado !== "-")
                ? `<button type="button" class="boton-tabla-icono" title="Ver ficha técnica" onclick="abrirFichaVehiculoAdmin('${item.identificadorCalculado}')">
                       <img src="recursos/imagenes/ficha-vehicular.svg" alt="Ficha">
                   </button>`
                : ``;

            const puntoFormateado = item.punto_control ? item.punto_control.replace('Punto de control ', '') : 'N01';

            const fila = `
                <tr>
                    <td>${item.fecha} - ${item.hora}</td>
                    <td><span class="dato-valor">${item.identificadorCalculado}</span></td>
                    <td><strong>${item.placa_vehicular}</strong></td>
                    <td>${item.tipoVehiculoCalculado}</td>
                    <td>${puntoFormateado}</td>
                    <td><strong>${item.tipo_movimiento}</strong></td>
                    <td class="columna-centrada">${botonFichaHtml}</td>
                </tr>
            `;
            contenedor.insertAdjacentHTML('beforeend', fila);
        });
    }

    // 3. Eventos en tiempo real para los 4 filtros del modal
    document.getElementById('filtro-modal-act-texto')?.addEventListener('input', renderizarRegistroActividadesModal);
    document.getElementById('filtro-modal-act-fecha')?.addEventListener('change', renderizarRegistroActividadesModal);
    document.getElementById('filtro-modal-act-punto')?.addEventListener('change', renderizarRegistroActividadesModal);
    document.getElementById('filtro-modal-act-mov')?.addEventListener('change', renderizarRegistroActividadesModal);


    // 7. BOTONES DE LA FICHA VEHICULAR

    // Botón: Modificar Información
    document.getElementById('btn-admin-modificar-vehiculo')?.addEventListener('click', () => {
        const idActual = vehiculoActualEnFicha || document.querySelector('#modal-ficha-vehicular .identificador-texto-modal .dato-valor')?.textContent.trim();
        if (!idActual || idActual === '-') return;

        cerrarModal('modal-ficha-vehicular');
        abrirModalModificarVehiculo(idActual);
    });

    // Botón: Exportar Ficha PDF (Solo credencial del vehículo seleccionado)
    document.getElementById('btn-admin-exportar-pdf')?.addEventListener('click', () => {
        const botonExportarPdf = document.getElementById('btn-admin-exportar-pdf');
        if (botonExportarPdf) {
            botonExportarPdf.onclick = function() {
                const idActual = (typeof vehiculoActualEnFicha !== 'undefined' && vehiculoActualEnFicha)
                    ? vehiculoActualEnFicha
                    : document.querySelector('#modal-ficha-vehicular .identificador-texto-modal .dato-valor')?.textContent.trim();

                if (!idActual || idActual === '-') return;

                const db = typeof obtenerBaseDatos === 'function' 
                    ? obtenerBaseDatos() 
                    : JSON.parse(localStorage.getItem('base_de_datos') || localStorage.getItem('inveh_db'));

                const vehiculo = (db?.vehiculos || []).find(v => v.identificador_sistema === idActual);
                if (!vehiculo) return;

                const printPlaca = document.getElementById('print-placa');
                const printQr = document.getElementById('print-qr');
                const printId = document.getElementById('print-identificador');

                if (printPlaca) printPlaca.textContent = vehiculo.placa_vehicular;
                if (printId) printId.textContent = vehiculo.identificador_sistema;

                // Bandera de control para evitar que se dispare dos veces
                let yaSeImprimio = false;
                function dispararImpresionUnica() {
                    if (yaSeImprimio) return;
                    yaSeImprimio = true;
                    window.print();
                }

                if (printQr) {
                    const rutaQr = (vehiculo.codigo_qr_ruta && vehiculo.codigo_qr_ruta !== "")
                        ? vehiculo.codigo_qr_ruta
                        : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(vehiculo.identificador_sistema + '|' + vehiculo.placa_vehicular)}`;

                    printQr.onload = dispararImpresionUnica;
                    printQr.onerror = () => {
                        printQr.src = "recursos/imagenes/codigo-qr.png";
                        dispararImpresionUnica();
                    };

                    printQr.src = rutaQr;

                    // Si la imagen ya está en caché y cargada, dispara una sola vez
                    if (printQr.complete && printQr.naturalWidth !== 0) {
                        dispararImpresionUnica();
                    }
                } else {
                    dispararImpresionUnica();
                }
            };
        }
    });

    // Botón: Desvincular Vehículo desde la Ficha
    document.getElementById('btn-admin-desvincular-ficha')?.addEventListener('click', () => {
        const idActual = vehiculoActualEnFicha || document.querySelector('#modal-ficha-vehicular .identificador-texto-modal .dato-valor')?.textContent.trim();
        if (!idActual || idActual === '-') return;

        vehiculoParaDesvincularAdmin = idActual;
        cerrarModal('modal-ficha-vehicular');

        const textoIdentificador = document.querySelector('#modal-desvincular-vehiculo .identificador-vehiculo-enfasis .dato-valor');
        if (textoIdentificador) {
            textoIdentificador.textContent = idActual;
        }
        abrirModal('modal-desvincular-vehiculo');
    });

    // Confirmar Desvinculación ("Sí, desvincular")
    document.getElementById('boton-proceder-desvincular')?.addEventListener('click', () => {
        if (!vehiculoParaDesvincularAdmin) return;
        const db = obtenerDB();

        db.vehiculos = (db.vehiculos || []).filter(v => v.identificador_sistema !== vehiculoParaDesvincularAdmin);
        guardarDB(db);

        cerrarModal('modal-desvincular-vehiculo');
        setTimeout(() => {
            abrirModal('modal-desvinculacion-exito');
            actualizarMetricas();
            renderizarRegistroVehicular();
            renderizarSolicitudesPendientes();
        }, 300);
    });

    // --- GUARDAR CAMBIOS DE LA MODIFICACIÓN ---
    document.getElementById('form-modificar-vehiculo')?.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!vehiculoActualEnFicha) return;

        const db = obtenerDB();
        const vehiculo = (db.vehiculos || []).find(v => v.identificador_sistema === vehiculoActualEnFicha);

        if (vehiculo) {
            const tiempo = obtenerFechaHoraActual();

            // 1. Actualizar únicamente los campos editables
            vehiculo.color = document.getElementById('mod-color-vehiculo').value.trim() || vehiculo.color;
            vehiculo.estado_autorizacion = document.getElementById('mod-estado-vehiculo').value;
            vehiculo.observaciones = document.getElementById('mod-observaciones-vehiculo').value.trim() || 'Sin observaciones';
            
            // 2. Registrar la fecha de actualización
            vehiculo.fecha_actualizacion = tiempo.fecha;

            // 3. Persistir cambios en LocalStorage
            guardarDB(db);

            // 4. Cerrar formulario y abrir confirmación de éxito exacta de Figma
            cerrarModal('modal-modificar-vehiculo');

            const tituloModal = document.getElementById('titulo-modal-exito-admin');
            const infoModal = document.getElementById('info-fecha-exito-admin');

            if (tituloModal) {
                tituloModal.textContent = "Registro vehicular modificado correctamente";
            }
            if (infoModal) {
                infoModal.textContent = `Fecha y hora en que se modificó el registro: ${tiempo.textoCompleto}`;
            }

            setTimeout(() => {
                abrirModal('modal-admin-exito');
                actualizarMetricas();
                renderizarRegistroVehicular();
                renderizarSolicitudesPendientes();
            }, 300);
        }
    });

    // 8. BOTONES: APROBAR Y RECHAZAR SOLICITUDES

    // ACEPTAR REGISTRO VEHICULAR
    document.getElementById('btn-aprobar-registro')?.addEventListener('click', () => {
        if (!placaVehiculoEnRevision) return;
        const db = obtenerDB();
        const vehiculo = (db.vehiculos || []).find(v => v.placa_vehicular === placaVehiculoEnRevision);

        if (vehiculo) {
            const tiempo = obtenerFechaHoraActual();
            vehiculo.identificador_sistema = generarSiguienteIdentificador(db.vehiculos.filter(v => v.estado_autorizacion === "Autorizado"));
            vehiculo.codigo_qr_ruta = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(vehiculo.identificador_sistema + '|' + vehiculo.placa_vehicular)}`;
            vehiculo.estado_autorizacion = "Autorizado";
            vehiculo.fecha_registro = tiempo.fecha;
            vehiculo.fecha_actualizacion = tiempo.fecha;
            
            guardarDB(db);
            cerrarModal('modal-revision-registro');

            const tituloModal = document.getElementById('titulo-modal-exito-admin');
            const infoModal = document.getElementById('info-fecha-exito-admin');
            if (tituloModal) tituloModal.textContent = "Registro vehicular creado correctamente";
            if (infoModal) infoModal.textContent = `Fecha y hora en que se creó el registro: ${tiempo.textoCompleto}`;

            setTimeout(() => {
                abrirModal('modal-admin-exito');
                actualizarMetricas();
                renderizarSolicitudesPendientes();
                renderizarRegistroVehicular();
            }, 300);
        }
    });

    // RECHAZAR REGISTRO VEHICULAR
    document.getElementById('btn-rechazar-registro')?.addEventListener('click', () => {
        if (!placaVehiculoEnRevision) return;
        const db = obtenerDB();
        db.vehiculos = (db.vehiculos || []).filter(v => v.placa_vehicular !== placaVehiculoEnRevision);
        
        guardarDB(db);
        cerrarModal('modal-revision-registro');
        actualizarMetricas();
        renderizarSolicitudesPendientes();
    });

    // ACEPTAR VISITA
    document.getElementById('btn-aprobar-autorizacion')?.addEventListener('click', () => {
        if (!idAutorizacionEnRevision) return;
        const db = obtenerDB();
        const autorizacion = (db.autorizaciones_visitas || []).find(a => a.identificador_solicitud === idAutorizacionEnRevision);

        if (autorizacion) {
            const tiempo = obtenerFechaHoraActual();
            autorizacion.estado_solicitud = "Autorizado";
            autorizacion.fecha_actualizacion = tiempo.fecha;
            
            guardarDB(db);
            cerrarModal('modal-revision-autorizacion');

            const tituloModal = document.getElementById('titulo-modal-exito-admin');
            const infoModal = document.getElementById('info-fecha-exito-admin');
            if (tituloModal) tituloModal.textContent = "Autorización de acceso creada correctamente";
            if (infoModal) infoModal.textContent = `Fecha y hora en que se aprobó la solicitud: ${tiempo.textoCompleto}`;

            setTimeout(() => {
                abrirModal('modal-admin-exito');
                actualizarMetricas();
                renderizarSolicitudesPendientes();
            }, 300);
        }
    });

    // RECHAZAR VISITA
    document.getElementById('btn-rechazar-autorizacion')?.addEventListener('click', () => {
        if (!idAutorizacionEnRevision) return;
        const db = obtenerDB();
        db.autorizaciones_visitas = (db.autorizaciones_visitas || []).filter(a => a.identificador_solicitud !== idAutorizacionEnRevision);
        
        guardarDB(db);
        cerrarModal('modal-revision-autorizacion');
        actualizarMetricas();
        renderizarSolicitudesPendientes();
    });

    // Carga inicial
    actualizarMetricas();
    renderizarSolicitudesPendientes();
    renderizarRegistroVehicular();
});


// FUNCIONES GLOBALES PARA ABRIR MODALES CON DATOS EN VIVO


function abrirRevisionRegistro(idOPlaca) {
    const db = obtenerDB();
    const vehiculo = (db.vehiculos || []).find(v => v.identificador_sistema === idOPlaca || v.placa_vehicular === idOPlaca);
    if (!vehiculo) return;

    placaVehiculoEnRevision = vehiculo.placa_vehicular;
    const solicitante = (db.usuarios || []).find(u => u.numero_identificacion === vehiculo.propietario_id);

    if (solicitante) {
        document.getElementById('rev-reg-nombre').textContent = solicitante.nombres_apellidos;
        document.getElementById('rev-reg-cedula').textContent = solicitante.numero_identificacion;
        document.getElementById('rev-reg-correo').textContent = solicitante.correo_institucional || '-';
        document.getElementById('rev-reg-tipo').textContent = solicitante.tipo_usuario || '-';
        document.getElementById('rev-reg-facultad').textContent = solicitante.facultad || '-';
    }

    document.getElementById('rev-reg-placa').textContent = vehiculo.placa_vehicular;
    document.getElementById('rev-reg-tipo-vehiculo').textContent = vehiculo.tipo_vehiculo;
    document.getElementById('rev-reg-modelo').textContent = `${vehiculo.fabricante} ${vehiculo.modelo}`;
    document.getElementById('rev-reg-anio').textContent = vehiculo.anio_fabricacion;
    document.getElementById('rev-reg-color').textContent = vehiculo.color;
    document.getElementById('rev-reg-obs').textContent = vehiculo.observaciones || 'Sin observaciones';

    abrirModal('modal-revision-registro');
}

function abrirRevisionAutorizacion(idSolicitud) {
    const db = obtenerDB();
    const autorizacion = (db.autorizaciones_visitas || []).find(a => a.identificador_solicitud === idSolicitud);
    if (!autorizacion) return;

    idAutorizacionEnRevision = idSolicitud;
    const solicitante = (db.usuarios || []).find(u => u.numero_identificacion === autorizacion.solicitante_id);

    if (solicitante) {
        document.getElementById('rev-aut-sol-nombre').textContent = solicitante.nombres_apellidos;
        document.getElementById('rev-aut-sol-cedula').textContent = solicitante.numero_identificacion;
        document.getElementById('rev-aut-sol-facultad').textContent = solicitante.facultad || '-';
        document.getElementById('rev-aut-sol-tipo').textContent = solicitante.tipo_usuario || '-';
    }

    const vis = autorizacion.visitante || {};
    document.getElementById('rev-aut-vis-nombre').textContent = vis.nombres_apellidos || '-';
    document.getElementById('rev-aut-vis-tipo-doc').textContent = vis.tipo_identificacion || '-';
    document.getElementById('rev-aut-vis-num-doc').textContent = vis.numero_identificacion || '-';
    document.getElementById('rev-aut-vis-tel').textContent = vis.telefono || 'No registrado';

    const veh = autorizacion.vehiculo || {};
    document.getElementById('rev-aut-veh-placa').textContent = veh.placa_vehicular || 'Sin placa';
    document.getElementById('rev-aut-veh-tipo').textContent = veh.tipo_vehiculo || 'Otro';
    document.getElementById('rev-aut-veh-modelo').textContent = `${veh.fabricante || ''} ${veh.modelo || ''}`.trim() || '-';
    document.getElementById('rev-aut-veh-color').textContent = veh.color || '-';

    const det = autorizacion.visita || {};
    document.getElementById('rev-aut-vis-fecha').textContent = det.fecha_programada || '-';
    document.getElementById('rev-aut-vis-hora').textContent = det.hora_programada || '-';
    document.getElementById('rev-aut-vis-motivo').textContent = det.motivo_visita || '-';
    document.getElementById('rev-aut-vis-destino').textContent = det.area_destino || '-';

    abrirModal('modal-revision-autorizacion');
}

function abrirFichaVehiculoAdmin(idVehiculo) {
    const db = obtenerDB();
    const vehiculo = (db.vehiculos || []).find(v => v.identificador_sistema === idVehiculo);
    if (!vehiculo) return;

    vehiculoActualEnFicha = vehiculo.identificador_sistema;
    const propietario = (db.usuarios || []).find(u => u.numero_identificacion === vehiculo.propietario_id);

    document.querySelector('.etiqueta-placa-ficha').textContent = vehiculo.placa_vehicular;
    document.querySelector('.identificador-texto-modal .dato-valor').textContent = vehiculo.identificador_sistema;
    document.querySelector('.imagen-qr-modal').src = vehiculo.codigo_qr_ruta || '';

    const datosVeh = document.querySelectorAll('#modal-ficha-vehicular .columna-modal:first-child .item-dato-modal span');
    if (datosVeh.length >= 5) {
        datosVeh[0].textContent = vehiculo.tipo_vehiculo;
        datosVeh[1].textContent = `${vehiculo.fabricante} ${vehiculo.modelo}`;
        datosVeh[2].textContent = vehiculo.anio_fabricacion;
        datosVeh[3].textContent = vehiculo.color;
        datosVeh[4].textContent = vehiculo.observaciones;
    }

    const datosReg = document.querySelectorAll('#modal-ficha-vehicular .columna-modal:last-child .tarjeta-informacion-modal:nth-child(2) .item-dato-modal span');
    if (datosReg.length >= 3) {
        datosReg[0].textContent = vehiculo.fecha_registro;
        datosReg[1].textContent = vehiculo.fecha_actualizacion;
        datosReg[2].textContent = vehiculo.estado_autorizacion;
    }

    const datosProp = document.querySelectorAll('#modal-ficha-vehicular .columna-modal:last-child .tarjeta-informacion-modal:nth-child(3) .item-dato-modal span');
    if (datosProp.length >= 6 && propietario) {
        datosProp[0].textContent = propietario.nombres_apellidos;
        datosProp[1].textContent = propietario.numero_identificacion;
        datosProp[2].textContent = propietario.correo_institucional || '-';
        datosProp[3].textContent = propietario.tipo_usuario;
        datosProp[4].textContent = propietario.facultad || '-';
        datosProp[5].textContent = propietario.carrera || '-';
    }

    abrirModal('modal-ficha-vehicular');
}

// --- APERTURA Y PRECARGA DEL MODAL DE MODIFICACIÓN ---
function abrirModalModificarVehiculo(idVehiculo) {
    const db = obtenerDB();
    const vehiculo = (db.vehiculos || []).find(v => v.identificador_sistema === idVehiculo);
    if (!vehiculo) return;

    vehiculoActualEnFicha = vehiculo.identificador_sistema;

    // 1. Inyectar datos en el bloque estático (no editable)
    document.getElementById('mod-estatico-placa').textContent = vehiculo.placa_vehicular;
    document.getElementById('mod-estatico-tipo').textContent = vehiculo.tipo_vehiculo;
    document.getElementById('mod-estatico-modelo').textContent = `${vehiculo.fabricante} ${vehiculo.modelo}`;
    document.getElementById('mod-estatico-anio').textContent = vehiculo.anio_fabricacion;
    document.getElementById('mod-estatico-identificador').textContent = vehiculo.identificador_sistema;

    // 2. Precargar los únicos campos editables
    document.getElementById('mod-color-vehiculo').value = vehiculo.color || '';
    document.getElementById('mod-estado-vehiculo').value = vehiculo.estado_autorizacion || 'Autorizado';
    document.getElementById('mod-observaciones-vehiculo').value = (vehiculo.observaciones && vehiculo.observaciones !== 'Sin observaciones') 
        ? vehiculo.observaciones 
        : '';

    abrirModal('modal-modificar-vehiculo');
}