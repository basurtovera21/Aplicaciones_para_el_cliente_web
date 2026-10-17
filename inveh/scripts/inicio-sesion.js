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
        const coincideCorreo = usuario.correo_institucional && 
                               usuario.correo_institucional.toLowerCase() === identificadorIngresado;
        
        const coincideUsuario = usuario.identificador_usuario && 
                                usuario.identificador_usuario.toLowerCase() === identificadorIngresado;

        return (coincideCorreo || coincideUsuario) && usuario.clave_acceso === claveIngresada;
    });

    if (usuarioEncontrado) {
        localStorage.setItem('sesion_activa', JSON.stringify(usuarioEncontrado));

        if (usuarioEncontrado.rol_sistema === "usuario") {
            window.location.href = "usuario-inicio.html";
        } else if (usuarioEncontrado.rol_sistema === "guardia") {
            window.location.href = "punto-control-inicio.html";
        } else if (usuarioEncontrado.rol_sistema === "admin") {
            // Nombre exacto de tu archivo
            window.location.href = "administracion.html"; 
        }
    } else {
        mostrarError(entradaCorreoUsuario, errorCorreo, "Las credenciales ingresadas no son válidas");
        mostrarError(entradaClave, errorClave, "");
    }
    
});


const botonExportar = document.getElementById("boton-exportar-bd");
const botonCargar = document.getElementById("boton-cargar-bd");
const selectorArchivo = document.getElementById("selector-archivo-bd");

if (botonExportar) {
    botonExportar.addEventListener("click", () => {
        exportarBaseDatosJSON();
    });
}

if (botonCargar && selectorArchivo) {

    botonCargar.addEventListener("click", () => {
        selectorArchivo.value = ''; // Permite volver a seleccionar el mismo archivo
        selectorArchivo.click();
    });

    selectorArchivo.addEventListener("change", (evento) => {
        const archivoSeleccionado = evento.target.files[0];
        if (archivoSeleccionado) {
            importarBaseDatosJSON(archivoSeleccionado);
        }
    });
}