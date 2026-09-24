const formulario = document.getElementById('formulario-cliente');
formulario.addEventListener('submit', function(evento) {
    evento.preventDefault(); // Evita que se envíe de forma predeterminada
  
    const numeroCedula = document.getElementById('numero-cedula').value.trim(); // Elimina espacios en blanco al inicio y al final  
    const nombreCompleto = document.getElementById('nombre-completo').value.trim();
    const direccion = document.getElementById('direccion').value.trim();
    const numeroCelular = document.getElementById('numero-celular').value.trim();
    const correoElectronico = document.getElementById('correo-electronico').value.trim();

    let todoCorrecto = true;

    document.getElementById('formulario-exito').textContent = '';

    const patronNumero = /^[0-9]+$/; // Expresión para verificar que solo contenga dígitos numéricos
    if (numeroCedula.length !== 10 || !patronNumero.test(numeroCedula)) { // test.- Verifica si el valor cumple con la expresión
        mostrarError('numero-cedula', 'error-cedula', 'El número de cédula debe tener exactamente 10 dígitos numéricos.');
        todoCorrecto = false;
    } else {
        limpiarError('numero-cedula', 'error-cedula');    
    }

    if (nombreCompleto === '') {
        mostrarError('nombre-completo', 'error-nombre', 'El nombre completo es obligatorio.');
        todoCorrecto = false;
    } else if (nombreCompleto.length > 30) {
        mostrarError('nombre-completo', 'error-nombre', 'El nombre completo no debe exceder los 30 caracteres.');
        todoCorrecto = false;
    } else {
        limpiarError('nombre-completo', 'error-nombre');
    }

    if (direccion === '') {
        mostrarError('direccion', 'error-direccion', 'La dirección es obligatoria.');
        todoCorrecto = false;
    } else if (direccion.length > 50) {
        mostrarError('direccion', 'error-direccion', 'La dirección no debe exceder los 50 caracteres.');
        todoCorrecto = false;
    } else {
        limpiarError('direccion', 'error-direccion');
    }

    if (numeroCelular.length !== 10 || !patronNumero.test(numeroCelular)) {
        mostrarError('numero-celular', 'error-celular', 'El número de celular debe tener exactamente 10 dígitos numéricos.');
        todoCorrecto = false;
    } else {
        limpiarError('numero-celular', 'error-celular');
    }

    const patronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Expresión para verificar formato de correo electrónico
    if (!patronCorreo.test(correoElectronico)) {
        mostrarError('correo-electronico', 'error-correo', 'El correo electrónico no tiene un formato válido.');
        todoCorrecto = false;
    } else {
        limpiarError('correo-electronico', 'error-correo');
    }

    if (todoCorrecto) {
        document.getElementById('formulario-exito').textContent = 'El cliente ha sido registrado exitosamente.';
        formulario.reset(); // Limpia los campos del formulario
    }
});

function mostrarError(campoId, errorId, mensaje) {
    const campo = document.getElementById(campoId);
    const error = document.getElementById(errorId);

    campo.classList.add('invalido'); // Agrega la clase de error al campo
    error.textContent = mensaje; // Muestra el mensaje de error
}

function limpiarError(campoId, errorId) {
    const campo = document.getElementById(campoId);
    const error = document.getElementById(errorId);

    campo.classList.remove('invalido'); // Elimina la clase de error del campo
    error.textContent = ''; // Limpia el mensaje de error
}