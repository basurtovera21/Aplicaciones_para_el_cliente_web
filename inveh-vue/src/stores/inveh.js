// Pinia: Sistema oficial de gestión de estado para Vue 3.
// Centraliza y comparte la información de usuarios, vehículos, visitas y garitas.
import { defineStore } from 'pinia'
import {
  obtenerFechaLocalISO,
  normalizarCodigoPunto,
  compactarEspaciosTexto,
  LIMITES_VEHICULO
} from '../utils/validaciones.js'
import { obtenerRutaCodigoQr, obtenerRutaCodigoQrGuardada } from '../utils/qr.js'

// Claves de almacenamiento local en el navegador
const CLAVE_BASE_DATOS = 'inveh_base_datos'
const CLAVE_SESION_ACTIVA = 'inveh_sesion_activa'

// Control de versión: al cambiar estructuras, incrementa este número para reiniciar los datos del navegador
const VERSION_ESQUEMA_ACTUAL = 11

// Usuarios iniciales del sistema con roles y áreas asignadas
const USUARIOS_INICIALES = [
  {
    identificador_usuario: "1316719804",
    numero_identificacion: "1316719804",
    nombres_apellidos: "Basurto Vera Carlos Eduardo",
    correo_institucional: "e1316719804@live.uleam.edu.ec",
    tipo_usuario: "Estudiante",
    facultad: "Ciencias de la vida y tecnologías",
    carrera: "Software",
    clave_acceso: "1316719804",
    rol_sistema: "usuario_institucional",
    limite_vehiculos_permitidos: 1
  },
  {
    identificador_usuario: "0943700717",
    numero_identificacion: "0943700717",
    nombres_apellidos: "Quinteros Velásquez George Smith",
    correo_institucional: "e0943700717@live.uleam.edu.ec",
    tipo_usuario: "Estudiante",
    facultad: "Ciencias de la vida y tecnologías",
    carrera: "Software",
    clave_acceso: "0943700717",
    rol_sistema: "usuario_institucional",
    limite_vehiculos_permitidos: 2
  },
  {
    identificador_usuario: "1314191535",
    numero_identificacion: "1314191535",
    nombres_apellidos: "Vélez Arcentales Jostin Rusdael",
    correo_institucional: "e1314191535@live.uleam.edu.ec",
    tipo_usuario: "Estudiante",
    facultad: "Ciencias de la vida y tecnologías",
    carrera: "Software",
    clave_acceso: "1314191535",
    rol_sistema: "usuario_institucional",
    limite_vehiculos_permitidos: 2
  },
  {
    identificador_usuario: "1350646400",
    numero_identificacion: "1350646400",
    nombres_apellidos: "Pilligua Saltos Michael Julean",
    correo_institucional: "e1350646400@live.uleam.edu.ec",
    tipo_usuario: "Estudiante",
    facultad: "Ciencias de la vida y tecnologías",
    carrera: "Software",
    clave_acceso: "1350646400",
    rol_sistema: "usuario_institucional",
    limite_vehiculos_permitidos: 2
  },
  {
    identificador_usuario: "administracion",
    correo_institucional: "administracion@uleam.edu.ec",
    clave_acceso: "admin123",
    rol_sistema: "usuario_administrativo",
    tipo_usuario: "Personal administrativo",
    area_asignada: "Administracion"
  },
  {
    identificador_usuario: "puntocontrol01",
    correo_institucional: "puntocontrol01@uleam.edu.ec",
    clave_acceso: "punto01",
    rol_sistema: "personal_operacion",
    tipo_usuario: "Personal de operación",
    area_asignada: "Punto de control N01"
  },
  {
    identificador_usuario: "puntocontrol02",
    correo_institucional: "puntocontrol02@uleam.edu.ec",
    clave_acceso: "punto02",
    rol_sistema: "personal_operacion",
    tipo_usuario: "Personal de operación",
    area_asignada: "Punto de control N02"
  },
  {
    identificador_usuario: "puntocontrol03",
    correo_institucional: "puntocontrol03@uleam.edu.ec",
    clave_acceso: "punto03",
    rol_sistema: "personal_operacion",
    tipo_usuario: "Personal de operación",
    area_asignada: "Punto de control N03"
  },
  {
    identificador_usuario: "puntocontrol04",
    correo_institucional: "puntocontrol04@uleam.edu.ec",
    clave_acceso: "punto04",
    rol_sistema: "personal_operacion",
    tipo_usuario: "Personal de operación",
    area_asignada: "Punto de control N04"
  }
]

