// Variables globales para la gestión de estados en modales administrativos.
let identificadorVehiculoActualEnFicha = null;
let identificadorVehiculoParaDesvincular = null;
let placaVehiculoEnRevision = null;
let identificadorAutorizacionEnRevision = null;

// document.addEventListener: Registra la inicialización general de la consola administrativa al cargarse el DOM.
document.addEventListener('DOMContentLoaded', function() {
    // 1. Verificación de privilegios de usuario administrador.
    const sesionActiva = JSON.parse(localStorage.getItem('sesion_activa'));
    if (!sesionActiva || sesionActiva.rol_sistema !== 'admin') {
        window.location.href = 'inicio-sesion.html';
        return;
    }

    // 2. Registro del botón de cierre de sesión institucional.
    const botonCerrarSesion = document.getElementById('boton-cerrar-sesion');
    if (botonCerrarSesion) {
        botonCerrarSesion.addEventListener('click', function() {
            localStorage.removeItem('sesion_activa');
            window.location.href = 'inicio-sesion.html';
        });
    }

    // 3. Cálculo y actualización de indicadores numéricos en las tarjetas superiores.
    function actualizarMetricas() {
        const baseDeDatos = obtenerBaseDatos();
        const coleccionVehiculos = baseDeDatos.vehiculos || [];
        const coleccionAutorizaciones = baseDeDatos.autorizaciones_visitas || [];

        // Métrica 1: Cantidad total de vehículos autorizados en el sistema.
        const totalAutorizados = coleccionVehiculos.filter(function(vehiculo) {
            return vehiculo.estado_autorizacion === "Autorizado";
        }).length;
        const etiquetaMetricaAutorizados = document.getElementById('metrica-vehiculos-autorizados');
        if (etiquetaMetricaAutorizados) {
            etiquetaMetricaAutorizados.textContent = totalAutorizados;
        }

        // Métrica 2: Cantidad de vehículos que se encuentran físicamente dentro del campus.
        const totalEnInstalaciones = coleccionVehiculos.filter(function(vehiculo) {
            return vehiculo.estado_autorizacion === "Autorizado" && vehiculo.ubicacion_actual === "Dentro de las instalaciones";
        }).length;
        const etiquetaMetricaEnInstalaciones = document.getElementById('metrica-vehiculos-instalaciones');
        if (etiquetaMetricaEnInstalaciones) {
            etiquetaMetricaEnInstalaciones.textContent = totalEnInstalaciones;
        }

        // Métrica 3: Total consolidado de solicitudes pendientes de revisión.
        const vehiculosPendientes = coleccionVehiculos.filter(function(vehiculo) {
            return vehiculo.estado_autorizacion === "Pendiente";
        }).length;
        const visitasPendientes = coleccionAutorizaciones.filter(function(autorizacion) {
            return autorizacion.estado_solicitud === "Pendiente";
        }).length;
        const etiquetaMetricaPendientes = document.getElementById('metrica-solicitudes-pendientes');
        if (etiquetaMetricaPendientes) {
            etiquetaMetricaPendientes.textContent = vehiculosPendientes + visitasPendientes;
        }

        // Métrica 4: Cantidad de visitas autorizadas programadas para el día de hoy reutilizando esFechaActualHoy de scripts/informacion.js.
        const visitasHoy = coleccionAutorizaciones.filter(function(autorizacion) {
            return autorizacion.estado_solicitud === "Autorizado" && 
                   autorizacion.visita && 
                   esFechaActualHoy(autorizacion.visita.fecha_programada);
        }).length;
        const etiquetaMetricaVisitasHoy = document.getElementById('metrica-visitas-hoy');
        if (etiquetaMetricaVisitasHoy) {
            etiquetaMetricaVisitasHoy.textContent = visitasHoy;
        }
    }

    // 4. Renderización de la tabla de solicitudes pendientes de aprobación o rechazo.
    function renderizarSolicitudesPendientes() {
        const cuerpoTablaPendientes = document.getElementById('cuerpo-tabla-pendientes');
        if (!cuerpoTablaPendientes) {
            return;
        }

        const baseDeDatos = obtenerBaseDatos();
        const vehiculosPendientes = (baseDeDatos.vehiculos || []).filter(function(vehiculo) {
            return vehiculo.estado_autorizacion === "Pendiente";
        });
        const visitasPendientes = (baseDeDatos.autorizaciones_visitas || []).filter(function(autorizacion) {
            return autorizacion.estado_solicitud === "Pendiente";
        });

        cuerpoTablaPendientes.innerHTML = '';

        if (vehiculosPendientes.length === 0 && visitasPendientes.length === 0) {
            cuerpoTablaPendientes.innerHTML = `<tr><td colspan="5" class="mensaje-tabla-vacia">No existen registros de solicitudes pendientes para revisión</td></tr>`;
            return;
        }

        // Renderiza solicitudes de vehículos propios de estudiantes o docentes.
        vehiculosPendientes.forEach(function(solicitudVehiculo) {
            const usuarioPropietario = (baseDeDatos.usuarios || []).find(function(usuario) {
                return usuario.numero_identificacion === solicitudVehiculo.propietario_id;
            });
            const nombrePropietario = usuarioPropietario 
                ? `${usuarioPropietario.nombres_apellidos} (${usuarioPropietario.tipo_usuario})` 
                : "Usuario institucional";

            const codigoHtmlFila = `
                <tr>
                    <td>${solicitudVehiculo.fecha_registro}</td>
                    <td>${nombrePropietario}</td>
                    <td><strong>${solicitudVehiculo.placa_vehicular}</strong></td>
                    <td>${solicitudVehiculo.tipo_vehiculo}</td>
                    <td class="columna-centrada">
                        <button type="button" class="boton-tabla-icono" title="Revisar solicitud vehicular" onclick="abrirRevisionRegistro('${solicitudVehiculo.identificador_sistema || solicitudVehiculo.placa_vehicular}')">
                            <img src="recursos/imagenes/crear-autorizacion.svg" alt="Revisar">
                        </button>
                    </td>
                </tr>`;
            cuerpoTablaPendientes.insertAdjacentHTML('beforeend', codigoHtmlFila);
        });

        // Renderiza solicitudes de permisos para visitantes externos.
        visitasPendientes.forEach(function(solicitudVisita) {
            const usuarioSolicitante = (baseDeDatos.usuarios || []).find(function(usuario) {
                return usuario.numero_identificacion === solicitudVisita.solicitante_id;
            });
            const etiquetaTipoUsuario = (usuarioSolicitante && usuarioSolicitante.tipo_usuario) ? ` (${usuarioSolicitante.tipo_usuario})` : "";
            const nombreSolicitante = usuarioSolicitante 
                ? `${usuarioSolicitante.nombres_apellidos}${etiquetaTipoUsuario} <strong>(Visita)</strong>` 
                : `Solicitante institucional <strong>(Visita)</strong>`;

            const valorPlaca = (solicitudVisita.vehiculo && solicitudVisita.vehiculo.placa_vehicular) ? solicitudVisita.vehiculo.placa_vehicular : "S/P";
            const tipoVehiculo = (solicitudVisita.vehiculo && solicitudVisita.vehiculo.tipo_vehiculo) ? solicitudVisita.vehiculo.tipo_vehiculo : "Peatonal / Otro";

            const codigoHtmlFila = `
                <tr>
                    <td>${solicitudVisita.fecha_registro}</td>
                    <td>${nombreSolicitante}</td>
                    <td><strong>${valorPlaca}</strong></td>
                    <td>${tipoVehiculo}</td>
                    <td class="columna-centrada">
                        <button type="button" class="boton-tabla-icono" title="Revisar autorización de visita" onclick="abrirRevisionAutorizacion('${solicitudVisita.identificador_solicitud}')">
                            <img src="recursos/imagenes/crear-autorizacion.svg" alt="Revisar">
                        </button>
                    </td>
                </tr>`;
            cuerpoTablaPendientes.insertAdjacentHTML('beforeend', codigoHtmlFila);
        });
    }

    // 5. Renderización del registro vehicular institucional aplicando los criterios de filtrado seleccionados.
    function renderizarRegistroVehicular(filtroTexto = '', filtroUsuario = '', filtroVehiculo = '') {
        const cuerpoTablaRegistroInstitucional = document.getElementById('cuerpo-tabla-registro-institucional');
        if (!cuerpoTablaRegistroInstitucional) {
            return;
        }

        const baseDeDatos = obtenerBaseDatos();
        // Discrimina exclusivamente los vehículos activos y autorizados de miembros de la institución.
        const vehiculosAutorizados = (baseDeDatos.vehiculos || []).filter(function(vehiculo) {
            return vehiculo.estado_autorizacion === "Autorizado";
        });

        cuerpoTablaRegistroInstitucional.innerHTML = '';

        if (vehiculosAutorizados.length === 0) {
            cuerpoTablaRegistroInstitucional.innerHTML = `<tr><td colspan="5" class="mensaje-tabla-vacia">No existen vehículos registrados en el sistema</td></tr>`;
            return;
        }

        const filtroTextoNormalizado = normalizarTextoAlfanumerico(filtroTexto);

        // Array.prototype.filter: Discrimina vehículos por coincidencia textual, rol de usuario o tipo vehicular.
        const vehiculosFiltrados = vehiculosAutorizados.filter(function(vehiculo) {
            const usuarioPropietario = (baseDeDatos.usuarios || []).find(function(usuario) {
                return usuario.numero_identificacion === vehiculo.propietario_id;
            });
            const nombrePropietario = usuarioPropietario ? usuarioPropietario.nombres_apellidos : '';
            const tipoUsuario = usuarioPropietario ? usuarioPropietario.tipo_usuario : '';

            const identificadorTexto = (vehiculo.identificador_sistema || '').toLowerCase();
            const identificadorNormalizado = normalizarTextoAlfanumerico(vehiculo.identificador_sistema);
            const placaTexto = (vehiculo.placa_vehicular || '').toLowerCase();
            const placaNormalizada = normalizarTextoAlfanumerico(vehiculo.placa_vehicular);
            const nombreTexto = nombrePropietario.toLowerCase();
            const nombreNormalizado = normalizarTextoAlfanumerico(nombrePropietario);

            const coincideTexto = !filtroTexto || 
                identificadorTexto.includes(filtroTexto.toLowerCase()) ||
                identificadorNormalizado.includes(filtroTextoNormalizado) ||
                placaTexto.includes(filtroTexto.toLowerCase()) ||
                placaNormalizada.includes(filtroTextoNormalizado) ||
                nombreTexto.includes(filtroTexto.toLowerCase()) ||
                nombreNormalizado.includes(filtroTextoNormalizado);

            const coincideUsuario = !filtroUsuario || tipoUsuario === filtroUsuario;
            const coincideVehiculo = !filtroVehiculo || vehiculo.tipo_vehiculo === filtroVehiculo;

            return coincideTexto && coincideUsuario && coincideVehiculo;
        });

        if (vehiculosFiltrados.length === 0) {
            cuerpoTablaRegistroInstitucional.innerHTML = `<tr><td colspan="5" class="mensaje-tabla-vacia">No se encontraron registros de vehículos con los criterios seleccionados</td></tr>`;
            return;
        }

        vehiculosFiltrados.forEach(function(vehiculo) {
            const usuarioPropietario = (baseDeDatos.usuarios || []).find(function(usuario) {
                return usuario.numero_identificacion === vehiculo.propietario_id;
            });
            const nombreCompleto = usuarioPropietario 
                ? `${usuarioPropietario.nombres_apellidos} (${usuarioPropietario.tipo_usuario})` 
                : "Sin propietario asignado";

            const codigoHtmlFila = `
                <tr>
                    <td><span class="dato-valor">${vehiculo.identificador_sistema}</span></td>
                    <td>${nombreCompleto}</td>
                    <td><strong>${vehiculo.placa_vehicular}</strong></td>
                    <td>${vehiculo.tipo_vehiculo}</td>
                    <td class="columna-centrada">
                        <button type="button" class="boton-tabla-icono" title="Ver ficha técnica" onclick="abrirFichaVehiculoAdmin('${vehiculo.identificador_sistema}')">
                            <img src="recursos/imagenes/ficha-vehicular.svg" alt="Ver">
                        </button>
                    </td>
                </tr>`;
            cuerpoTablaRegistroInstitucional.insertAdjacentHTML('beforeend', codigoHtmlFila);
        });
    }

    // 6. Aplicación de filtros en la tabla de registro vehicular institucional al presionar el botón Comprobar.
    function ejecutarFiltrosRegistroVehicular() {
        const textoBusqueda = document.getElementById('filtro-busqueda-general')?.value.trim().toLowerCase() || '';
        const tipoUsuarioSeleccionado = document.getElementById('filtro-tipo-usuario')?.value || '';
        const tipoVehiculoSeleccionado = document.getElementById('filtro-tipo-vehiculo')?.value || '';
        renderizarRegistroVehicular(textoBusqueda, tipoUsuarioSeleccionado, tipoVehiculoSeleccionado);
    }

    const botonEjecutarFiltro = document.getElementById('boton-ejecutar-filtro');
    if (botonEjecutarFiltro) {
        botonEjecutarFiltro.addEventListener('click', ejecutarFiltrosRegistroVehicular);
    }

    const campoFiltroBusquedaGeneral = document.getElementById('filtro-busqueda-general');
    if (campoFiltroBusquedaGeneral) {
        campoFiltroBusquedaGeneral.addEventListener('keydown', function(evento) {
            if (evento.key === 'Enter') {
                evento.preventDefault();
                ejecutarFiltrosRegistroVehicular();
            }
        });
    }

    // Configuración y despliegue del modal de registro consolidado de actividades.
    const botonRegistroActividades = document.getElementById('boton-registro-actividades');
    if (botonRegistroActividades) {
        botonRegistroActividades.addEventListener('click', function() {
            // Restablece los filtros del modal para exhibir todo el historial de movimientos.
            const campoFiltroTexto = document.getElementById('filtro-modal-act-texto');
            const campoFiltroFecha = document.getElementById('filtro-modal-act-fecha');
            const selectorFiltroPunto = document.getElementById('filtro-modal-act-punto');
            const selectorFiltroMovimiento = document.getElementById('filtro-modal-act-mov');
            
            if (campoFiltroTexto) campoFiltroTexto.value = '';
            if (campoFiltroFecha) campoFiltroFecha.value = '';
            if (selectorFiltroPunto) selectorFiltroPunto.value = '';
            if (selectorFiltroMovimiento) selectorFiltroMovimiento.value = '';

            renderizarRegistroActividadesModal();
            abrirModal('modal-registro-actividades');
        });
    }

    // Renderiza la tabla de actividades del modal con filtros en tiempo real.
    function renderizarRegistroActividadesModal() {
        const cuerpoTablaActividadesModal = document.getElementById('cuerpo-tabla-actividades-modal');
        if (!cuerpoTablaActividadesModal) {
            return;
        }

        const filtroTexto = document.getElementById('filtro-modal-act-texto')?.value.trim().toLowerCase() || '';
        const filtroFecha = document.getElementById('filtro-modal-act-fecha')?.value || '';
        const filtroPunto = document.getElementById('filtro-modal-act-punto')?.value || '';
        const filtroMovimiento = document.getElementById('filtro-modal-act-mov')?.value || '';

        const baseDeDatos = obtenerBaseDatos();
        const historialMovimientos = baseDeDatos.historial_movimientos || [];

        cuerpoTablaActividadesModal.innerHTML = '';

        if (historialMovimientos.length === 0) {
            cuerpoTablaActividadesModal.innerHTML = `<tr><td colspan="7" class="mensaje-tabla-vacia">No se han registrado movimientos vehiculares en ningún punto de control</td></tr>`;
            return;
        }

        let fechaFormateada = '';
        if (filtroFecha) {
            const partesFecha = filtroFecha.split('-');
            fechaFormateada = `${partesFecha[2]}/${partesFecha[1]}/${partesFecha[0]}`;
        }

        const filtroTextoNormalizado = normalizarTextoAlfanumerico(filtroTexto);

        // Array.prototype.map: Vincula cada movimiento con los datos completos del vehículo si es institucional.
        const movimientosProcesados = historialMovimientos.slice().reverse().map(function(movimiento) {
            const placaBuscada = (movimiento.placa_vehicular || '').trim().toUpperCase();
            const identificadorBuscado = (movimiento.identificador || '').trim().toUpperCase();

            const vehiculoRegistrado = (baseDeDatos.vehiculos || []).find(function(vehiculo) {
                return (vehiculo.placa_vehicular && vehiculo.placa_vehicular.trim().toUpperCase() === placaBuscada) || 
                       (vehiculo.identificador_sistema && vehiculo.identificador_sistema.trim().toUpperCase() === identificadorBuscado);
            });
            
            const identificadorCalculado = vehiculoRegistrado ? vehiculoRegistrado.identificador_sistema : (movimiento.identificador && movimiento.identificador !== "-" ? movimiento.identificador : "");
            const tipoVehiculoCalculado = vehiculoRegistrado ? vehiculoRegistrado.tipo_vehiculo : (movimiento.tipo_vehiculo && movimiento.tipo_vehiculo !== "-" ? movimiento.tipo_vehiculo : "");

            return {
                ...movimiento,
                identificadorCalculado: identificadorCalculado,
                tipoVehiculoCalculado: tipoVehiculoCalculado
            };
        });

        // Aplica los filtros de búsqueda sobre el historial de movimientos.
        const movimientosFiltrados = movimientosProcesados.filter(function(movimiento) {
            const identificadorTexto = (movimiento.identificadorCalculado || '').toLowerCase();
            const identificadorNormalizado = normalizarTextoAlfanumerico(movimiento.identificadorCalculado);
            const placaTexto = (movimiento.placa_vehicular || '').toLowerCase();
            const placaNormalizada = normalizarTextoAlfanumerico(movimiento.placa_vehicular);
            const propietarioTexto = (movimiento.propietario || '').toLowerCase();
            const propietarioNormalizado = normalizarTextoAlfanumerico(movimiento.propietario);

            const coincideTexto = !filtroTexto || 
                identificadorTexto.includes(filtroTexto) ||
                identificadorNormalizado.includes(filtroTextoNormalizado) ||
                placaTexto.includes(filtroTexto) ||
                placaNormalizada.includes(filtroTextoNormalizado) ||
                propietarioTexto.includes(filtroTexto) ||
                propietarioNormalizado.includes(filtroTextoNormalizado);
            
            const coincideFecha = !fechaFormateada || movimiento.fecha === fechaFormateada;
            
            const puntoMovimientoNormalizado = normalizarCodigoPuntoControl(movimiento.punto_control);
            const puntoFiltroNormalizado = normalizarCodigoPuntoControl(filtroPunto);
            const coincidePunto = !filtroPunto || puntoMovimientoNormalizado === puntoFiltroNormalizado || (!puntoMovimientoNormalizado && puntoFiltroNormalizado === 'N01');
            
            const coincideMovimiento = !filtroMovimiento || movimiento.tipo_movimiento === filtroMovimiento;

            return coincideTexto && coincideFecha && coincidePunto && coincideMovimiento;
        });

        if (movimientosFiltrados.length === 0) {
            cuerpoTablaActividadesModal.innerHTML = `<tr><td colspan="7" class="mensaje-tabla-vacia">No se encontraron registros de movimientos relacionados con los filtros seleccionados</td></tr>`;
            return;
        }

        movimientosFiltrados.forEach(function(movimiento) {
            const esVehiculoInstitucional = movimiento.identificadorCalculado && 
                (baseDeDatos.vehiculos || []).some(function(vehiculo) {
                    return vehiculo.identificador_sistema === movimiento.identificadorCalculado;
                });

            const botonFichaHtml = esVehiculoInstitucional
                ? `<button type="button" class="boton-tabla-icono" title="Ver ficha técnica" onclick="abrirFichaVehiculoAdmin('${movimiento.identificadorCalculado}')">
                       <img src="recursos/imagenes/ficha-vehicular.svg" alt="Ficha">
                   </button>`
                : ``;

            const puntoFormateado = normalizarCodigoPuntoControl(movimiento.punto_control) || 'N01';
            const identificadorMostrar = (movimiento.identificadorCalculado && movimiento.identificadorCalculado !== "-") ? movimiento.identificadorCalculado : "";
            const placaMostrar = (movimiento.placa_vehicular && movimiento.placa_vehicular !== "-") ? movimiento.placa_vehicular : "";
            const tipoVehiculoMostrar = (movimiento.tipoVehiculoCalculado && movimiento.tipoVehiculoCalculado !== "-") ? movimiento.tipoVehiculoCalculado : "";
            const fechaHoraMostrar = (movimiento.fecha && movimiento.hora) ? `${movimiento.fecha} - ${movimiento.hora}` : (movimiento.fecha || "");

            const spanIdentificador = identificadorMostrar ? `<span class="dato-valor">${identificadorMostrar}</span>` : "";

            const codigoHtmlFila = `
                <tr>
                    <td>${fechaHoraMostrar}</td>
                    <td>${spanIdentificador}</td>
                    <td><strong>${placaMostrar}</strong></td>
                    <td>${tipoVehiculoMostrar}</td>
                    <td>${puntoFormateado}</td>
                    <td><strong>${movimiento.tipo_movimiento || ""}</strong></td>
                    <td class="columna-centrada">${botonFichaHtml}</td>
                </tr>
            `;
            cuerpoTablaActividadesModal.insertAdjacentHTML('beforeend', codigoHtmlFila);
        });
    }

    // Escuchadores de eventos para aplicar filtros en vivo al interactuar con los campos del modal de actividades.
    document.getElementById('filtro-modal-act-texto')?.addEventListener('input', renderizarRegistroActividadesModal);
    document.getElementById('filtro-modal-act-fecha')?.addEventListener('change', renderizarRegistroActividadesModal);
    document.getElementById('filtro-modal-act-punto')?.addEventListener('change', renderizarRegistroActividadesModal);
    document.getElementById('filtro-modal-act-mov')?.addEventListener('change', renderizarRegistroActividadesModal);

    // 7. Configuración de acciones dentro del modal de la ficha vehicular.
    const botonModificarVehiculo = document.getElementById('btn-admin-modificar-vehiculo');
    if (botonModificarVehiculo) {
        botonModificarVehiculo.addEventListener('click', function() {
            const identificadorActual = identificadorVehiculoActualEnFicha || document.querySelector('#modal-ficha-vehicular .identificador-texto-modal .dato-valor')?.textContent.trim();
            if (!identificadorActual || identificadorActual === '-') {
                return;
            }

            cerrarModal('modal-ficha-vehicular');
            abrirModalModificarVehiculo(identificadorActual);
        });
    }

    // Botón para exportar e imprimir en PDF la credencial vehicular.
    const botonExportarPdf = document.getElementById('btn-admin-exportar-pdf');
    if (botonExportarPdf) {
        botonExportarPdf.addEventListener('click', function() {
            const identificadorActual = identificadorVehiculoActualEnFicha || document.querySelector('#modal-ficha-vehicular .identificador-texto-modal .dato-valor')?.textContent.trim();
            if (!identificadorActual || identificadorActual === '-') {
                return;
            }

            const baseDeDatos = obtenerBaseDatos();
            const vehiculoEncontrado = (baseDeDatos?.vehiculos || []).find(function(vehiculo) {
                return vehiculo.identificador_sistema === identificadorActual;
            });
            if (!vehiculoEncontrado) {
                return;
            }

            const etiquetaImpresionPlaca = document.getElementById('print-placa');
            const imagenImpresionCodigoQr = document.getElementById('print-qr');
            const etiquetaImpresionIdentificador = document.getElementById('print-identificador');

            if (etiquetaImpresionPlaca) {
                etiquetaImpresionPlaca.textContent = vehiculoEncontrado.placa_vehicular;
            }
            if (etiquetaImpresionIdentificador) {
                etiquetaImpresionIdentificador.textContent = vehiculoEncontrado.identificador_sistema;
            }

            let impresionYaEjecutada = false;
            function dispararImpresionUnica() {
                if (impresionYaEjecutada) {
                    return;
                }
                impresionYaEjecutada = true;
                // window.print: Abre el diálogo de impresión nativo del navegador.
                window.print();
            }

            if (imagenImpresionCodigoQr) {
                const rutaCodigoQr = (vehiculoEncontrado.codigo_qr_ruta && vehiculoEncontrado.codigo_qr_ruta !== "")
                    ? vehiculoEncontrado.codigo_qr_ruta
                    : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(vehiculoEncontrado.identificador_sistema + '|' + vehiculoEncontrado.placa_vehicular)}`;

                imagenImpresionCodigoQr.onload = dispararImpresionUnica;
                imagenImpresionCodigoQr.onerror = function() {
                    imagenImpresionCodigoQr.src = "recursos/imagenes/codigo-qr.png";
                    dispararImpresionUnica();
                };

                imagenImpresionCodigoQr.src = rutaCodigoQr;

                if (imagenImpresionCodigoQr.complete && imagenImpresionCodigoQr.naturalWidth !== 0) {
                    dispararImpresionUnica();
                }
            } else {
                dispararImpresionUnica();
            }
        });
    }

    // Botón para iniciar el flujo de desvinculación de un vehículo desde la ficha.
    const botonDesvincularDesdeFicha = document.getElementById('btn-admin-desvincular-ficha');
    if (botonDesvincularDesdeFicha) {
        botonDesvincularDesdeFicha.addEventListener('click', function() {
            const identificadorActual = identificadorVehiculoActualEnFicha || document.querySelector('#modal-ficha-vehicular .identificador-texto-modal .dato-valor')?.textContent.trim();
            if (!identificadorActual || identificadorActual === '-') {
                return;
            }

            identificadorVehiculoParaDesvincular = identificadorActual;
            cerrarModal('modal-ficha-vehicular');

            const etiquetaIdentificadorDesvinculo = document.querySelector('#modal-desvincular-vehiculo .identificador-vehiculo-enfasis .dato-valor');
            if (etiquetaIdentificadorDesvinculo) {
                etiquetaIdentificadorDesvinculo.textContent = identificadorActual;
            }
            abrirModal('modal-desvincular-vehiculo');
        });
    }

    // Botón de confirmación definitiva de desvinculación de vehículo.
    const botonProcederDesvincular = document.getElementById('boton-proceder-desvincular');
    if (botonProcederDesvincular) {
        botonProcederDesvincular.addEventListener('click', function() {
            if (!identificadorVehiculoParaDesvincular) {
                return;
            }
            const baseDeDatos = obtenerBaseDatos();

            baseDeDatos.vehiculos = (baseDeDatos.vehiculos || []).filter(function(vehiculo) {
                return vehiculo.identificador_sistema !== identificadorVehiculoParaDesvincular;
            });
            guardarCambios(baseDeDatos);

            cerrarModal('modal-desvincular-vehiculo');
            setTimeout(function() {
                abrirModal('modal-desvinculacion-exito');
                actualizarMetricas();
                renderizarRegistroVehicular();
                renderizarSolicitudesPendientes();
            }, 300);
        });
    }

    // Procesa el formulario de edición de datos de vehículo.
    const formularioModificarVehiculo = document.getElementById('form-modificar-vehiculo');
    if (formularioModificarVehiculo) {
        formularioModificarVehiculo.addEventListener('submit', function(evento) {
            evento.preventDefault();
            if (!identificadorVehiculoActualEnFicha) {
                return;
            }

            const baseDeDatos = obtenerBaseDatos();
            const vehiculoEncontrado = (baseDeDatos.vehiculos || []).find(function(vehiculo) {
                return vehiculo.identificador_sistema === identificadorVehiculoActualEnFicha;
            });

            if (vehiculoEncontrado) {
                // Reutiliza la función global obtenerFechaHoraActual de scripts/informacion.js.
                const datosFechaHora = obtenerFechaHoraActual();

                // Actualiza los valores modificables del vehículo.
                vehiculoEncontrado.color = document.getElementById('mod-color-vehiculo').value.trim() || vehiculoEncontrado.color;
                vehiculoEncontrado.estado_autorizacion = document.getElementById('mod-estado-vehiculo').value;
                vehiculoEncontrado.observaciones = document.getElementById('mod-observaciones-vehiculo').value.trim() || 'Sin observaciones';
                vehiculoEncontrado.fecha_actualizacion = datosFechaHora.fecha;

                guardarCambios(baseDeDatos);
                cerrarModal('modal-modificar-vehiculo');

                const etiquetaTituloModal = document.getElementById('titulo-modal-exito-admin');
                const etiquetaInfoModal = document.getElementById('info-fecha-exito-admin');

                if (etiquetaTituloModal) {
                    etiquetaTituloModal.textContent = "Registro vehicular modificado correctamente";
                }
                if (etiquetaInfoModal) {
                    etiquetaInfoModal.textContent = `Fecha y hora en que se modificó el registro: ${datosFechaHora.textoCompleto}`;
                }

                setTimeout(function() {
                    abrirModal('modal-admin-exito');
                    actualizarMetricas();
                    renderizarRegistroVehicular();
                    renderizarSolicitudesPendientes();
                }, 300);
            }
        });
    }

    // 8. Botones para aprobar o rechazar solicitudes pendientes de registro vehicular y visitas.

    // Aprobación de solicitud vehicular de usuario institucional.
    const botonAprobarRegistro = document.getElementById('btn-aprobar-registro');
    if (botonAprobarRegistro) {
        botonAprobarRegistro.addEventListener('click', function() {
            if (!placaVehiculoEnRevision) {
                return;
            }
            const baseDeDatos = obtenerBaseDatos();
            const vehiculoEncontrado = (baseDeDatos.vehiculos || []).find(function(vehiculo) {
                return vehiculo.placa_vehicular === placaVehiculoEnRevision;
            });

            if (vehiculoEncontrado) {
                const datosFechaHora = obtenerFechaHoraActual();
                const vehiculosAutorizados = baseDeDatos.vehiculos.filter(function(vehiculo) {
                    return vehiculo.estado_autorizacion === "Autorizado";
                });
                // Reutiliza generarSiguienteIdentificadorVehicular de scripts/informacion.js.
                vehiculoEncontrado.identificador_sistema = generarSiguienteIdentificadorVehicular(vehiculosAutorizados);
                vehiculoEncontrado.codigo_qr_ruta = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(vehiculoEncontrado.identificador_sistema + '|' + vehiculoEncontrado.placa_vehicular)}`;
                vehiculoEncontrado.estado_autorizacion = "Autorizado";
                vehiculoEncontrado.fecha_registro = datosFechaHora.fecha;
                vehiculoEncontrado.fecha_actualizacion = datosFechaHora.fecha;
                
                guardarCambios(baseDeDatos);
                cerrarModal('modal-revision-registro');

                const etiquetaTituloModal = document.getElementById('titulo-modal-exito-admin');
                const etiquetaInfoModal = document.getElementById('info-fecha-exito-admin');
                if (etiquetaTituloModal) {
                    etiquetaTituloModal.textContent = "Registro vehicular creado correctamente";
                }
                if (etiquetaInfoModal) {
                    etiquetaInfoModal.textContent = `Fecha y hora en que se creó el registro: ${datosFechaHora.textoCompleto}`;
                }

                setTimeout(function() {
                    abrirModal('modal-admin-exito');
                    actualizarMetricas();
                    renderizarSolicitudesPendientes();
                    renderizarRegistroVehicular();
                }, 300);
            }
        });
    }

    // Rechazo de solicitud vehicular de usuario institucional.
    const botonRechazarRegistro = document.getElementById('btn-rechazar-registro');
    if (botonRechazarRegistro) {
        botonRechazarRegistro.addEventListener('click', function() {
            if (!placaVehiculoEnRevision) {
                return;
            }
            const baseDeDatos = obtenerBaseDatos();
            baseDeDatos.vehiculos = (baseDeDatos.vehiculos || []).filter(function(vehiculo) {
                return vehiculo.placa_vehicular !== placaVehiculoEnRevision;
            });
            
            guardarCambios(baseDeDatos);
            cerrarModal('modal-revision-registro');
            actualizarMetricas();
            renderizarSolicitudesPendientes();
        });
    }

    // Aprobación de solicitud de autorización de visita.
    const botonAprobarAutorizacion = document.getElementById('btn-aprobar-autorizacion');
    if (botonAprobarAutorizacion) {
        botonAprobarAutorizacion.addEventListener('click', function() {
            if (!identificadorAutorizacionEnRevision) {
                return;
            }
            const baseDeDatos = obtenerBaseDatos();
            const autorizacionEncontrada = (baseDeDatos.autorizaciones_visitas || []).find(function(autorizacion) {
                return autorizacion.identificador_solicitud === identificadorAutorizacionEnRevision;
            });

            if (autorizacionEncontrada) {
                const datosFechaHora = obtenerFechaHoraActual();
                autorizacionEncontrada.estado_solicitud = "Autorizado";
                autorizacionEncontrada.fecha_actualizacion = datosFechaHora.fecha;
                
                guardarCambios(baseDeDatos);
                cerrarModal('modal-revision-autorizacion');

                const etiquetaTituloModal = document.getElementById('titulo-modal-exito-admin');
                const etiquetaInfoModal = document.getElementById('info-fecha-exito-admin');
                if (etiquetaTituloModal) {
                    etiquetaTituloModal.textContent = "Autorización de acceso creada correctamente";
                }
                if (etiquetaInfoModal) {
                    etiquetaInfoModal.textContent = `Fecha y hora en que se aprobó la solicitud: ${datosFechaHora.textoCompleto}`;
                }

                setTimeout(function() {
                    abrirModal('modal-admin-exito');
                    actualizarMetricas();
                    renderizarSolicitudesPendientes();
                }, 300);
            }
        });
    }

    // Rechazo de solicitud de autorización de visita.
    const botonRechazarAutorizacion = document.getElementById('btn-rechazar-autorizacion');
    if (botonRechazarAutorizacion) {
        botonRechazarAutorizacion.addEventListener('click', function() {
            if (!identificadorAutorizacionEnRevision) {
                return;
            }
            const baseDeDatos = obtenerBaseDatos();
            baseDeDatos.autorizaciones_visitas = (baseDeDatos.autorizaciones_visitas || []).filter(function(autorizacion) {
                return autorizacion.identificador_solicitud !== identificadorAutorizacionEnRevision;
            });
            
            guardarCambios(baseDeDatos);
            cerrarModal('modal-revision-autorizacion');
            actualizarMetricas();
            renderizarSolicitudesPendientes();
        });
    }

    // Carga inicial al iniciar la consola administrativa.
    actualizarMetricas();
    renderizarSolicitudesPendientes();
    renderizarRegistroVehicular();
});

