const BASE_DE_DATOS_INICIAL = {
    usuarios: [
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

        //Administrador
        {
            nombres_apellidos: "Administrador",
            identificador_usuario: "admin",
            clave_acceso: "admin123",
            tipo_usuario: "Personal administrativo",
            rol_sistema: "admin"   
        },

        //Puntos de control
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
    vehiculos: [
        {
            propietario_id: "1316719804",
            placa_vehicular: "KH463S",
            identificador_sistema: "VEH-000639",
            tipo_vehiculo: "Motocicleta",
            fabricante: "Honda",
            modelo: "Navi",
            anio_fabricacion: "2024",
            color: "Negro",
            observaciones: "Sin observaciones",
            codigo_qr_ruta: "recursos/imagenes/codigo-qr.png",
            estado_autorizacion: "Autorizado",
            ubicacion_actual: "Fuera de las instalaciones",
            fecha_registro: "02/10/2026",
            fecha_actualizacion: "03/10/2026"
        }
    ],
    autorizaciones_visitas: [],
    historial_movimientos: []
};

function inicializarPersistencia() {
    const datosGuardados = localStorage.getItem('base_de_datos') || localStorage.getItem('inveh_db');
    if (!datosGuardados) {
        guardarCambios(BASE_DE_DATOS_INICIAL);
        return;
    }

    // Sincronizar cuentas iniciales que falten en la base existente y asegurar estado del vehículo inicial
    try {
        const db = JSON.parse(datosGuardados);
        let cambios = false;

        // 1. Sincronizar cuentas de usuarios y puntos de control faltantes
        BASE_DE_DATOS_INICIAL.usuarios.forEach(uIni => {
            const idx = (db.usuarios || []).findIndex(u => 
                (uIni.identificador_usuario && u.identificador_usuario === uIni.identificador_usuario) ||
                (uIni.numero_identificacion && u.numero_identificacion === uIni.numero_identificacion)
            );
            if (idx === -1) {
                if (!Array.isArray(db.usuarios)) db.usuarios = [];
                db.usuarios.push(uIni);
                cambios = true;
            } else {
                // Actualizar credenciales y datos si cambiaron en la configuración inicial
                Object.assign(db.usuarios[idx], uIni);
                cambios = true;
            }
        });

        // 2. Asegurar que el vehículo inicial VEH-000639 inicie fuera de las instalaciones
        if (Array.isArray(db.vehiculos)) {
            const vehiculoInicial = db.vehiculos.find(v => v.identificador_sistema === "VEH-000639");
            if (vehiculoInicial && vehiculoInicial.ubicacion_actual !== "Fuera de las instalaciones") {
                vehiculoInicial.ubicacion_actual = "Fuera de las instalaciones";
                cambios = true;
            }
        }

        if (cambios) {
            guardarCambios(db);
        }
    } catch (e) {}
}

function obtenerBaseDatos() {
    const datos = localStorage.getItem('base_de_datos') || localStorage.getItem('inveh_db');
    return datos ? JSON.parse(datos) : BASE_DE_DATOS_INICIAL;
}

function guardarCambios(datosActualizados) {
    localStorage.setItem('base_de_datos', JSON.stringify(datosActualizados));
    localStorage.setItem('inveh_db', JSON.stringify(datosActualizados));
}


function reiniciarBaseDatos() {
    localStorage.removeItem('base_de_datos');
    localStorage.removeItem('inveh_db');
    localStorage.removeItem('sesion_activa');

    guardarCambios(BASE_DE_DATOS_INICIAL);
    location.reload();
}
window.reiniciarBaseDatos = reiniciarBaseDatos;

inicializarPersistencia();


function exportarBaseDatosJSON() {
    const datos = obtenerBaseDatos();
    const textoJSON = JSON.stringify(datos, null, 2);

    const bloqueDatos = new Blob([textoJSON], { type: 'application/json' });
    const urlDescarga = URL.createObjectURL(bloqueDatos);

    const enlace = document.createElement('a');
    enlace.href = urlDescarga;
    enlace.download = 'inveh_base_datos.json';
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

    URL.revokeObjectURL(urlDescarga);
}

/**
 * @param {File} archivo - Archivo seleccionado mediante input tipo file
 */
function importarBaseDatosJSON(archivo) {
    if (!archivo) return;

    const lector = new FileReader();

    lector.onload = function(evento) {
        const contenido = (evento.target.result || '').trim();

        // Si el archivo está vacío o en blanco, reinicia de inmediato a los registros iniciales limpios
        if (!contenido || contenido === '{}' || contenido === '[]') {
            reiniciarBaseDatos();
            return;
        }

        try {
            const datosImportados = JSON.parse(contenido);

            // Si contiene la estructura requerida, guarda y recarga silenciosamente
            if (datosImportados && (Array.isArray(datosImportados.usuarios) || Array.isArray(datosImportados.vehiculos))) {
                if (!Array.isArray(datosImportados.usuarios)) datosImportados.usuarios = [];
                if (!Array.isArray(datosImportados.vehiculos)) datosImportados.vehiculos = [];
                if (!Array.isArray(datosImportados.autorizaciones_visitas)) datosImportados.autorizaciones_visitas = [];
                if (!Array.isArray(datosImportados.historial_movimientos)) datosImportados.historial_movimientos = [];

                guardarCambios(datosImportados);
                location.reload();
            }
        } catch (error) {
            // Sin alertas en caso de archivo no válido
        }
    };

    lector.readAsText(archivo);
}