// Vehículos base autorizados
const VEHICULOS_INICIALES = [
  {
    identificador: "VEH-000001",
    placa: "KH463S",
    tipo: "Motocicleta",
    fabricante: "Honda",
    modelo: "Navi",
    color: "Negro",
    anio: 2024,
    observaciones: "Sin observaciones",
    codigoQrRuta: obtenerRutaCodigoQr({ identificador: "VEH-000001", placa: "KH463S" }),
    estadoAutorizacion: "Autorizado",
    estadoPresencia: "Fuera de las instalaciones",
    fechaSolicitud: "",
    fechaAprobacion: "",
    fechaActualizacion: "",
    propietario: {
      nombres_apellidos: "Basurto Vera Carlos Eduardo",
      numero_identificacion: "1316719804",
      correo_institucional: "e1316719804@live.uleam.edu.ec",
      tipo_usuario: "Estudiante",
      facultad: "Ciencias de la vida y tecnologías",
      carrera: "Software"
    }
  }
]

// Visitas institucionales base
const VISITAS_INICIALES = [
  {
    identificador: "AUT-000001",
    solicitante: {
      nombres_apellidos: "Basurto Vera Carlos Eduardo",
      numero_identificacion: "1316719804",
      tipo_usuario: "Estudiante",
      facultad: "Ciencias de la vida y tecnologías"
    },
    visitante: {
      nombres_apellidos: "Coello Mendoza Joseph Alexander",
      tipo_identificacion: "Cédula de identidad",
      numero_identificacion: "1316719812",
      telefono: "0991237851"
    },
    vehiculo: {
      placa: "PCN9041",
      tipo: "Automóvil",
      fabricante: "Toyota",
      modelo: "Raize",
      color: "Blanco"
    },
    detalle: {
      fecha: "",
      hora: "",
      motivo: "academica",
      destino: "Facultad de Ciencias de la Vida y Tecnologías - Laboratorio de Software"
    },
    estadoAutorizacion: "Pendiente",
    estadoPresencia: "Fuera de las instalaciones",
    fechaSolicitud: "",
    fechaAprobacion: ""
  }
]

// Historial inicial vacío
const HISTORIAL_INICIAL = []

// Lee datos de localStorage de forma segura
function leerStorage(clave) {
  try {
    const valor = localStorage.getItem(clave)
    return valor ? JSON.parse(valor) : null
  } catch {
    return null
  }
}

// Inicializa las fechas del vehículo con la fecha actual del día
function prepararVehiculoInicial(vehiculo) {
  const hoy = obtenerFechaLocalISO()
  return {
    ...vehiculo,
    fechaSolicitud: hoy,
    fechaAprobacion: vehiculo.estadoAutorizacion === 'Autorizado' ? hoy : '',
    fechaActualizacion: hoy,
    propietario: { ...vehiculo.propietario }
  }
}

// Inicializa las fechas y horas de la visita con la fecha y hora actuales
function prepararVisitaInicial(visita) {
  const ahora = new Date()
  const hoy = obtenerFechaLocalISO(ahora)
  const hora = ahora.toTimeString().slice(0, 5)
  return {
    ...visita,
    fechaSolicitud: hoy,
    fechaAprobacion: visita.estadoAutorizacion === 'Autorizado' ? hoy : '',
    solicitante: { ...visita.solicitante },
    visitante: { ...visita.visitante },
    vehiculo: { ...visita.vehiculo },
    detalle: {
      ...visita.detalle,
      fecha: hoy,
      hora
    }
  }
}

