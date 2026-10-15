document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('form-registro-vehiculo');
    if (!formulario) return;

    const campoPlaca = document.getElementById('placa-vehiculo');
    const campoTipo = document.getElementById('tipo-vehiculo');
    const campoFabricante = document.getElementById('fabricante-vehiculo');
    const campoModelo = document.getElementById('modelo-vehiculo');
    const campoColor = document.getElementById('color-vehiculo');
    const campoAnio = document.getElementById('anio-vehiculo');
    const campoObservaciones = document.getElementById('observaciones-vehiculo');

    function activarError(campo, mensaje) {
        if (typeof mostrarAlertaError === 'function') {
            mostrarAlertaError(campo, mensaje);
        } else {
            const contenedor = campo.closest('.bloque-campo-formulario');
            const alerta = contenedor ? contenedor.querySelector('.texto-alerta-error') : null;
            if (alerta) {
                alerta.textContent = mensaje;
                alerta.style.display = 'block';
                campo.style.borderColor = 'var(--color-alerta-salmon-fondo)';
            }
        }
    }

    function desactivarError(campo) {
        if (typeof ocultarAlertaError === 'function') {
            ocultarAlertaError(campo);
        } else {
            const contenedor = campo.closest('.bloque-campo-formulario');
            const alerta = contenedor ? contenedor.querySelector('.texto-alerta-error') : null;
            if (alerta) {
                alerta.style.display = 'none';
                campo.style.borderColor = 'var(--borde-suave)';
            }
        }
    }

    if (campoPlaca) {
        campoPlaca.addEventListener('input', () => {
            campoPlaca.value = campoPlaca.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            desactivarError(campoPlaca);
        });
    }

    if (campoTipo) {
        campoTipo.addEventListener('change', () => {
            desactivarError(campoTipo);
        });
    }

    [campoFabricante, campoModelo, campoColor].forEach(campo => {
        if (campo) {
            campo.addEventListener('input', () => {
                campo.value = campo.value.replace(/[0-9]/g, '');
                desactivarError(campo);
            });
        }
    });

    if (campoAnio) {
        campoAnio.addEventListener('input', () => {
            desactivarError(campoAnio);
        });
    }


    function obtenerSiguienteIdentificador(listaVehiculos) {
        let numeroMasAlto = 639;

        if (Array.isArray(listaVehiculos)) {
            listaVehiculos.forEach(v => {
                if (v.identificador_sistema && v.identificador_sistema.startsWith('VEH-')) {
                    const numeroExtraido = parseInt(v.identificador_sistema.replace('VEH-', ''), 10);
                    if (!isNaN(numeroExtraido) && numeroExtraido > numeroMasAlto) {
                        numeroMasAlto = numeroExtraido;
                    }
                }
            });
        }

        const siguienteNumero = numeroMasAlto + 1;
        return `VEH-${String(siguienteNumero).padStart(6, '0')}`;
    }

    formulario.addEventListener('submit', function(evento) {
        evento.preventDefault();
        let esValido = true;

        // Validar Tipo de Vehículo
        if (!campoTipo || campoTipo.value === "") {
            activarError(campoTipo, "El registro es obligatorio");
            esValido = false;
        } else {
            desactivarError(campoTipo);
        }


        if (campoTipo && campoTipo.value === "otro") {
            desactivarError(campoPlaca);
        } else {
            const valorPlaca = campoPlaca ? campoPlaca.value.trim() : "";
            if (valorPlaca === "") {
                activarError(campoPlaca, "El registro es obligatorio");
                esValido = false;
            } else {
                let formatoCorrecto = false;
                const tiposEstandar = ["automovil", "camioneta", "suv", "furgoneta", "bus", "camion"];
                
                if (campoTipo && tiposEstandar.includes(campoTipo.value)) {
                    formatoCorrecto = /^[A-Z]{3}[0-9]{4}$/.test(valorPlaca);
                } else if (campoTipo && campoTipo.value === "motocicleta") {
                    formatoCorrecto = /^[A-Z]{2}[0-9]{3}[A-Z]{1}$/.test(valorPlaca);
                } else {
                    formatoCorrecto = valorPlaca.length >= 6 && valorPlaca.length <= 7;
                }

                if (!formatoCorrecto) {
                    activarError(campoPlaca, "El registro tiene un formato no válido");
                    esValido = false;
                } else {
                    desactivarError(campoPlaca);
                }
            }
        }


        [campoFabricante, campoModelo, campoColor].forEach(campo => {
            if (campo) {
                const valor = campo.value.trim();
                if (valor === "") {
                    activarError(campo, "El registro es obligatorio");
                    esValido = false;
                } else if (valor.length < 2) {
                    activarError(campo, "El registro tiene un formato no válido");
                    esValido = false;
                } else {
                    desactivarError(campo);
                }
            }
        });


        const valorAnio = campoAnio ? campoAnio.value.trim() : "";
        const numAnio = parseInt(valorAnio, 10);
        const anioActual = new Date().getFullYear();

        if (valorAnio === "") {
            activarError(campoAnio, "El registro es obligatorio");
            esValido = false;
        } else if (isNaN(numAnio) || numAnio < 1950 || numAnio > (anioActual + 1)) {
            activarError(campoAnio, "El registro tiene un formato no válido");
            esValido = false;
        } else {
            desactivarError(campoAnio);
        }


        if (campoObservaciones && campoObservaciones.value.length > 250) {
            activarError(campoObservaciones, "El registro excede los caracteres permitidos (250)");
            esValido = false;
        } else if (campoObservaciones) {
            desactivarError(campoObservaciones);
        }


        if (esValido) {
            const baseDeDatos = typeof obtenerBaseDatos === 'function' 
                ? obtenerBaseDatos() 
                : JSON.parse(localStorage.getItem('base_de_datos') || localStorage.getItem('inveh_db'));

            const usuarioActivo = JSON.parse(localStorage.getItem('sesion_activa')) || { numero_identificacion: "1316719804" };


            const misVehiculosTotales = baseDeDatos.vehiculos.filter(v => v.propietario_id === usuarioActivo.numero_identificacion);
            if (misVehiculosTotales.length >= 2) {
                cerrarModal('modal-registro-vehiculo');
                return;
            }


            const nuevoIdentificador = obtenerSiguienteIdentificador(baseDeDatos.vehiculos);
            const hoy = new Date();
            const fechaHoy = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;

            const nuevoVehiculo = {
                propietario_id: usuarioActivo.numero_identificacion,
                placa_vehicular: campoPlaca.value.toUpperCase(),
                identificador_sistema: nuevoIdentificador,
                tipo_vehiculo: campoTipo.options[campoTipo.selectedIndex].text,
                fabricante: campoFabricante.value.trim(),
                modelo: campoModelo.value.trim(),
                anio_fabricacion: campoAnio.value,
                color: campoColor.value.trim(),
                observaciones: (campoObservaciones && campoObservaciones.value.trim()) ? campoObservaciones.value.trim() : "Sin observaciones",
                codigo_qr_ruta: "",
                estado_autorizacion: "Pendiente",
                ubicacion_actual: "Fuera de las instalaciones",
                fecha_registro: fechaHoy,
                fecha_actualizacion: fechaHoy
            };

            if (baseDeDatos && Array.isArray(baseDeDatos.vehiculos)) {
                baseDeDatos.vehiculos.push(nuevoVehiculo);
                if (typeof guardarCambios === 'function') {
                    guardarCambios(baseDeDatos);
                } else {
                    localStorage.setItem('base_de_datos', JSON.stringify(baseDeDatos));
                    localStorage.setItem('inveh_db', JSON.stringify(baseDeDatos));
                }
            }

            const fechaHora = `${fechaHoy} a las ${String(hoy.getHours()).padStart(2, '0')}:${String(hoy.getMinutes()).padStart(2, '0')}.`;
            const contenedorInfoExito = document.getElementById('info-fecha-registro');
            if (contenedorInfoExito) {
                contenedorInfoExito.textContent = `Fecha y hora en que se registró la solicitud: ${fechaHora}`;
            }

            cerrarModal('modal-registro-vehiculo');
            setTimeout(() => {
                abrirModal('modal-registro-exito');
                formulario.reset();

                const botonesCerrarExito = document.querySelectorAll('#modal-registro-exito [data-modal-cerrar]');
                botonesCerrarExito.forEach(btn => {
                    btn.addEventListener('click', () => {
                        location.reload();
                    }, { once: true });
                });
            }, 400);
        }
    });
});