// Despliega el modal para revisar la solicitud vehicular pendiente seleccionada.
function abrirRevisionRegistro(identificadorOPlaca) {
    const baseDeDatos = obtenerBaseDatos();
    const vehiculoEncontrado = (baseDeDatos.vehiculos || []).find(function(vehiculo) {
        return vehiculo.identificador_sistema === identificadorOPlaca || vehiculo.placa_vehicular === identificadorOPlaca;
    });
    if (!vehiculoEncontrado) {
        return;
    }

    placaVehiculoEnRevision = vehiculoEncontrado.placa_vehicular;
    const usuarioSolicitante = (baseDeDatos.usuarios || []).find(function(usuario) {
        return usuario.numero_identificacion === vehiculoEncontrado.propietario_id;
    });

    if (usuarioSolicitante) {
        document.getElementById('rev-reg-nombre').textContent = usuarioSolicitante.nombres_apellidos;
        document.getElementById('rev-reg-cedula').textContent = usuarioSolicitante.numero_identificacion;
        document.getElementById('rev-reg-correo').textContent = usuarioSolicitante.correo_institucional || '-';
        document.getElementById('rev-reg-tipo').textContent = usuarioSolicitante.tipo_usuario || '-';
        document.getElementById('rev-reg-facultad').textContent = usuarioSolicitante.facultad || '-';
    }

    document.getElementById('rev-reg-placa').textContent = vehiculoEncontrado.placa_vehicular;
    document.getElementById('rev-reg-tipo-vehiculo').textContent = vehiculoEncontrado.tipo_vehiculo;
    document.getElementById('rev-reg-modelo').textContent = `${vehiculoEncontrado.fabricante} ${vehiculoEncontrado.modelo}`;
    document.getElementById('rev-reg-anio').textContent = vehiculoEncontrado.anio_fabricacion;
    document.getElementById('rev-reg-color').textContent = vehiculoEncontrado.color;
    document.getElementById('rev-reg-obs').textContent = vehiculoEncontrado.observaciones || 'Sin observaciones';

    abrirModal('modal-revision-registro');
}

