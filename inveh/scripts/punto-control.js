// Variable global para almacenar en memoria el vehículo o visita identificado tras la búsqueda.
let vehiculoEncontradoActual = null;

// Reutiliza las funciones globales obtenerUltimoMovimientoVehiculo y determinarUbicacionVehiculo de scripts/informacion.js.

// document.addEventListener: Registra la inicialización general de la interfaz al cargarse el documento.
document.addEventListener('DOMContentLoaded', function() {
    // 1. Verificación de sesión de guardia de punto de control.
    const sesionActiva = JSON.parse(localStorage.getItem('sesion_activa'));
    if (!sesionActiva || sesionActiva.rol_sistema !== 'guardia') {
        // window.location.href: Redirige a la pantalla de login si no hay privilegios de guardia.
        window.location.href = 'inicio-sesion.html';
        return;
    }

    // Configura visualmente el encabezado del punto de control asignado a la sesión actual.
    const nombrePuntoAsignado = sesionActiva.punto_control_asignado || "Punto de control N01";
    const etiquetaEncabezadoPuntoControl = document.getElementById('header-punto-control');
    if (etiquetaEncabezadoPuntoControl) {
        etiquetaEncabezadoPuntoControl.textContent = nombrePuntoAsignado;
    }

    // Extrae y formatea el número de garita para la insignia visual.
    const etiquetaInsigniaPuntoControl = document.getElementById('insignia-punto');
    if (etiquetaInsigniaPuntoControl) {
        // String.prototype.replace: Extrae los dígitos numéricos del texto descriptivo del punto de control.
        const digitosPunto = nombrePuntoAsignado.replace(/\D/g, ''); 
        etiquetaInsigniaPuntoControl.textContent = digitosPunto ? digitosPunto.padStart(2, '0') : '--';
    }

    // Registra el evento de cierre de sesión para el personal de control.
    const botonCerrarSesion = document.getElementById('boton-cerrar-sesion');
    if (botonCerrarSesion) {
        botonCerrarSesion.addEventListener('click', function() {
            // localStorage.removeItem: Limpia la sesión del usuario del almacenamiento persistente.
            localStorage.removeItem('sesion_activa');
            window.location.href = 'inicio-sesion.html';
        });
    }

    // 2. Renderización de la tabla del historial de movimientos vehiculares.
    function renderizarHistorial() {
        const cuerpoTablaHistorial = document.getElementById('cuerpo-tabla-historial');
        if (!cuerpoTablaHistorial) {
            return;
        }

        // Obtiene la persistencia centralizada mediante la función global reutilizable de scripts/informacion.js.
        const baseDeDatos = obtenerBaseDatos();
        const historialMovimientos = baseDeDatos?.historial_movimientos || [];
        // Element.innerHTML: Vacía los registros visuales anteriores de la tabla.
        cuerpoTablaHistorial.innerHTML = '';

        // Utiliza la función compartida normalizarCodigoPuntoControl de scripts/informacion.js.
        const codigoPuntoActual = normalizarCodigoPuntoControl(sesionActiva.punto_control_asignado || "Punto de control N01");

        // Array.prototype.filter: Filtra los movimientos vehiculares que pertenecen estrictamente a este punto de control.
        const historialFiltrado = historialMovimientos.filter(function(movimiento) {
            const codigoMovimiento = normalizarCodigoPuntoControl(movimiento.punto_control);
            if (!codigoMovimiento) {
                return codigoPuntoActual === "N01";
            }
            return codigoMovimiento === codigoPuntoActual;
        });

        // Muestra mensaje informativo si la tabla no contiene movimientos registrados.
        if (historialFiltrado.length === 0) {
            cuerpoTablaHistorial.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--color-texto-atenuado);">No se han registrado movimientos vehiculares en este punto de control</td></tr>`;
            return;
        }

        // Array.prototype.slice y reverse: Invierte el listado para presentar los eventos más recientes primero.
        historialFiltrado.slice().reverse().forEach(function(movimiento) {
            const codigoHtmlFila = `
                <tr>
                    <td>${movimiento.fecha}</td>
                    <td>${movimiento.hora}</td>
                    <td><strong>${movimiento.placa_vehicular}</strong></td>
                    <td>${movimiento.propietario}</td>
                    <td>${movimiento.tipo_usuario}</td>
                    <td class="columna-centrada">
                        <span class="dato-valor movimiento-tabla-texto">
                            ${movimiento.tipo_movimiento}
                        </span>
                    </td>
                </tr>`;
            // Element.insertAdjacentHTML: Inserta la fila al final del cuerpo de la tabla.
            cuerpoTablaHistorial.insertAdjacentHTML('beforeend', codigoHtmlFila);
        });
    }

    // 3. Mecanismo de comprobación y búsqueda de vehículos o visitas.
    const formularioComprobarVehiculo = document.getElementById('form-comprobar-vehiculo');
    const campoEntradaBusquedaControl = document.getElementById('entrada-busqueda-control');
    const tarjetaResultadoCoincidencia = document.getElementById('tarjeta-resultado-coincidencia');
    const etiquetaMensajeSinCoincidencia = document.getElementById('mensaje-sin-coincidencia');

    // Normaliza caracteres en el campo de búsqueda de placa o identificador.
    if (campoEntradaBusquedaControl) {
        campoEntradaBusquedaControl.addEventListener('input', function() {
            campoEntradaBusquedaControl.value = campoEntradaBusquedaControl.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
            if (etiquetaMensajeSinCoincidencia) {
                etiquetaMensajeSinCoincidencia.style.display = 'none';
            }
        });
    }

    // Escucha el envío del formulario para ejecutar la búsqueda de coincidencias.
    if (formularioComprobarVehiculo) {
        formularioComprobarVehiculo.addEventListener('submit', function(evento) {
            // Event.preventDefault: Evita la recarga automática de la página.
            evento.preventDefault();
            const criterioBusqueda = campoEntradaBusquedaControl.value.trim().toUpperCase();

            // Valida que el guardia haya ingresado un criterio de búsqueda.
            if (!criterioBusqueda) {
                vehiculoEncontradoActual = null;
                if (tarjetaResultadoCoincidencia) {
                    tarjetaResultadoCoincidencia.style.display = 'none';
                }
                if (etiquetaMensajeSinCoincidencia) {
                    etiquetaMensajeSinCoincidencia.textContent = "Registre una placa o identificador vehicular";
                    etiquetaMensajeSinCoincidencia.style.display = 'block';
                }
                return;
            }

            const baseDeDatos = obtenerBaseDatos();
            // Emplea la función global normalizarTextoAlfanumerico.
            const criterioNormalizado = normalizarTextoAlfanumerico(criterioBusqueda);

            // Paso 1: Busca en la colección de vehículos propios autorizados del personal y estudiantes.
            let vehiculo = (baseDeDatos?.vehiculos || []).find(function(vehiculoRegistrado) {
                if (vehiculoRegistrado.estado_autorizacion !== "Autorizado") {
                    return false;
                }
                const placaNormalizada = normalizarTextoAlfanumerico(vehiculoRegistrado.placa_vehicular);
                const identificadorNormalizado = normalizarTextoAlfanumerico(vehiculoRegistrado.identificador_sistema);
                return (placaNormalizada && placaNormalizada === criterioNormalizado) || 
                       (identificadorNormalizado && identificadorNormalizado === criterioNormalizado);
            });

            // Paso 2: Si no se encuentra en vehículos propios, busca en autorizaciones de visitas aprobadas.
            if (!vehiculo) {
                const autorizacionVisita = (baseDeDatos?.autorizaciones_visitas || []).find(function(registroAutorizacion) {
                    const estadoAutorizacion = registroAutorizacion.estado_solicitud || registroAutorizacion.estado_autorizacion;
                    if (estadoAutorizacion !== "Autorizado") {
                        return false;
                    }

                    const identificadorSolicitudNormalizado = normalizarTextoAlfanumerico(registroAutorizacion.identificador_solicitud || registroAutorizacion.identificador_sistema);
                    const placaVisitaNormalizada = normalizarTextoAlfanumerico(registroAutorizacion.vehiculo?.placa_vehicular);

                    const coincideIdentificador = identificadorSolicitudNormalizado && identificadorSolicitudNormalizado === criterioNormalizado;
                    const coincidePlaca = placaVisitaNormalizada && placaVisitaNormalizada !== "SP" && placaVisitaNormalizada === criterioNormalizado;

                    if (!coincideIdentificador && !coincidePlaca) {
                        return false;
                    }

                    // Validación cronológica: utiliza la función compartida esFechaActualHoy de scripts/informacion.js.
                    const fechaProgramadaVisita = registroAutorizacion.visita?.fecha_programada;
                    const estaDentroInstalaciones = registroAutorizacion.ubicacion_actual === "Dentro de las instalaciones";
                    if (!estaDentroInstalaciones && fechaProgramadaVisita && !esFechaActualHoy(fechaProgramadaVisita)) {
                        return false;
                    }

                    return true;
                });

                if (autorizacionVisita) {
                    const usuarioSolicitante = (baseDeDatos?.usuarios || []).find(function(usuario) {
                        return usuario.numero_identificacion === autorizacionVisita.solicitante_id;
                    });
                    const vehiculoVisita = autorizacionVisita.vehiculo || {};
                    const datosVisitante = autorizacionVisita.visitante || {};

                    // Mapea la estructura del vehículo de visita para unificar la renderización visual.
                    vehiculo = {
                        es_visita: true,
                        identificador_solicitud: autorizacionVisita.identificador_solicitud,
                        identificador_sistema: autorizacionVisita.identificador_solicitud,
                        placa_vehicular: vehiculoVisita.placa_vehicular || "S/P",
                        tipo_vehiculo: vehiculoVisita.tipo_vehiculo || "Peatonal / Otro",
                        color: vehiculoVisita.color || "No especificado",
                        fabricante: vehiculoVisita.fabricante || "No especificado",
                        modelo: vehiculoVisita.modelo || "No especificado",
                        ubicacion_actual: autorizacionVisita.ubicacion_actual || "Fuera de las instalaciones",
                        propietario_nombre: datosVisitante.nombres_apellidos || "Visitante",
                        propietario_cedula: datosVisitante.numero_identificacion || "-",
                        titulo_propietario: "Información del visitante (Visita)",
                        solicitante_nombre: usuarioSolicitante ? usuarioSolicitante.nombres_apellidos : "Institucional"
                    };
                }
            }

            // Si se identificó un vehículo o visita, sincroniza su estado y muestra los resultados.
            if (vehiculo) {
                const ultimoMovimientoRegistrado = obtenerUltimoMovimientoVehiculo(baseDeDatos?.historial_movimientos, vehiculo);
                if (ultimoMovimientoRegistrado) {
                    vehiculo.ubicacion_actual = (ultimoMovimientoRegistrado.tipo_movimiento === "Entrada")
                        ? "Dentro de las instalaciones"
                        : "Fuera de las instalaciones";
                } else if (!vehiculo.ubicacion_actual) {
                    vehiculo.ubicacion_actual = "Fuera de las instalaciones";
                }

                // Sincroniza en la base de datos si existía discrepancia de ubicación física.
                let huboSincronizacionUbicacion = false;
                if (!vehiculo.es_visita && Array.isArray(baseDeDatos?.vehiculos)) {
                    const vehiculoEnBaseDatos = baseDeDatos.vehiculos.find(function(registroVehiculo) {
                        return normalizarTextoAlfanumerico(registroVehiculo.identificador_sistema) === normalizarTextoAlfanumerico(vehiculo.identificador_sistema);
                    });
                    if (vehiculoEnBaseDatos && vehiculoEnBaseDatos.ubicacion_actual !== vehiculo.ubicacion_actual) {
                        vehiculoEnBaseDatos.ubicacion_actual = vehiculo.ubicacion_actual;
                        huboSincronizacionUbicacion = true;
                    }
                } else if (vehiculo.es_visita && Array.isArray(baseDeDatos?.autorizaciones_visitas)) {
                    const autorizacionEnBaseDatos = baseDeDatos.autorizaciones_visitas.find(function(registroAutorizacion) {
                        return normalizarTextoAlfanumerico(registroAutorizacion.identificador_solicitud) === normalizarTextoAlfanumerico(vehiculo.identificador_solicitud);
                    });
                    if (autorizacionEnBaseDatos && autorizacionEnBaseDatos.ubicacion_actual !== vehiculo.ubicacion_actual) {
                        autorizacionEnBaseDatos.ubicacion_actual = vehiculo.ubicacion_actual;
                        huboSincronizacionUbicacion = true;
                    }
                }

                if (huboSincronizacionUbicacion) {
                    guardarCambios(baseDeDatos);
                }

                vehiculoEncontradoActual = vehiculo;
                if (etiquetaMensajeSinCoincidencia) {
                    etiquetaMensajeSinCoincidencia.style.display = 'none';
                }
                mostrarResultadoVehiculo(vehiculo, baseDeDatos);
            } else {
                vehiculoEncontradoActual = null;
                if (tarjetaResultadoCoincidencia) {
                    tarjetaResultadoCoincidencia.style.display = 'none';
                }
                if (etiquetaMensajeSinCoincidencia) {
                    etiquetaMensajeSinCoincidencia.textContent = "No se encontró ningún resultado con los datos registrados";
                    etiquetaMensajeSinCoincidencia.style.display = 'block';
                }
            }
        });
    }

    // 4. Despliega la tarjeta visual con los datos del vehículo y el botón dinámico de Entrada/Salida.
    function mostrarResultadoVehiculo(vehiculo, baseDeDatos) {
        const ultimoMovimientoRegistrado = obtenerUltimoMovimientoVehiculo(baseDeDatos?.historial_movimientos, vehiculo);
        if (ultimoMovimientoRegistrado) {
            vehiculo.ubicacion_actual = (ultimoMovimientoRegistrado.tipo_movimiento === "Entrada")
                ? "Dentro de las instalaciones"
                : "Fuera de las instalaciones";
        } else if (!vehiculo.ubicacion_actual) {
            vehiculo.ubicacion_actual = "Fuera de las instalaciones";
        }

        // Actualiza los elementos textuales con las especificaciones del vehículo.
        document.getElementById('res-placa').textContent = vehiculo.placa_vehicular;
        document.getElementById('res-identificador').textContent = vehiculo.identificador_sistema;
        document.getElementById('res-ubicacion').textContent = vehiculo.ubicacion_actual;

        const botonVerFichaVehicular = document.getElementById('btn-ver-ficha-control');

        // Adapta los títulos y datos si el registro corresponde a una visita o a un miembro institucional.
        if (vehiculo.es_visita) {
            document.getElementById('res-titulo-propietario').textContent = vehiculo.titulo_propietario;
            document.getElementById('res-propietario-nombre').textContent = vehiculo.propietario_nombre;
            document.getElementById('res-propietario-cedula').textContent = vehiculo.propietario_cedula;
            if (botonVerFichaVehicular) {
                botonVerFichaVehicular.style.display = 'none';
            }
        } else {
            const usuarioPropietario = (baseDeDatos?.usuarios || []).find(function(usuario) {
                return usuario.numero_identificacion === vehiculo.propietario_id;
            });
            const etiquetaTipoUsuario = usuarioPropietario ? `(${usuarioPropietario.tipo_usuario})` : "";
            document.getElementById('res-titulo-propietario').textContent = `Información del propietario ${etiquetaTipoUsuario}`;
            document.getElementById('res-propietario-nombre').textContent = usuarioPropietario ? usuarioPropietario.nombres_apellidos : "No registrado";
            document.getElementById('res-propietario-cedula').textContent = vehiculo.propietario_id;
            if (botonVerFichaVehicular) {
                botonVerFichaVehicular.style.display = 'inline-flex';
            }
        }

        document.getElementById('res-tipo-vehiculo').textContent = vehiculo.tipo_vehiculo;
        document.getElementById('res-color').textContent = vehiculo.color;
        document.getElementById('res-modelo').textContent = `${vehiculo.fabricante || ''} ${vehiculo.modelo || ''}`.trim() || '-';

        // Actualiza el texto descriptivo del último movimiento asentado.
        const etiquetaUltimoMovimiento = document.getElementById('res-ultimo-movimiento');
        if (etiquetaUltimoMovimiento) {
            if (ultimoMovimientoRegistrado) {
                const puntoTexto = ultimoMovimientoRegistrado.punto_control ? ` (${ultimoMovimientoRegistrado.punto_control.replace('Punto de control ', '')})` : '';
                etiquetaUltimoMovimiento.textContent = `Último movimiento: ${ultimoMovimientoRegistrado.tipo_movimiento} registrada el ${ultimoMovimientoRegistrado.fecha} a las ${ultimoMovimientoRegistrado.hora}${puntoTexto}.`;
            } else {
                etiquetaUltimoMovimiento.textContent = "Sin movimientos previos registrados hoy.";
            }
        }

        configurarBotonMovimiento(vehiculo.ubicacion_actual);
        if (tarjetaResultadoCoincidencia) {
            tarjetaResultadoCoincidencia.style.display = 'flex';
        }
    }

    // Configura el estilo, ícono y texto del botón de confirmación de movimiento.
    function configurarBotonMovimiento(ubicacionActual) {
        const botonAccionMovimiento = document.getElementById('btn-confirmar-movimiento');
        const etiquetaTextoBotonMovimiento = document.getElementById('texto-btn-movimiento');
        const iconoBotonMovimiento = document.getElementById('icono-movimiento');

        if (ubicacionActual === "Dentro de las instalaciones") {
            botonAccionMovimiento.className = "boton-accion-movimiento movimiento-salida";
            etiquetaTextoBotonMovimiento.textContent = "Confirmar salida";
            if (iconoBotonMovimiento) {
                iconoBotonMovimiento.src = "recursos/imagenes/eliminar.svg";
            }
        } else {
            botonAccionMovimiento.className = "boton-accion-movimiento movimiento-entrada";
            etiquetaTextoBotonMovimiento.textContent = "Confirmar entrada";
            if (iconoBotonMovimiento) {
                iconoBotonMovimiento.src = "recursos/imagenes/aceptar.svg";
            }
        }
    }

    // 5. Registro persistente del movimiento (Entrada o Salida) en el historial.
    const botonConfirmarMovimiento = document.getElementById('btn-confirmar-movimiento');
    if (botonConfirmarMovimiento) {
        botonConfirmarMovimiento.addEventListener('click', function() {
            if (!vehiculoEncontradoActual) {
                return;
            }

            const baseDeDatos = obtenerBaseDatos();
            // Reutiliza la función global obtenerFechaHoraActual de scripts/informacion.js.
            const tiempoActual = obtenerFechaHoraActual();
            const cadenaFechaActual = tiempoActual.fecha;
            const cadenaHoraActual = tiempoActual.hora;

            let tipoMovimiento = "";

            // Procesa si el vehículo en cuestión corresponde a una visita.
            if (vehiculoEncontradoActual.es_visita) {
                const identificadorActualNormalizado = normalizarTextoAlfanumerico(vehiculoEncontradoActual.identificador_solicitud || vehiculoEncontradoActual.identificador_sistema);
                const placaActualNormalizada = normalizarTextoAlfanumerico(vehiculoEncontradoActual.placa_vehicular);

                const autorizacionVisita = (baseDeDatos?.autorizaciones_visitas || []).find(function(registroAutorizacion) {
                    const idNormalizado = normalizarTextoAlfanumerico(registroAutorizacion.identificador_solicitud || registroAutorizacion.identificador_sistema);
                    const placaNormalizada = normalizarTextoAlfanumerico(registroAutorizacion.vehiculo?.placa_vehicular);
                    return (idNormalizado && idNormalizado === identificadorActualNormalizado) || 
                           (placaNormalizada && placaNormalizada !== 'SP' && placaNormalizada === placaActualNormalizada);
                });
                if (!autorizacionVisita) {
                    return;
                }

                const ubicacionPrevia = autorizacionVisita.ubicacion_actual || vehiculoEncontradoActual.ubicacion_actual || "Fuera de las instalaciones";
                const esSalida = ubicacionPrevia === "Dentro de las instalaciones";
                tipoMovimiento = esSalida ? "Salida" : "Entrada";

                if (!Array.isArray(baseDeDatos.historial_movimientos)) {
                    baseDeDatos.historial_movimientos = [];
                }
                // Array.prototype.push: Anexa el nuevo evento de movimiento vehicular de visita.
                baseDeDatos.historial_movimientos.push({
                    fecha: cadenaFechaActual,
                    hora: cadenaHoraActual,
                    identificador: autorizacionVisita.identificador_solicitud,
                    tipo_vehiculo: autorizacionVisita.vehiculo?.tipo_vehiculo || "Peatonal / Otro",
                    placa_vehicular: autorizacionVisita.vehiculo?.placa_vehicular || "S/P",
                    propietario: autorizacionVisita.visitante?.nombres_apellidos || "Visitante",
                    tipo_usuario: "Visitante",
                    tipo_movimiento: tipoMovimiento,
                    punto_control: sesionActiva.punto_control_asignado || "Punto de control N01"
                });

                // Si concluye la visita con una salida, se retira de la lista activa; si entra, se marca dentro.
                if (esSalida) {
                    baseDeDatos.autorizaciones_visitas = baseDeDatos.autorizaciones_visitas.filter(function(registroAutorizacion) {
                        return normalizarTextoAlfanumerico(registroAutorizacion.identificador_solicitud) !== normalizarTextoAlfanumerico(autorizacionVisita.identificador_solicitud);
                    });
                    tarjetaResultadoCoincidencia.style.display = 'none';
                    if (campoEntradaBusquedaControl) {
                        campoEntradaBusquedaControl.value = '';
                    }
                    vehiculoEncontradoActual = null;
                } else {
                    autorizacionVisita.ubicacion_actual = "Dentro de las instalaciones";
                    vehiculoEncontradoActual.ubicacion_actual = autorizacionVisita.ubicacion_actual;
                }
            } else {
                // Procesa si el vehículo pertenece a un usuario institucional regular.
                const identificadorActualNormalizado = normalizarTextoAlfanumerico(vehiculoEncontradoActual.identificador_sistema);
                const placaActualNormalizada = normalizarTextoAlfanumerico(vehiculoEncontradoActual.placa_vehicular);

                const vehiculo = (baseDeDatos?.vehiculos || []).find(function(registroVehiculo) {
                    const idNormalizado = normalizarTextoAlfanumerico(registroVehiculo.identificador_sistema);
                    const placaNormalizada = normalizarTextoAlfanumerico(registroVehiculo.placa_vehicular);
                    return (idNormalizado && idNormalizado === identificadorActualNormalizado) || 
                           (placaNormalizada && placaNormalizada !== 'SP' && placaNormalizada === placaActualNormalizada);
                });
                if (!vehiculo) {
                    return;
                }

                const usuarioPropietario = (baseDeDatos?.usuarios || []).find(function(usuario) {
                    return usuario.numero_identificacion === vehiculo.propietario_id;
                });

                const ubicacionPrevia = vehiculo.ubicacion_actual || vehiculoEncontradoActual.ubicacion_actual || "Fuera de las instalaciones";
                const esSalida = ubicacionPrevia === "Dentro de las instalaciones";
                tipoMovimiento = esSalida ? "Salida" : "Entrada";

                vehiculo.ubicacion_actual = esSalida ? "Fuera de las instalaciones" : "Dentro de las instalaciones";
                vehiculoEncontradoActual.ubicacion_actual = vehiculo.ubicacion_actual;

                if (!Array.isArray(baseDeDatos.historial_movimientos)) {
                    baseDeDatos.historial_movimientos = [];
                }
                baseDeDatos.historial_movimientos.push({
                    fecha: cadenaFechaActual,
                    hora: cadenaHoraActual,
                    identificador: vehiculo.identificador_sistema,
                    tipo_vehiculo: vehiculo.tipo_vehiculo,
                    placa_vehicular: vehiculo.placa_vehicular,
                    propietario: usuarioPropietario ? usuarioPropietario.nombres_apellidos : "No asignado",
                    tipo_usuario: usuarioPropietario ? usuarioPropietario.tipo_usuario : "Estudiante",
                    tipo_movimiento: tipoMovimiento,
                    punto_control: sesionActiva.punto_control_asignado || "Punto de control N01"
                });
            }

            // Persiste los cambios mediante la función reutilizable guardarCambios.
            guardarCambios(baseDeDatos);

            // Refresca la información visual de la tarjeta tras el movimiento.
            if (vehiculoEncontradoActual) {
                document.getElementById('res-ubicacion').textContent = vehiculoEncontradoActual.ubicacion_actual;
                const etiquetaTipoMovimiento = vehiculoEncontradoActual.ubicacion_actual === "Dentro de las instalaciones" ? "Entrada" : "Salida";
                const etiquetaPuntoControl = (sesionActiva.punto_control_asignado || "Punto de control N01").replace('Punto de control ', '');
                document.getElementById('res-ultimo-movimiento').textContent = `Último movimiento: ${etiquetaTipoMovimiento} registrada el ${cadenaFechaActual} a las ${cadenaHoraActual} (${etiquetaPuntoControl}).`;
                configurarBotonMovimiento(vehiculoEncontradoActual.ubicacion_actual);
            }

            renderizarHistorial();

            // Configura y despliega el modal de confirmación del movimiento registrado.
            const etiquetaTituloModal = document.getElementById('titulo-modal-movimiento');
            const etiquetaFechaModal = document.getElementById('info-fecha-movimiento');
            if (etiquetaTituloModal) {
                etiquetaTituloModal.textContent = `${tipoMovimiento} registrada correctamente`;
            }
            if (etiquetaFechaModal) {
                etiquetaFechaModal.textContent = `Fecha y hora en que se registró el movimiento: ${cadenaFechaActual} a las ${cadenaHoraActual}.`;
            }

            abrirModal('modal-movimiento-exito');
        });
    }

    // 6. Despliega la ficha técnica detallada del vehículo seleccionado.
    const botonVerFichaControl = document.getElementById('btn-ver-ficha-control');
    if (botonVerFichaControl) {
        botonVerFichaControl.addEventListener('click', function() {
            if (!vehiculoEncontradoActual || !vehiculoEncontradoActual.identificador_sistema) {
                return;
            }
            
            const baseDeDatos = obtenerBaseDatos();
            const vehiculo = vehiculoEncontradoActual;
            const usuarioPropietario = (baseDeDatos?.usuarios || []).find(function(usuario) {
                return usuario.numero_identificacion === vehiculo.propietario_id;
            });

            document.querySelector('.etiqueta-placa-ficha').textContent = vehiculo.placa_vehicular;
            document.querySelector('.identificador-texto-modal .dato-valor').textContent = vehiculo.identificador_sistema;
            
            const imagenCodigoQr = document.querySelector('.imagen-qr-modal');
            if (imagenCodigoQr) {
                // encodeURIComponent: Codifica de forma segura la cadena con el identificador y placa para generar el QR.
                imagenCodigoQr.src = vehiculo.codigo_qr_ruta && vehiculo.codigo_qr_ruta !== ""
                    ? vehiculo.codigo_qr_ruta
                    : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(vehiculo.identificador_sistema + '|' + vehiculo.placa_vehicular)}`;
            }

            // Asigna las especificaciones técnicas del vehículo en la ficha.
            const elementosDatosVehiculo = document.querySelectorAll('#modal-ficha-vehicular .columna-modal:first-child .item-dato-modal span');
            if (elementosDatosVehiculo.length >= 5) {
                elementosDatosVehiculo[0].textContent = vehiculo.tipo_vehiculo;
                elementosDatosVehiculo[1].textContent = `${vehiculo.fabricante} ${vehiculo.modelo}`;
                elementosDatosVehiculo[2].textContent = vehiculo.anio_fabricacion;
                elementosDatosVehiculo[3].textContent = vehiculo.color;
                elementosDatosVehiculo[4].textContent = vehiculo.observaciones || 'Sin observaciones';
            }

            // Asigna los datos de fecha y estado de registro en la segunda columna.
            const elementosDatosRegistro = document.querySelectorAll('#modal-ficha-vehicular .columna-modal:last-child .tarjeta-informacion-modal:nth-child(2) .item-dato-modal span');
            if (elementosDatosRegistro.length >= 3) {
                elementosDatosRegistro[0].textContent = vehiculo.fecha_registro;
                elementosDatosRegistro[1].textContent = vehiculo.fecha_actualizacion;
                elementosDatosRegistro[2].textContent = vehiculo.estado_autorizacion;
            }

            // Asigna los datos personales e institucionales del propietario del vehículo.
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
        });
    }

    // Inicializa el renderizado del historial al arrancar la pantalla.
    renderizarHistorial();

    // 7. Lógica del registro temporal de ingresos imprevistos en garita.
    const botonAbrirRegistroTemporal = document.getElementById('boton-registro-temporal');
    if (botonAbrirRegistroTemporal) {
        botonAbrirRegistroTemporal.addEventListener('click', function() {
            abrirModal('modal-registro-temporal');
        });
    }

    // Configura los acordeones desplegables dentro del modal de registro temporal.
    const botonesAcordeonTemporal = document.querySelectorAll('#modal-registro-temporal .boton-desplegar-compacto');
    botonesAcordeonTemporal.forEach(function(botonAcordeon) {
        botonAcordeon.addEventListener('click', function(evento) {
            evento.preventDefault();
            const identificadorContenido = this.getAttribute('data-objetivo');
            const contenedorContenido = document.getElementById(identificadorContenido);
            this.classList.toggle('activo');
            if (contenedorContenido) {
                contenedorContenido.classList.toggle('visible');
            }
        });
    });

    // Referencias a los campos del formulario de registro temporal.
    const formularioRegistroTemporal = document.getElementById('form-registro-temporal');
    const campoTemporalNombres = document.getElementById('temp-nombres');
    const selectorTemporalTipoIdentificacion = document.getElementById('temp-tipo-id');
    const campoTemporalNumeroIdentificacion = document.getElementById('temp-numero-id');
    const campoTemporalPlaca = document.getElementById('temp-placa');
    const selectorTemporalTipoVehiculo = document.getElementById('temp-tipo-vehiculo');
    const selectorTemporalMotivo = document.getElementById('temp-motivo');
    const campoTemporalDestino = document.getElementById('temp-destino');

    // Limpia caracteres numéricos en el campo de nombres en tiempo real reutilizando ocultarAlertaError de validaciones.js.
    if (campoTemporalNombres) {
        campoTemporalNombres.addEventListener('input', function() {
            campoTemporalNombres.value = campoTemporalNombres.value.replace(/[0-9]/g, '');
            ocultarAlertaError(campoTemporalNombres);
        });
    }

    // Normaliza la placa vehicular en mayúsculas sin caracteres especiales.
    if (campoTemporalPlaca) {
        campoTemporalPlaca.addEventListener('input', function() {
            campoTemporalPlaca.value = campoTemporalPlaca.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            ocultarAlertaError(campoTemporalPlaca);
        });
    }

    // Procesa el envío y validación integral del registro temporal.
    if (formularioRegistroTemporal) {
        formularioRegistroTemporal.addEventListener('submit', function(evento) {
            evento.preventDefault();
            let formularioEsValido = true;
            
            const baseDeDatos = obtenerBaseDatos();

            // Validación de nombres del visitante temporal mediante mostrarAlertaError/ocultarAlertaError de scripts/validaciones.js.
            if (campoTemporalNombres.value.trim() === "") {
                mostrarAlertaError(campoTemporalNombres, "El registro es obligatorio");
                formularioEsValido = false;
            } else {
                ocultarAlertaError(campoTemporalNombres);
            }

            // Validación de documento: reutiliza la función oficial validarCedulaEcuatoriana de scripts/validaciones.js.
            if (selectorTemporalTipoIdentificacion.value === "") {
                mostrarAlertaError(selectorTemporalTipoIdentificacion, "El registro es obligatorio");
                formularioEsValido = false;
            } else {
                ocultarAlertaError(selectorTemporalTipoIdentificacion);
                const valorIdentificacion = campoTemporalNumeroIdentificacion.value.trim();
                if (valorIdentificacion === "") {
                    mostrarAlertaError(campoTemporalNumeroIdentificacion, "El registro es obligatorio");
                    formularioEsValido = false;
                } else if (selectorTemporalTipoIdentificacion.value === "cedula" && !validarCedulaEcuatoriana(valorIdentificacion)) {
                    mostrarAlertaError(campoTemporalNumeroIdentificacion, "El registro tiene un formato no válido");
                    formularioEsValido = false;
                } else if (selectorTemporalTipoIdentificacion.value !== "cedula" && (valorIdentificacion.length < 5 || valorIdentificacion.length > 20)) {
                    mostrarAlertaError(campoTemporalNumeroIdentificacion, "El registro tiene un formato no válido");
                    formularioEsValido = false;
                } else {
                    ocultarAlertaError(campoTemporalNumeroIdentificacion);
                }
            }

            // Validación del tipo de vehículo y de la placa ingresada.
            if (selectorTemporalTipoVehiculo.value === "") {
                mostrarAlertaError(selectorTemporalTipoVehiculo, "El registro es obligatorio");
                formularioEsValido = false;
            } else {
                ocultarAlertaError(selectorTemporalTipoVehiculo);
                if (selectorTemporalTipoVehiculo.value !== "Otro") {
                    const valorPlaca = campoTemporalPlaca.value.trim().toUpperCase();
                    if (valorPlaca === "") {
                        mostrarAlertaError(campoTemporalPlaca, "El registro es obligatorio");
                        formularioEsValido = false;
                    } else {
                        let tieneFormatoValido = false;
                        const tiposVehiculoEstandar = ["Automóvil", "Camioneta", "SUV", "Furgoneta", "Bus / buseta", "Camión"];
                        if (tiposVehiculoEstandar.includes(selectorTemporalTipoVehiculo.value)) {
                            tieneFormatoValido = /^[A-Z]{3}[0-9]{4}$/.test(valorPlaca);
                        } else if (selectorTemporalTipoVehiculo.value === "Motocicleta") {
                            tieneFormatoValido = /^[A-Z]{2}[0-9]{3}[A-Z]{1}$/.test(valorPlaca);
                        }
                        
                        if (!tieneFormatoValido) {
                            mostrarAlertaError(campoTemporalPlaca, "El registro tiene un formato no válido");
                            formularioEsValido = false;
                        } else {
                            // Verifica que la placa no se encuentre registrada activamente.
                            const existeEnVehiculos = (baseDeDatos.vehiculos || []).some(function(vehiculo) {
                                return vehiculo.placa_vehicular && vehiculo.placa_vehicular.toUpperCase() === valorPlaca;
                            });
                            const existeEnAutorizaciones = (baseDeDatos.autorizaciones_visitas || []).some(function(autorizacion) {
                                return autorizacion.vehiculo && autorizacion.vehiculo.placa_vehicular && autorizacion.vehiculo.placa_vehicular.toUpperCase() === valorPlaca;
                            });

                            if (existeEnVehiculos || existeEnAutorizaciones) {
                                mostrarAlertaError(campoTemporalPlaca, "Placa ya registrada en el sistema");
                                formularioEsValido = false;
                            } else {
                                ocultarAlertaError(campoTemporalPlaca);
                            }
                        }
                    }
                } else {
                    ocultarAlertaError(campoTemporalPlaca);
                }
            }

            // Validación de obligatoriedad para el motivo y destino de la visita.
            if (selectorTemporalMotivo.value === "") {
                mostrarAlertaError(selectorTemporalMotivo, "El registro es obligatorio");
                formularioEsValido = false;
            } else {
                ocultarAlertaError(selectorTemporalMotivo);
            }

            if (campoTemporalDestino.value.trim() === "") {
                mostrarAlertaError(campoTemporalDestino, "El registro es obligatorio");
                formularioEsValido = false;
            } else {
                ocultarAlertaError(campoTemporalDestino);
            }

            // Almacenamiento y registro automático del ingreso si todos los campos son conformes.
            if (formularioEsValido) {
                // Reutiliza obtenerFechaHoraActual de scripts/informacion.js.
                const tiempoActual = obtenerFechaHoraActual();
                const cadenaFechaActual = tiempoActual.fecha;
                const cadenaHoraActual = tiempoActual.hora;
                const fechaProgramadaLocal = tiempoActual.fechaISO;

                // Reutiliza la función global generarSiguienteIdentificadorAutorizacion de scripts/informacion.js.
                const nuevoIdentificadorAutorizacion = generarSiguienteIdentificadorAutorizacion(baseDeDatos.autorizaciones_visitas);

                // Estructura completa de la autorización temporal generada en punto de control.
                const nuevaAutorizacionTemporal = {
                    identificador_solicitud: nuevoIdentificadorAutorizacion,
                    solicitante_id: sesionActiva.identificador_usuario || "Punto de control",
                    visitante: {
                        nombres_apellidos: campoTemporalNombres.value.trim(),
                        tipo_identificacion: selectorTemporalTipoIdentificacion.options[selectorTemporalTipoIdentificacion.selectedIndex].text,
                        numero_identificacion: campoTemporalNumeroIdentificacion.value.trim(),
                        telefono: "No registrado"
                    },
                    vehiculo: {
                        placa_vehicular: campoTemporalPlaca.value.toUpperCase().trim() || "S/P",
                        tipo_vehiculo: selectorTemporalTipoVehiculo.value,
                        fabricante: "No especificado",
                        modelo: "No especificado",
                        color: "No especificado"
                    },
                    visita: {
                        fecha_programada: fechaProgramadaLocal,
                        hora_programada: cadenaHoraActual,
                        motivo_visita: selectorTemporalMotivo.value,
                        area_destino: campoTemporalDestino.value.trim()
                    },
                    estado_solicitud: "Autorizado",
                    ubicacion_actual: "Dentro de las instalaciones",
                    fecha_registro: cadenaFechaActual,
                    fecha_actualizacion: cadenaFechaActual
                };

                if (!Array.isArray(baseDeDatos.autorizaciones_visitas)) {
                    baseDeDatos.autorizaciones_visitas = [];
                }
                baseDeDatos.autorizaciones_visitas.push(nuevaAutorizacionTemporal);

                // Registra simultáneamente el evento de entrada en el historial de movimientos.
                if (!Array.isArray(baseDeDatos.historial_movimientos)) {
                    baseDeDatos.historial_movimientos = [];
                }
                baseDeDatos.historial_movimientos.push({
                    fecha: cadenaFechaActual,
                    hora: cadenaHoraActual,
                    identificador: nuevaAutorizacionTemporal.identificador_solicitud,
                    tipo_vehiculo: nuevaAutorizacionTemporal.vehiculo.tipo_vehiculo,
                    placa_vehicular: nuevaAutorizacionTemporal.vehiculo.placa_vehicular,
                    propietario: nuevaAutorizacionTemporal.visitante.nombres_apellidos,
                    tipo_usuario: "Visitante",
                    tipo_movimiento: "Entrada",
                    punto_control: sesionActiva.punto_control_asignado || "Punto de control N01"
                });

                guardarCambios(baseDeDatos);
                cerrarModal('modal-registro-temporal');

                const etiquetaTituloModal = document.getElementById('titulo-modal-movimiento');
                const etiquetaFechaModal = document.getElementById('info-fecha-movimiento');
                if (etiquetaTituloModal) {
                    etiquetaTituloModal.textContent = "Entrada registrada correctamente";
                }
                if (etiquetaFechaModal) {
                    etiquetaFechaModal.textContent = `Fecha y hora en que se registró el movimiento: ${cadenaFechaActual} a las ${cadenaHoraActual}.`;
                }

                // setTimeout: Muestra el modal de confirmación y restablece el formulario tras un intervalo suave.
                setTimeout(function() {
                    abrirModal('modal-movimiento-exito');
                    formularioRegistroTemporal.reset();
                    botonesAcordeonTemporal.forEach(function(botonAcordeon) {
                        botonAcordeon.classList.remove('activo');
                    });
                    const elementosContenidoAcordeon = document.querySelectorAll('#modal-registro-temporal .contenido-desplegable');
                    elementosContenidoAcordeon.forEach(function(contenido) {
                        contenido.classList.remove('visible');
                    });
                    renderizarHistorial();
                }, 300);
            }
        });
    }
});