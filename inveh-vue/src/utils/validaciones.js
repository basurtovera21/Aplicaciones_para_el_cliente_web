// Utilidades de validación para INVEH

import { MOTIVOS_VISITA } from './catalogos.js'

// Valida la autenticidad matemática de una cédula de identidad ecuatoriana mediante el algoritmo Módulo 10.
// @param {string} cadenaCedula
// @returns {boolean}
export function validarCedulaEcuatoriana(cadenaCedula) {
  if (!cadenaCedula) return false
  const cedulaLimpia = String(cadenaCedula).trim()
  if (cedulaLimpia.length !== 10 || !/^\d+$/.test(cedulaLimpia)) {
    return false
  }

  const codigoProvincia = parseInt(cedulaLimpia.substring(0, 2), 10)
  if (codigoProvincia < 1 || codigoProvincia > 24) {
    return false
  }

  const ultimoDigitoRecibido = parseInt(cedulaLimpia.substring(9, 10), 10)
  let sumaAcumulada = 0

  for (let indice = 0; indice < 9; indice++) {
    const multiplicador = (indice % 2 === 0) ? 2 : 1
    let resultadoMultiplicacion = parseInt(cedulaLimpia[indice], 10) * multiplicador
    if (resultadoMultiplicacion > 9) {
      resultadoMultiplicacion -= 9
    }
    sumaAcumulada += resultadoMultiplicacion
  }

  const digitoVerificadorEsperado = (sumaAcumulada % 10 === 0) ? 0 : 10 - (sumaAcumulada % 10)
  return digitoVerificadorEsperado === ultimoDigitoRecibido
}

// Determina si el tipo de identificación corresponde a cédula ecuatoriana
// (permite texto completo como "Cédula de identidad" o identificadores como "cedula", insensible a mayúsculas y tildes).
// @param {string} tipo
// @returns {boolean}
export function esTipoCedula(tipo) {
  const t = String(tipo || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return t.includes('cedula')
}

const CODIGOS_PROVINCIA_ECUADOR = 'ABUCHXOEWGILRMVNQSPYJKTZ'
const EXPRESION_PLACA_MOTO = new RegExp(`^[${CODIGOS_PROVINCIA_ECUADOR}][A-Z]\\d{3}[A-Z]$`)
const EXPRESION_PLACA_VEHICULO = new RegExp(`^[${CODIGOS_PROVINCIA_ECUADOR}][A-Z]{2}\\d{3,4}$`)
const EXPRESION_PLACA_GENERAL = new RegExp(`^[${CODIGOS_PROVINCIA_ECUADOR}][A-Z]{1,2}\\d{3,4}[A-Z]?$`)

const EXPRESION_NOMBRE_PERSONA = /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ]{2,}(?:\s+[A-Za-zÁÉÍÓÚáéíóúÜüÑñ]{2,})+$/
const EXPRESION_TELEFONO_ECUADOR = /^09\d{8}$/

export const LIMITES_VEHICULO = {
  anioMinimo: 1950,
  longitudMaximaPlacaAuto: 7,
  longitudMaximaPlacaMoto: 6,
  longitudMaximaPlacaOtro: 12,
  longitudMaximaFabricante: 40,
  longitudMaximaModelo: 50,
  longitudMaximaColor: 30,
  longitudMaximaObservaciones: 250
}

const REGLAS_DETALLE_VEHICULO = {
  fabricante: {
    caracteresProhibidos: /[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s&.-]/g,
    longitudMaxima: LIMITES_VEHICULO.longitudMaximaFabricante,
    patron: /^(?=(?:.*[A-Za-zÁÉÍÓÚáéíóúÜüÑñ]){2})[A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s&.-]{2,40}$/
  },
  modelo: {
    caracteresProhibidos: /[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ0-9\s./-]/g,
    longitudMaxima: LIMITES_VEHICULO.longitudMaximaModelo,
    patron: /^(?=.*[A-Za-zÁÉÍÓÚáéíóúÜüÑñ0-9])[A-Za-zÁÉÍÓÚáéíóúÜüÑñ0-9\s./-]{2,50}$/
  },
  color: {
    caracteresProhibidos: /[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s/-]/g,
    longitudMaxima: LIMITES_VEHICULO.longitudMaximaColor,
    patron: /^(?=(?:.*[A-Za-zÁÉÍÓÚáéíóúÜüÑñ]){2})[A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s/-]{2,30}$/
  }
}