// Despliega el modal para revisar la solicitud de autorización de visita pendiente seleccionada.
function abrirRevisionAutorizacion(identificadorSolicitud) {
    const baseDeDatos = obtenerBaseDatos();
    const autorizacionEncontrada = (baseDeDatos.autorizaciones_visitas || []).find(function(autorizacion) {
        return autorizacion.identificador_solicitud === identificadorSolicitud;
    });
    if (!autorizacionEncontrada) {
        return;
    }

    identificadorAutorizacionEnRevision = identificadorSolicitud;
    const usuarioSolicitante = (baseDeDatos.usuarios || []).find(function(usuario) {
        return usuario.numero_identificacion === autorizacionEncontrada.solicitante_id;
    });

    if (usuarioSolicitante) {
        document.getElementById('rev-aut-sol-nombre').textContent = usuarioSolicitante.nombres_apellidos;
        document.getElementById('rev-aut-sol-cedula').textContent = usuarioSolicitante.numero_identificacion;
        document.getElementById('rev-aut-sol-facultad').textContent = usuarioSolicitante.facultad || '-';
        document.getElementById('rev-aut-sol-tipo').textContent = usuarioSolicitante.tipo_usuario || '-';
    }

    const datosVisitante = autorizacionEncontrada.visitante || {};
    document.getElementById('rev-aut-vis-nombre').textContent = datosVisitante.nombres_apellidos || '-';
    document.getElementById('rev-aut-vis-tipo-doc').textContent = datosVisitante.tipo_identificacion || '-';
    document.getElementById('rev-aut-vis-num-doc').textContent = datosVisitante.numero_identificacion || '-';
    document.getElementById('rev-aut-vis-tel').textContent = datosVisitante.telefono || 'No registrado';

    const datosVehiculo = autorizacionEncontrada.vehiculo || {};
    document.getElementById('rev-aut-veh-placa').textContent = datosVehiculo.placa_vehicular || 'Sin placa';
    document.getElementById('rev-aut-veh-tipo').textContent = datosVehiculo.tipo_vehiculo || 'Otro';
    document.getElementById('rev-aut-veh-modelo').textContent = `${datosVehiculo.fabricante || ''} ${datosVehiculo.modelo || ''}`.trim() || '-';
    document.getElementById('rev-aut-veh-color').textContent = datosVehiculo.color || '-';

    const datosVisita = autorizacionEncontrada.visita || {};
    document.getElementById('rev-aut-vis-fecha').textContent = datosVisita.fecha_programada || '-';
    document.getElementById('rev-aut-vis-hora').textContent = datosVisita.hora_programada || '-';
    document.getElementById('rev-aut-vis-motivo').textContent = datosVisita.motivo_visita || '-';
    document.getElementById('rev-aut-vis-destino').textContent = datosVisita.area_destino || '-';

    abrirModal('modal-revision-autorizacion');
}

