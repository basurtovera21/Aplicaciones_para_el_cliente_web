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