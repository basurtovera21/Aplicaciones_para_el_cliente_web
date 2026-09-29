document.getElementById('boton-calcular').addEventListener('click', function() {
    const valor1 = document.getElementById('numero1').value.trim();
    const valor2 = document.getElementById('numero2').value.trim();
    const contenedorResultados = document.getElementById('resultados');

    if (valor1 === '' || valor2 === '') {
        alert('Registre ambos números antes de calcular.');
        return;
    }

    const n1 = parseFloat(valor1);
    const n2 = parseFloat(valor2);

    if (isNaN(n1) || isNaN(n2)) {
        alert('Registre valores numéricos válidos.');
        return;
    }

    // Encabezado de resultados
    contenedorResultados.innerHTML = '<h3>Resultado</h3>';

    // Bucle de 5 iteraciones
    for (let i = 1; i <= 5; i++) {
        let resultado = 0;
        let operacion = '';

        switch (i) {
            case 1:
                operacion = 'Suma';
                resultado = n1 + n2;
                break;
            case 2:
                operacion = 'Resta';
                resultado = n1 - n2;
                break;
            case 3:
                operacion = 'Multiplicación';
                resultado = n1 * n2;
                break;
            case 4:
                operacion = 'División';
                resultado = (n2 === 0) ? 'No divisible para 0' : (n1 / n2);
                break;
            case 5:
                operacion = 'Módulo (%)';
                resultado = (n2 === 0) ? 'Indefinido (módulo 0)' : (n1 % n2);
                break;
        }

        // Formatear si tiene muchos decimales (hasta 4 dígitos)
        if (typeof resultado === 'number' && !Number.isInteger(resultado)) {
            resultado = parseFloat(resultado.toFixed(4));
        }

        // Renderizado alineado
        contenedorResultados.innerHTML += `
            <p>
                <span><strong>Iteración ${i}:</strong> ${operacion}</span>
                <span>${resultado}</span>
            </p>
        `;
    }

    contenedorResultados.style.display = 'block';
});