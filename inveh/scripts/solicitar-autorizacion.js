// document.addEventListener: Escucha el evento DOMContentLoaded para ejecutar las acciones al finalizar la carga del DOM.
document.addEventListener('DOMContentLoaded', function() {
    // document.getElementById: Obtiene la referencia al formulario de solicitud de autorización de visitas.
    const formularioSolicitarAutorizacion = document.getElementById('form-crear-autorizacion');
    if (!formularioSolicitarAutorizacion) {
        return;
    }

    // Referencias a los campos del visitante en el DOM.
    const campoNombresVisitante = document.getElementById('auth-nombres');
    const selectorTipoIdentificacion = document.getElementById('auth-tipo-id');
    const campoNumeroIdentificacion = document.getElementById('auth-numero-id');
    const campoTelefonoVisitante = document.getElementById('auth-telefono');
    
    // Referencias a los campos del vehículo visitante en el DOM.
    const campoPlacaVehicular = document.getElementById('auth-placa');
    const selectorTipoVehiculo = document.getElementById('auth-tipo-vehiculo');
    const campoFabricanteVehiculo = document.getElementById('auth-fabricante');
    const campoModeloVehiculo = document.getElementById('auth-modelo');
    const campoColorVehiculo = document.getElementById('auth-color');
    
    // Referencias a los campos de programación de la visita en el DOM.
    const campoFechaVisita = document.getElementById('auth-fecha');
    const campoHoraVisita = document.getElementById('auth-hora');
    const selectorMotivoVisita = document.getElementById('auth-motivo');
    const campoDestinoVisita = document.getElementById('auth-destino');

    // document.querySelectorAll: Selecciona los botones que alternan las secciones colapsables del acordeón.
    const botonesSeccionDesplegable = document.querySelectorAll('.boton-desplegar-compacto');
    // Array.prototype.forEach: Asigna a cada botón el evento de alternar visibilidad de su sección correspondiente.
    botonesSeccionDesplegable.forEach(function(botonSeccion) {
        botonSeccion.addEventListener('click', function() {
            // Element.getAttribute: Recupera el identificador del contenedor objetivo definido en el atributo HTML.
            const identificadorObjetivo = this.getAttribute('data-objetivo');
            const contenedorObjetivo = document.getElementById(identificadorObjetivo);
            // DOMTokenList.toggle: Conmuta la clase CSS para reflejar visualmente el estado abierto o cerrado.
            this.classList.toggle('activo');
            if (contenedorObjetivo) {
                contenedorObjetivo.classList.toggle('visible');
            }
        });
    });

    // Campos de texto descriptivos que restringen el ingreso de dígitos numéricos en tiempo real.
    const camposTextoSinDigitos = [campoNombresVisitante, campoFabricanteVehiculo, campoModeloVehiculo, campoColorVehiculo];
    camposTextoSinDigitos.forEach(function(campoTexto) {
        if (campoTexto) {
            campoTexto.addEventListener('input', function() {
                // String.prototype.replace: Suprime cualquier dígito numérico que sea introducido en el campo.
                campoTexto.value = campoTexto.value.replace(/[0-9]/g, '');
                ocultarAlertaError(campoTexto);
            });
        }
    });

    // Normaliza la placa vehicular en mayúsculas y caracteres alfanuméricos en tiempo real.
    if (campoPlacaVehicular) {
        campoPlacaVehicular.addEventListener('input', function() {
            // String.prototype.toUpperCase y replace: Convierte a mayúsculas y filtra únicamente letras y números.
            campoPlacaVehicular.value = campoPlacaVehicular.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            ocultarAlertaError(campoPlacaVehicular);
        });
    }

    // Escucha el evento submit del formulario para procesar las validaciones y el almacenamiento.
    formularioSolicitarAutorizacion.addEventListener('submit', function(evento) {
        // Event.preventDefault: Cancela la recarga automática predeterminada de la página del navegador.
        evento.preventDefault();
        let formularioEsValido = true;

        // 1. Validación del nombre completo del visitante mediante mostrarAlertaError/ocultarAlertaError de validaciones.js.
        if (campoNombresVisitante.value.trim() === "") {
            mostrarAlertaError(campoNombresVisitante, "El registro es obligatorio");
            formularioEsValido = false;
        } else {
            ocultarAlertaError(campoNombresVisitante);
        }

        // 2. Validación de tipo y número de documento de identificación.
        if (selectorTipoIdentificacion.value === "") {
            mostrarAlertaError(selectorTipoIdentificacion, "El registro es obligatorio");
            formularioEsValido = false;
        } else {
            ocultarAlertaError(selectorTipoIdentificacion);
            const valorNumeroIdentificacion = campoNumeroIdentificacion.value.trim();
            if (valorNumeroIdentificacion === "") {
                mostrarAlertaError(campoNumeroIdentificacion, "El registro es obligatorio");
                formularioEsValido = false;
            } else {
                if (selectorTipoIdentificacion.value === "cedula") {
                    // Reutiliza la función compartida validarCedulaEcuatoriana de scripts/validaciones.js.
                    if (!validarCedulaEcuatoriana(valorNumeroIdentificacion)) {
                        mostrarAlertaError(campoNumeroIdentificacion, "El registro tiene un formato no válido");
                        formularioEsValido = false;
                    } else {
                        ocultarAlertaError(campoNumeroIdentificacion);
                    }
                } else {
                    // Valida la longitud aceptable para pasaporte u otro documento de identificación.
                    if (valorNumeroIdentificacion.length < 5 || valorNumeroIdentificacion.length > 20) {
                        mostrarAlertaError(campoNumeroIdentificacion, "El registro tiene un formato no válido");
                        formularioEsValido = false;
                    } else {
                        ocultarAlertaError(campoNumeroIdentificacion);
                    }
                }
            }
        }

        // 3. Validación opcional del número telefónico de contacto.
        const valorTelefono = campoTelefonoVisitante.value.trim();
        if (valorTelefono === "") {
            ocultarAlertaError(campoTelefonoVisitante);
        } else if (!/^09[0-9]{8}$/.test(valorTelefono)) {
            mostrarAlertaError(campoTelefonoVisitante, "El registro tiene un formato no válido");
            formularioEsValido = false;
        } else { 
            ocultarAlertaError(campoTelefonoVisitante); 
        }

        // 4. Validación del tipo de vehículo y de la placa vehicular.
        if (selectorTipoVehiculo.value === "") {
            mostrarAlertaError(selectorTipoVehiculo, "El registro es obligatorio");
            formularioEsValido = false;
        } else {
            ocultarAlertaError(selectorTipoVehiculo);
            if (selectorTipoVehiculo.value !== "otro") {
                const valorPlacaVehicular = campoPlacaVehicular.value.trim().toUpperCase();
                if (valorPlacaVehicular === "") {
                    mostrarAlertaError(campoPlacaVehicular, "El registro es obligatorio");
                    formularioEsValido = false;
                } else {
                    let placaEsValida = false;
                    const tiposVehiculoEstandar = ["automovil", "camioneta", "suv", "furgoneta", "bus", "camion"];
                    // RegExp.prototype.test: Comprueba la estructura sintáctica de la matrícula automotriz.
                    if (tiposVehiculoEstandar.includes(selectorTipoVehiculo.value)) {
                        placaEsValida = /^[A-Z]{3}[0-9]{4}$/.test(valorPlacaVehicular);
                    } else if (selectorTipoVehiculo.value === "motocicleta") {
                        placaEsValida = /^[A-Z]{2}[0-9]{3}[A-Z]{1}$/.test(valorPlacaVehicular);
                    }
                    if (!placaEsValida) {
                        mostrarAlertaError(campoPlacaVehicular, "El registro tiene un formato no válido");
                        formularioEsValido = false;
                    } else {
                        // Obtiene la base de datos centralizada para comprobar que la placa no esté previamente registrada.
                        const baseDeDatos = obtenerBaseDatos();

                        // Array.prototype.some: Verifica que la placa no pertenezca a ningún vehículo institucional activo.
                        const existeEnVehiculos = baseDeDatos && Array.isArray(baseDeDatos.vehiculos)
                            ? baseDeDatos.vehiculos.some(function(vehiculo) {
                                return vehiculo.placa_vehicular && vehiculo.placa_vehicular.toUpperCase() === valorPlacaVehicular;
                            })
                            : false;

                        // Array.prototype.some: Verifica que la placa no pertenezca a otra autorización registrada.
                        const existeEnAutorizaciones = baseDeDatos && Array.isArray(baseDeDatos.autorizaciones_visitas)
                            ? baseDeDatos.autorizaciones_visitas.some(function(autorizacion) {
                                return autorizacion.vehiculo && autorizacion.vehiculo.placa_vehicular && autorizacion.vehiculo.placa_vehicular.toUpperCase() === valorPlacaVehicular;
                            })
                            : false;

                        if (existeEnVehiculos || existeEnAutorizaciones) {
                            mostrarAlertaError(campoPlacaVehicular, "El vehículo se encuentra registrado");
                            formularioEsValido = false;
                        } else {
                            ocultarAlertaError(campoPlacaVehicular);
                        }
                    }
                }
            } else {
                ocultarAlertaError(campoPlacaVehicular);
            }
        }

        // 5. Validación de especificaciones del vehículo (Fabricante, Modelo y Color).
        const camposEspecificacionVehiculo = [campoFabricanteVehiculo, campoModeloVehiculo, campoColorVehiculo];
        camposEspecificacionVehiculo.forEach(function(campoTexto) {
            if (campoTexto.value.trim() === "") {
                mostrarAlertaError(campoTexto, "El registro es obligatorio");
                formularioEsValido = false;
            } else if (campoTexto.value.trim().length < 2) {
                mostrarAlertaError(campoTexto, "El registro tiene un formato no válido");
                formularioEsValido = false;
            } else {
                ocultarAlertaError(campoTexto);
            }
        });

        // 6. Validación cronológica de la fecha programada de visita.
        const fechaLimiteHoy = new Date();
        fechaLimiteHoy.setHours(0, 0, 0, 0);
        const fechaProgramadaSeleccionada = new Date(campoFechaVisita.value + "T00:00:00");
        if (!campoFechaVisita.value) {
            mostrarAlertaError(campoFechaVisita, "El registro es obligatorio");
            formularioEsValido = false;
        } else if (fechaProgramadaSeleccionada < fechaLimiteHoy) {
            mostrarAlertaError(campoFechaVisita, "El registro no es válido.");
            formularioEsValido = false;
        } else {
            ocultarAlertaError(campoFechaVisita);
        }

        // 7. Validación cronológica de la hora programada de visita dentro del rango institucional permitido.
        if (!campoHoraVisita.value) {
            mostrarAlertaError(campoHoraVisita, "El registro es obligatorio");
            formularioEsValido = false;
        } else {
            // String.prototype.split y Array.prototype.map: Descompone la hora y minutos ingresados en números.
            const partesHora = campoHoraVisita.value.split(':').map(Number);
            const horaProgramada = partesHora[0];
            const minutosProgramados = partesHora[1];
            const instanteActual = new Date();

            if (horaProgramada < 7 || horaProgramada >= 19) {
                mostrarAlertaError(campoHoraVisita, "Horario de visitas establecido (7AM - 7PM)");
                formularioEsValido = false;
            } else if (fechaProgramadaSeleccionada.getTime() === fechaLimiteHoy.getTime()) {
                // Si la visita está programada para la fecha de hoy, restringe que la hora no sea anterior a la actual.
                const esHoraPasada = (horaProgramada < instanteActual.getHours()) || 
                                     (horaProgramada === instanteActual.getHours() && minutosProgramados < instanteActual.getMinutes());
                if (esHoraPasada) {
                    mostrarAlertaError(campoHoraVisita, "El registro no es válido");
                    formularioEsValido = false;
                } else {
                    ocultarAlertaError(campoHoraVisita);
                }
            } else {
                ocultarAlertaError(campoHoraVisita);
            }
        }

        // 8. Validación de obligatoriedad del motivo y área de destino.
        if (selectorMotivoVisita.value === "") {
            mostrarAlertaError(selectorMotivoVisita, "El registro es obligatorio");
            formularioEsValido = false;
        } else {
            ocultarAlertaError(selectorMotivoVisita);
        }

        if (campoDestinoVisita.value.trim() === "") {
            mostrarAlertaError(campoDestinoVisita, "El registro es obligatorio");
            formularioEsValido = false;
        } else if (campoDestinoVisita.value.length > 100) {
            mostrarAlertaError(campoDestinoVisita, "El registro excede el límite de caracteres permitidos (100)");
            formularioEsValido = false;
        } else {
            ocultarAlertaError(campoDestinoVisita);
        }

        // 9. Construcción y persistencia de la nueva solicitud de autorización.
        if (formularioEsValido) {
            const baseDeDatos = obtenerBaseDatos();

            // Recupera la sesión activa actual del usuario solicitante.
            const usuarioActivo = JSON.parse(localStorage.getItem('sesion_activa'));
            if (!usuarioActivo) {
                return;
            }

            if (!Array.isArray(baseDeDatos.autorizaciones_visitas)) {
                baseDeDatos.autorizaciones_visitas = [];
            }

            // Reutiliza la función global generarSiguienteIdentificadorAutorizacion de scripts/informacion.js.
            const nuevoIdentificadorSolicitud = generarSiguienteIdentificadorAutorizacion(baseDeDatos.autorizaciones_visitas);
            // Reutiliza la función compartida obtenerFechaHoraActual de scripts/informacion.js.
            const tiempoActual = obtenerFechaHoraActual();
            const cadenaFechaActual = tiempoActual.fecha;

            // Objeto estructurado que representa la solicitud de autorización vehicular de visita.
            const nuevaAutorizacion = {
                solicitante_id: usuarioActivo.numero_identificacion,
                identificador_solicitud: nuevoIdentificadorSolicitud,
                visitante: {
                    nombres_apellidos: campoNombresVisitante.value.trim(),
                    tipo_identificacion: selectorTipoIdentificacion.options[selectorTipoIdentificacion.selectedIndex].text,
                    numero_identificacion: campoNumeroIdentificacion.value.trim(),
                    telefono: valorTelefono || "No registrado"
                },
                vehiculo: {
                    placa_vehicular: campoPlacaVehicular.value.toUpperCase().trim(),
                    tipo_vehiculo: selectorTipoVehiculo.options[selectorTipoVehiculo.selectedIndex].text,
                    fabricante: campoFabricanteVehiculo.value.trim(),
                    modelo: campoModeloVehiculo.value.trim(),
                    color: campoColorVehiculo.value.trim()
                },
                visita: {
                    fecha_programada: campoFechaVisita.value,
                    hora_programada: campoHoraVisita.value,
                    motivo_visita: selectorMotivoVisita.options[selectorMotivoVisita.selectedIndex].text,
                    area_destino: campoDestinoVisita.value.trim()
                },
                estado_solicitud: "Pendiente",
                fecha_registro: cadenaFechaActual,
                fecha_actualizacion: cadenaFechaActual
            };

            // Array.prototype.push: Anexa la solicitud al arreglo de autorizaciones en la base de datos.
            baseDeDatos.autorizaciones_visitas.push(nuevaAutorizacion);

            // Persiste la información actualizada mediante guardarCambios.
            guardarCambios(baseDeDatos);

            const etiquetaFechaRegistroExito = document.getElementById('info-fecha-registro');
            if (etiquetaFechaRegistroExito) {
                etiquetaFechaRegistroExito.textContent = `Fecha y hora en que se registró la solicitud: ${tiempoActual.textoCompleto}`;
            }

            // Oculta el modal de solicitud de autorización de visitas.
            cerrarModal('modal-crear-autorizacion');

            // setTimeout: Muestra la retroalimentación de éxito tras la transición del modal anterior.
            setTimeout(function() {
                abrirModal('modal-registro-exito');
                // HTMLFormElement.reset: Restablece todos los campos del formulario.
                formularioSolicitarAutorizacion.reset();
                // Restablece el estado cerrado de los botones del acordeón y sus secciones.
                botonesSeccionDesplegable.forEach(function(botonSeccion) {
                    botonSeccion.classList.remove('activo');
                });
                const elementosContenidoDesplegable = document.querySelectorAll('.contenido-desplegable');
                elementosContenidoDesplegable.forEach(function(contenido) {
                    contenido.classList.remove('visible');
                });
            }, 400);
        }
    });
});