// Elimina espacios repetidos y los espacios al inicio y al final de una cadena.
// @param {string} valor
// @returns {string}
export function compactarEspaciosTexto(valor) {
  return String(valor || '').replace(/\s+/g, ' ').trim()
}

// Valida formato estándar de placas vehiculares ecuatorianas.
// @param {string} placa
// @param {string} [tipoVehiculo]
// @returns {boolean}
export function validarPlacaEcuatoriana(placa, tipoVehiculo = '') {
  if (tipoVehiculo === 'Otro') return true
  if (!placa) return false
  const placaLimpia = String(placa).trim().toUpperCase()

  if (tipoVehiculo === 'Motocicleta') {
    return EXPRESION_PLACA_MOTO.test(placaLimpia)
  }
  if (tipoVehiculo) {
    return EXPRESION_PLACA_VEHICULO.test(placaLimpia)
  }
  // Validación general (auto ej. PCN9041 / ABC123 o moto ej. KH463S)
  return EXPRESION_PLACA_GENERAL.test(placaLimpia)
}

export const MENSAJES_VALIDACION = {
  obligatorio: 'El registro es obligatorio',
  formatoInvalido: 'El registro tiene un formato no válido',
  registroInvalido: 'El registro no es válido'
}

// Restablece a cadena vacía todas las propiedades de un objeto reactivo
// @param {Record<string, string>} objeto
export function limpiarCampos(objeto) {
  Object.keys(objeto).forEach(clave => {
    objeto[clave] = ''
  })
}

// Indica si existe al menos un mensaje de error activo
// @param {Record<string, string>} errores
// @returns {boolean}
export function tieneErrores(errores) {
  return Object.values(errores).some(Boolean)
}

