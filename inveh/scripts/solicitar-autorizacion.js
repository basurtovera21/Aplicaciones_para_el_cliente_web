document.addEventListener('DOMContentLoaded', function() {
    const formularioAuth = document.getElementById('form-crear-autorizacion');
    if (!formularioAuth) return;


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


    const botonesDesplegar = document.querySelectorAll('.boton-desplegar-compacto');
    botonesDesplegar.forEach(boton => {
        boton.addEventListener('click', function() {
            const contenido = document.getElementById(this.getAttribute('data-objetivo'));
            this.classList.toggle('activo');
            if (contenido) contenido.classList.toggle('visible');
        });
    });

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

  
    formularioAuth.addEventListener('submit', function(evento) {
        evento.preventDefault();
        let esValido = true;


        if (nombres.value.trim() === "") {
            mostrarAlertaError(nombres, "El registro es obligatorio");
            esValido = false;
        } else { ocultarAlertaError(nombres); }


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

  
        const valorTel = telefono.value.trim();
        if (valorTel === "") {
            ocultarAlertaError(telefono);
        } else if (!/^09[0-9]{8}$/.test(valorTel)) {
            mostrarAlertaError(telefono, "El registro tiene un formato no válido");
            esValido = false;
        } else { 
            ocultarAlertaError(telefono); 
        }


        if (tipoVehiculo.value === "") {
            mostrarAlertaError(tipoVehiculo, "El registro es obligatorio");
            esValido = false;
        } else {
            ocultarAlertaError(tipoVehiculo);
            if (tipoVehiculo.value !== "otro") {
                const valorPlaca = placa.value.trim();
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
                    } else { ocultarAlertaError(placa); }
                }
            } else { ocultarAlertaError(placa); }
        }


        [fabricante, modelo, color].forEach(campo => {
            if (campo.value.trim() === "") {
                mostrarAlertaError(campo, "El registro es obligatorio");
                esValido = false;
            } else if (campo.value.trim().length < 2) {
                mostrarAlertaError(campo, "El registro tiene un formato no válido");
                esValido = false;
            } else { ocultarAlertaError(campo); }
        });


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


        if (esValido) {
            const ahoraLog = new Date();
            const fechaHora = `${String(ahoraLog.getDate()).padStart(2, '0')}/${String(ahoraLog.getMonth() + 1).padStart(2, '0')}/${ahoraLog.getFullYear()} a las ${String(ahoraLog.getHours()).padStart(2, '0')}:${String(ahoraLog.getMinutes()).padStart(2, '0')}.`;
            document.getElementById('info-fecha-registro').innerHTML = `Fecha y hora en que se registró la solicitud: ${fechaHora}`;
            
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