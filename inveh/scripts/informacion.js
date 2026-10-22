// Estructura de datos predeterminada del sistema institucional.
const BASE_DE_DATOS_INICIAL = {
    // Registros de usuarios del sistema.
    usuarios: [
        // Registro de usuario estudiante.
        {
            nombres_apellidos: "Basurto Vera Carlos Eduardo",
            numero_identificacion: "1316719804",
            correo_institucional: "e1316719804@live.uleam.edu.ec",
            tipo_usuario: "Estudiante", 
            facultad: "Ciencias de la vida y tecnologías",
            carrera: "Software",
            clave_acceso: "1316719804",
            rol_sistema: "usuario",
            limite_vehiculos_permitidos: 2
        },
        // Registro de usuario estudiante.
        {
            nombres_apellidos: "Quinteros Velásquez George Smith",
            numero_identificacion: "0943700717",
            correo_institucional: "e0943700717@live.uleam.edu.ec",
            tipo_usuario: "Estudiante", 
            facultad: "Ciencias de la vida y tecnologías",
            carrera: "Software",
            clave_acceso: "0943700717",
            rol_sistema: "usuario",
            limite_vehiculos_permitidos: 2
        },
        // Registro de usuario estudiante.
        {
            nombres_apellidos: "Vélez Arcentales Jostin Rusdael",
            numero_identificacion: "1314191535",
            correo_institucional: "e1314191535@live.uleam.edu.ec",
            tipo_usuario: "Estudiante", 
            facultad: "Ciencias de la vida y tecnologías",
            carrera: "Software",
            clave_acceso: "1314191535",
            rol_sistema: "usuario",
            limite_vehiculos_permitidos: 2
        },
        // Registro de usuario estudiante.
        {
            nombres_apellidos: "Pilligua Saltos Michael Julean",
            numero_identificacion: "1350646400",
            correo_institucional: "e1350646400@live.uleam.edu.ec",
            tipo_usuario: "Estudiante", 
            facultad: "Ciencias de la vida y tecnologías",
            carrera: "Software",
            clave_acceso: "1350646400",
            rol_sistema: "usuario",
            limite_vehiculos_permitidos: 2
        },

        // Registro de usuario con rol administrativo.
        {
            nombres_apellidos: "Administrador",
            identificador_usuario: "admin",
            clave_acceso: "admin123",
            tipo_usuario: "Personal administrativo",
            rol_sistema: "admin"   
        },

        // Registro de punto de control y personal de guardia asignado.
        {
            identificador_usuario: "puntocontrol01",
            clave_acceso: "punto01",
            punto_control_asignado: "Punto de control N01",
            rol_sistema: "guardia"
        },
        {
            identificador_usuario: "puntocontrol02",
            clave_acceso: "punto02",
            punto_control_asignado: "Punto de control N02",
            rol_sistema: "guardia"
        },
        {
            identificador_usuario: "puntocontrol03",
            clave_acceso: "punto03",
            punto_control_asignado: "Punto de control N03",
            rol_sistema: "guardia"
        },
        {
            identificador_usuario: "puntocontrol04",
            clave_acceso: "punto04",
            punto_control_asignado: "Punto de control N04",
            rol_sistema: "guardia"
        }
    ],
    // Registros iniciales vacíos.
    vehiculos: [],
    autorizaciones_visitas: [],
    historial_movimientos: []
};

// Serializa y persiste la estructura de datos en el almacenamiento local del navegador.
function guardarCambios(baseDeDatosActualizada) {
    // JSON.stringify: Convierte el objeto JavaScript a texto en formato JSON.
    const textoJSON = JSON.stringify(baseDeDatosActualizada);
    // localStorage.setItem: Guarda el texto bajo la clave única del sistema en el navegador.
    localStorage.setItem('base_de_datos', textoJSON);
}

// Retorna la base de datos actual desde el almacenamiento local o la inicial si no existe.
function obtenerBaseDatos() {
    // localStorage.getItem: Recupera el texto JSON guardado en el navegador.
    const textoGuardado = localStorage.getItem('base_de_datos');
    // Si existen datos guardados, los convierte a objeto; si no, retorna la plantilla inicial.
    if (textoGuardado) {
        // JSON.parse: Convierte el texto JSON recuperado a un objeto JavaScript.
        return JSON.parse(textoGuardado);
    }
    return BASE_DE_DATOS_INICIAL;
}

