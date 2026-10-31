const formulario = document.getElementById('formularioEstudiante');
const cuerpoTablaEstudiantes = document.getElementById('cuerpoTablaEstudiantes');
const botonDescargar = document.getElementById('botonDescargar');
const botonReiniciar = document.getElementById('botonReiniciar');

let listaEstudiantes = JSON.parse(localStorage.getItem('estudiantes')) || [];

// Función para mostrar los estudiantes
function mostrarEstudiantes() {
    cuerpoTablaEstudiantes.innerHTML = '';
    
    listaEstudiantes.forEach((estudiante) => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${estudiante.cedula}</td>
            <td>${estudiante.apellidos} ${estudiante.nombres}</td>
            <td>${estudiante.direccion}</td>
            <td>${estudiante.telefono}</td>
            <td>${estudiante.correo}</td>
            <td>${estudiante.facultad}</td>
            <td>${estudiante.nivel}</td>
            <td>${estudiante.paralelo}</td>
        `;
        cuerpoTablaEstudiantes.appendChild(fila);
    });
}

mostrarEstudiantes();

// Función para mostrar un error debajo del input
function mostrarError(idInput, mensaje) {
    const input = document.getElementById(idInput);
    input.classList.add('error-input');
    
    // Verificar si ya existe un error para no duplicarlo
    let spanError = input.parentElement.querySelector('.mensaje-error');
    if (!spanError) {
        spanError = document.createElement('span');
        spanError.className = 'mensaje-error';
        input.parentElement.appendChild(spanError);
    }
    spanError.textContent = mensaje;
}

// Función para limpiar el error de un input
function limpiarError(idInput) {
    const input = document.getElementById(idInput);
    input.classList.remove('error-input');
    const spanError = input.parentElement.querySelector('.mensaje-error');
    if (spanError) {
        spanError.remove();
    }
}

// Función para limpiar todos los errores del formulario
function limpiarTodosLosErrores() {
    const inputs = formulario.querySelectorAll('input');
    inputs.forEach(input => {
        input.classList.remove('error-input');
        const spanError = input.parentElement.querySelector('.mensaje-error');
        if (spanError) {
            spanError.remove();
        }
    });
}

// Evento para guardar un nuevo estudiante
formulario.addEventListener('submit', function(evento) {
    evento.preventDefault();
    limpiarTodosLosErrores();

    const cedula = document.getElementById('cedula').value.trim();
    const apellidos = document.getElementById('apellidos').value.trim();
    const nombres = document.getElementById('nombres').value.trim();
    const direccion = document.getElementById('direccion').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const facultad = document.getElementById('facultad').value.trim();
    const nivel = document.getElementById('nivel').value.trim();
    const paralelo = document.getElementById('paralelo').value.trim();

    let esFormularioValido = true;

    // --- VALIDACIONES DE CAMPOS VACÍOS Y FORMATOS (EXPRESIONES REGULARES) ---

    // 1. Cédula
    if (cedula === '') {
        mostrarError('cedula', 'El registro es obligatorio.');
        esFormularioValido = false;
    } else {
        const patronCedula = /^\d{10}$/;
        if (!patronCedula.test(cedula)) {
            mostrarError('cedula', 'El número de cédula debe contener 10 dígitos numéricos.');
            esFormularioValido = false;
        } else {
            // Verificar si la cédula ya está registrada
            const cedulaExiste = listaEstudiantes.some(est => est.cedula === cedula);
            if (cedulaExiste) {
                mostrarError('cedula', 'El número de cédula ya se encuentra registrado.');
                esFormularioValido = false;
            }
        }
    }

    // 2. Apellidos
    if (apellidos === '') {
        mostrarError('apellidos', 'El registro es obligatorio.');
        esFormularioValido = false;
    } else {
        const patronLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/;
        if (!patronLetras.test(apellidos)) {
            mostrarError('apellidos', 'Registro no válido (registre un máximo de 50 caracteres alfabéticos).');
            esFormularioValido = false;
        }
    }

    // 3. Nombres
    if (nombres === '') {
        mostrarError('nombres', 'El registro es obligatorio.');
        esFormularioValido = false;
    } else {
        const patronLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/;
        if (!patronLetras.test(nombres)) {
            mostrarError('nombres', 'Registro no válido (registre un máximo de 50 caracteres alfabéticos).');
            esFormularioValido = false;
        }
    }

    // 4. Dirección
    if (direccion === '') {
        mostrarError('direccion', 'El registro es obligatorio.');
        esFormularioValido = false;
    } else if (direccion.length > 100) {
        mostrarError('direccion', 'Registro no válido (registre un máximo de 100 caracteres).');
        esFormularioValido = false;
    }

    // 5. Teléfono
    if (telefono === '') {
        mostrarError('telefono', 'El registro es obligatorio.');
        esFormularioValido = false;
    } else {
        const patronTelefono = /^09\d{8}$/;
        if (!patronTelefono.test(telefono)) {
            mostrarError('telefono', 'El registro debe contener 10 dígitos.');
            esFormularioValido = false;
        } else {
            // Verificar si el teléfono ya está registrado
            const telefonoExiste = listaEstudiantes.some(est => est.telefono === telefono);
            if (telefonoExiste) {
                mostrarError('telefono', 'El número de teléfono ya se encuentra registrado.');
                esFormularioValido = false;
            }
        }
    }

    // 6. Correo electrónico
    if (correo === '') {
        mostrarError('correo', 'El registro es obligatorio.');
        esFormularioValido = false;
    } else {
        const correoEsperado = `e${cedula}@live.uleam.edu.ec`;
        if (correo !== correoEsperado) {
            mostrarError('correo', 'Formato de registro no válido (e(número de cédula)@live.uleam.edu.ec).');
            esFormularioValido = false;
        } else {
            // Verificar si el correo ya está registrado
            const correoExiste = listaEstudiantes.some(est => est.correo === correo);
            if (correoExiste) {
                mostrarError('correo', 'El correo electrónico ya se encuentra registrado.');
                esFormularioValido = false;
            }
        }
    }

    // 7. Facultad
    if (facultad === '') {
        mostrarError('facultad', 'El registro es obligatorio.');
        esFormularioValido = false;
    } else if (facultad.length > 40) {
        mostrarError('facultad', 'Registro no válido (registre un máximo de 40 caracteres).');
        esFormularioValido = false;
    }

    // 8. Nivel
    if (nivel === '') {
        mostrarError('nivel', 'El registro es obligatorio.');
        esFormularioValido = false;
    } else {
        const patronNivel = /^(?:[1-9]|1[0-2])$/;
        if (!patronNivel.test(nivel)) {
            mostrarError('nivel', 'Registro no válido (número entero entre 1 y 12).');
            esFormularioValido = false;
        }
    }

    // 9. Paralelo
    if (paralelo === '') {
        mostrarError('paralelo', 'El registro es obligatorio.');
        esFormularioValido = false;
    } else {
        const patronParalelo = /^[a-zA-Z]$/;
        if (!patronParalelo.test(paralelo)) {
            mostrarError('paralelo', 'Registro no válido (registre un caracter alfabético).');
            esFormularioValido = false;
        }
    }

    if (!esFormularioValido) {
        return;
    }

    // Crear objeto del estudiante
    const nuevoEstudiante = {
        cedula,
        apellidos: apellidos.toUpperCase(),
        nombres: nombres.toUpperCase(),
        direccion,
        telefono,
        correo,
        facultad: facultad.toUpperCase(),
        nivel,
        paralelo: paralelo.toUpperCase()
    };

    // Agregar al arreglo
    listaEstudiantes.push(nuevoEstudiante);

    // Guardar en localStorage usando JSON.stringify
    localStorage.setItem('estudiantes', JSON.stringify(listaEstudiantes));

    // Actualizar la interfaz y limpiar formulario
    mostrarEstudiantes();
    formulario.reset();
    alert("Estudiante registrado correctamente");
});

// Función para descargar los registros en formato JSON
botonDescargar.addEventListener('click', function() {
    if (listaEstudiantes.length === 0) {
        alert("No existen registros.");
        return;
    }

    // Convertir el arreglo a formato JSON legible
    const contenidoJson = JSON.stringify(listaEstudiantes, null, 2);
    
    // Crear archivo virtual para descarga
    const blob = new Blob([contenidoJson], { type: 'application/json' });
    const urlEnlace = URL.createObjectURL(blob);
    
    const enlaceDescarga = document.createElement('a');
    enlaceDescarga.href = urlEnlace;
    enlaceDescarga.download = 'registro_estudiantes.json';
    document.body.appendChild(enlaceDescarga);
    enlaceDescarga.click();
    
    document.body.removeChild(enlaceDescarga);
    URL.revokeObjectURL(urlEnlace);
});

// Función para reiniciar/borrar todos los registros
botonReiniciar.addEventListener('click', function() {
    if (confirm("¿Desea reiniciar los registros guardados?")) {
        localStorage.removeItem('estudiantes');
        listaEstudiantes = [];
        mostrarEstudiantes();
        limpiarTodosLosErrores();
        alert("Los registros se han eliminado exitosamente.");
    }
});