// Normaliza un campo de placa en mayúsculas sin caracteres especiales y valida
// en tiempo real si el vehículo ya se encuentra registrado en el sistema.
// @param {Record<string, any>} formulario
// @param {Record<string, string>} [errores]
// @param {string} [campo='placa']
// @param {number} [longitudMaxima=0]
// @param {(placa: string) => boolean} [placaEstaRegistrada]
export function normalizarPlacaCampo(formulario, errores, campo = 'placa', longitudMaxima = 0, placaEstaRegistrada = null) {
  let placaNormalizada = String(formulario[campo] || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (longitudMaxima > 0) {
    placaNormalizada = placaNormalizada.slice(0, longitudMaxima)
  }
  formulario[campo] = placaNormalizada

  if (!errores) return

  // Validación en tiempo real al ingresar la placa
  if (!placaNormalizada) {
    errores[campo] = ''
    return
  }

  // Si ya alcanza una longitud representativa (mínimo 6 caracteres) y está registrada, notifica de inmediato
  if (placaEstaRegistrada && placaNormalizada.length >= 6) {
    if (placaEstaRegistrada(placaNormalizada)) {
      errores[campo] = 'El vehículo se encuentra registrado'
      return
    }
  }

  errores[campo] = ''
}

// Normaliza el número de documento en tiempo real y valida inmediatamente
// si la cédula o identificación ya pertenece a un usuario o visitante registrado.
// @param {Record<string, any>} formulario
// @param {Record<string, string>} errores
// @param {(identificacion: string) => boolean} [identificacionEstaRegistrada]
// @param {string} [campoDoc='numeroIdentificacion']
// @param {string} [campoTipo='tipoIdentificacion']
export function normalizarDocumentoCampo(
  formulario,
  errores,
  identificacionEstaRegistrada = null,
  campoDoc = 'numeroIdentificacion',
  campoTipo = 'tipoIdentificacion'
) {
  const tipo = formulario[campoTipo] || ''
  const esCedula = esTipoCedula(tipo)
  let valor = String(formulario[campoDoc] || '')

  if (esCedula) {
    valor = valor.replace(/\D/g, '').slice(0, 10)
  } else {
    valor = valor.replace(/[^A-Za-z0-9-]/g, '').slice(0, 20)
  }
  formulario[campoDoc] = valor

  if (!errores) return

  if (!valor) {
    errores[campoDoc] = ''
    return
  }

  // Validación inmediata al escribir la identificación:
  // Si ya pertenece a un usuario institucional, propietario o visitante registrado, se alerta de inmediato
  if (identificacionEstaRegistrada && identificacionEstaRegistrada(valor)) {
    errores[campoDoc] = 'El usuario se encuentra registrado'
    return
  }

  // Si es cédula y completó los 10 dígitos, valida la regla matemática Módulo 10 ecuatoriana
  if (esCedula && valor.length === 10) {
    if (!validarCedulaEcuatoriana(valor)) {
      errores[campoDoc] = MENSAJES_VALIDACION.formatoInvalido
      return
    }
  }

  errores[campoDoc] = ''
}

// Filtra caracteres permitidos y limita la longitud de un campo de detalle vehicular.
// @param {Record<string, any>} formulario
// @param {Record<string, string>} errores
// @param {'fabricante'|'modelo'|'color'} nombreCampo
export function normalizarDetalleVehiculo(formulario, errores, nombreCampo) {
  const regla = REGLAS_DETALLE_VEHICULO[nombreCampo]
  let valorFiltrado = String(formulario[nombreCampo] || '')
  if (regla) {
    valorFiltrado = valorFiltrado
      .replace(regla.caracteresProhibidos, '')
      .slice(0, regla.longitudMaxima)
  }
  formulario[nombreCampo] = valorFiltrado
  if (errores) errores[nombreCampo] = ''
}

// Restringe el campo de año de fabricación a un máximo de 4 dígitos enteros.
// @param {Record<string, any>} formulario
// @param {Record<string, string>} [errores]
// @param {string} [nombreCampo='anio']
export function normalizarAnioVehiculo(formulario, errores, nombreCampo = 'anio') {
  formulario[nombreCampo] = String(formulario[nombreCampo] ?? '')
    .replace(/\D/g, '')
    .slice(0, 4)
  if (errores) errores[nombreCampo] = ''
}

// Valida nombres y apellidos de una persona (mínimo dos palabras alfabéticas).
// @param {string} valor
// @returns {string}
export function obtenerErrorNombres(valor) {
  const textoLimpio = compactarEspaciosTexto(valor)
  if (!textoLimpio) return MENSAJES_VALIDACION.obligatorio
  if (!EXPRESION_NOMBRE_PERSONA.test(textoLimpio)) {
    return MENSAJES_VALIDACION.formatoInvalido
  }
  return ''
}

// Valida número de teléfono celular obligatorio con formato de Ecuador (10 dígitos iniciando con 09).
// @param {string} valor
// @returns {string}
export function obtenerErrorTelefono(valor) {
  const textoLimpio = String(valor || '').trim()
  if (!textoLimpio) return MENSAJES_VALIDACION.obligatorio
  if (!EXPRESION_TELEFONO_ECUADOR.test(textoLimpio)) {
    return MENSAJES_VALIDACION.formatoInvalido
  }
  return ''
}

// Normaliza número de teléfono permitiendo solo dígitos numéricos (máximo 10).
// @param {Record<string, any>} formulario
// @param {Record<string, string>} [errores]
// @param {string} [campo='telefono']
export function normalizarTelefono(formulario, errores, campo = 'telefono') {
  formulario[campo] = String(formulario[campo] || '')
    .replace(/\D/g, '')
    .slice(0, 10)
  if (errores) errores[campo] = ''
}

// Normaliza nombres de personas permitiendo únicamente letras y espacios (máximo 80).
// @param {Record<string, any>} formulario
// @param {Record<string, string>} [errores]
// @param {string} [campo='nombres']
export function normalizarNombrePersona(formulario, errores, campo = 'nombres') {
  formulario[campo] = String(formulario[campo] || '')
    .replace(/[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]/g, '')
    .slice(0, 80)
  if (errores) errores[campo] = ''
}

// Valida fecha de visita: obligatoria, no pasada y no más de diasMaximos hacia el futuro.
// @param {string} fecha
// @param {number} [diasMaximos=30]
// @returns {string}
export function obtenerErrorFechaVisita(fecha, diasMaximos = 30) {
  const textoFecha = String(fecha || '').trim()
  if (!textoFecha) return MENSAJES_VALIDACION.obligatorio

  const hoyISO = obtenerFechaLocalISO()
  if (textoFecha < hoyISO) {
    return MENSAJES_VALIDACION.registroInvalido
  }

  const fechaLimite = new Date()
  fechaLimite.setDate(fechaLimite.getDate() + diasMaximos)
  const maxISO = obtenerFechaLocalISO(fechaLimite)
  if (textoFecha > maxISO) {
    return MENSAJES_VALIDACION.registroInvalido
  }

  return ''
}

// Valida hora de visita: obligatoria, dentro del horario 7AM - 7PM, y si la fecha es hoy, que no sea hora pasada.
// @param {string} hora
// @param {string} fecha
// @returns {string}
export function obtenerErrorHoraVisita(hora, fecha) {
  const textoHora = String(hora || '').trim()
  if (!textoHora) return MENSAJES_VALIDACION.obligatorio

  const [horaNum, minNum] = textoHora.split(':').map(Number)
  if (isNaN(horaNum) || isNaN(minNum)) {
    return MENSAJES_VALIDACION.formatoInvalido
  }

  if (horaNum < 7 || horaNum >= 19) {
    return MENSAJES_VALIDACION.registroInvalido
  }

  const hoyISO = obtenerFechaLocalISO()
  if (fecha === hoyISO) {
    const ahora = new Date()
    const esHoraPasada = horaNum < ahora.getHours() || (horaNum === ahora.getHours() && minNum < ahora.getMinutes())
    if (esHoraPasada) {
      return MENSAJES_VALIDACION.registroInvalido
    }
  }

  return ''
}

// Valida un campo de texto obligatorio y opcionalmente su longitud mínima
// @param {string} valor
// @param {number} [longitudMinima=0]
// @returns {string}
export function obtenerErrorTexto(valor, longitudMinima = 0) {
  const textoLimpio = String(valor || '').trim()
  if (!textoLimpio) return MENSAJES_VALIDACION.obligatorio
  if (longitudMinima > 0 && textoLimpio.length < longitudMinima) {
    return MENSAJES_VALIDACION.formatoInvalido
  }
  return ''
}

// Valida número de identificación según el tipo elegido y comprueba si ya está registrado
// @param {string} tipoIdentificacion
// @param {string} numeroIdentificacion
// @param {(identificacion: string) => boolean} [identificacionEstaRegistrada]
// @param {string} [mensajeDuplicada='El usuario se encuentra registrado']
// @returns {string}
export function obtenerErrorDocumento(
  tipoIdentificacion,
  numeroIdentificacion,
  identificacionEstaRegistrada = null,
  mensajeDuplicada = 'El usuario se encuentra registrado'
) {
  const numDoc = String(numeroIdentificacion || '').trim()
  if (!numDoc) return MENSAJES_VALIDACION.obligatorio

  // Verificación prioritaria de duplicidad
  if (identificacionEstaRegistrada?.(numDoc)) {
    return mensajeDuplicada
  }

  const esCedula = esTipoCedula(tipoIdentificacion)
  if (esCedula && !validarCedulaEcuatoriana(numDoc)) {
    return MENSAJES_VALIDACION.formatoInvalido
  }

  if (!esCedula && tipoIdentificacion) {
    if (numDoc.length < 5 || numDoc.length > 20 || !/^[A-Za-z0-9-]+$/.test(numDoc)) {
      return MENSAJES_VALIDACION.formatoInvalido
    }
  }

  return ''
}

// Valida la placa vehicular según el tipo y comprueba que no esté ya registrada
// @param {string} placa
// @param {string} tipoVehiculo
// @param {(placa: string) => boolean} placaEstaRegistrada
// @param {string} [mensajeDuplicada='El vehículo se encuentra registrado']
// @returns {string}
export function obtenerErrorPlacaRegistro(
  placa,
  tipoVehiculo,
  placaEstaRegistrada,
  mensajeDuplicada = 'El vehículo se encuentra registrado'
) {
  const placaLimpia = String(placa || '').trim().toUpperCase()

  if (tipoVehiculo === 'Otro') {
    if (!placaLimpia) return ''
    if (placaEstaRegistrada?.(placaLimpia)) {
      return mensajeDuplicada
    }
    return ''
  }

  if (!placaLimpia) return MENSAJES_VALIDACION.obligatorio
  if (!validarPlacaEcuatoriana(placaLimpia, tipoVehiculo)) {
    return MENSAJES_VALIDACION.formatoInvalido
  }
  if (placaEstaRegistrada?.(placaLimpia)) {
    return mensajeDuplicada
  }
  return ''
}

// Valida el contenido y longitud de fabricante, modelo o color.
// @param {string} valor
// @param {'fabricante'|'modelo'|'color'} nombreCampo
// @returns {string}
export function obtenerErrorDetalleVehiculo(valor, nombreCampo) {
  const textoLimpio = compactarEspaciosTexto(valor)
  if (!textoLimpio) return MENSAJES_VALIDACION.obligatorio
  const regla = REGLAS_DETALLE_VEHICULO[nombreCampo]
  if (regla && !regla.patron.test(textoLimpio)) {
    return MENSAJES_VALIDACION.formatoInvalido
  }
  return ''
}

// Valida que el año de fabricación sea un entero de 4 dígitos dentro del rango permitido.
// @param {string|number} valorAnio
// @param {number} [anioMinimo=LIMITES_VEHICULO.anioMinimo]
// @returns {string}
export function obtenerErrorAnioFabricacion(valorAnio, anioMinimo = LIMITES_VEHICULO.anioMinimo) {
  const textoAnio = String(valorAnio ?? '').trim()
  if (!textoAnio) return MENSAJES_VALIDACION.obligatorio

  const anioMaximo = new Date().getFullYear() + 1
  const anioNumerico = Number(textoAnio)
  if (!/^\d{4}$/.test(textoAnio) || anioNumerico < anioMinimo || anioNumerico > anioMaximo) {
    return MENSAJES_VALIDACION.formatoInvalido
  }
  return ''
}

// Valida fabricante, modelo y color de un vehículo
// @param {Record<string, any>} formulario
// @param {Record<string, string>} errores
export function validarDetallesVehiculo(formulario, errores) {
  errores.fabricante = obtenerErrorDetalleVehiculo(formulario.fabricante, 'fabricante')
  errores.modelo = obtenerErrorDetalleVehiculo(formulario.modelo, 'modelo')
  errores.color = obtenerErrorDetalleVehiculo(formulario.color, 'color')
}

// Valida el área de destino institucional (obligatoria, mínimo 3 caracteres con contenido alfanumérico).
// @param {string} valor
// @returns {string}
export function obtenerErrorDestino(valor) {
  const textoLimpio = compactarEspaciosTexto(valor)
  if (!textoLimpio) return MENSAJES_VALIDACION.obligatorio
  if (textoLimpio.length < 3) return MENSAJES_VALIDACION.formatoInvalido
  const caracteresAlfanumericos = textoLimpio.replace(/[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ0-9]/g, '')
  if (caracteresAlfanumericos.length < 2) {
    return MENSAJES_VALIDACION.formatoInvalido
  }
  return ''
}

// Valida los campos comunes de una solicitud de visita o autorización temporal
// @param {Record<string, any>} formulario
// @param {Record<string, string>} errores
// @param {(placa: string) => boolean} placaEstaRegistrada
// @param {string} [mensajePlacaDuplicada='El vehículo se encuentra registrado']
// @param {(identificacion: string) => boolean} [identificacionEstaRegistrada]
// @param {string} [mensajeIdentificacionDuplicada='El usuario se encuentra registrado']
export function validarCamposBaseVisita(
  formulario,
  errores,
  placaEstaRegistrada,
  mensajePlacaDuplicada = 'El vehículo se encuentra registrado',
  identificacionEstaRegistrada = null,
  mensajeIdentificacionDuplicada = 'El usuario se encuentra registrado'
) {
  errores.nombres = obtenerErrorNombres(formulario.nombres)
  errores.tipoIdentificacion = obtenerErrorTexto(formulario.tipoIdentificacion)
  errores.numeroIdentificacion = obtenerErrorDocumento(
    formulario.tipoIdentificacion,
    formulario.numeroIdentificacion,
    identificacionEstaRegistrada,
    mensajeIdentificacionDuplicada
  )
  if ('telefono' in formulario) {
    errores.telefono = obtenerErrorTelefono(formulario.telefono)
  }
  errores.tipoVehiculo = obtenerErrorTexto(formulario.tipoVehiculo)
  errores.placa = obtenerErrorPlacaRegistro(
    formulario.placa,
    formulario.tipoVehiculo,
    placaEstaRegistrada,
    mensajePlacaDuplicada
  )
  errores.motivo = obtenerErrorTexto(formulario.motivo)
  errores.destino = obtenerErrorDestino(formulario.destino)
}

// Retorna fecha en formato local YYYY-MM-DD (evita desfases horarios UTC)
// @param {Date} fecha
// @returns {string}
export function obtenerFechaLocalISO(fecha = new Date()) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

// Extrae el código normalizado del punto de control (ej. "N01")
// @param {string} textoPunto
// @returns {string}
export function normalizarCodigoPunto(textoPunto) {
  return String(textoPunto || '')
    .toUpperCase()
    .replace(/PUNTO\s*DE\s*CONTROL/g, '')
    .replace(/[^A-Z0-9]/g, '')
}

const ETIQUETAS_MOTIVOS = Object.fromEntries(
  MOTIVOS_VISITA.map(({ valor, etiqueta }) => [valor, etiqueta])
)

// Convierte claves de motivo en texto legible manteniendo compatibilidad
// @param {string} motivo
// @returns {string}
export function obtenerEtiquetaMotivo(motivo) {
  if (!motivo) return ''
  const motivoLimpio = String(motivo).trim().toLowerCase()
  const encontrado = MOTIVOS_VISITA.find(m =>
    m.valor.toLowerCase() === motivoLimpio || m.etiqueta.toLowerCase() === motivoLimpio
  )
  return encontrado ? encontrado.etiqueta : (ETIQUETAS_MOTIVOS[motivo] || motivo)
}

// Formatea fecha actual en formato legible DD/MM/AAAA a las HH:MM
// @param {Date|string} fecha
// @returns {string}
export function formatearFechaHora(fecha = new Date()) {
  const f = typeof fecha === 'string' ? new Date(fecha) : fecha
  const dia = String(f.getDate()).padStart(2, '0')
  const mes = String(f.getMonth() + 1).padStart(2, '0')
  const anio = f.getFullYear()
  const horas = String(f.getHours()).padStart(2, '0')
  const minutos = String(f.getMinutes()).padStart(2, '0')
  return `${dia}/${mes}/${anio} a las ${horas}:${minutos}`
}
