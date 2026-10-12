//inicio-sesion.html
const formularioAutenticacion = document.getElementById("formulario-autenticacion");
const campoCorreoInstitucional = document.getElementById("campo-correo-institucional");
const campoClaveAcceso = document.getElementById("campo-clave-acceso");
const botonAlternarVisualizacionClave = document.getElementById("boton-alternar-visualizacion-clave");
const imagenIconoOjo = document.getElementById("imagen-icono-ojo");

const mensajeErrorCorreo = document.getElementById("mensaje-error-correo");
const mensajeErrorClave = document.getElementById("mensaje-error-clave");

const RUTA_OJO = "recursos/imagenes/ojo.svg";
const RUTA_OJO_CERRADO = "recursos/imagenes/ojo-cerrado.svg";

const LONGITUD_MAXIMA_CLAVE = 20;

const ROLES_GUARDIA_VALIDOS = ["guardia", "puntoacceso"];
const ROLES_ADMIN_VALIDOS = ["admin", "administrador"];


// Configuración de atributos
if (campoClaveAcceso) {
    campoClaveAcceso.setAttribute("maxlength", LONGITUD_MAXIMA_CLAVE);
}

if (botonAlternarVisualizacionClave && campoClaveAcceso && imagenIconoOjo) {
    botonAlternarVisualizacionClave.addEventListener("click", () => {
        if (campoClaveAcceso.type === "password") {
            campoClaveAcceso.type = "text";
            imagenIconoOjo.src = RUTA_OJO_CERRADO;
            imagenIconoOjo.alt = "ocultar clave";
            botonAlternarVisualizacionClave.classList.add("activo");
        } else {
            campoClaveAcceso.type = "password";
            imagenIconoOjo.src = RUTA_OJO;
            imagenIconoOjo.alt = "mostrar clave";
            botonAlternarVisualizacionClave.classList.remove("activo");
        }
    });
}

if (campoCorreoInstitucional) {
    campoCorreoInstitucional.addEventListener("input", () => {
        if (mensajeErrorCorreo.style.display === "block") {
            mensajeErrorCorreo.style.display = "none";
            campoCorreoInstitucional.style.borderColor = "var(--borde-suave)";
        }
    });
}

if (campoClaveAcceso) {
    campoClaveAcceso.addEventListener("input", () => {
        if (mensajeErrorClave.style.display === "block") {
            mensajeErrorClave.style.display = "none";
            campoClaveAcceso.style.borderColor = "var(--borde-suave)";
        }
    });
}

// Validación del formulario de autenticación
if (formularioAutenticacion) {
    formularioAutenticacion.addEventListener("submit", (evento) => {
        evento.preventDefault();
        evento.stopPropagation();

        const identificador = campoCorreoInstitucional.value.trim().toLowerCase();
        const valorClave = campoClaveAcceso.value.trim();
        let esFormularioValido = true;
        let destinoRedireccion = "";

        //Correo institucional o usuario vacío
        if (identificador === "") {
            mensajeErrorCorreo.textContent = "Registre su correo institucional o usuario.";
            mensajeErrorCorreo.style.display = "block";
            campoCorreoInstitucional.style.borderColor = "var(--color-alerta-salmon-borde, #f98080)";
            esFormularioValido = false;
        //Correo institucional 
        } else if (identificador.includes("@")) {
            const esDominioInstitucional = identificador.endsWith("@live.uleam.edu.ec") || identificador.endsWith("@uleam.edu.ec");
    
            if (!esDominioInstitucional) {
                mensajeErrorCorreo.textContent = "Usuario o correo no válido.";
                mensajeErrorCorreo.style.display = "block";
                campoCorreoInstitucional.style.borderColor = "var(--color-alerta-salmon-borde, #f98080)";
                esFormularioValido = false;
            } else {
                mensajeErrorCorreo.style.display = "none";
                campoCorreoInstitucional.style.borderColor = "var(--borde-suave)";
                destinoRedireccion = "usuario-inicio.html";
            }
        //Usuario
        } else {
            const esGuardia = ROLES_GUARDIA_VALIDOS.some(rol => identificador.includes(rol));
            const esAdmin = ROLES_ADMIN_VALIDOS.some(rol => identificador.includes(rol));

            if (esGuardia) {
                mensajeErrorCorreo.style.display = "none";
                campoCorreoInstitucional.style.borderColor = "var(--borde-suave)";
                destinoRedireccion = "guardia-de-acceso-inicio.html";

            } else if (esAdmin) {
                mensajeErrorCorreo.style.display = "none";
                campoCorreoInstitucional.style.borderColor = "var(--borde-suave)";
                destinoRedireccion = "administracion-inicio.html";
            } else {
                mensajeErrorCorreo.textContent = "Usuario o correo no válido.";
                mensajeErrorCorreo.style.display = "block";
                campoCorreoInstitucional.style.borderColor = "var(--color-alerta-salmon-borde, #f98080)";
                esFormularioValido = false;
            }
        }

        //Contraseña
        if (valorClave === "") {
            mensajeErrorClave.textContent = "Registre su contraseña.";
            mensajeErrorClave.style.display = "block";
            campoClaveAcceso.style.borderColor = "var(--color-alerta-salmon-borde, #f98080)";
            esFormularioValido = false;
        } else if (valorClave.length > LONGITUD_MAXIMA_CLAVE) {
            mensajeErrorClave.textContent = `La contraseña excede los caracteres permitidos (${LONGITUD_MAXIMA_CLAVE}).`;
            mensajeErrorClave.style.display = "block";
            campoClaveAcceso.style.borderColor = "var(--color-alerta-salmon-borde, #f98080)";
            esFormularioValido = false;
        } else {
        mensajeErrorClave.style.display = "none";
        campoClaveAcceso.style.borderColor = "var(--borde-suave)";
        }

        if (esFormularioValido && destinoRedireccion !== "") {
        window.location.href = destinoRedireccion;
        }
    });
}