// Inicializa y sincroniza los datos persistentes en el almacenamiento local.
function inicializarPersistencia() {
    // localStorage.getItem: Recupera el texto JSON guardado en el almacenamiento local.
    const textoGuardado = localStorage.getItem('base_de_datos');

    // Verifica la existencia previa de datos; si no existen, inicializa el almacenamiento.
    if (!textoGuardado) {
        guardarCambios(BASE_DE_DATOS_INICIAL);
        return;
    }

    // Bloque de control de excepciones para prevenir fallos en el análisis de datos.
    try {
        // JSON.parse: Transforma la cadena JSON en un objeto JavaScript manejable.
        const baseDeDatos = JSON.parse(textoGuardado);
        let huboCambios = false;

        // Array.prototype.forEach: Recorre cada usuario de la configuración predeterminada.
        BASE_DE_DATOS_INICIAL.usuarios.forEach(function(usuarioInicial) {
            // Busca si el usuario ya existe comparando identificador de usuario o cédula.
            const indiceUsuario = (baseDeDatos.usuarios || []).findIndex(function(usuarioGuardado) {
                const coincideUsuario = usuarioInicial.identificador_usuario && usuarioGuardado.identificador_usuario === usuarioInicial.identificador_usuario;
                const coincideCedula = usuarioInicial.numero_identificacion && usuarioGuardado.numero_identificacion === usuarioInicial.numero_identificacion;
                return coincideUsuario || coincideCedula;
            });

            // Si el usuario no existe en la lista, se agrega como nuevo registro.
            if (indiceUsuario === -1) {
                // Array.isArray: Determina de forma estricta si el valor evaluado es un arreglo.
                if (!Array.isArray(baseDeDatos.usuarios)) {
                    baseDeDatos.usuarios = [];
                }
                // Array.prototype.push: Añade el nuevo registro al final del arreglo.
                baseDeDatos.usuarios.push(usuarioInicial);
                huboCambios = true;
            } else {
                // Object.assign: Copia las propiedades actualizadas sobre el usuario registrado.
                Object.assign(baseDeDatos.usuarios[indiceUsuario], usuarioInicial);
                huboCambios = true;
            }
        });

        // Si se realizaron actualizaciones, guarda la base de datos modificada.
        if (huboCambios) {
            guardarCambios(baseDeDatos);
        }
    } catch (error) {}
}

// Restablece la base de datos a sus valores iniciales eliminando la persistencia actual.
function reiniciarBaseDatos() {
    // localStorage.removeItem: Elimina del almacenamiento local las claves de datos y sesión.
    localStorage.removeItem('base_de_datos');
    localStorage.removeItem('sesion_activa');

    // Guarda los registros iniciales limpios en el almacenamiento local.
    guardarCambios(BASE_DE_DATOS_INICIAL);
    // Location.reload: Fuerza la recarga del documento actual para restablecer el estado.
    location.reload();
}

// Genera y descarga un archivo en formato JSON con la base de datos completa.
function exportarBaseDatosJSON() {
    // Obtiene la información actual de la base de datos.
    const baseDeDatos = obtenerBaseDatos();
    // JSON.stringify: Serializa los datos con una sangría de dos espacios.
    const contenidoTextoJSON = JSON.stringify(baseDeDatos, null, 2);

    // Blob: Instancia un objeto de datos binarios inmutables con tipo MIME application/json.
    const archivoBlob = new Blob([contenidoTextoJSON], { type: 'application/json' });
    // URL.createObjectURL: Genera un identificador URI temporal vinculado al recurso Blob.
    const enlaceTemporalURL = URL.createObjectURL(archivoBlob);

    // Document.createElement: Instancia dinámicamente un elemento de hipervínculo en el DOM.
    const elementoDescarga = document.createElement('a');
    elementoDescarga.href = enlaceTemporalURL;
    elementoDescarga.download = 'inveh_base_datos.json';
    // Node.appendChild: Inserta el nodo temporal en el árbol del documento.
    document.body.appendChild(elementoDescarga);
    // HTMLElement.click: Desencadena programáticamente el evento de clic para la descarga.
    elementoDescarga.click();
    // Node.removeChild: Remueve el nodo del enlace del árbol del documento.
    document.body.removeChild(elementoDescarga);

    // URL.revokeObjectURL: Libera el recurso URI generado previamente en memoria.
    URL.revokeObjectURL(enlaceTemporalURL);
}

