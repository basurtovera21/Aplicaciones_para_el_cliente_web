function mostrarAlertaError(elementoInput, mensaje) {
    const contenedorFila = elementoInput.closest('.bloque-campo-formulario');
    const etiquetaError = contenedorFila.querySelector('.texto-alerta-error');
    
    if (etiquetaError) {
        etiquetaError.textContent = mensaje;
        etiquetaError.style.display = 'block';
        elementoInput.style.borderColor = 'var(--color-alerta-salmon-fondo)';
    }
}


function ocultarAlertaError(elementoInput) {
    const contenedorFila = elementoInput.closest('.bloque-campo-formulario');
    const etiquetaError = contenedorFila.querySelector('.texto-alerta-error');
    
    if (etiquetaError) {
        etiquetaError.style.display = 'none';
        elementoInput.style.borderColor = 'var(--borde-suave)';
    }
}


function validarCedulaEcuatoriana(cedula) {
    if (cedula.length !== 10 || !/^\d+$/.test(cedula)) return false;

    const region = parseInt(cedula.substring(0, 2));
    if (region < 1 || region > 24) return false;

    const ultimoDigitoRecibido = parseInt(cedula.substring(9, 10));
    let suma = 0;

    for (let i = 0; i < 9; i++) {
        let multiplicador = (i % 2 === 0) ? 2 : 1;
        let resultado = parseInt(cedula[i]) * multiplicador;
        if (resultado > 9) resultado -= 9;
        suma += resultado;
    }

    const digitoVerificador = (suma % 10 === 0) ? 0 : 10 - (suma % 10);
    return digitoVerificador === ultimoDigitoRecibido;
}