// Despliega la ficha vehicular en modo administrador para inspeccionar datos completos.
function abrirFichaVehiculoAdmin(identificadorVehiculo) {
    const baseDeDatos = obtenerBaseDatos();
    const vehiculoEncontrado = (baseDeDatos.vehiculos || []).find(function(vehiculo) {
        return vehiculo.identificador_sistema === identificadorVehiculo;
    });
    if (!vehiculoEncontrado) {
        return;
    }

    identificadorVehiculoActualEnFicha = vehiculoEncontrado.identificador_sistema;
    const usuarioPropietario = (baseDeDatos.usuarios || []).find(function(usuario) {
        return usuario.numero_identificacion === vehiculoEncontrado.propietario_id;
    });

    document.querySelector('.etiqueta-placa-ficha').textContent = vehiculoEncontrado.placa_vehicular;
    document.querySelector('.identificador-texto-modal .dato-valor').textContent = vehiculoEncontrado.identificador_sistema;
    document.querySelector('.imagen-qr-modal').src = vehiculoEncontrado.codigo_qr_ruta || '';

    const elementosDatosVehiculo = document.querySelectorAll('#modal-ficha-vehicular .columna-modal:first-child .item-dato-modal span');
    if (elementosDatosVehiculo.length >= 5) {
        elementosDatosVehiculo[0].textContent = vehiculoEncontrado.tipo_vehiculo;
        elementosDatosVehiculo[1].textContent = `${vehiculoEncontrado.fabricante} ${vehiculoEncontrado.modelo}`;
        elementosDatosVehiculo[2].textContent = vehiculoEncontrado.anio_fabricacion;
        elementosDatosVehiculo[3].textContent = vehiculoEncontrado.color;
        elementosDatosVehiculo[4].textContent = vehiculoEncontrado.observaciones;
    }

    const elementosDatosRegistro = document.querySelectorAll('#modal-ficha-vehicular .columna-modal:last-child .tarjeta-informacion-modal:nth-child(2) .item-dato-modal span');
    if (elementosDatosRegistro.length >= 3) {
        elementosDatosRegistro[0].textContent = vehiculoEncontrado.fecha_registro;
        elementosDatosRegistro[1].textContent = vehiculoEncontrado.fecha_actualizacion;
        elementosDatosRegistro[2].textContent = vehiculoEncontrado.estado_autorizacion;
    }

    const elementosDatosPropietario = document.querySelectorAll('#modal-ficha-vehicular .columna-modal:last-child .tarjeta-informacion-modal:nth-child(3) .item-dato-modal span');
    if (elementosDatosPropietario.length >= 6 && usuarioPropietario) {
        elementosDatosPropietario[0].textContent = usuarioPropietario.nombres_apellidos;
        elementosDatosPropietario[1].textContent = usuarioPropietario.numero_identificacion;
        elementosDatosPropietario[2].textContent = usuarioPropietario.correo_institucional || '-';
        elementosDatosPropietario[3].textContent = usuarioPropietario.tipo_usuario;
        elementosDatosPropietario[4].textContent = usuarioPropietario.facultad || '-';
        elementosDatosPropietario[5].textContent = usuarioPropietario.carrera || '-';
    }

    abrirModal('modal-ficha-vehicular');
}