// Procesa e importa un archivo JSON para actualizar la base de datos del sistema.
function importarBaseDatosJSON(archivoSeleccionado) {
    // Si no se seleccionó ningún archivo, cancela la ejecución.
    if (!archivoSeleccionado) {
        return;
    }

    // FileReader: Objeto de la Web API para realizar lecturas asíncronas de archivos locales.
    const lectorDeArchivos = new FileReader();

    // FileReader.onload: Manejador de evento que se ejecuta tras completar la lectura del archivo.
    lectorDeArchivos.onload = function(eventoLectura) {
        // String.prototype.trim: Suprime los espacios en blanco situados en ambos extremos.
        const textoLeido = (eventoLectura.target.result || '').trim();

        // Restablece los datos limpios si el archivo provisto carece de contenido válido.
        if (!textoLeido || textoLeido === '{}' || textoLeido === '[]') {
            reiniciarBaseDatos();
            return;
        }

        // Bloque de captura para controlar excepciones durante la deserialización del archivo.
        try {
            // JSON.parse: Convierte la cadena leída en una estructura de objeto JavaScript.
            const baseDeDatosImportada = JSON.parse(textoLeido);

            // Verifica si el archivo contiene las listas principales de usuarios o vehículos.
            const tieneUsuarios = Array.isArray(baseDeDatosImportada.usuarios);
            const tieneVehiculos = Array.isArray(baseDeDatosImportada.vehiculos);

            // Valida la conformidad estructural de los arreglos principales antes de persistir.
            if (baseDeDatosImportada && (tieneUsuarios || tieneVehiculos)) {
                // Asegura que cada colección requerida exista como arreglo.
                if (!Array.isArray(baseDeDatosImportada.usuarios)) {
                    baseDeDatosImportada.usuarios = [];
                }
                if (!Array.isArray(baseDeDatosImportada.vehiculos)) {
                    baseDeDatosImportada.vehiculos = [];
                }
                if (!Array.isArray(baseDeDatosImportada.autorizaciones_visitas)) {
                    baseDeDatosImportada.autorizaciones_visitas = [];
                }
                if (!Array.isArray(baseDeDatosImportada.historial_movimientos)) {
                    baseDeDatosImportada.historial_movimientos = [];
                }

                // Guarda la base de datos importada y recarga la página.
                guardarCambios(baseDeDatosImportada);
                location.reload();
            }
        } catch (errorAnalisis) {
        }
    };

    // FileReader.readAsText: Inicia la lectura del archivo especificado como texto plano.
    lectorDeArchivos.readAsText(archivoSeleccionado);
}

// --- FUNCIONES UTILITARIAS COMPARTIDAS REUTILIZABLES ---

