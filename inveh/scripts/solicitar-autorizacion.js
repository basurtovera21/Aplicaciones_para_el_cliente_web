document.addEventListener('DOMContentLoaded', function() {
    const formularioAuth = document.getElementById('form-crear-autorizacion');
    if (!formularioAuth) return;

    // 1. VARIABLES DE LOS CAMPOS
    const nombres = document.getElementById('auth-nombres');
    const tipoId = document.getElementById('auth-tipo-id');
    const numId = document.getElementById('auth-numero-id');
    const telefono = document.getElementById('auth-telefono');
    
    const placa = document.getElementById('auth-placa');
    const tipoVehiculo = document.getElementById('auth-tipo-vehiculo');
    const fabricante = document.getElementById('auth-fabricante');
    const modelo = document.getElementById('auth-modelo');
    const color = document.getElementById('auth-color');
    
    const fechaInput = document.getElementById('auth-fecha');
    const horaInput = document.getElementById('auth-hora');
    const motivo = document.getElementById('auth-motivo');
    const destino = document.getElementById('auth-destino');

    // 2. MANEJO DE DESPLEGABLES (ACORDEÓN)
    const botonesDesplegar = document.querySelectorAll('.boton-desplegar-compacto');
    botonesDesplegar.forEach(boton => {
        boton.addEventListener('click', function() {
            const contenido = document.getElementById(this.getAttribute('data-objetivo'));
            this.classList.toggle('activo');
            if (contenido) contenido.classList.toggle('visible');
        });
    });

    // 3. LIMPIEZA EN TIEMPO REAL
    const camposSoloLetras = [nombres, fabricante, modelo, color];
    camposSoloLetras.forEach(campo => {
        if (campo) {
            campo.addEventListener('input', () => {
                campo.value = campo.value.replace(/[0-9]/g, '');
                ocultarAlertaError(campo);
            });
        }
    });

    if (placa) {
        placa.addEventListener('input', () => {
            placa.value = placa.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            ocultarAlertaError(placa);
        });
    }

    function obtenerSiguienteIdentificadorAutorizacion(listaAutorizaciones) {
        let numeroMasAlto = 100;

        if (Array.isArray(listaAutorizaciones)) {
            listaAutorizaciones.forEach(item => {
                if (item.identificador_solicitud && item.identificador_solicitud.startsWith('AUT-')) {
                    const numeroExtraido = parseInt(item.identificador_solicitud.replace('AUT-', ''), 10);
                    if (!isNaN(numeroExtraido) && numeroExtraido > numeroMasAlto) {
                        numeroMasAlto = numeroExtraido;
                    }
                }
            });
        }

        const siguienteNumero = numeroMasAlto + 1;
        return `AUT-${String(siguienteNumero).padStart(6, '0')}`;
    }

    // 4. VALIDACIÓN Y GUARDADO AL ENVIAR
    formularioAuth.addEventListener('submit', function(evento) {
        evento.preventDefault();
        let esValido = true;

        // Validar Nombres
        if (nombres.value.trim() === "") {
            mostrarAlertaError(nombres, "El registro es obligatorio");
            esValido = false;
        } else { ocultarAlertaError(nombres); }

        // Validar Identificación
        if (tipoId.value === "") {
            mostrarAlertaError(tipoId, "El registro es obligatorio");
            esValido = false;
        } else {
            ocultarAlertaError(tipoId);
            const valorId = numId.value.trim();
            if (valorId === "") {
                mostrarAlertaError(numId, "El registro es obligatorio");
                esValido = false;
            } else {
                if (tipoId.value === "cedula") {
                    if (!validarCedulaEcuatoriana(valorId)) {
                        mostrarAlertaError(numId, "El registro tiene un formato no válido");
                        esValido = false;
                    } else { ocultarAlertaError(numId); }
                } else {
                    if (valorId.length < 5 || valorId.length > 20) {
                        mostrarAlertaError(numId, "El registro tiene un formato no válido");
                        esValido = false;
                    } else { ocultarAlertaError(numId); }
                }
            }
        }

        // Validar Teléfono (Opcional, pero con formato 09...)
        const valorTel = telefono.value.trim();
        if (valorTel === "") {
            ocultarAlertaError(telefono);
        } else if (!/^09[0-9]{8}$/.test(valorTel)) {
            mostrarAlertaError(telefono, "El registro tiene un formato no válido");
            esValido = false;
        } else { 
            ocultarAlertaError(telefono); 
        }

        // Validar Tipo de Vehículo y Placa
        if (tipoVehiculo.value === "") {
            mostrarAlertaError(tipoVehiculo, "El registro es obligatorio");
            esValido = false;
        } else {
            ocultarAlertaError(tipoVehiculo);
            if (tipoVehiculo.value !== "otro") {
                const valorPlaca = placa.value.trim().toUpperCase();
                if (valorPlaca === "") {
                    mostrarAlertaError(placa, "El registro es obligatorio");
                    esValido = false;
                } else {
                    let placaOk = false;
                    const tiposEstandar = ["automovil", "camioneta", "suv", "furgoneta", "bus", "camion"];
                    if (tiposEstandar.includes(tipoVehiculo.value)) {
                        placaOk = /^[A-Z]{3}[0-9]{4}$/.test(valorPlaca);
                    } else if (tipoVehiculo.value === "motocicleta") {
                        placaOk = /^[A-Z]{2}[0-9]{3}[A-Z]{1}$/.test(valorPlaca);
                    }
                    if (!placaOk) {
                        mostrarAlertaError(placa, "El registro tiene un formato no válido");
                        esValido = false;
                    } else {
                        // VALIDACIÓN: Comprobar que la placa no exista en la base de datos
                        const baseDeDatos = typeof obtenerBaseDatos === 'function' 
                            ? obtenerBaseDatos() 
                            : JSON.parse(localStorage.getItem('base_de_datos') || localStorage.getItem('inveh_db'));

                        const existeEnVehiculos = baseDeDatos && Array.isArray(baseDeDatos.vehiculos)
                            ? baseDeDatos.vehiculos.some(v => v.placa_vehicular && v.placa_vehicular.toUpperCase() === valorPlaca)
                            : false;

                        const existeEnAutorizaciones = baseDeDatos && Array.isArray(baseDeDatos.autorizaciones_visitas)
                            ? baseDeDatos.autorizaciones_visitas.some(a => a.vehiculo && a.vehiculo.placa_vehicular && a.vehiculo.placa_vehicular.toUpperCase() === valorPlaca)
                            : false;

                        if (existeEnVehiculos || existeEnAutorizaciones) {
                            mostrarAlertaError(placa, "El vehículo se encuentra registrado");
                            esValido = false;
                        } else {
                            ocultarAlertaError(placa);
                        }
                    }
                }
            } else { ocultarAlertaError(placa); }
        }

        // Validar Fabricante, Modelo y Color
        [fabricante, modelo, color].forEach(campo => {
            if (campo.value.trim() === "") {
                mostrarAlertaError(campo, "El registro es obligatorio");
                esValido = false;
            } else if (campo.value.trim().length < 2) {
                mostrarAlertaError(campo, "El registro tiene un formato no válido");
                esValido = false;
            } else { ocultarAlertaError(campo); }
        });

        // Validar Fecha Programada
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaElegida = new Date(fechaInput.value + "T00:00:00");
        if (!fechaInput.value) {
            mostrarAlertaError(fechaInput, "El registro es obligatorio");
            esValido = false;
        } else if (fechaElegida < hoy) {
            mostrarAlertaError(fechaInput, "El registro no es válido.");
            esValido = false;
        } else { ocultarAlertaError(fechaInput); }

        // Validar Hora Programada
        if (!horaInput.value) {
            mostrarAlertaError(horaInput, "El registro es obligatorio");
            esValido = false;
        } else {
            const [hora, min] = horaInput.value.split(':').map(Number);
            const ahora = new Date();
            if (hora < 7 || hora >= 19) {
                mostrarAlertaError(horaInput, "Horario de visitas establecido (7AM - 7PM)");
                esValido = false;
            } else if (fechaElegida.getTime() === hoy.getTime()) {
                if (hora < ahora.getHours() || (hora === ahora.getHours() && min < ahora.getMinutes())) {
                    mostrarAlertaError(horaInput, "El registro no es válido");
                    esValido = false;
                } else { ocultarAlertaError(horaInput); }
            } else { ocultarAlertaError(horaInput); }
        }

        // Validar Motivo y Destino
        if (motivo.value === "") {
            mostrarAlertaError(motivo, "El registro es obligatorio");
            esValido = false;
        } else { ocultarAlertaError(motivo); }

        if (destino.value.trim() === "") {
            mostrarAlertaError(destino, "El registro es obligatorio");
            esValido = false;
        } else if (destino.value.length > 100) {
            mostrarAlertaError(destino, "El registro excede el límite de caracteres permitidos (100)");
            esValido = false;
        } else { ocultarAlertaError(destino); }

        // 5. Guardar en Base de Datos Local
        if (esValido) {
            const baseDeDatos = typeof obtenerBaseDatos === 'function' 
                ? obtenerBaseDatos() 
                : JSON.parse(localStorage.getItem('base_de_datos') || localStorage.getItem('inveh_db'));

            const usuarioActivo = JSON.parse(localStorage.getItem('sesion_activa')) || { numero_identificacion: "1316719804" };

            if (!Array.isArray(baseDeDatos.autorizaciones_visitas)) {
                baseDeDatos.autorizaciones_visitas = [];
            }

            const nuevoIdentificador = obtenerSiguienteIdentificadorAutorizacion(baseDeDatos.autorizaciones_visitas);
            const fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

            const nuevaAutorizacion = {
                solicitante_id: usuarioActivo.numero_identificacion,
                identificador_solicitud: nuevoIdentificador,
                visitante: {
                    nombres_apellidos: nombres.value.trim(),
                    tipo_identificacion: tipoId.options[tipoId.selectedIndex].text,
                    numero_identificacion: numId.value.trim(),
                    telefono: valorTel || "No registrado"
                },
                vehiculo: {
                    placa_vehicular: placa.value.toUpperCase().trim(),
                    tipo_vehiculo: tipoVehiculo.options[tipoVehiculo.selectedIndex].text,
                    fabricante: fabricante.value.trim(),
                    modelo: modelo.value.trim(),
                    color: color.value.trim()
                },
                visita: {
                    fecha_programada: fechaInput.value,
                    hora_programada: horaInput.value,
                    motivo_visita: motivo.options[motivo.selectedIndex].text,
                    area_destino: destino.value.trim()
                },
                estado_solicitud: "Pendiente",
                fecha_registro: fechaHoy,
                fecha_actualizacion: fechaHoy
            };

            baseDeDatos.autorizaciones_visitas.push(nuevaAutorizacion);

            if (typeof guardarCambios === 'function') {
                guardarCambios(baseDeDatos);
            } else {
                localStorage.setItem('base_de_datos', JSON.stringify(baseDeDatos));
                localStorage.setItem('inveh_db', JSON.stringify(baseDeDatos));
            }

            const ahoraLog = new Date();
            const fechaHora = `${String(ahoraLog.getDate()).padStart(2, '0')}/${String(ahoraLog.getMonth() + 1).padStart(2, '0')}/${ahoraLog.getFullYear()} a las ${String(ahoraLog.getHours()).padStart(2, '0')}:${String(ahoraLog.getMinutes()).padStart(2, '0')}.`;
            
            const contenedorInfoExito = document.getElementById('info-fecha-registro');
            if (contenedorInfoExito) {
                contenedorInfoExito.textContent = `Fecha y hora en que se registró la solicitud: ${fechaHora}`;
            }

            cerrarModal('modal-crear-autorizacion');
            setTimeout(() => {
                abrirModal('modal-registro-exito');
                formularioAuth.reset();
                botonesDesplegar.forEach(b => b.classList.remove('activo'));
                document.querySelectorAll('.contenido-desplegable').forEach(c => c.classList.remove('visible'));
            }, 400);
        }
    });
});