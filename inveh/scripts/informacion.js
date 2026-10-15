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
            limite_vehiculos_permitidos: 1
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
            ubicacion_actual: "Dentro de las instalaciones",
            fecha_registro: "02/10/2026",
            fecha_actualizacion: "03/10/2026"
        }
    ],
    autorizaciones_visitas: []
};

function inicializarPersistencia() {
    if (!localStorage.getItem('base_de_datos')) {
        localStorage.setItem('base_de_datos', JSON.stringify(BASE_DE_DATOS_INICIAL));
    }
}

function obtenerBaseDatos() {
    const datos = localStorage.getItem('base_de_datos');
    return JSON.parse(datos);
}

function guardarCambios(datosActualizados) {
    localStorage.setItem('base_de_datos', JSON.stringify(datosActualizados));
}



inicializarPersistencia();