// Suprime caracteres especiales y espacios, retornando texto en mayúsculas para comparaciones consistentes.
function normalizarTextoAlfanumerico(texto) {
    return (texto || '').toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Normaliza la denominación del punto de control extrayendo su identificador alfanumérico clave.
function normalizarCodigoPuntoControl(textoPunto) {
    return (textoPunto || '').toString().toUpperCase().replace(/PUNTO\s*DE\s*CONTROL/g, '').replace(/[^A-Z0-9]/g, '');
}

// Genera las representaciones formateadas de fecha y hora actuales según el reloj local del sistema.
function obtenerFechaHoraActual() {
    const fechaHoraActual = new Date();
    // String.prototype.padStart: Normaliza a dos dígitos el día, mes, hora y minutos.
    const diaFormateado = String(fechaHoraActual.getDate()).padStart(2, '0');
    const mesFormateado = String(fechaHoraActual.getMonth() + 1).padStart(2, '0');
    const anioFormateado = fechaHoraActual.getFullYear();
    const horasFormateadas = String(fechaHoraActual.getHours()).padStart(2, '0');
    const minutosFormateados = String(fechaHoraActual.getMinutes()).padStart(2, '0');
    return {
        fecha: `${diaFormateado}/${mesFormateado}/${anioFormateado}`,
        hora: `${horasFormateadas}:${minutosFormateados}`,
        fechaISO: `${anioFormateado}-${mesFormateado}-${diaFormateado}`,
        textoCompleto: `${diaFormateado}/${mesFormateado}/${anioFormateado} a las ${horasFormateadas}:${minutosFormateados}.`
    };
}

// Comprueba de forma estricta si una fecha dada coincide con el día de hoy según el calendario local.
function esFechaActualHoy(cadenaFecha) {
    if (!cadenaFecha) {
        return false;
    }
    const fechaActual = new Date();
    const anioActual = fechaActual.getFullYear();
    const mesActual = fechaActual.getMonth() + 1;
    const diaActual = fechaActual.getDate();

    const textoFecha = String(cadenaFecha).trim();

    // Evalúa cadenas con formato estándar ISO YYYY-MM-DD.
    if (/^\d{4}-\d{1,2}-\d{1,2}/.test(textoFecha)) {
        const partesFecha = textoFecha.split('T')[0].split('-');
        const anioExtraido = parseInt(partesFecha[0], 10);
        const mesExtraido = parseInt(partesFecha[1], 10);
        const diaExtraido = parseInt(partesFecha[2], 10);
        return anioExtraido === anioActual && mesExtraido === mesActual && diaExtraido === diaActual;
    }

    // Evalúa cadenas con formato común DD/MM/YYYY.
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(textoFecha)) {
        const partesFecha = textoFecha.split('/');
        const diaExtraido = parseInt(partesFecha[0], 10);
        const mesExtraido = parseInt(partesFecha[1], 10);
        const anioExtraido = parseInt(partesFecha[2], 10);
        return anioExtraido === anioActual && mesExtraido === mesActual && diaExtraido === diaActual;
    }

    const fechaAnalizada = new Date(textoFecha);
    if (!isNaN(fechaAnalizada.getTime())) {
        return fechaAnalizada.getFullYear() === anioActual && 
               (fechaAnalizada.getMonth() + 1) === mesActual && 
               fechaAnalizada.getDate() === diaActual;
    }

    return false;
}

// Determina el siguiente identificador correlativo con formato VEH-000001 evaluando la lista de vehículos.
function generarSiguienteIdentificadorVehicular(listaVehiculos) {
    let numeroMayorEncontrado = 0;
    if (Array.isArray(listaVehiculos)) {
        // Array.prototype.forEach: Recorre los vehículos para encontrar el número secuencial más alto registrado.
        listaVehiculos.forEach(function(vehiculo) {
            if (vehiculo.identificador_sistema && vehiculo.identificador_sistema.startsWith('VEH-')) {
                // parseInt: Extrae el valor numérico del identificador para su comparación.
                const numeroExtraido = parseInt(vehiculo.identificador_sistema.replace('VEH-', ''), 10);
                if (!isNaN(numeroExtraido) && numeroExtraido > numeroMayorEncontrado) {
                    numeroMayorEncontrado = numeroExtraido;
                }
            }
        });
    }
    // String.prototype.padStart: Rellena con ceros a la izquierda hasta completar seis dígitos.
    return `VEH-${String(numeroMayorEncontrado + 1).padStart(6, '0')}`;
}

// Determina el siguiente identificador correlativo con formato AUT-000001 para visitas y movimientos.
function generarSiguienteIdentificadorAutorizacion(listaAutorizaciones) {
    let numeroMayorEncontrado = 0;

    function analizarIdentificador(identificadorTexto) {
        if (identificadorTexto && typeof identificadorTexto === 'string' && identificadorTexto.startsWith('AUT-')) {
            const numeroExtraido = parseInt(identificadorTexto.replace('AUT-', ''), 10);
            if (!isNaN(numeroExtraido) && numeroExtraido > numeroMayorEncontrado) {
                numeroMayorEncontrado = numeroExtraido;
            }
        }
    }

    const baseDeDatos = typeof obtenerBaseDatos === 'function' 
        ? obtenerBaseDatos() 
        : JSON.parse(localStorage.getItem('base_de_datos') || '{}');

    // Examina las autorizaciones registradas en la base de datos.
    const coleccionAutorizaciones = baseDeDatos?.autorizaciones_visitas || (Array.isArray(listaAutorizaciones) ? listaAutorizaciones : []);
    coleccionAutorizaciones.forEach(function(registroAutorizacion) {
        analizarIdentificador(registroAutorizacion.identificador_solicitud);
        analizarIdentificador(registroAutorizacion.identificador_sistema);
    });

    // Examina el historial de movimientos para prevenir duplicaciones de códigos.
    const historialMovimientos = baseDeDatos?.historial_movimientos || [];
    historialMovimientos.forEach(function(registroMovimiento) {
        analizarIdentificador(registroMovimiento.identificador);
        analizarIdentificador(registroMovimiento.identificador_solicitud);
    });

    return `AUT-${String(numeroMayorEncontrado + 1).padStart(6, '0')}`;
}