// Solicitud de registro de vehículo - Validaciones
document.addEventListener('DOMContentLoaded', function() {
    const formularioRegistro = document.getElementById('form-registro-vehiculo');
    if (!formularioRegistro) return;

    const entradaPlaca = document.getElementById('placa-vehiculo');
    const entradaTipo = document.getElementById('tipo-vehiculo');
    const entradaFabricante = document.getElementById('fabricante-vehiculo');
    const entradaModelo = document.getElementById('modelo-vehiculo');
    const entradaColor = document.getElementById('color-vehiculo');
    const entradaAnio = document.getElementById('anio-vehiculo');
    const entradaObservaciones = document.getElementById('observaciones-vehiculo');

    const LIMITE_OBSERVACIONES = 250;

    entradaPlaca.addEventListener('input', function() {
        entradaPlaca.value = entradaPlaca.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });

    [entradaFabricante, entradaModelo, entradaColor].forEach(function(campo) {
        campo.addEventListener('input', function() {
            campo.value = campo.value.replace(/[0-9]/g, '');
        });
    });

    function mostrarAlertaError(elementoInput, mensaje) {
        const contenedorFila = elementoInput.closest('.bloque-campo-formulario');
        const etiquetaError = contenedorFila.querySelector('.texto-alerta-error');
        etiquetaError.textContent = mensaje;
        etiquetaError.style.display = 'block';
        elementoInput.style.borderColor = 'var(--color-alerta-salmon-fondo)';
    }

    function ocultarAlertaError(elementoInput) {
        const contenedorFila = elementoInput.closest('.bloque-campo-formulario');
        const etiquetaError = contenedorFila.querySelector('.texto-alerta-error');
        etiquetaError.style.display = 'none';
        elementoInput.style.borderColor = 'var(--borde-suave)';
    }

    formularioRegistro.addEventListener('submit', function(evento) {
        evento.preventDefault();
        let formularioEsValido = true;

        // 1. Validar tipo
        if (entradaTipo.value === "") {
            mostrarAlertaError(entradaTipo, "El registro es obligatorio");
            formularioEsValido = false;
        } else {
            ocultarAlertaError(entradaTipo);
        }

        // 2. Validar placa (si no es "Otro")
        if (entradaTipo.value !== "otro" && entradaTipo.value !== "") {
            const valorPlaca = entradaPlaca.value.trim();
            if (valorPlaca === "") {
                mostrarAlertaError(entradaPlaca, "El registro es obligatorio");
                formularioEsValido = false;
            } else {
                let formatoCorrecto = false;
                const tiposEstandar = ["automovil", "camioneta", "suv", "furgoneta", "bus", "camion"];
                
                if (tiposEstandar.includes(entradaTipo.value)) {
                    formatoCorrecto = /^[A-Z]{3}[0-9]{4}$/.test(valorPlaca);
                } else if (entradaTipo.value === "motocicleta") {
                    formatoCorrecto = /^[A-Z]{2}[0-9]{3}[A-Z]{1}$/.test(valorPlaca);
                }

                if (!formatoCorrecto) {
                    mostrarAlertaError(entradaPlaca, "El registro tiene un formato no válido");
                    formularioEsValido = false;
                } else {
                    ocultarAlertaError(entradaPlaca);
                }
            }
        } else {
            ocultarAlertaError(entradaPlaca);
        }

        // 3. Validar Fabricante, Modelo y Color
        const camposTexto = [entradaFabricante, entradaModelo, entradaColor];
        camposTexto.forEach(function(campo) {
            const valor = campo.value.trim();
            if (valor === "") {
                mostrarAlertaError(campo, "El registro es obligatorio");
                formularioEsValido = false;
            } else if (valor.length < 2) {
                mostrarAlertaError(campo, "El registro no es válido");
                formularioEsValido = false;
            } else {
                ocultarAlertaError(campo);
            }
        });

        // 4. Validar año
        const valorAnioInput = entradaAnio.value.trim();
        const anioIngresado = parseInt(valorAnioInput);
        const anioActual = new Date().getFullYear();

        if (valorAnioInput === "") {
            mostrarAlertaError(entradaAnio, "El registro es obligatorio");
            formularioEsValido = false;
        } else if (anioIngresado < 1950 || anioIngresado > (anioActual + 1)) {
            mostrarAlertaError(entradaAnio, "El registro no es válido");
            formularioEsValido = false;
        } else {
            ocultarAlertaError(entradaAnio);
        }

        // 5. Validar observaciones
        if (entradaObservaciones.value.length > LIMITE_OBSERVACIONES) {
            mostrarAlertaError(entradaObservaciones, "El registro excede los caracteres permitidos (" + LIMITE_OBSERVACIONES + ")");
            formularioEsValido = false;
        } else {
            ocultarAlertaError(entradaObservaciones);
        }

        if (formularioEsValido) {
            // Obtener la fecha y hora actual formateada
            const ahora = new Date();
            const dia = String(ahora.getDate()).padStart(2, '0');
            const mes = String(ahora.getMonth() + 1).padStart(2, '0');
            const anio = ahora.getFullYear();
            const horas = String(ahora.getHours()).padStart(2, '0');
            const minutos = String(ahora.getMinutes()).padStart(2, '0');
            
            const fechaFormateada = `${dia}/${mes}/${anio} a las ${horas}:${minutos}.`;
            
            const parrafoFecha = document.getElementById('info-fecha-registro');
            if (parrafoFecha) {
                parrafoFecha.innerHTML = `Fecha y hora en que se registró la solicitud: ${fechaFormateada}`;
            }

            if (typeof cerrarModal === 'function') {
                cerrarModal('modal-registro-vehiculo');
            }

            setTimeout(() => {
                if (typeof abrirModal === 'function') {
                    abrirModal('modal-registro-exito');
                }
                formularioRegistro.reset();
            }, 400);
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const botonesDesplegar = document.querySelectorAll('.boton-desplegar-compacto');
    
    botonesDesplegar.forEach(boton => {
        boton.addEventListener('click', function() {
            const idContenido = this.getAttribute('data-objetivo');
            const contenido = document.getElementById(idContenido);
            
            this.classList.toggle('activo');
            contenido.classList.toggle('visible');
        });
    });

    const formAutorizacion = document.getElementById('form-crear-autorizacion');
    if (formAutorizacion) {
        formAutorizacion.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const ahora = new Date();
            const fechaHora = `${String(ahora.getDate()).padStart(2, '0')}/${String(ahora.getMonth() + 1).padStart(2, '0')}/${ahora.getFullYear()} a las ${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}.`;
            
            const parrafoFecha = document.getElementById('info-fecha-registro');
            if (parrafoFecha) {
                parrafoFecha.innerHTML = `Fecha y hora en que se registró la solicitud: ${fechaHora}`;
            }

            cerrarModal('modal-crear-autorizacion');
            setTimeout(() => {
                abrirModal('modal-registro-exito');
                formAutorizacion.reset();
            }, 400);
        });
    }
});