// Genera un código único
function generarSiguienteId(lista, prefijo) {
  let maximo = 0
  for (const item of lista) {
    const num = parseInt(String(item.identificador || '').replace(/\D/g, ''), 10) || 0
    if (num > maximo) maximo = num
  }
  return `${prefijo}-${String(maximo + 1).padStart(6, '0')}`
}

// Normaliza el texto de una placa vehicular en mayúsculas sin espacios
function normalizarPlaca(placa) {
  return String(placa || '').trim().toUpperCase() || 'S/P'
}

// Carga el estado inicial del sistema desde el almacenamiento local
function cargarEstadoInicial() {
  const baseGuardada = leerStorage(CLAVE_BASE_DATOS)

  // Si no hay datos previos o la versión cambió, se generan los datos iniciales limpios
  if (!baseGuardada || baseGuardada.versionEsquema !== VERSION_ESQUEMA_ACTUAL) {
    const usuarios = USUARIOS_INICIALES.map(u => ({ ...u }))
    const vehiculos = VEHICULOS_INICIALES.map(prepararVehiculoInicial)
    const autorizacionesVisitas = VISITAS_INICIALES.map(prepararVisitaInicial)
    const historialMovimientos = []

    localStorage.setItem(CLAVE_BASE_DATOS, JSON.stringify({
      versionEsquema: VERSION_ESQUEMA_ACTUAL,
      usuarios,
      vehiculos,
      autorizaciones_visitas: autorizacionesVisitas,
      historial_movimientos: historialMovimientos
    }))
    localStorage.removeItem(CLAVE_SESION_ACTIVA)

    return {
      usuarios,
      vehiculos,
      autorizacionesVisitas,
      historialMovimientos,
      usuarioActual: null
    }
  }

  // Carga los datos existentes
  const sesion = leerStorage(CLAVE_SESION_ACTIVA)
  return {
    usuarios: baseGuardada.usuarios || USUARIOS_INICIALES.map(u => ({ ...u })),
    vehiculos: baseGuardada.vehiculos || [],
    autorizacionesVisitas: baseGuardada.autorizaciones_visitas || [],
    historialMovimientos: baseGuardada.historial_movimientos || [],
    usuarioActual: sesion || null
  }
}