// Localiza el último movimiento vehicular registrado en el historial para verificar su estado de entrada o salida.
function obtenerUltimoMovimientoVehiculo(historialMovimientos, vehiculo) {
    if (!Array.isArray(historialMovimientos) || !vehiculo) {
        return null;
    }

    const placaVehiculoNormalizada = normalizarTextoAlfanumerico(vehiculo.placa_vehicular);
    const identificadorVehiculoNormalizado = normalizarTextoAlfanumerico(vehiculo.identificador_sistema || vehiculo.identificador_solicitud || vehiculo.identificador);

    // Array.prototype.filter: Discrimina movimientos que coincidan con la placa o identificador del vehículo.
    const movimientosCoincidentes = historialMovimientos.filter(function(movimiento) {
        const placaMovimientoNormalizada = normalizarTextoAlfanumerico(movimiento.placa_vehicular);
        const identificadorMovimientoNormalizado = normalizarTextoAlfanumerico(movimiento.identificador);
        const coincidePlaca = placaMovimientoNormalizada && placaVehiculoNormalizada && placaMovimientoNormalizada !== 'SP' && placaMovimientoNormalizada === placaVehiculoNormalizada;
        const coincideIdentificador = identificadorMovimientoNormalizado && identificadorVehiculoNormalizado && identificadorMovimientoNormalizado === identificadorVehiculoNormalizado;
        return coincidePlaca || coincideIdentificador;
    });

    return movimientosCoincidentes.length > 0 ? movimientosCoincidentes[movimientosCoincidentes.length - 1] : null;
}

// Determina la ubicación física actual de un vehículo (Dentro o Fuera de las instalaciones) contrastando su historial.
function determinarUbicacionVehiculo(vehiculo, historialMovimientos) {
    if (!vehiculo) return "Fuera de las instalaciones";
    const ultimoMovimiento = obtenerUltimoMovimientoVehiculo(historialMovimientos, vehiculo);
    if (ultimoMovimiento) {
        return ultimoMovimiento.tipo_movimiento === "Entrada" 
            ? "Dentro de las instalaciones" 
            : "Fuera de las instalaciones";
    }
    return vehiculo.ubicacion_actual || "Fuera de las instalaciones";
}

// Asigna las funciones utilitarias y de persistencia al objeto global window para su reutilización.
window.obtenerBaseDatos = obtenerBaseDatos;
window.guardarCambios = guardarCambios;
window.reiniciarBaseDatos = reiniciarBaseDatos;
window.exportarBaseDatosJSON = exportarBaseDatosJSON;
window.importarBaseDatosJSON = importarBaseDatosJSON;
window.normalizarTextoAlfanumerico = normalizarTextoAlfanumerico;
window.normalizarCodigoPuntoControl = normalizarCodigoPuntoControl;
window.obtenerFechaHoraActual = obtenerFechaHoraActual;
window.esFechaActualHoy = esFechaActualHoy;
window.generarSiguienteIdentificadorVehicular = generarSiguienteIdentificadorVehicular;
window.generarSiguienteIdentificadorAutorizacion = generarSiguienteIdentificadorAutorizacion;
window.obtenerUltimoMovimientoVehiculo = obtenerUltimoMovimientoVehiculo;
window.determinarUbicacionVehiculo = determinarUbicacionVehiculo;

// Ejecuta el procedimiento de inicialización y verificación de persistencia al cargar el archivo.
inicializarPersistencia();