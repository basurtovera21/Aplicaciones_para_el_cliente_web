const formularioAutenticacion = document.getElementById("formulario-autenticacion");
const entradaCorreoUsuario = document.getElementById("campo-correo-institucional");
const entradaClave = document.getElementById("campo-clave-acceso");
const botonOjo = document.getElementById("boton-alternar-visualizacion-clave");
const iconoOjo = document.getElementById("imagen-icono-ojo");

const errorCorreo = document.getElementById("mensaje-error-correo");
const errorClave = document.getElementById("mensaje-error-clave");

const MAXIMO_CARACTERES_CLAVE = 20;
entradaClave.setAttribute("maxlength", MAXIMO_CARACTERES_CLAVE);

function mostrarError(campo, etiquetaMensaje, texto) {
    etiquetaMensaje.textContent = texto;
    etiquetaMensaje.style.display = "block";
    campo.style.borderColor = "var(--color-alerta-salmon-fondo)";
}

function limpiarError(campo, etiquetaMensaje) {
    etiquetaMensaje.style.display = "none";
    campo.style.borderColor = "var(--borde-suave)";
}

botonOjo.addEventListener("click", function() {
    if (entradaClave.type === "password") {
        entradaClave.type = "text";
        iconoOjo.src = "recursos/imagenes/ojo-cerrado.svg";
    } else {
        entradaClave.type = "password";
        iconoOjo.src = "recursos/imagenes/ojo.svg";
    }
});

entradaCorreoUsuario.addEventListener("input", () => limpiarError(entradaCorreoUsuario, errorCorreo));
entradaClave.addEventListener("input", () => limpiarError(entradaClave, errorClave));

formularioAutenticacion.addEventListener("submit", function(evento) {
    evento.preventDefault();

    const identificadorIngresado = entradaCorreoUsuario.value.trim().toLowerCase();
    const claveIngresada = entradaClave.value.trim();
    

    const baseDeDatos = obtenerBaseDatos();
    let esValido = true; 

    if (identificadorIngresado === "") {
        mostrarError(entradaCorreoUsuario, errorCorreo, "Registre su correo institucional o usuario");
        esValido = false;
    }
    if (claveIngresada === "") {
        mostrarError(entradaClave, errorClave, "Registre su contraseña");
        esValido = false;
    }

    if (!esValido) return;


    const usuarioEncontrado = baseDeDatos.usuarios.find(usuario => {
        return (usuario.correo_institucional.toLowerCase() === identificadorIngresado || 
                (usuario.identificador_usuario && usuario.identificador_usuario.toLowerCase() === identificadorIngresado)) && 
               usuario.clave_acceso === claveIngresada;
    });

    if (usuarioEncontrado) {
        localStorage.setItem('sesion_activa', JSON.stringify(usuarioEncontrado));

        if (usuarioEncontrado.rol_sistema === "usuario") {
            window.location.href = "usuario-inicio.html";
        } else if (usuarioEncontrado.rol_sistema === "guardia") {
            window.location.href = "punto-de-acceso-inicio.html";
        } else if (usuarioEncontrado.rol_sistema === "admin") {
            window.location.href = "administracion-inicio.html";
        }
    } else {
        mostrarError(entradaCorreoUsuario, errorCorreo, "Las credenciales ingresadas no son válidas");
        mostrarError(entradaClave, errorClave, "");
    }
});