// Despliega visualmente el mensaje de error y destaca el borde del campo de entrada.
function mostrarAlertaError(elementoEntrada, textoMensaje) {
    // Element.closest: Localiza el contenedor ancestro con la clase de bloque del formulario.
    const contenedorFila = elementoEntrada.closest('.bloque-campo-formulario');
    // Element.querySelector: Busca la etiqueta destinada al mensaje de alerta de error dentro del contenedor.
    const etiquetaError = contenedorFila ? contenedorFila.querySelector('.texto-alerta-error') : null;
    
    if (etiquetaError) {
        // Node.textContent: Asigna el texto descriptivo del error a la etiqueta.
        etiquetaError.textContent = textoMensaje;
        // CSSStyleDeclaration.display: Modifica la propiedad de visualización a bloque para hacerlo visible.
        etiquetaError.style.display = 'block';
        // CSSStyleDeclaration.borderColor: Aplica el color de alerta definido en las variables CSS al borde del campo.
        elementoEntrada.style.borderColor = 'var(--color-alerta-salmon-fondo)';
    }
}

// Oculta el mensaje de error visual y restablece el estilo predeterminado del campo.
function ocultarAlertaError(elementoEntrada) {
    const contenedorFila = elementoEntrada.closest('.bloque-campo-formulario');
    const etiquetaError = contenedorFila ? contenedorFila.querySelector('.texto-alerta-error') : null;
    
    if (etiquetaError) {
        // CSSStyleDeclaration.display: Oculta la etiqueta de advertencia.
        etiquetaError.style.display = 'none';
        // CSSStyleDeclaration.borderColor: Restaura el color de borde estándar del campo.
        elementoEntrada.style.borderColor = 'var(--borde-suave)';
    }
}

// Valida la autenticidad matemática de una cédula de identidad ecuatoriana mediante el algoritmo Módulo 10.
function validarCedulaEcuatoriana(cadenaCedula) {
    // String.prototype.length y RegExp.prototype.test: Comprueba longitud de diez caracteres exclusivamente numéricos.
    if (cadenaCedula.length !== 10 || !/^\d+$/.test(cadenaCedula)) {
        return false;
    }

    // parseInt y String.prototype.substring: Extrae el código de provincia de los primeros dos dígitos.
    const codigoProvincia = parseInt(cadenaCedula.substring(0, 2), 10);
    if (codigoProvincia < 1 || codigoProvincia > 24) {
        return false;
    }

    // parseInt: Extrae el décimo dígito correspondiente al verificador emitido.
    const ultimoDigitoRecibido = parseInt(cadenaCedula.substring(9, 10), 10);
    let sumaAcumulada = 0;

    // Itera los primeros 9 dígitos aplicando multiplicadores intercalados de 2 y 1.
    for (let indice = 0; indice < 9; indice++) {
        let multiplicador = (indice % 2 === 0) ? 2 : 1;
        let resultadoMultiplicacion = parseInt(cadenaCedula[indice], 10) * multiplicador;
        // Si el producto supera 9, se le resta 9 según las especificaciones del algoritmo.
        if (resultadoMultiplicacion > 9) {
            resultadoMultiplicacion -= 9;
        }
        sumaAcumulada += resultadoMultiplicacion;
    }

    // Obtiene el dígito verificador esperado mediante la operación residuo base 10.
    const digitoVerificadorEsperado = (sumaAcumulada % 10 === 0) ? 0 : 10 - (sumaAcumulada % 10);
    return digitoVerificadorEsperado === ultimoDigitoRecibido;
}

// Expone las funciones de validación en el ámbito global window para su reutilización.
window.mostrarAlertaError = mostrarAlertaError;
window.ocultarAlertaError = ocultarAlertaError;
window.validarCedulaEcuatoriana = validarCedulaEcuatoriana;