// Precarga los campos editables y despliega el formulario de modificación de vehículo.
function abrirModalModificarVehiculo(identificadorVehiculo) {
    const baseDeDatos = obtenerBaseDatos();
    const vehiculoEncontrado = (baseDeDatos.vehiculos || []).find(function(vehiculo) {
        return vehiculo.identificador_sistema === identificadorVehiculo;
    });
    if (!vehiculoEncontrado) {
        return;
    }

    identificadorVehiculoActualEnFicha = vehiculoEncontrado.identificador_sistema;

    // Inyecta datos no modificables en las etiquetas informativas del modal.
    document.getElementById('mod-estatico-placa').textContent = vehiculoEncontrado.placa_vehicular;
    document.getElementById('mod-estatico-tipo').textContent = vehiculoEncontrado.tipo_vehiculo;
    document.getElementById('mod-estatico-modelo').textContent = `${vehiculoEncontrado.fabricante} ${vehiculoEncontrado.modelo}`;
    document.getElementById('mod-estatico-anio').textContent = vehiculoEncontrado.anio_fabricacion;
    document.getElementById('mod-estatico-identificador').textContent = vehiculoEncontrado.identificador_sistema;

    // Precarga los únicos campos editables autorizados.
    document.getElementById('mod-color-vehiculo').value = vehiculoEncontrado.color || '';
    document.getElementById('mod-estado-vehiculo').value = vehiculoEncontrado.estado_autorizacion || 'Autorizado';
    document.getElementById('mod-observaciones-vehiculo').value = (vehiculoEncontrado.observaciones && vehiculoEncontrado.observaciones !== 'Sin observaciones') 
        ? vehiculoEncontrado.observaciones 
        : '';

    abrirModal('modal-modificar-vehiculo');
}

// Expone las funciones en el ámbito global window para permitir su ejecución desde atributos HTML.
window.abrirRevisionRegistro = abrirRevisionRegistro;
window.abrirRevisionAutorizacion = abrirRevisionAutorizacion;
window.abrirFichaVehiculoAdmin = abrirFichaVehiculoAdmin;
window.abrirModalModificarVehiculo = abrirModalModificarVehiculo;