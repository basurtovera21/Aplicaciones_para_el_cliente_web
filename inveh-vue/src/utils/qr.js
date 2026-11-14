export const RUTA_QR_RESPALDO = '/recursos/imagenes/codigo-qr.png'

// Devuelve una ruta QR ya emitida en el registro si es válida y distinta del respaldo estático.
// @param {object|null|undefined} registro
// @returns {string}
export function obtenerRutaCodigoQrGuardada(registro) {
  if (!registro || typeof registro !== 'object') return ''
  const rutaGuardada = String(registro.codigoQrRuta || registro.codigo_qr_ruta || '').trim()
  if (rutaGuardada && !rutaGuardada.endsWith('codigo-qr.png')) {
    return rutaGuardada
  }
  return ''
}

// Genera o recupera la URL única del código QR según el identificador y la placa del registro.
// @param {object|null|undefined} registro
// @returns {string}
export function obtenerRutaCodigoQr(registro) {
  if (!registro || typeof registro !== 'object') {
    return RUTA_QR_RESPALDO
  }

  const rutaGuardada = obtenerRutaCodigoQrGuardada(registro)
  if (rutaGuardada) {
    return rutaGuardada
  }

  const identificador = String(registro.identificador || registro.identificador_sistema || '').trim()
  const placa = String(
    registro.placa || registro.vehiculo?.placa || registro.placa_vehicular || ''
  ).trim().toUpperCase()

  if (!identificador && !placa) {
    return RUTA_QR_RESPALDO
  }

  const cargaUtil = `${identificador}|${placa}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cargaUtil)}`
}
