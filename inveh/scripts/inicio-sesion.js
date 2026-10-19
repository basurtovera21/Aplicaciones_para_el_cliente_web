// Referencias a los elementos del formulario de autenticación en el DOM.
const formularioAutenticacion = document.getElementById("formulario-autenticacion");
const campoUsuarioOCorreo = document.getElementById("campo-correo-institucional");
const campoClaveAcceso = document.getElementById("campo-clave-acceso");
const botonAlternarClave = document.getElementById("boton-alternar-visualizacion-clave");
const iconoAlternarClave = document.getElementById("imagen-icono-ojo");

// Referencias a las etiquetas contenedoras de mensajes de error.
const mensajeErrorIdentificador = document.getElementById("mensaje-error-correo");
const mensajeErrorClave = document.getElementById("mensaje-error-clave");

// Element.setAttribute: Establece la longitud máxima permitida para el campo de contraseña.
const MAXIMO_CARACTERES_CLAVE = 20;
campoClaveAcceso.setAttribute("maxlength", MAXIMO_CARACTERES_CLAVE);

// Muestra el mensaje de validación y resalta el borde del campo afectado.
function mostrarError(campoTexto, etiquetaError, textoMensaje) {
    etiquetaError.textContent = textoMensaje;
    etiquetaError.style.display = "block";
    campoTexto.style.borderColor = "var(--color-alerta-salmon-fondo)";
}

// Oculta el mensaje de validación y restablece el estilo original del campo.
function limpiarError(campoTexto, etiquetaError) {
    etiquetaError.style.display = "none";
    campoTexto.style.borderColor = "var(--borde-suave)";
}

// Alterna la visibilidad de los caracteres en el campo de contraseña.
botonAlternarClave.addEventListener("click", function() {
    // HTMLInputElement.type: Evalúa y conmuta el tipo de entrada entre texto plano y contraseña protegida.
    if (campoClaveAcceso.type === "password") {
        campoClaveAcceso.type = "text";
        iconoAlternarClave.src = "recursos/imagenes/ojo-cerrado.svg";
    } else {
        campoClaveAcceso.type = "password";
        iconoAlternarClave.src = "recursos/imagenes/ojo.svg";
    }
});

// Limpia los mensajes de error en tiempo real conforme el usuario interactúa con los campos.
campoUsuarioOCorreo.addEventListener("input", function() {
    limpiarError(campoUsuarioOCorreo, mensajeErrorIdentificador);
});
campoClaveAcceso.addEventListener("input", function() {
    limpiarError(campoClaveAcceso, mensajeErrorClave);
});

// Procesa el inicio de sesión y valida las credenciales registradas.
formularioAutenticacion.addEventListener("submit", function(evento) {
    // Event.preventDefault: Cancela la recarga automática predeterminada del formulario al enviarse.
    evento.preventDefault();

    // String.prototype.trim y toLowerCase: Limpia espacios y normaliza el identificador a minúsculas.
    const identificadorIngresado = campoUsuarioOCorreo.value.trim().toLowerCase();
    const claveIngresada = campoClaveAcceso.value.trim();

    // Obtiene la base de datos completa desde el almacenamiento persistente.
    const baseDeDatos = obtenerBaseDatos();
    let formularioEsValido = true;

    // Validación de obligatoriedad para el campo de usuario o correo.
    if (identificadorIngresado === "") {
        mostrarError(campoUsuarioOCorreo, mensajeErrorIdentificador, "Registre su correo institucional o usuario");
        formularioEsValido = false;
    }

    // Validación de obligatoriedad para el campo de contraseña.
    if (claveIngresada === "") {
        mostrarError(campoClaveAcceso, mensajeErrorClave, "Registre su contraseña");
        formularioEsValido = false;
    }

    // Si existen campos vacíos, detiene la autenticación.
    if (!formularioEsValido) {
        return;
    }

    // Array.prototype.find: Busca en la colección de usuarios una coincidencia exacta de credenciales.
    const usuarioEncontrado = baseDeDatos.usuarios.find(function(usuario) {
        // Valida coincidencia contra el correo institucional normalizado.
        const coincideCorreo = Boolean(usuario.correo_institucional && usuario.correo_institucional.toLowerCase() === identificadorIngresado);
        // Valida coincidencia contra el identificador de usuario institucional.
        const coincideUsuario = Boolean(usuario.identificador_usuario && usuario.identificador_usuario.toLowerCase() === identificadorIngresado);
        // Valida la concordancia exacta de la contraseña de acceso.
        const coincideClave = usuario.clave_acceso === claveIngresada;

        return (coincideCorreo || coincideUsuario) && coincideClave;
    });

    // Gestiona la redirección según el rol si las credenciales son válidas.
    if (usuarioEncontrado) {
        // localStorage.setItem: Persiste la sesión activa del usuario autenticado en formato JSON.
        localStorage.setItem('sesion_activa', JSON.stringify(usuarioEncontrado));

        // Redirecciona al usuario a la interfaz correspondiente a su rol en el sistema.
        if (usuarioEncontrado.rol_sistema === "usuario") {
            window.location.href = "usuario-inicio.html";
        } else if (usuarioEncontrado.rol_sistema === "guardia") {
            window.location.href = "punto-control-inicio.html";
        } else if (usuarioEncontrado.rol_sistema === "admin") {
            window.location.href = "administracion.html";
        }
    } else {
        // Notifica el error de autenticación si las credenciales no coincidieron con ningún usuario.
        mostrarError(campoUsuarioOCorreo, mensajeErrorIdentificador, "Las credenciales ingresadas no son válidas");
        mostrarError(campoClaveAcceso, mensajeErrorClave, "");
    }
});

// Referencias a los botones de respaldo y restauración de la base de datos.
const botonExportarBaseDatos = document.getElementById("boton-exportar-bd");
const botonImportarBaseDatos = document.getElementById("boton-cargar-bd");
const selectorArchivoJSON = document.getElementById("selector-archivo-bd");

// Evento para iniciar la descarga del respaldo en formato JSON.
if (botonExportarBaseDatos) {
    botonExportarBaseDatos.addEventListener("click", function() {
        exportarBaseDatosJSON();
    });
}

// Configuración del botón para seleccionar y cargar el archivo de respaldo.
if (botonImportarBaseDatos && selectorArchivoJSON) {
    // HTMLElement.click: Desencadena la apertura del selector de archivos del sistema operativo.
    botonImportarBaseDatos.addEventListener("click", function() {
        selectorArchivoJSON.value = '';
        selectorArchivoJSON.click();
    });

    // Event.target.files: Captura el archivo seleccionado por el usuario y ejecuta la importación.
    selectorArchivoJSON.addEventListener("change", function(evento) {
        const archivoSeleccionado = evento.target.files[0];
        if (archivoSeleccionado) {
            importarBaseDatosJSON(archivoSeleccionado);
        }
    });
}