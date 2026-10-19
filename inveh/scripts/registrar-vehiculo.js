// document.addEventListener: Escucha el evento DOMContentLoaded para ejecutar la lógica tras cargar el árbol DOM.
document.addEventListener('DOMContentLoaded', function() {
    // document.getElementById: Obtiene la referencia al elemento del formulario de registro vehicular.
    const formularioRegistroVehiculo = document.getElementById('form-registro-vehiculo');
    if (!formularioRegistroVehiculo) {
        return;
    }

    // Referencias a los campos de entrada de datos del formulario en el DOM.
    const campoPlacaVehicular = document.getElementById('placa-vehiculo');
    const campoTipoVehiculo = document.getElementById('tipo-vehiculo');
    const campoFabricanteVehiculo = document.getElementById('fabricante-vehiculo');
    const campoModeloVehiculo = document.getElementById('modelo-vehiculo');
    const campoColorVehiculo = document.getElementById('color-vehiculo');
    const campoAnioFabricacion = document.getElementById('anio-vehiculo');
    const campoObservacionesVehiculo = document.getElementById('observaciones-vehiculo');

    // Normaliza la placa vehicular en mayúsculas y caracteres alfanuméricos en tiempo real.
    if (campoPlacaVehicular) {
        campoPlacaVehicular.addEventListener('input', function() {
            // String.prototype.toUpperCase y replace: Convierte a mayúsculas y remueve caracteres no alfanuméricos.
            campoPlacaVehicular.value = campoPlacaVehicular.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            // Utiliza la función compartida de scripts/validaciones.js.
            ocultarAlertaError(campoPlacaVehicular);
        });
    }

    // Limpia la advertencia de error al seleccionar una opción de tipo de vehículo.
    if (campoTipoVehiculo) {
        campoTipoVehiculo.addEventListener('change', function() {
            ocultarAlertaError(campoTipoVehiculo);
        });
    }

    // Array.prototype.forEach: Registra escuchadores para limpiar dígitos numéricos en campos de texto descriptivo.
    const camposDeTextoSinDigitos = [campoFabricanteVehiculo, campoModeloVehiculo, campoColorVehiculo];
    camposDeTextoSinDigitos.forEach(function(campoTexto) {
        if (campoTexto) {
            campoTexto.addEventListener('input', function() {
                // String.prototype.replace: Suprime caracteres numéricos ingresados en nombres descriptivos.
                campoTexto.value = campoTexto.value.replace(/[0-9]/g, '');
                ocultarAlertaError(campoTexto);
            });
        }
    });

    // Limpia la advertencia de error al ingresar el año de fabricación.
    if (campoAnioFabricacion) {
        campoAnioFabricacion.addEventListener('input', function() {
            ocultarAlertaError(campoAnioFabricacion);
        });
    }

    // Procesa el envío del formulario y efectúa la validación integral de campos.
    formularioRegistroVehiculo.addEventListener('submit', function(evento) {
        // Event.preventDefault: Evita la recarga automática predeterminada de la página.
        evento.preventDefault();
        let formularioEsValido = true;

        // 1. Validación de obligatoriedad del tipo de vehículo utilizando funciones compartidas de scripts/validaciones.js.
        if (!campoTipoVehiculo || campoTipoVehiculo.value === "") {
            mostrarAlertaError(campoTipoVehiculo, "El registro es obligatorio");
            formularioEsValido = false;
        } else {
            ocultarAlertaError(campoTipoVehiculo);
        }

        // 2. Validación de formato y unicidad de la placa vehicular.
        if (campoTipoVehiculo && campoTipoVehiculo.value === "otro") {
            ocultarAlertaError(campoPlacaVehicular);
        } else {
            const valorPlacaVehicular = campoPlacaVehicular ? campoPlacaVehicular.value.trim().toUpperCase() : "";
            if (valorPlacaVehicular === "") {
                mostrarAlertaError(campoPlacaVehicular, "El registro es obligatorio");
                formularioEsValido = false;
            } else {
                let tieneFormatoValido = false;
                const tiposVehiculoEstandar = ["automovil", "camioneta", "suv", "furgoneta", "bus", "camion"];
                
                // RegExp.prototype.test: Evalúa expresiones regulares según la tipología vehicular seleccionada.
                if (campoTipoVehiculo && tiposVehiculoEstandar.includes(campoTipoVehiculo.value)) {
                    tieneFormatoValido = /^[A-Z]{3}[0-9]{4}$/.test(valorPlacaVehicular);
                } else if (campoTipoVehiculo && campoTipoVehiculo.value === "motocicleta") {
                    tieneFormatoValido = /^[A-Z]{2}[0-9]{3}[A-Z]{1}$/.test(valorPlacaVehicular);
                } else {
                    tieneFormatoValido = valorPlacaVehicular.length >= 6 && valorPlacaVehicular.length <= 7;
                }

                if (!tieneFormatoValido) {
                    mostrarAlertaError(campoPlacaVehicular, "El registro tiene un formato no válido");
                    formularioEsValido = false;
                } else {
                    // Obtiene la base de datos para verificar que la placa no esté previamente registrada.
                    const baseDeDatos = obtenerBaseDatos();

                    // Array.prototype.some: Comprueba la existencia previa de la placa en la lista de vehículos registrados.
                    const existeEnVehiculos = baseDeDatos && Array.isArray(baseDeDatos.vehiculos)
                        ? baseDeDatos.vehiculos.some(function(vehiculo) {
                            return vehiculo.placa_vehicular && vehiculo.placa_vehicular.toUpperCase() === valorPlacaVehicular;
                        })
                        : false;

                    // Array.prototype.some: Comprueba la existencia previa de la placa en las autorizaciones de visitas.
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
        }

        // 3. Validación de campos descriptivos (Fabricante, Modelo y Color).
        const camposDescriptivos = [campoFabricanteVehiculo, campoModeloVehiculo, campoColorVehiculo];
        camposDescriptivos.forEach(function(campoTexto) {
            if (campoTexto) {
                const valorTexto = campoTexto.value.trim();
                if (valorTexto === "") {
                    mostrarAlertaError(campoTexto, "El registro es obligatorio");
                    formularioEsValido = false;
                } else if (valorTexto.length < 2) {
                    mostrarAlertaError(campoTexto, "El registro tiene un formato no válido");
                    formularioEsValido = false;
                } else {
                    ocultarAlertaError(campoTexto);
                }
            }
        });

        // 4. Validación del año de fabricación del vehículo.
        const valorAnioTexto = campoAnioFabricacion ? campoAnioFabricacion.value.trim() : "";
        const numeroAnio = parseInt(valorAnioTexto, 10);
        // Date.prototype.getFullYear: Obtiene el año actual del reloj del sistema.
        const anioActual = new Date().getFullYear();

        if (valorAnioTexto === "") {
            mostrarAlertaError(campoAnioFabricacion, "El registro es obligatorio");
            formularioEsValido = false;
        } else if (isNaN(numeroAnio) || numeroAnio < 1950 || numeroAnio > (anioActual + 1)) {
            mostrarAlertaError(campoAnioFabricacion, "El registro tiene un formato no válido");
            formularioEsValido = false;
        } else {
            ocultarAlertaError(campoAnioFabricacion);
        }

        // 5. Validación de longitud máxima del campo de observaciones.
        if (campoObservacionesVehiculo && campoObservacionesVehiculo.value.length > 250) {
            mostrarAlertaError(campoObservacionesVehiculo, "El registro excede los caracteres permitidos (250)");
            formularioEsValido = false;
        } else if (campoObservacionesVehiculo) {
            ocultarAlertaError(campoObservacionesVehiculo);
        }

        // 6. Registro y almacenamiento persistente si todas las validaciones fueron superadas.
        if (formularioEsValido) {
            const baseDeDatos = obtenerBaseDatos();

            // Recupera la sesión activa actual del usuario autenticado.
            const usuarioActivo = JSON.parse(localStorage.getItem('sesion_activa'));
            if (!usuarioActivo) {
                return;
            }

            // Array.prototype.filter: Verifica que el usuario no supere el límite permitido de dos vehículos.
            const vehiculosRegistradosPorUsuario = baseDeDatos.vehiculos.filter(function(vehiculo) {
                return vehiculo.propietario_id === usuarioActivo.numero_identificacion;
            });
            if (vehiculosRegistradosPorUsuario.length >= 2) {
                cerrarModal('modal-registro-vehiculo');
                return;
            }

            // Reutiliza la función compartida generarSiguienteIdentificadorVehicular de scripts/informacion.js.
            const nuevoIdentificadorVehiculo = generarSiguienteIdentificadorVehicular(baseDeDatos.vehiculos);
            // Reutiliza la función compartida obtenerFechaHoraActual de scripts/informacion.js.
            const tiempoActual = obtenerFechaHoraActual();
            const cadenaFechaActual = tiempoActual.fecha;

            // Objeto con la estructura completa del vehículo a registrar.
            const nuevoVehiculo = {
                propietario_id: usuarioActivo.numero_identificacion,
                placa_vehicular: campoPlacaVehicular.value.toUpperCase().trim(),
                identificador_sistema: nuevoIdentificadorVehiculo,
                tipo_vehiculo: campoTipoVehiculo.options[campoTipoVehiculo.selectedIndex].text,
                fabricante: campoFabricanteVehiculo.value.trim(),
                modelo: campoModeloVehiculo.value.trim(),
                anio_fabricacion: campoAnioFabricacion.value,
                color: campoColorVehiculo.value.trim(),
                observaciones: (campoObservacionesVehiculo && campoObservacionesVehiculo.value.trim()) ? campoObservacionesVehiculo.value.trim() : "Sin observaciones",
                codigo_qr_ruta: "",
                estado_autorizacion: "Pendiente",
                ubicacion_actual: "Fuera de las instalaciones",
                fecha_registro: cadenaFechaActual,
                fecha_actualizacion: cadenaFechaActual
            };

            // Array.prototype.push: Agrega el nuevo registro a la colección de vehículos en memoria.
            if (baseDeDatos && Array.isArray(baseDeDatos.vehiculos)) {
                baseDeDatos.vehiculos.push(nuevoVehiculo);
                // Persiste los cambios mediante la función reutilizable guardarCambios.
                guardarCambios(baseDeDatos);
            }

            const etiquetaFechaRegistroExito = document.getElementById('info-fecha-registro');
            if (etiquetaFechaRegistroExito) {
                etiquetaFechaRegistroExito.textContent = `Fecha y hora en que se registró la solicitud: ${tiempoActual.textoCompleto}`;
            }

            // Cierra el modal de formulario de registro vehicular.
            cerrarModal('modal-registro-vehiculo');

            // setTimeout: Despliega el modal de confirmación tras un intervalo controlado de transición visual.
            setTimeout(function() {
                abrirModal('modal-registro-exito');
                // HTMLFormElement.reset: Restablece todos los campos del formulario a sus valores originales.
                formularioRegistroVehiculo.reset();

                // Registra el evento de recarga en los botones de cierre del modal de confirmación.
                const botonesCerrarExito = document.querySelectorAll('#modal-registro-exito [data-modal-cerrar]');
                botonesCerrarExito.forEach(function(botonCerrar) {
                    botonCerrar.addEventListener('click', function() {
                        location.reload();
                    }, { once: true });
                });
            }, 400);
        }
    });
});