export const useInvehStore = defineStore('inveh', {
  // Estado reactivo global
  state: () => cargarEstadoInicial(),

  // Propiedades calculadas del estado
  getters: {
    // Comprueba si hay una sesión iniciada
    estaAutenticado: (state) => !!state.usuarioActual,

    // Vehículos autorizados o en trámite pertenecientes al usuario actual
    vehiculosUsuarioActual: (state) => {
      if (!state.usuarioActual || state.usuarioActual.rol_sistema !== 'usuario_institucional') return []
      const cedulaUsuario = String(state.usuarioActual.numero_identificacion || '').trim()
      if (!cedulaUsuario) return []

      return state.vehiculos.filter(v =>
        String(v.propietario?.numero_identificacion || '').trim() === cedulaUsuario
      )
    },

    // Cupo vehicular ocupado por el usuario (máximo 2 permitidos)
    cupoUsadoUsuarioActual() {
      return this.vehiculosUsuarioActual.filter(v => v.estadoAutorizacion !== 'Rechazado').length
    },

    // Solicitudes de vehículos pendientes de revisión
    solicitudesVehiculosPendientes: (state) => {
      return state.vehiculos.filter(v => v.estadoAutorizacion === 'Pendiente')
    },

    // Solicitudes de visitas pendientes de revisión
    solicitudesVisitasPendientes: (state) => {
      return state.autorizacionesVisitas.filter(v => v.estadoAutorizacion === 'Pendiente')
    },

    // Métrica: Total de vehículos institucionales autorizados
    metricasVehiculosAutorizados: (state) => {
      return state.vehiculos.filter(v => v.estadoAutorizacion === 'Autorizado').length
    },

    // Métrica: Vehículos actualmente dentro de las instalaciones
    metricasVehiculosEnInstalaciones: (state) => {
      const institucionales = state.vehiculos.filter(
        v => v.estadoAutorizacion === 'Autorizado' && v.estadoPresencia === 'Dentro de las instalaciones'
      ).length
      const visitas = state.autorizacionesVisitas.filter(
        v => v.estadoPresencia === 'Dentro de las instalaciones'
      ).length
      return institucionales + visitas
    },

    // Métrica: Total de solicitudes pendientes (vehículos + visitas)
    metricasSolicitudesPendientes() {
      return this.solicitudesVehiculosPendientes.length + this.solicitudesVisitasPendientes.length
    },

    // Métrica: Visitas autorizadas programadas para hoy
    metricasVisitasAutorizadasHoy: (state) => {
      const hoy = obtenerFechaLocalISO()
      return state.autorizacionesVisitas.filter(v =>
        v.estadoAutorizacion === 'Autorizado' && v.detalle?.fecha === hoy
      ).length
    },

    // Valida si una placa ya está registrada en vehículos o visitas vigentes
    placaEstaRegistrada: (state) => (placa) => {
      const placaLimpia = String(placa || '').trim().toUpperCase()
      if (!placaLimpia || placaLimpia === 'S/P') return false

      const hoy = obtenerFechaLocalISO()
      const enVehiculos = state.vehiculos.some(v =>
        v.placa?.toUpperCase() === placaLimpia && v.estadoAutorizacion !== 'Rechazado'
      )
      const enVisitas = state.autorizacionesVisitas.some(v => {
        if (v.vehiculo?.placa?.toUpperCase() !== placaLimpia) return false
        if (v.estadoAutorizacion === 'Rechazado') return false
        const dentro = v.estadoPresencia === 'Dentro de las instalaciones'
        const vigente = (v.detalle?.fecha || '') >= hoy
        return dentro || vigente
      })

      return enVehiculos || enVisitas
    },

    // Valida si una cédula ya está registrada en el sistema
    identificacionEstaRegistrada: (state) => (numeroIdentificacion) => {
      const cedula = String(numeroIdentificacion || '').trim()
      if (!cedula) return false

      // Cédula del usuario en sesión
      if (state.usuarioActual && String(state.usuarioActual.numero_identificacion || '').trim() === cedula) {
        return true
      }

      // Cédula en lista de usuarios
      const enUsuarios = state.usuarios.some(u => String(u.numero_identificacion || '').trim() === cedula)
      if (enUsuarios) return true

      // Cédula en propietarios de vehículos
      const enVehiculos = state.vehiculos.some(v =>
        v.estadoAutorizacion !== 'Rechazado' &&
        String(v.propietario?.numero_identificacion || '').trim() === cedula
      )
      if (enVehiculos) return true

      // Cédula en visitantes registrados
      const enVisitas = state.autorizacionesVisitas.some(v =>
        v.estadoAutorizacion !== 'Rechazado' &&
        String(v.visitante?.numero_identificacion || '').trim() === cedula
      )
      return enVisitas
    }
  },

  // Acciones y métodos que modifican el estado
  actions: {
    // Guarda el estado actual en el almacenamiento local del navegador
    guardarEnStorage() {
      const base = {
        versionEsquema: VERSION_ESQUEMA_ACTUAL,
        usuarios: this.usuarios,
        vehiculos: this.vehiculos,
        autorizaciones_visitas: this.autorizacionesVisitas,
        historial_movimientos: this.historialMovimientos
      }
      localStorage.setItem(CLAVE_BASE_DATOS, JSON.stringify(base))

      if (this.usuarioActual) {
        localStorage.setItem(CLAVE_SESION_ACTIVA, JSON.stringify(this.usuarioActual))
      } else {
        localStorage.removeItem(CLAVE_SESION_ACTIVA)
      }
    },

    // Restablece todos los datos del sistema a los valores iniciales limpios
    reiniciarDatosCompletos() {
      this.usuarios = USUARIOS_INICIALES.map(u => ({ ...u }))
      this.vehiculos = VEHICULOS_INICIALES.map(prepararVehiculoInicial)
      this.autorizacionesVisitas = VISITAS_INICIALES.map(prepararVisitaInicial)
      this.historialMovimientos = []
      this.guardarEnStorage()
    },

    // Importa una copia de la base de datos desde un archivo JSON
    importarBaseDatos(datos) {
      if (!datos || typeof datos !== 'object') return

      if (Array.isArray(datos.usuarios)) this.usuarios = datos.usuarios
      if (Array.isArray(datos.vehiculos)) this.vehiculos = datos.vehiculos
      if (Array.isArray(datos.autorizaciones_visitas)) this.autorizacionesVisitas = datos.autorizaciones_visitas
      if (Array.isArray(datos.historial_movimientos)) this.historialMovimientos = datos.historial_movimientos

      this.guardarEnStorage()
    },

    // Asegura que la sesión activa corresponda al rol de la vista
    asegurarRolEnSesion(rol) {
      if (!this.usuarioActual || this.usuarioActual.rol_sistema !== rol) {
        const usuario = this.usuarios.find(u => u.rol_sistema === rol)
        if (usuario) {
          this.usuarioActual = { ...usuario }
          this.guardarEnStorage()
        }
      }
    },

    // Autentica al usuario mediante su identificador/correo y contraseña exacta
    iniciarSesion(identificador, clave) {
      const usuarioIngresado = String(identificador || '').trim().toLowerCase()
      const claveIngresada = String(clave || '').trim()

      const usuarioEncontrado = this.usuarios.find(u => {
        const coincideUsuario = (u.identificador_usuario || '').toLowerCase() === usuarioIngresado
        const coincideCorreo = (u.correo_institucional || '').toLowerCase() === usuarioIngresado
        const coincideCedula = String(u.numero_identificacion || '').trim() === usuarioIngresado
        const coincideClave = u.clave_acceso === claveIngresada

        return (coincideUsuario || coincideCorreo || coincideCedula) && coincideClave
      })

      if (usuarioEncontrado) {
        this.usuarioActual = { ...usuarioEncontrado }
        this.guardarEnStorage()
        return { exito: true, usuario: this.usuarioActual }
      }

      return { exito: false, mensaje: "Credenciales de acceso incorrectas" }
    },

    // Cierra la sesión activa
    cerrarSesion() {
      this.usuarioActual = null
      this.guardarEnStorage()
    },

    // Retorna las notificaciones pendientes de aprobación o rechazo para el usuario en sesión
    obtenerNotificacionesPendientesUsuario() {
      if (!this.usuarioActual) return []
      const cedula = String(this.usuarioActual.numero_identificacion || '').trim()
      if (!cedula) return []

      const notificaciones = []

      // 1. Notificación de vehículo rechazado
      for (const v of this.vehiculos) {
        if (String(v.propietario?.numero_identificacion || '').trim() === cedula && v.notificacionPendiente === 'rechazado') {
          notificaciones.push({
            tipoOrigen: 'vehiculo',
            identificador: v.identificador,
            tipoModal: 'advertencia',
            titulo: 'Solicitud de registro vehicular no aprobada',
            mensaje: `Le informamos que la solicitud de registro para el vehículo con placa '${v.placa || ''}' ha sido rechazada por el área administrativa tras la revisión correspondiente`
          })
        }
      }

      // 2. Notificación de visita aprobada o rechazada
      for (const visita of this.autorizacionesVisitas) {
        if (String(visita.solicitante?.numero_identificacion || '').trim() === cedula && visita.notificacionPendiente) {
          const visitante = visita.visitante?.nombres_apellidos || 'Visitante'
          const placa = visita.vehiculo?.placa || ''
          const fecha = (visita.detalle?.fecha || '').split('-').reverse().join('/')

          if (visita.notificacionPendiente === 'rechazado') {
            notificaciones.push({
              tipoOrigen: 'visita',
              identificador: visita.identificador,
              tipoModal: 'advertencia',
              titulo: 'Autorización de acceso no aprobada',
              mensaje: `La solicitud de acceso vehicular para el visitante '${visitante}' con placa '${placa}' programada para el ${fecha} ha sido rechazada por la administración. El vehículo no cuenta con autorización de ingreso a la institución`
            })
          } else if (visita.notificacionPendiente === 'aprobado') {
            notificaciones.push({
              tipoOrigen: 'visita',
              identificador: visita.identificador,
              tipoModal: 'confirmacion',
              titulo: 'Autorización de acceso aprobada',
              mensaje: `La solicitud de acceso vehicular para el visitante '${visitante}' con placa '${placa}' programada para el ${fecha} ha sido aceptada por la administración. El vehículo cuenta con autorización de ingreso a la institución`
            })
          }
        }
      }

      return notificaciones
    },

    // Marca una notificación como atendida para no volver a mostrarla
    marcarNotificacionLeida(tipo, identificador) {
      if (tipo === 'vehiculo') {
        const v = this.vehiculos.find(item => item.identificador === identificador)
        if (v) v.notificacionPendiente = null
      } else if (tipo === 'visita') {
        const vis = this.autorizacionesVisitas.find(item => item.identificador === identificador)
        if (vis) vis.notificacionPendiente = null
      }
      this.guardarEnStorage()
    },

    // Registra una nueva solicitud de vehículo por parte del usuario institucional
    solicitarRegistroVehiculo(datos) {
      const hoy = obtenerFechaLocalISO()
      const nuevoVehiculo = {
        identificador: generarSiguienteId(this.vehiculos, 'VEH'),
        placa: normalizarPlaca(datos.placa),
        tipo: datos.tipo,
        fabricante: compactarEspaciosTexto(datos.fabricante),
        modelo: compactarEspaciosTexto(datos.modelo),
        color: compactarEspaciosTexto(datos.color),
        anio: String(datos.anio || '').trim(),
        observaciones: compactarEspaciosTexto(datos.observaciones).slice(0, LIMITES_VEHICULO.longitudMaximaObservaciones) || 'Sin observaciones',
        codigoQrRuta: '',
        estadoAutorizacion: 'Pendiente',
        estadoPresencia: 'Fuera de las instalaciones',
        fechaSolicitud: hoy,
        fechaAprobacion: '',
        fechaActualizacion: hoy,
        propietario: {
          nombres_apellidos: this.usuarioActual?.nombres_apellidos || '',
          numero_identificacion: this.usuarioActual?.numero_identificacion || '',
          correo_institucional: this.usuarioActual?.correo_institucional || '',
          tipo_usuario: this.usuarioActual?.tipo_usuario || '',
          facultad: this.usuarioActual?.facultad || '',
          carrera: this.usuarioActual?.carrera || ''
        }
      }

      this.vehiculos.push(nuevoVehiculo)
      this.guardarEnStorage()
      return nuevoVehiculo
    },

    // Registra una solicitud de visita anticipada por parte del usuario institucional
    solicitarAutorizacionVisita(datos) {
      const hoy = obtenerFechaLocalISO()
      const nuevaVisita = {
        identificador: generarSiguienteId(this.autorizacionesVisitas, 'AUT'),
        solicitante: {
          nombres_apellidos: this.usuarioActual?.nombres_apellidos || '',
          numero_identificacion: this.usuarioActual?.numero_identificacion || '',
          tipo_usuario: this.usuarioActual?.tipo_usuario || '',
          facultad: this.usuarioActual?.facultad || ''
        },
        visitante: {
          nombres_apellidos: compactarEspaciosTexto(datos.nombres),
          tipo_identificacion: datos.tipoIdentificacion || '',
          numero_identificacion: String(datos.numeroIdentificacion || '').trim(),
          telefono: String(datos.telefono || '').trim()
        },
        vehiculo: {
          placa: normalizarPlaca(datos.placa),
          tipo: datos.tipoVehiculo || '',
          fabricante: compactarEspaciosTexto(datos.fabricante),
          modelo: compactarEspaciosTexto(datos.modelo),
          color: compactarEspaciosTexto(datos.color)
        },
        detalle: {
          fecha: datos.fecha,
          hora: datos.hora,
          motivo: datos.motivo || '',
          destino: compactarEspaciosTexto(datos.destino)
        },
        estadoAutorizacion: 'Pendiente',
        estadoPresencia: 'Fuera de las instalaciones',
        fechaSolicitud: hoy,
        fechaAprobacion: '',
        codigoQrRuta: ''
      }

      this.autorizacionesVisitas.push(nuevaVisita)
      this.guardarEnStorage()
      return nuevaVisita
    },

    // Aprueba una solicitud de registro vehicular
    aprobarVehiculo(identificador) {
      const v = this.vehiculos.find(item => item.identificador === identificador)
      if (v) {
        const hoy = obtenerFechaLocalISO()
        v.estadoAutorizacion = 'Autorizado'
        v.fechaAprobacion = hoy
        v.fechaActualizacion = hoy
        v.codigoQrRuta = obtenerRutaCodigoQr(v)
        this.guardarEnStorage()
      }
    },

    // Rechaza una solicitud de registro vehicular
    rechazarVehiculo(identificador) {
      const v = this.vehiculos.find(item => item.identificador === identificador)
      if (v) {
        v.estadoAutorizacion = 'Rechazado'
        v.fechaActualizacion = obtenerFechaLocalISO()
        v.notificacionPendiente = 'rechazado'
        this.guardarEnStorage()
      }
    },

    // Aprueba una solicitud de visita
    aprobarVisita(identificador) {
      const visita = this.autorizacionesVisitas.find(item => item.identificador === identificador)
      if (visita) {
        visita.estadoAutorizacion = 'Autorizado'
        visita.fechaAprobacion = obtenerFechaLocalISO()
        visita.notificacionPendiente = 'aprobado'
        this.guardarEnStorage()
      }
    },

    // Rechaza una solicitud de visita
    rechazarVisita(identificador) {
      const visita = this.autorizacionesVisitas.find(item => item.identificador === identificador)
      if (visita) {
        visita.estadoAutorizacion = 'Rechazado'
        visita.notificacionPendiente = 'rechazado'
        this.guardarEnStorage()
      }
    },

    // Modifica los datos editables de un vehículo desde el panel de administración
    modificarVehiculo(identificador, { color, estadoAutorizacion, observaciones }) {
      const v = this.vehiculos.find(item => item.identificador === identificador)
      if (v) {
        if (color) v.color = color.trim()
        if (estadoAutorizacion) v.estadoAutorizacion = estadoAutorizacion
        if (observaciones !== undefined) v.observaciones = observaciones.trim() || 'Sin observaciones'
        if (v.estadoAutorizacion === 'Autorizado' && !obtenerRutaCodigoQrGuardada(v)) {
          v.codigoQrRuta = obtenerRutaCodigoQr(v)
        }
        v.fechaActualizacion = obtenerFechaLocalISO()
        this.guardarEnStorage()
      }
    },

    // Desvincula un vehículo de la cuenta del usuario institucional
    desvincularVehiculo(identificador) {
      this.vehiculos = this.vehiculos.filter(v => v.identificador !== identificador)
      this.guardarEnStorage()
    },

    // Registra un movimiento (Entrada o Salida) en el punto de control
    registrarMovimientoGarita({ identificadorOPlaca, tipoMovimiento, puntoControl = 'N01' }) {
      const termino = String(identificadorOPlaca || '').trim().toUpperCase()

      // Busca primero en vehículos institucionales autorizados
      const vehiculoInst = this.vehiculos.find(v =>
        (v.identificador.toUpperCase() === termino || v.placa.toUpperCase() === termino) &&
        v.estadoAutorizacion === 'Autorizado'
      )

      // Si no es institucional, busca en visitas autorizadas
      const visita = vehiculoInst ? null : this.autorizacionesVisitas.find(v =>
        (v.identificador.toUpperCase() === termino || v.vehiculo?.placa?.toUpperCase() === termino) &&
        v.estadoAutorizacion === 'Autorizado'
      )

      const objetivo = vehiculoInst || visita
      if (!objetivo) {
        return { exito: false, mensaje: 'Vehículo no encontrado o sin autorización activa' }
      }

      // Actualiza la presencia
      objetivo.estadoPresencia = tipoMovimiento === 'Entrada'
        ? 'Dentro de las instalaciones'
        : 'Fuera de las instalaciones'

      const ahora = new Date()
      const registroMovimiento = {
        id: Date.now(),
        fecha: obtenerFechaLocalISO(ahora),
        hora: ahora.toTimeString().slice(0, 5),
        identificador: objetivo.identificador,
        placa: vehiculoInst ? vehiculoInst.placa : visita.vehiculo.placa,
        tipoVehiculo: vehiculoInst ? vehiculoInst.tipo : visita.vehiculo.tipo,
        propietario: vehiculoInst ? (vehiculoInst.propietario?.nombres_apellidos || 'Institucional') : (visita.visitante?.nombres_apellidos || 'Visitante'),
        tipoUsuario: vehiculoInst ? (vehiculoInst.propietario?.tipo_usuario || 'Institucional') : 'Visitante',
        tipoMovimiento,
        puntoControl: normalizarCodigoPunto(puntoControl) || 'N01'
      }

      this.historialMovimientos.unshift(registroMovimiento)

      // Las visitas temporales se eliminan del sistema al registrar su salida
      let eliminado = false
      if (visita && tipoMovimiento === 'Salida') {
        this.autorizacionesVisitas = this.autorizacionesVisitas.filter(v => v.identificador !== visita.identificador)
        eliminado = true
      }

      this.guardarEnStorage()
      return { exito: true, registro: registroMovimiento, vehiculo: objetivo, eliminado }
    },

    // Crea una autorización temporal directa en garita con entrada inmediata
    crearAutorizacionTemporalGarita(datos, puntoControl = 'N01') {
      const ahora = new Date()
      const hoy = obtenerFechaLocalISO(ahora)
      const hora = ahora.toTimeString().slice(0, 5)

      const nuevaVisita = {
        identificador: generarSiguienteId(this.autorizacionesVisitas, 'AUT'),
        solicitante: {
          nombres_apellidos: '',
          numero_identificacion: '',
          tipo_usuario: '',
          facultad: ''
        },
        visitante: {
          nombres_apellidos: compactarEspaciosTexto(datos.nombres),
          tipo_identificacion: datos.tipoIdentificacion || '',
          numero_identificacion: String(datos.numeroIdentificacion || '').trim(),
          telefono: String(datos.telefono || '').trim()
        },
        vehiculo: {
          placa: normalizarPlaca(datos.placa),
          tipo: datos.tipoVehiculo || '',
          fabricante: compactarEspaciosTexto(datos.fabricante),
          modelo: compactarEspaciosTexto(datos.modelo),
          color: compactarEspaciosTexto(datos.color)
        },
        detalle: {
          fecha: hoy,
          hora,
          motivo: datos.motivo || '',
          destino: compactarEspaciosTexto(datos.destino)
        },
        estadoAutorizacion: 'Autorizado',
        estadoPresencia: 'Dentro de las instalaciones',
        fechaSolicitud: hoy,
        fechaAprobacion: hoy,
        codigoQrRuta: ''
      }

      this.autorizacionesVisitas.push(nuevaVisita)

      // Movimiento de entrada generado automáticamente en el acto
      const registroMovimiento = {
        id: Date.now(),
        fecha: hoy,
        hora,
        identificador: nuevaVisita.identificador,
        placa: nuevaVisita.vehiculo.placa,
        tipoVehiculo: nuevaVisita.vehiculo.tipo,
        propietario: nuevaVisita.visitante.nombres_apellidos || 'Visitante',
        tipoUsuario: 'Visitante',
        tipoMovimiento: 'Entrada',
        puntoControl: normalizarCodigoPunto(puntoControl) || 'N01'
      }

      this.historialMovimientos.unshift(registroMovimiento)
      this.guardarEnStorage()

      return nuevaVisita
    }
  }
})