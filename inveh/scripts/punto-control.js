let vehiculoEncontradoActual = null;

// --- FUNCIONES DE AYUDA INTEGRADAS ---
function activarAlertaControl(campo, mensaje) {
    if (!campo) return;
    const contenedor = campo.closest('.bloque-campo-formulario');
    const alerta = contenedor ? contenedor.querySelector('.texto-alerta-error') : null;
    if (alerta) {
        alerta.textContent = mensaje;
        alerta.style.display = 'block';
        campo.style.borderColor = 'var(--color-alerta-salmon-fondo)';
    }
}

function desactivarAlertaControl(campo) {
    if (!campo) return;
    const contenedor = campo.closest('.bloque-campo-formulario');
    const alerta = contenedor ? contenedor.querySelector('.texto-alerta-error') : null;
    if (alerta) {
        alerta.style.display = 'none';
        campo.style.borderColor = 'var(--borde-suave)';
    }
}

function validarCedulaControl(cedula) {
    if (cedula.length !== 10 || !/^\d+$/.test(cedula)) return false;
    const region = parseInt(cedula.substring(0, 2));
    if (region < 1 || region > 24) return false;
    let suma = 0;
    for (let i = 0; i < 9; i++) {
        let mult = (i % 2 === 0) ? parseInt(cedula[i]) * 2 : parseInt(cedula[i]) * 1;
        if (mult > 9) mult -= 9;
        suma += mult;
    }
    const verificador = (suma % 10 === 0) ? 0 : 10 - (suma % 10);
    return verificador === parseInt(cedula[9]);
}

function esFechaDeHoy(fechaStr) {
    if (!fechaStr) return false;
    const ahora = new Date();
    const hoyAnio = ahora.getFullYear();
    const hoyMes = ahora.getMonth() + 1; // 1-12
    const hoyDia = ahora.getDate();

    const str = String(fechaStr).trim();

    // Formato YYYY-MM-DD
    if (/^\d{4}-\d{1,2}-\d{1,2}/.test(str)) {
        const partes = str.split('T')[0].split('-');
        const anio = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10);
        const dia = parseInt(partes[2], 10);
        return anio === hoyAnio && mes === hoyMes && dia === hoyDia;
    }

    // Formato DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
        const partes = str.split('/');
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10);
        const anio = parseInt(partes[2], 10);
        return anio === hoyAnio && mes === hoyMes && dia === hoyDia;
    }

    const d = new Date(str);
    if (!isNaN(d.getTime())) {
        return d.getFullYear() === hoyAnio && (d.getMonth() + 1) === hoyMes && d.getDate() === hoyDia;
    }

    return false;
}

function obtenerUltimoMovimientoVehiculo(historial, vehiculo) {
    if (!Array.isArray(historial) || !vehiculo) return null;
    const normalizar = (txt) => (txt || '').toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const placaVehNorm = normalizar(vehiculo.placa_vehicular);
    const idVehNorm = normalizar(vehiculo.identificador_sistema || vehiculo.identificador_solicitud);

    const movimientos = historial.filter(m => {
        const mPlaca = normalizar(m.placa_vehicular);
        const mId = normalizar(m.identificador);
        const coincidePlaca = mPlaca && placaVehNorm && mPlaca !== 'SP' && mPlaca === placaVehNorm;
        const coincideId = mId && idVehNorm && mId === idVehNorm;
        return coincidePlaca || coincideId;
    });

    return movimientos.length > 0 ? movimientos[movimientos.length - 1] : null;
}

document.addEventListener('DOMContentLoaded', function() {
    // 1. VERIFICAR SESIÓN DE PUNTO DE CONTROL
    const sesion = JSON.parse(localStorage.getItem('sesion_activa'));
    if (!sesion || sesion.rol_sistema !== 'guardia') {
        window.location.href = 'inicio-sesion.html';
        return;
    }

    const nombrePuntoAsignado = sesion.punto_control_asignado || "Punto de control N01";
    const headerPunto = document.getElementById('header-punto-control');
    if (headerPunto) headerPunto.textContent = nombrePuntoAsignado;

    const insignia = document.getElementById('insignia-punto');
    if (insignia) {
        const digitos = nombrePuntoAsignado.replace(/\D/g, ''); 
        insignia.textContent = digitos ? digitos.padStart(2, '0') : '--';
    }

    document.getElementById('boton-cerrar-sesion')?.addEventListener('click', () => {
        localStorage.removeItem('sesion_activa');
        window.location.href = 'inicio-sesion.html';
    });

    // 2. RENDERIZAR HISTORIAL
    function renderizarHistorial() {
        const contenedor = document.getElementById('cuerpo-tabla-historial');
        if (!contenedor) return;

        const db = typeof obtenerBaseDatos === 'function' ? obtenerBaseDatos() : JSON.parse(localStorage.getItem('base_de_datos'));
        const historial = db?.historial_movimientos || [];
        contenedor.innerHTML = '';

        // Filtrar exclusivamente los registros que corresponden al punto de control asignado a esta sesión
        const puntoActual = sesion.punto_control_asignado || "Punto de control N01";
        const normalizarPunto = (p) => (p || '').toString().trim().toUpperCase().replace(/PUNTO\s*DE\s*CONTROL/g, '').replace(/[^A-Z0-9]/g, '');
        const codigoPuntoActual = normalizarPunto(puntoActual);

        const historialFiltrado = historial.filter(item => {
            const codigoItem = normalizarPunto(item.punto_control);
            // Compatibilidad con registros previos sin punto especificado
            if (!codigoItem) return codigoPuntoActual === "N01";
            return codigoItem === codigoPuntoActual;
        });

        if (historialFiltrado.length === 0) {
            contenedor.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--color-texto-atenuado);">No se han registrado movimientos vehiculares en este punto de control</td></tr>`;
            return;
        }

        historialFiltrado.slice().reverse().forEach(item => {
            const fila = `
                <tr>
                    <td>${item.fecha}</td>
                    <td>${item.hora}</td>
                    <td><strong>${item.placa_vehicular}</strong></td>
                    <td>${item.propietario}</td>
                    <td>${item.tipo_usuario}</td>
                    <td class="columna-centrada">
                        <span class="dato-valor movimiento-tabla-texto">
                            ${item.tipo_movimiento}
                        </span>
                    </td>
                </tr>`;
            contenedor.insertAdjacentHTML('beforeend', fila);
        });
    }

    // 3. BUSCADOR DE VEHÍCULOS
    const formComprobar = document.getElementById('form-comprobar-vehiculo');
    const entradaBusqueda = document.getElementById('entrada-busqueda-control');
    const tarjetaResultado = document.getElementById('tarjeta-resultado-coincidencia');
    const mensajeError = document.getElementById('mensaje-sin-coincidencia');

    if (entradaBusqueda) {
        entradaBusqueda.addEventListener('input', () => {
            entradaBusqueda.value = entradaBusqueda.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
            if (mensajeError) mensajeError.style.display = 'none';
        });
    }

    formComprobar?.addEventListener('submit', function(e) {
        e.preventDefault();
        const criterio = entradaBusqueda.value.trim().toUpperCase();

        if (!criterio) {
            vehiculoEncontradoActual = null;
            if (tarjetaResultado) tarjetaResultado.style.display = 'none';
            if (mensajeError) {
                mensajeError.textContent = "Registre una placa o identificador vehicular";
                mensajeError.style.display = 'block';
            }
            return;
        }

        const db = typeof obtenerBaseDatos === 'function' ? obtenerBaseDatos() : JSON.parse(localStorage.getItem('base_de_datos'));
        const normalizar = (txt) => (txt || '').toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        const criterioNorm = normalizar(criterio);

        // 1. Buscar en vehículos propios autorizados
        let vehiculo = (db?.vehiculos || []).find(v => {
            if (v.estado_autorizacion !== "Autorizado") return false;
            const placaNorm = normalizar(v.placa_vehicular);
            const idSisNorm = normalizar(v.identificador_sistema);
            return (placaNorm && placaNorm === criterioNorm) || (idSisNorm && idSisNorm === criterioNorm);
        });

        // 2. Buscar en visitas autorizadas y registros temporales
        if (!vehiculo) {
            const autorizacion = (db?.autorizaciones_visitas || []).find(a => {
                const estado = a.estado_solicitud || a.estado_autorizacion;
                if (estado !== "Autorizado") return false;

                const idSolNorm = normalizar(a.identificador_solicitud || a.identificador_sistema);
                const placaVisitaNorm = normalizar(a.vehiculo?.placa_vehicular);

                const coincideId = idSolNorm && idSolNorm === criterioNorm;
                const coincidePlaca = placaVisitaNorm && placaVisitaNorm !== "SP" && placaVisitaNorm === criterioNorm;

                if (!coincideId && !coincidePlaca) return false;

                // Validación estricta de fecha para visitas:
                // Solo debe aparecer si es el día correspondiente a la fecha programada.
                // Si el vehículo ya ingresó (está dentro), se le permite procesar su salida.
                const fechaProg = a.visita?.fecha_programada;
                const estaDentro = a.ubicacion_actual === "Dentro de las instalaciones";
                if (!estaDentro && fechaProg && !esFechaDeHoy(fechaProg)) {
                    return false;
                }

                return true;
            });

            if (autorizacion) {
                const solicitante = (db?.usuarios || []).find(u => u.numero_identificacion === autorizacion.solicitante_id);
                const veh = autorizacion.vehiculo || {};
                const vis = autorizacion.visitante || {};
                vehiculo = {
                    es_visita: true,
                    identificador_solicitud: autorizacion.identificador_solicitud,
                    identificador_sistema: autorizacion.identificador_solicitud,
                    placa_vehicular: veh.placa_vehicular || "S/P",
                    tipo_vehiculo: veh.tipo_vehiculo || "Peatonal / Otro",
                    color: veh.color || "No especificado",
                    fabricante: veh.fabricante || "No especificado",
                    modelo: veh.modelo || "No especificado",
                    ubicacion_actual: autorizacion.ubicacion_actual || "Fuera de las instalaciones",
                    propietario_nombre: vis.nombres_apellidos || "Visitante",
                    propietario_cedula: vis.numero_identificacion || "-",
                    titulo_propietario: "Información del visitante (Visita)",
                    solicitante_nombre: solicitante ? solicitante.nombres_apellidos : "Institucional"
                };
            }
        }

        if (vehiculo) {
            // Sincronizar ubicación_actual según el último movimiento registrado en el sistema
            const ultimoMov = obtenerUltimoMovimientoVehiculo(db?.historial_movimientos, vehiculo);
            if (ultimoMov) {
                vehiculo.ubicacion_actual = (ultimoMov.tipo_movimiento === "Entrada")
                    ? "Dentro de las instalaciones"
                    : "Fuera de las instalaciones";
            } else if (!vehiculo.ubicacion_actual) {
                vehiculo.ubicacion_actual = "Fuera de las instalaciones";
            }

            // Si la ubicación en la base de datos estaba desactualizada, sincronizarla
            let cambiosSync = false;
            if (!vehiculo.es_visita && Array.isArray(db?.vehiculos)) {
                const vEnDb = db.vehiculos.find(v => normalizar(v.identificador_sistema) === normalizar(vehiculo.identificador_sistema));
                if (vEnDb && vEnDb.ubicacion_actual !== vehiculo.ubicacion_actual) {
                    vEnDb.ubicacion_actual = vehiculo.ubicacion_actual;
                    cambiosSync = true;
                }
            } else if (vehiculo.es_visita && Array.isArray(db?.autorizaciones_visitas)) {
                const aEnDb = db.autorizaciones_visitas.find(a => normalizar(a.identificador_solicitud) === normalizar(vehiculo.identificador_solicitud));
                if (aEnDb && aEnDb.ubicacion_actual !== vehiculo.ubicacion_actual) {
                    aEnDb.ubicacion_actual = vehiculo.ubicacion_actual;
                    cambiosSync = true;
                }
            }
            if (cambiosSync) {
                if (typeof guardarCambios === 'function') guardarCambios(db);
                else localStorage.setItem('base_de_datos', JSON.stringify(db));
            }

            vehiculoEncontradoActual = vehiculo;
            if (mensajeError) mensajeError.style.display = 'none';
            mostrarResultadoVehiculo(vehiculo, db);
        } else {
            vehiculoEncontradoActual = null;
            if (tarjetaResultado) tarjetaResultado.style.display = 'none';
            if (mensajeError) {
                mensajeError.textContent = "No se encontró ningún resultado con los datos registrados";
                mensajeError.style.display = 'block';
            }
        }
    });

    // 4. MOSTRAR TARJETA DE RESULTADO Y ALTERNAR BOTÓN
    function mostrarResultadoVehiculo(vehiculo, db) {
        // Asegurar que vehiculo tenga la ubicación sincronizada según el último movimiento en el historial
        const ultimoMov = obtenerUltimoMovimientoVehiculo(db?.historial_movimientos, vehiculo);
        if (ultimoMov) {
            vehiculo.ubicacion_actual = (ultimoMov.tipo_movimiento === "Entrada")
                ? "Dentro de las instalaciones"
                : "Fuera de las instalaciones";
        } else if (!vehiculo.ubicacion_actual) {
            vehiculo.ubicacion_actual = "Fuera de las instalaciones";
        }

        document.getElementById('res-placa').textContent = vehiculo.placa_vehicular;
        document.getElementById('res-identificador').textContent = vehiculo.identificador_sistema;
        document.getElementById('res-ubicacion').textContent = vehiculo.ubicacion_actual;

        const btnFicha = document.getElementById('btn-ver-ficha-control');

        if (vehiculo.es_visita) {
            document.getElementById('res-titulo-propietario').textContent = vehiculo.titulo_propietario;
            document.getElementById('res-propietario-nombre').textContent = vehiculo.propietario_nombre;
            document.getElementById('res-propietario-cedula').textContent = vehiculo.propietario_cedula;
            if (btnFicha) btnFicha.style.display = 'none';
        } else {
            const propietario = (db?.usuarios || []).find(u => u.numero_identificacion === vehiculo.propietario_id);
            const tipoUsr = propietario ? `(${propietario.tipo_usuario})` : "";
            document.getElementById('res-titulo-propietario').textContent = `Información del propietario ${tipoUsr}`;
            document.getElementById('res-propietario-nombre').textContent = propietario ? propietario.nombres_apellidos : "No registrado";
            document.getElementById('res-propietario-cedula').textContent = vehiculo.propietario_id;
            if (btnFicha) btnFicha.style.display = 'inline-flex';
        }

        document.getElementById('res-tipo-vehiculo').textContent = vehiculo.tipo_vehiculo;
        document.getElementById('res-color').textContent = vehiculo.color;
        document.getElementById('res-modelo').textContent = `${vehiculo.fabricante || ''} ${vehiculo.modelo || ''}`.trim() || '-';

        const textoUltimoMov = document.getElementById('res-ultimo-movimiento');
        if (textoUltimoMov) {
            if (ultimoMov) {
                const puntoTexto = ultimoMov.punto_control ? ` (${ultimoMov.punto_control.replace('Punto de control ', '')})` : '';
                textoUltimoMov.textContent = `Último movimiento: ${ultimoMov.tipo_movimiento} registrada el ${ultimoMov.fecha} a las ${ultimoMov.hora}${puntoTexto}.`;
            } else {
                textoUltimoMov.textContent = "Sin movimientos previos registrados hoy.";
            }
        }

        configurarBotonMovimiento(vehiculo.ubicacion_actual);
        if (tarjetaResultado) tarjetaResultado.style.display = 'flex';
    }

    function configurarBotonMovimiento(ubicacion) {
        const btn = document.getElementById('btn-confirmar-movimiento');
        const txt = document.getElementById('texto-btn-movimiento');
        const icono = document.getElementById('icono-movimiento');

        if (ubicacion === "Dentro de las instalaciones") {
            btn.className = "boton-accion-movimiento movimiento-salida";
            txt.textContent = "Confirmar salida";
            if (icono) icono.src = "recursos/imagenes/eliminar.svg";
        } else {
            btn.className = "boton-accion-movimiento movimiento-entrada";
            txt.textContent = "Confirmar entrada";
            if (icono) icono.src = "recursos/imagenes/aceptar.svg";
        }
    }

    // 5. REGISTRAR EL MOVIMIENTO
    document.getElementById('btn-confirmar-movimiento')?.addEventListener('click', function() {
        if (!vehiculoEncontradoActual) return;

        const db = typeof obtenerBaseDatos === 'function' ? obtenerBaseDatos() : JSON.parse(localStorage.getItem('base_de_datos'));
        const ahora = new Date();
        const dia = String(ahora.getDate()).padStart(2, '0');
        const mes = String(ahora.getMonth() + 1).padStart(2, '0');
        const fechaHoy = `${dia}/${mes}/${ahora.getFullYear()}`;
        const horaHoy = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;

        let tipoMovimiento = "";

        if (vehiculoEncontradoActual.es_visita) {
            const normalizar = (txt) => (txt || '').toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
            const idActualNorm = normalizar(vehiculoEncontradoActual.identificador_solicitud || vehiculoEncontradoActual.identificador_sistema);
            const placaActualNorm = normalizar(vehiculoEncontradoActual.placa_vehicular);

            const autorizacion = (db?.autorizaciones_visitas || []).find(a => {
                const aIdNorm = normalizar(a.identificador_solicitud || a.identificador_sistema);
                const aPlacaNorm = normalizar(a.vehiculo?.placa_vehicular);
                return (aIdNorm && aIdNorm === idActualNorm) || (aPlacaNorm && aPlacaNorm !== 'SP' && aPlacaNorm === placaActualNorm);
            });
            if (!autorizacion) return;

            const ubicacionActual = autorizacion.ubicacion_actual || vehiculoEncontradoActual.ubicacion_actual || "Fuera de las instalaciones";
            const esSalida = ubicacionActual === "Dentro de las instalaciones";
            tipoMovimiento = esSalida ? "Salida" : "Entrada";

            if (!Array.isArray(db.historial_movimientos)) db.historial_movimientos = [];
            db.historial_movimientos.push({
                fecha: fechaHoy,
                hora: horaHoy,
                identificador: autorizacion.identificador_solicitud,
                tipo_vehiculo: autorizacion.vehiculo?.tipo_vehiculo || "Peatonal / Otro",
                placa_vehicular: autorizacion.vehiculo?.placa_vehicular || "S/P",
                propietario: autorizacion.visitante?.nombres_apellidos || "Visitante",
                tipo_usuario: "Visitante",
                tipo_movimiento: tipoMovimiento,
                punto_control: sesion.punto_control_asignado || "Punto de control N01"
            });

            if (esSalida) {
                db.autorizaciones_visitas = db.autorizaciones_visitas.filter(a => normalizar(a.identificador_solicitud) !== normalizar(autorizacion.identificador_solicitud));
                tarjetaResultado.style.display = 'none';
                if (entradaBusqueda) entradaBusqueda.value = '';
                vehiculoEncontradoActual = null;
            } else {
                autorizacion.ubicacion_actual = "Dentro de las instalaciones";
                vehiculoEncontradoActual.ubicacion_actual = autorizacion.ubicacion_actual;
            }
        } else {
            const normalizar = (txt) => (txt || '').toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
            const idActualNorm = normalizar(vehiculoEncontradoActual.identificador_sistema);
            const placaActualNorm = normalizar(vehiculoEncontradoActual.placa_vehicular);

            const vehiculo = (db?.vehiculos || []).find(v => {
                const vIdNorm = normalizar(v.identificador_sistema);
                const vPlacaNorm = normalizar(v.placa_vehicular);
                return (vIdNorm && vIdNorm === idActualNorm) || (vPlacaNorm && vPlacaNorm !== 'SP' && vPlacaNorm === placaActualNorm);
            });
            if (!vehiculo) return;

            const propietario = (db?.usuarios || []).find(u => u.numero_identificacion === vehiculo.propietario_id);

            const ubicacionActual = vehiculo.ubicacion_actual || vehiculoEncontradoActual.ubicacion_actual || "Fuera de las instalaciones";
            const esSalida = ubicacionActual === "Dentro de las instalaciones";
            tipoMovimiento = esSalida ? "Salida" : "Entrada";

            vehiculo.ubicacion_actual = esSalida ? "Fuera de las instalaciones" : "Dentro de las instalaciones";
            vehiculoEncontradoActual.ubicacion_actual = vehiculo.ubicacion_actual;

            if (!Array.isArray(db.historial_movimientos)) db.historial_movimientos = [];
            db.historial_movimientos.push({
                fecha: fechaHoy,
                hora: horaHoy,
                identificador: vehiculo.identificador_sistema,
                tipo_vehiculo: vehiculo.tipo_vehiculo,
                placa_vehicular: vehiculo.placa_vehicular,
                propietario: propietario ? propietario.nombres_apellidos : "No asignado",
                tipo_usuario: propietario ? propietario.tipo_usuario : "Estudiante",
                tipo_movimiento: tipoMovimiento,
                punto_control: sesion.punto_control_asignado || "Punto de control N01"
            });
        }

        if (typeof guardarCambios === 'function') {
            guardarCambios(db);
        } else {
            localStorage.setItem('base_de_datos', JSON.stringify(db));
        }

        if (vehiculoEncontradoActual) {
            document.getElementById('res-ubicacion').textContent = vehiculoEncontradoActual.ubicacion_actual;
            const tipoReg = vehiculoEncontradoActual.ubicacion_actual === "Dentro de las instalaciones" ? "Entrada" : "Salida";
            const ptoActualTag = (sesion.punto_control_asignado || "Punto de control N01").replace('Punto de control ', '');
            document.getElementById('res-ultimo-movimiento').textContent = `Último movimiento: ${tipoReg} registrada el ${fechaHoy} a las ${horaHoy} (${ptoActualTag}).`;
            configurarBotonMovimiento(vehiculoEncontradoActual.ubicacion_actual);
        }

        renderizarHistorial();

        const tituloModal = document.getElementById('titulo-modal-movimiento');
        const infoFecha = document.getElementById('info-fecha-movimiento');
        if (tituloModal) tituloModal.textContent = `${tipoMovimiento} registrada correctamente`;
        if (infoFecha) infoFecha.textContent = `Fecha y hora en que se registró el movimiento: ${fechaHoy} a las ${horaHoy}.`;

        abrirModal('modal-movimiento-exito');
    });

    // 6. ABRIR FICHA TÉCNICA DEL VEHÍCULO ENCONTRADO
    document.getElementById('btn-ver-ficha-control')?.addEventListener('click', () => {
        if (!vehiculoEncontradoActual || !vehiculoEncontradoActual.identificador_sistema) return;
        
        const db = typeof obtenerBaseDatos === 'function' ? obtenerBaseDatos() : JSON.parse(localStorage.getItem('base_de_datos'));
        const vehiculo = vehiculoEncontradoActual;
        const propietario = (db?.usuarios || []).find(u => u.numero_identificacion === vehiculo.propietario_id);

        document.querySelector('.etiqueta-placa-ficha').textContent = vehiculo.placa_vehicular;
        document.querySelector('.identificador-texto-modal .dato-valor').textContent = vehiculo.identificador_sistema;
        
        const imagenQr = document.querySelector('.imagen-qr-modal');
        if (imagenQr) {
            imagenQr.src = vehiculo.codigo_qr_ruta && vehiculo.codigo_qr_ruta !== ""
                ? vehiculo.codigo_qr_ruta
                : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(vehiculo.identificador_sistema + '|' + vehiculo.placa_vehicular)}`;
        }

        const datosVeh = document.querySelectorAll('#modal-ficha-vehicular .columna-modal:first-child .item-dato-modal span');
        if (datosVeh.length >= 5) {
            datosVeh[0].textContent = vehiculo.tipo_vehiculo;
            datosVeh[1].textContent = `${vehiculo.fabricante} ${vehiculo.modelo}`;
            datosVeh[2].textContent = vehiculo.anio_fabricacion;
            datosVeh[3].textContent = vehiculo.color;
            datosVeh[4].textContent = vehiculo.observaciones || 'Sin observaciones';
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
    });

    // Carga inicial del historial
    renderizarHistorial();

    // 7. LÓGICA DEL REGISTRO TEMPORAL

    // Abrir Modal
    document.getElementById('boton-registro-temporal')?.addEventListener('click', () => {
        abrirModal('modal-registro-temporal');
    });

    // Desplegables del modal
    document.querySelectorAll('#modal-registro-temporal .boton-desplegar-compacto').forEach(boton => {
        boton.addEventListener('click', function(e) {
            e.preventDefault();
            const idContenido = this.getAttribute('data-objetivo');
            const contenido = document.getElementById(idContenido);
            this.classList.toggle('activo');
            if (contenido) contenido.classList.toggle('visible');
        });
    });

    const formTemporal = document.getElementById('form-registro-temporal');
    const tempNombres = document.getElementById('temp-nombres');
    const tempTipoId = document.getElementById('temp-tipo-id');
    const tempNumId = document.getElementById('temp-numero-id');
    const tempPlaca = document.getElementById('temp-placa');
    const tempTipoVehiculo = document.getElementById('temp-tipo-vehiculo');
    const tempMotivo = document.getElementById('temp-motivo');
    const tempDestino = document.getElementById('temp-destino');

    if (tempNombres) {
        tempNombres.addEventListener('input', () => {
            tempNombres.value = tempNombres.value.replace(/[0-9]/g, '');
            desactivarAlertaControl(tempNombres);
        });
    }

    if (tempPlaca) {
        tempPlaca.addEventListener('input', () => {
            tempPlaca.value = tempPlaca.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            desactivarAlertaControl(tempPlaca);
        });
    }

    function obtenerSiguienteIdentificadorAutorizacion(listaAutorizaciones) {
        let numeroMasAlto = 0; // Inicia en 0 para que la primera sea AUT-000001

        const revisarId = (id) => {
            if (id && typeof id === 'string' && id.startsWith('AUT-')) {
                const num = parseInt(id.replace('AUT-', ''), 10);
                if (!isNaN(num) && num > numeroMasAlto) {
                    numeroMasAlto = num;
                }
            }
        };

        const db = typeof obtenerBaseDatos === 'function' ? obtenerBaseDatos() : JSON.parse(localStorage.getItem('base_de_datos') || '{}');

        // 1. Revisar en autorizaciones de visitas existentes
        const autorizaciones = db?.autorizaciones_visitas || (Array.isArray(listaAutorizaciones) ? listaAutorizaciones : []);
        autorizaciones.forEach(item => {
            revisarId(item.identificador_solicitud);
            revisarId(item.identificador_sistema);
        });

        // 2. Revisar en historial de movimientos (evita que se repita entre diferentes puntos de control o si el vehículo salió)
        (db?.historial_movimientos || []).forEach(item => {
            revisarId(item.identificador);
            revisarId(item.identificador_solicitud);
        });

        return `AUT-${String(numeroMasAlto + 1).padStart(6, '0')}`;
    }

    formTemporal?.addEventListener('submit', function(e) {
        e.preventDefault();
        let esValido = true;
        
        // Cargamos la BD al inicio para poder validar si la placa ya existe
        const db = typeof obtenerBaseDatos === 'function' ? obtenerBaseDatos() : JSON.parse(localStorage.getItem('base_de_datos') || '{}');

        // Validar Nombres
        if (tempNombres.value.trim() === "") { activarAlertaControl(tempNombres, "El registro es obligatorio"); esValido = false; } else { desactivarAlertaControl(tempNombres); }

        // Validar Identificación
        if (tempTipoId.value === "") {
            activarAlertaControl(tempTipoId, "El registro es obligatorio");
            esValido = false;
        } else {
            desactivarAlertaControl(tempTipoId);
            const valId = tempNumId.value.trim();
            if (valId === "") {
                activarAlertaControl(tempNumId, "El registro es obligatorio");
                esValido = false;
            } else if (tempTipoId.value === "cedula" && typeof validarCedulaControl === 'function' && !validarCedulaControl(valId)) {
                activarAlertaControl(tempNumId, "El registro tiene un formato no válido");
                esValido = false;
            } else if (tempTipoId.value !== "cedula" && (valId.length < 5 || valId.length > 20)) {
                activarAlertaControl(tempNumId, "El registro tiene un formato no válido");
                esValido = false;
            } else { desactivarAlertaControl(tempNumId); }
        }

        // Validar Vehículo y Placa Única
        if (tempTipoVehiculo.value === "") {
            activarAlertaControl(tempTipoVehiculo, "El registro es obligatorio");
            esValido = false;
        } else {
            desactivarAlertaControl(tempTipoVehiculo);
            if (tempTipoVehiculo.value !== "Otro") {
                const valPlaca = tempPlaca.value.trim().toUpperCase();
                if (valPlaca === "") {
                    activarAlertaControl(tempPlaca, "El registro es obligatorio");
                    esValido = false;
                } else {
                    let placaOk = false;
                    const tiposEst = ["Automóvil", "Camioneta", "SUV", "Furgoneta", "Bus / buseta", "Camión"];
                    if (tiposEst.includes(tempTipoVehiculo.value)) {
                        placaOk = /^[A-Z]{3}[0-9]{4}$/.test(valPlaca);
                    } else if (tempTipoVehiculo.value === "Motocicleta") {
                        placaOk = /^[A-Z]{2}[0-9]{3}[A-Z]{1}$/.test(valPlaca);
                    }
                    
                    if (!placaOk) {
                        activarAlertaControl(tempPlaca, "El registro tiene un formato no válido");
                        esValido = false;
                    } else {
                        // VALIDACIÓN: Comprobar que la placa no esté adentro ni registrada previamente
                        const existeEnVehiculos = (db.vehiculos || []).some(v => v.placa_vehicular && v.placa_vehicular.toUpperCase() === valPlaca);
                        const existeEnAutorizaciones = (db.autorizaciones_visitas || []).some(a => a.vehiculo && a.vehiculo.placa_vehicular && a.vehiculo.placa_vehicular.toUpperCase() === valPlaca);

                        if (existeEnVehiculos || existeEnAutorizaciones) {
                            activarAlertaControl(tempPlaca, "Placa ya registrada en el sistema");
                            esValido = false;
                        } else {
                            desactivarAlertaControl(tempPlaca);
                        }
                    }
                }
            } else { desactivarAlertaControl(tempPlaca); }
        }

        // Validar Motivo y Destino
        if (tempMotivo.value === "") { activarAlertaControl(tempMotivo, "El registro es obligatorio"); esValido = false; } else { desactivarAlertaControl(tempMotivo); }
        if (tempDestino.value.trim() === "") { activarAlertaControl(tempDestino, "El registro es obligatorio"); esValido = false; } else { desactivarAlertaControl(tempDestino); }

        // --- GUARDADO FINAL SI TODO ES VÁLIDO ---
        if (esValido) {
            const ahora = new Date();
            const dia = String(ahora.getDate()).padStart(2, '0');
            const mes = String(ahora.getMonth() + 1).padStart(2, '0');
            const anio = ahora.getFullYear();
            const fechaHoy = `${dia}/${mes}/${anio}`;
            const horaHoy = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
            const fechaProgramadaLocal = `${anio}-${mes}-${dia}`; // Evita bugs de zona horaria

            const idAuto = obtenerSiguienteIdentificadorAutorizacion(db.autorizaciones_visitas);

            const nuevaAutorizacion = {
                identificador_solicitud: idAuto,
                solicitante_id: sesion.identificador_usuario || "Punto de control",
                visitante: {
                    nombres_apellidos: tempNombres.value.trim(),
                    tipo_identificacion: tempTipoId.options[tempTipoId.selectedIndex].text,
                    numero_identificacion: tempNumId.value.trim(),
                    telefono: "No registrado"
                },
                vehiculo: {
                    placa_vehicular: tempPlaca.value.toUpperCase().trim() || "S/P",
                    tipo_vehiculo: tempTipoVehiculo.value,
                    fabricante: "No especificado",
                    modelo: "No especificado",
                    color: "No especificado"
                },
                visita: {
                    fecha_programada: fechaProgramadaLocal,
                    hora_programada: horaHoy,
                    motivo_visita: tempMotivo.value,
                    area_destino: tempDestino.value.trim()
                },
                estado_solicitud: "Autorizado",
                ubicacion_actual: "Dentro de las instalaciones",
                fecha_registro: fechaHoy,
                fecha_actualizacion: fechaHoy
            };

            if (!Array.isArray(db.autorizaciones_visitas)) db.autorizaciones_visitas = [];
            db.autorizaciones_visitas.push(nuevaAutorizacion);

            if (!Array.isArray(db.historial_movimientos)) db.historial_movimientos = [];
            db.historial_movimientos.push({
                fecha: fechaHoy,
                hora: horaHoy,
                identificador: nuevaAutorizacion.identificador_solicitud,
                tipo_vehiculo: nuevaAutorizacion.vehiculo.tipo_vehiculo,
                placa_vehicular: nuevaAutorizacion.vehiculo.placa_vehicular,
                propietario: nuevaAutorizacion.visitante.nombres_apellidos,
                tipo_usuario: "Visitante",
                tipo_movimiento: "Entrada",
                punto_control: sesion.punto_control_asignado || "Punto de control N01"
            });

            if (typeof guardarCambios === 'function') {
                guardarCambios(db);
            } else {
                localStorage.setItem('base_de_datos', JSON.stringify(db));
            }

            cerrarModal('modal-registro-temporal');

            const tituloModal = document.getElementById('titulo-modal-movimiento');
            const infoFecha = document.getElementById('info-fecha-movimiento');
            if (tituloModal) tituloModal.textContent = "Entrada registrada correctamente";
            if (infoFecha) infoFecha.textContent = `Fecha y hora en que se registró el movimiento: ${fechaHoy} a las ${horaHoy}.`;

            setTimeout(() => {
                abrirModal('modal-movimiento-exito');
                formTemporal.reset();
                // Opcional: Cerrar los acordeones después de resetear
                document.querySelectorAll('#modal-registro-temporal .boton-desplegar-compacto').forEach(b => b.classList.remove('activo'));
                document.querySelectorAll('#modal-registro-temporal .contenido-desplegable').forEach(c => c.classList.remove('visible'));
                renderizarHistorial();
            }, 300);
        }
    });
});