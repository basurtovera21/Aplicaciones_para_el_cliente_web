<script setup>

import { ref, reactive, computed, onMounted } from 'vue'
import { useInvehStore } from '../stores/inveh'
import Navbar from '../components/Navbar.vue'
import ModalBase from '../components/ModalBase.vue'
import ModalConfirmacionExito from '../components/ModalConfirmacionExito.vue'
import ModalFichaVehicular from '../components/ModalFichaVehicular.vue'
import CampoFormulario from '../components/CampoFormulario.vue'
import SeccionDesplegable from '../components/SeccionDesplegable.vue'
import BannerInformativo from '../components/BannerInformativo.vue'
import AccionesFormularioModal from '../components/AccionesFormularioModal.vue'
import { useTeclaEscape } from '../composables/useTeclaEscape'
import { TIPOS_VEHICULO, TIPOS_IDENTIFICACION, MOTIVOS_VISITA } from '../utils/catalogos'
import {
  limpiarCampos,
  tieneErrores,
  compactarEspaciosTexto,
  esTipoCedula,
  normalizarPlacaCampo,
  normalizarDocumentoCampo,
  normalizarNombrePersona,
  normalizarDetalleVehiculo,
  validarCamposBaseVisita,
  validarDetallesVehiculo,
  formatearFechaHora,
  normalizarCodigoPunto,
  obtenerErrorDocumento,
  obtenerErrorPlacaRegistro,
  LIMITES_VEHICULO
} from '../utils/validaciones'

// Almacén global Pinia
const store = useInvehStore()

// Nombre del punto de control asignado a la sesión actual
const puntoControlAsignado = computed(() => {
  return store.usuarioActual?.area_asignada || 'Punto de control N01'
})

// Extrae los dígitos numéricos del punto de control
const numeroPunto = computed(() => {
  const match = puntoControlAsignado.value.match(/\d+/)
  return match ? match[0].padStart(2, '0') : '01'
})

// Código normalizado del punto de control
const codigoPuntoActual = computed(() => {
  return normalizarCodigoPunto(puntoControlAsignado.value) || 'N01'
})

// Al cargar la vista, asegurar sesión de personal de operación
onMounted(() => {
  store.asegurarRolEnSesion('personal_operacion')
  entradaBusqueda.value = ''
  vehiculoCoincidente.value = null
  mensajeSinCoincidencia.value = ''
})

// Historial filtrado para mostrar solo los movimientos de esta garita
const historialMovimientosPunto = computed(() => {
  return store.historialMovimientos.filter(movimiento => {
    const codigoMovimiento = normalizarCodigoPunto(movimiento.puntoControl) || 'N01'
    return codigoMovimiento === codigoPuntoActual.value
  })
})

// Variables del buscador vehicular
const entradaBusqueda = ref('')
const vehiculoCoincidente = ref(null)
const mensajeSinCoincidencia = ref('')

// Normaliza el texto de búsqueda (mayúsculas, letras, números y guiones)
function normalizarEntradaBusqueda() {
  entradaBusqueda.value = entradaBusqueda.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
  mensajeSinCoincidencia.value = ''
}

// Comprueba si la placa o identificador ingresado corresponde a un vehículo o visita autorizada
function comprobarVehiculo() {
  const termino = entradaBusqueda.value.trim().toUpperCase()
  if (!termino) {
    vehiculoCoincidente.value = null
    mensajeSinCoincidencia.value = 'Registre una placa o identificador vehicular'
    return
  }

  // 1. Buscar en vehículos institucionales autorizados
  const vehiculoInstitucional = store.vehiculos.find(v => 
    (v.placa.toUpperCase() === termino || v.identificador.toUpperCase() === termino) &&
    v.estadoAutorizacion === 'Autorizado'
  )

  if (vehiculoInstitucional) {
    vehiculoCoincidente.value = {
      ...vehiculoInstitucional,
      esVisita: false,
      nombrePersona: vehiculoInstitucional.propietario?.nombres_apellidos || '',
      identificacionPersona: vehiculoInstitucional.propietario?.numero_identificacion || ''
    }
    mensajeSinCoincidencia.value = ''
    return
  }

  // 2. Buscar en visitas externas autorizadas
  const visita = store.autorizacionesVisitas.find(v => 
    (v.vehiculo?.placa?.toUpperCase() === termino || v.identificador.toUpperCase() === termino) &&
    v.estadoAutorizacion === 'Autorizado'
  )

  if (visita) {
    vehiculoCoincidente.value = {
      esVisita: true,
      identificador: visita.identificador,
      placa: visita.vehiculo.placa,
      tipo: visita.vehiculo.tipo,
      fabricante: visita.vehiculo.fabricante,
      modelo: visita.vehiculo.modelo,
      color: visita.vehiculo.color,
      anio: visita.vehiculo.anio || '',
      observaciones: visita.vehiculo.observaciones || 'Sin observaciones',
      estadoPresencia: visita.estadoPresencia,
      estadoAutorizacion: visita.estadoAutorizacion || 'Autorizado',
      fechaSolicitud: visita.fechaSolicitud || visita.detalle?.fecha || '',
      fechaActualizacion: visita.fechaAprobacion || visita.fechaSolicitud || visita.detalle?.fecha || '',
      codigoQrRuta: visita.codigoQrRuta,
      propietario: {
        nombres_apellidos: visita.visitante?.nombres_apellidos || 'Visitante',
        numero_identificacion: visita.visitante?.numero_identificacion || '',
        correo_institucional: visita.visitante?.correo || 'No aplica',
        tipo_usuario: 'Visitante',
        facultad: visita.solicitante?.facultad || 'No aplica',
        carrera: 'Externo'
      },
      nombrePersona: visita.visitante?.nombres_apellidos || 'Visitante',
      identificacionPersona: visita.visitante?.numero_identificacion || ''
    }
    mensajeSinCoincidencia.value = ''
    return
  }

  vehiculoCoincidente.value = null
  mensajeSinCoincidencia.value = 'No se encontró ningún registro con los datos registrados'
}

// Resumen del último movimiento registrado para el vehículo actual
const textoUltimoMovimiento = computed(() => {
  if (!vehiculoCoincidente.value) return ''
  const ultimo = store.historialMovimientos.find(m => 
    m.placa.toUpperCase() === vehiculoCoincidente.value.placa.toUpperCase()
  )
  if (ultimo) {
    const punto = normalizarCodigoPunto(ultimo.puntoControl) || 'N01'
    return `Último movimiento: ${ultimo.tipoMovimiento} registrada el ${ultimo.fecha} a las ${ultimo.hora} (${punto})`
  }
  return 'Sin movimientos previos registrados hoy'
})

// Modales y confirmación de movimiento
const modalMovimientoExitoAbierto = ref(false)
const tituloModalMovimiento = ref('Entrada registrada correctamente')
const mensajeFechaMovimiento = ref('')
const modalFichaAbierto = ref(false)
const modalRegistroTemporalAbierto = ref(false)

useTeclaEscape([
  modalMovimientoExitoAbierto,
  modalRegistroTemporalAbierto,
  modalFichaAbierto
])

// Registra la entrada o salida del vehículo comprobado
function registrarMovimiento() {
  if (!vehiculoCoincidente.value) return

  const tipoMovimiento = vehiculoCoincidente.value.estadoPresencia === 'Dentro de las instalaciones'
    ? 'Salida'
    : 'Entrada'

  const resultado = store.registrarMovimientoGarita({
    identificadorOPlaca: vehiculoCoincidente.value.placa,
    tipoMovimiento: tipoMovimiento,
    puntoControl: puntoControlAsignado.value
  })

  if (resultado.exito) {
    if (resultado.eliminado) {
      // Las autorizaciones temporales o visitas se dan de baja automáticamente al salir
      vehiculoCoincidente.value = null
      entradaBusqueda.value = ''
    } else {
      // Alterna el estado de presencia para vehículos institucionales
      vehiculoCoincidente.value.estadoPresencia = tipoMovimiento === 'Entrada'
        ? 'Dentro de las instalaciones'
        : 'Fuera de las instalaciones'
    }

    tituloModalMovimiento.value = `${tipoMovimiento} registrada correctamente`
    mensajeFechaMovimiento.value = `Fecha y hora en que se registró el movimiento: ${formatearFechaHora()}`
    modalMovimientoExitoAbierto.value = true
  }
}

function abrirFichaVehicular() {
  modalFichaAbierto.value = true
}

// Formulario de autorización temporal
const seccionVehiculoTemporalAbierta = ref(true)
const seccionVisitaTemporalAbierta = ref(true)

const formularioTemporal = reactive({
  nombres: '',
  tipoIdentificacion: '',
  numeroIdentificacion: '',
  placa: '',
  tipoVehiculo: '',
  fabricante: '',
  modelo: '',
  color: '',
  motivo: '',
  destino: ''
})

const erroresTemporal = reactive({
  nombres: '',
  tipoIdentificacion: '',
  numeroIdentificacion: '',
  placa: '',
  tipoVehiculo: '',
  fabricante: '',
  modelo: '',
  color: '',
  motivo: '',
  destino: ''
})

const longitudMaximaDocTemporal = computed(() => {
  return esTipoCedula(formularioTemporal.tipoIdentificacion) ? 10 : 20
})

function alCambiarTipoIdentificacionTemporal() {
  erroresTemporal.tipoIdentificacion = ''
  normalizarDocTemporal()
}

function normalizarDocTemporal() {
  normalizarDocumentoCampo(
    formularioTemporal,
    erroresTemporal,
    store.identificacionEstaRegistrada
  )
}

function validarDocumentoTemporal() {
  if (formularioTemporal.numeroIdentificacion) {
    erroresTemporal.numeroIdentificacion = obtenerErrorDocumento(
      formularioTemporal.tipoIdentificacion,
      formularioTemporal.numeroIdentificacion,
      store.identificacionEstaRegistrada,
      'El usuario se encuentra registrado'
    )
  }
}

function validarPlacaTemporal() {
  if (formularioTemporal.placa) {
    erroresTemporal.placa = obtenerErrorPlacaRegistro(
      formularioTemporal.placa,
      formularioTemporal.tipoVehiculo,
      store.placaEstaRegistrada
    )
  }
}

function abrirModalTemporal() {
  limpiarCampos(erroresTemporal)
  limpiarCampos(formularioTemporal)
  seccionVehiculoTemporalAbierta.value = true
  seccionVisitaTemporalAbierta.value = true
  modalRegistroTemporalAbierto.value = true
}

function enviarAutorizacionTemporal() {
  limpiarCampos(erroresTemporal)

  formularioTemporal.nombres = compactarEspaciosTexto(formularioTemporal.nombres)
  formularioTemporal.placa = formularioTemporal.placa.trim().toUpperCase()
  formularioTemporal.fabricante = compactarEspaciosTexto(formularioTemporal.fabricante)
  formularioTemporal.modelo = compactarEspaciosTexto(formularioTemporal.modelo)
  formularioTemporal.color = compactarEspaciosTexto(formularioTemporal.color)
  formularioTemporal.destino = compactarEspaciosTexto(formularioTemporal.destino)

  validarCamposBaseVisita(
    formularioTemporal,
    erroresTemporal,
    store.placaEstaRegistrada,
    'El vehículo se encuentra registrado',
    store.identificacionEstaRegistrada,
    'El usuario se encuentra registrado'
  )
  validarDetallesVehiculo(formularioTemporal, erroresTemporal)

  const hayErrorVehiculo = erroresTemporal.placa || erroresTemporal.tipoVehiculo || erroresTemporal.fabricante || erroresTemporal.modelo || erroresTemporal.color
  if (hayErrorVehiculo) {
    seccionVehiculoTemporalAbierta.value = true
  }

  const hayErrorVisita = erroresTemporal.motivo || erroresTemporal.destino
  if (hayErrorVisita) {
    seccionVisitaTemporalAbierta.value = true
  }

  if (tieneErrores(erroresTemporal)) return

  const nuevaVisita = store.crearAutorizacionTemporalGarita(formularioTemporal, puntoControlAsignado.value)
  modalRegistroTemporalAbierto.value = false

  // Carga automáticamente el vehículo recién creado en pantalla
  entradaBusqueda.value = nuevaVisita.vehiculo.placa
  comprobarVehiculo()

  tituloModalMovimiento.value = 'Entrada registrada correctamente'
  mensajeFechaMovimiento.value = `Fecha y hora en que se registró el movimiento: ${formatearFechaHora()}`
  modalMovimientoExitoAbierto.value = true
}
</script>

<template>
  <div>
    <!-- Barra de navegación institucional -->
    <Navbar />

    <main class="contenedor-principal">

      <!-- Tarjeta 1: Buscador y comprobación de placas -->
      <section class="tarjeta-panel tarjeta-busqueda-control">
        <div class="fila-superior-control">
          <div class="bloque-identificador-punto">
            <div class="insignia-circular" id="insignia-punto">{{ numeroPunto }}</div>
            <div class="textos-cabecera-control">
              <h1 class="titulo-control">Control de movimientos vehiculares</h1>
              <p class="descripcion-control">
                Registre la placa o identificador del vehículo para comprobar el estado y registrar el movimiento correspondiente.
              </p>
            </div>
          </div>

          <button 
            type="button" 
            class="boton-registro-temporal" 
            id="boton-registro-temporal"
            @click="abrirModalTemporal"
          >
            <img src="/recursos/imagenes/crear-autorizacion.svg" alt="" class="icono-boton-accion" />
            <span>Crear registro temporal</span>
          </button>
        </div>

        <form class="formulario-comprobacion-control" @submit.prevent="comprobarVehiculo" novalidate>
          <div class="campo-entrada-placa-contenedor">
            <input 
              v-model="entradaBusqueda"
              type="text" 
              id="entrada-busqueda-control" 
              class="entrada-busqueda-control" 
              placeholder="Registre la placa o identificador vehicular" 
              autocomplete="off"
              @input="normalizarEntradaBusqueda"
            />
          </div>
          <button type="submit" class="boton-comprobar-control" id="btn-comprobar-vehiculo">
            <img src="/recursos/imagenes/buscar.svg" alt="" class="icono-comprobar" />
            <span>Comprobar</span>
          </button>
        </form>

        <p 
          v-if="mensajeSinCoincidencia" 
          class="mensaje-sin-coincidencia" 
          id="mensaje-sin-coincidencia"
          style="display: block;"
        >
          {{ mensajeSinCoincidencia }}
        </p>
      </section>

      <!-- Tarjeta 2: Resultado de comprobación y acción de paso -->
      <section 
        v-if="vehiculoCoincidente" 
        class="tarjeta-panel tarjeta-resultado-vehiculo" 
        id="tarjeta-resultado-coincidencia"
        style="display: block;"
      >
        <div class="cabecera-resultado-control">
          <div class="bloque-placa-id-control">
            <span class="etiqueta-placa-vehicular">{{ vehiculoCoincidente.placa }}</span>
            <span class="identificador-control">
              Identificador: <span class="dato-valor">{{ vehiculoCoincidente.identificador }}</span>
            </span>
          </div>
          <span class="etiqueta-estado-instalaciones">
            {{ vehiculoCoincidente.estadoPresencia }}
          </span>
        </div>

        <div class="rejilla-detalles-control">
          <!-- Columna 1: Información del titular o visitante -->
          <div class="columna-detalle-control">
            <h3 class="subtitulo-detalle-control">
              {{ vehiculoCoincidente.esVisita ? 'Información del visitante (Visita)' : 'Información del propietario' }}
            </h3>
            <p class="item-detalle-control">
              Apellidos y nombres: <span class="dato-valor">{{ vehiculoCoincidente.nombrePersona }}</span>
            </p>
            <p class="item-detalle-control">
              Número de identificación: <span class="dato-valor">{{ vehiculoCoincidente.identificacionPersona }}</span>
            </p>
          </div>

          <!-- Columna 2: Información del vehículo -->
          <div class="columna-detalle-control">
            <h3 class="subtitulo-detalle-control">Información del vehículo</h3>
            <div class="filas-dos-datos-control">
              <p class="item-detalle-control">
                Tipo de vehículo: <span class="dato-valor">{{ vehiculoCoincidente.tipo }}</span>
              </p>
              <p class="item-detalle-control">
                Color: <span class="dato-valor">{{ vehiculoCoincidente.color }}</span>
              </p>
            </div>
            <p class="item-detalle-control">
              Fabricante / Modelo: <span class="dato-valor">{{ vehiculoCoincidente.fabricante }} {{ vehiculoCoincidente.modelo }}</span>
            </p>
          </div>
        </div>

        <!-- Pie de tarjeta con último movimiento y botón dinámico -->
        <div class="pie-resultado-control">
          <button 
            v-if="!vehiculoCoincidente.esVisita"
            type="button" 
            class="boton-ficha-control" 
            id="btn-ver-ficha-control"
            @click="abrirFichaVehicular"
          >
            <img src="/recursos/imagenes/ficha-vehicular.svg" alt="" class="icono-boton-accion" />
            <span>Ficha vehicular</span>
          </button>

          <p class="texto-ultimo-movimiento" id="res-ultimo-movimiento">
            {{ textoUltimoMovimiento }}
          </p>

          <button 
            type="button" 
            class="boton-accion-movimiento"
            :class="vehiculoCoincidente.estadoPresencia === 'Dentro de las instalaciones' ? 'movimiento-salida' : 'movimiento-entrada'"
            @click="registrarMovimiento"
          >
            <img 
              :src="vehiculoCoincidente.estadoPresencia === 'Dentro de las instalaciones' ? '/recursos/imagenes/eliminar.svg' : '/recursos/imagenes/aceptar.svg'" 
              alt="" 
              class="icono-boton-accion" 
            />
            <span>
              {{ vehiculoCoincidente.estadoPresencia === 'Dentro de las instalaciones' ? 'Confirmar salida' : 'Confirmar entrada' }}
            </span>
          </button>
        </div>
      </section>

      <!-- Tarjeta 3: Historial de movimientos en garita -->
      <section class="tarjeta-panel tarjeta-panel-fijo">
        <header class="cabecera-panel-tabla">
          <h2 class="titulo-panel">Historial de movimientos</h2>
        </header>

        <div class="contenedor-tabla-desplazable">
          <table class="tabla-gestion-inveh">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Placa vehicular</th>
                <th>Propietario</th>
                <th>Tipo de usuario</th>
                <th class="columna-centrada">Tipo de movimiento</th>
              </tr>
            </thead>
            <tbody id="cuerpo-tabla-historial">
              <tr v-if="historialMovimientosPunto.length === 0">
                <td colspan="6" class="mensaje-tabla-vacia">
                  No se han registrado movimientos vehiculares en este punto de control
                </td>
              </tr>
              <tr v-for="mov in historialMovimientosPunto" :key="mov.id">
                <td>{{ mov.fecha }}</td>
                <td>{{ mov.hora }}</td>
                <td>{{ mov.placa }}</td>
                <td>{{ mov.propietario }}</td>
                <td>{{ mov.tipoUsuario }}</td>
                <td class="columna-centrada">
                  <span class="movimiento-tabla-texto">{{ mov.tipoMovimiento }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Modal: Confirmación de movimiento -->
      <ModalConfirmacionExito
        :abierto="modalMovimientoExitoAbierto"
        :titulo="tituloModalMovimiento"
        :mensaje="mensajeFechaMovimiento"
        @cerrar="modalMovimientoExitoAbierto = false"
      />

      <!-- Modal: Ficha vehicular -->
      <ModalFichaVehicular
        :abierto="modalFichaAbierto"
        :vehiculo="vehiculoCoincidente"
        @cerrar="modalFichaAbierto = false"
      />

      <!-- Modal: Autorización temporal de acceso -->
      <ModalBase
        :abierto="modalRegistroTemporalAbierto"
        ancho="registro"
        titulo="Autorización temporal de acceso vehicular"
        @cerrar="modalRegistroTemporalAbierto = false"
      >

          <BannerInformativo>
            Al confirmar el registro temporal, el sistema registrará la 'Entrada' del vehículo, incluyendo la fecha y hora del movimiento
          </BannerInformativo>

          <form class="formulario-registro-vehiculo" @submit.prevent="enviarAutorizacionTemporal" novalidate>
            <!-- Sección 1: Información del visitante -->
            <div class="seccion-formulario-modal">
              <h4 class="titulo-seccion-grande">Información del visitante</h4>
              <div class="cuerpo-grid-formulario">
                <CampoFormulario etiqueta="Apellidos y nombres" :error="erroresTemporal.nombres">
                  <input 
                    v-model="formularioTemporal.nombres" 
                    type="text" 
                    class="campo-texto-modal" 
                    placeholder="Ej. Alcivar Mero Luis Alfonso"
                    maxlength="80"
                    @input="normalizarNombrePersona(formularioTemporal, erroresTemporal)"
                  />
                </CampoFormulario>

                <CampoFormulario etiqueta="Tipo de identificación" :error="erroresTemporal.tipoIdentificacion">
                  <select 
                    v-model="formularioTemporal.tipoIdentificacion" 
                    class="campo-texto-modal"
                    :class="{ 'campo-sin-seleccion': !formularioTemporal.tipoIdentificacion }"
                    @change="alCambiarTipoIdentificacionTemporal"
                  >
                    <option value="" disabled>Elija una opción</option>
                    <option
                      v-for="tipo in TIPOS_IDENTIFICACION"
                      :key="tipo"
                      :value="tipo"
                    >
                      {{ tipo }}
                    </option>
                  </select>
                </CampoFormulario>

                <CampoFormulario etiqueta="Número de identificación" :error="erroresTemporal.numeroIdentificacion">
                  <input 
                    v-model="formularioTemporal.numeroIdentificacion" 
                    type="text" 
                    class="campo-texto-modal" 
                    placeholder="Ej. 1307892139"
                    :maxlength="longitudMaximaDocTemporal"
                    @input="normalizarDocTemporal"
                    @change="normalizarDocTemporal"
                    @blur="validarDocumentoTemporal"
                  />
                </CampoFormulario>
              </div>
            </div>

            <!-- Sección 2: Información del vehículo visitante -->
            <SeccionDesplegable v-model:abierta="seccionVehiculoTemporalAbierta" titulo="Información del vehículo">
              <CampoFormulario etiqueta="Placa vehicular" :error="erroresTemporal.placa">
                <input 
                  v-model="formularioTemporal.placa" 
                  type="text" 
                  class="campo-texto-modal" 
                  maxlength="8"
                  placeholder="Ej. PCN9041"
                  @input="normalizarPlacaCampo(formularioTemporal, erroresTemporal, 'placa', 8, store.placaEstaRegistrada)"
                  @blur="validarPlacaTemporal"
                />
              </CampoFormulario>

              <CampoFormulario etiqueta="Tipo de vehículo" :error="erroresTemporal.tipoVehiculo">
                <select 
                  v-model="formularioTemporal.tipoVehiculo" 
                  class="campo-texto-modal"
                  :class="{ 'campo-sin-seleccion': !formularioTemporal.tipoVehiculo }"
                  @change="erroresTemporal.tipoVehiculo = ''"
                >
                  <option value="" disabled>Elija una opción</option>
                  <option v-for="tipo in TIPOS_VEHICULO" :key="tipo" :value="tipo">{{ tipo }}</option>
                </select>
              </CampoFormulario>

              <CampoFormulario etiqueta="Fabricante" :error="erroresTemporal.fabricante">
                <input 
                  v-model="formularioTemporal.fabricante" 
                  type="text" 
                  class="campo-texto-modal" 
                  :maxlength="LIMITES_VEHICULO.longitudMaximaFabricante"
                  placeholder="Ej. Toyota"
                  @input="normalizarDetalleVehiculo(formularioTemporal, erroresTemporal, 'fabricante')"
                />
              </CampoFormulario>

              <CampoFormulario etiqueta="Modelo" :error="erroresTemporal.modelo">
                <input 
                  v-model="formularioTemporal.modelo" 
                  type="text" 
                  class="campo-texto-modal" 
                  :maxlength="LIMITES_VEHICULO.longitudMaximaModelo"
                  placeholder="Ej. Raize"
                  @input="normalizarDetalleVehiculo(formularioTemporal, erroresTemporal, 'modelo')"
                />
              </CampoFormulario>

              <CampoFormulario etiqueta="Color" :error="erroresTemporal.color">
                <input 
                  v-model="formularioTemporal.color" 
                  type="text" 
                  class="campo-texto-modal" 
                  :maxlength="LIMITES_VEHICULO.longitudMaximaColor"
                  placeholder="Ej. Blanco"
                  @input="normalizarDetalleVehiculo(formularioTemporal, erroresTemporal, 'color')"
                />
              </CampoFormulario>
            </SeccionDesplegable>

            <!-- Sección 3: Detalle de la visita -->
            <SeccionDesplegable v-model:abierta="seccionVisitaTemporalAbierta" titulo="Detalle de la visita">
              <CampoFormulario etiqueta="Motivo de la visita" :error="erroresTemporal.motivo">
                <select 
                  v-model="formularioTemporal.motivo" 
                  class="campo-texto-modal"
                  :class="{ 'campo-sin-seleccion': !formularioTemporal.motivo }"
                  @change="erroresTemporal.motivo = ''"
                >
                  <option value="" disabled>Elija una opción</option>
                  <option
                    v-for="motivo in MOTIVOS_VISITA"
                    :key="motivo.valor"
                    :value="motivo.valor"
                  >
                    {{ motivo.etiqueta }}
                  </option>
                </select>
              </CampoFormulario>

              <CampoFormulario etiqueta="Área de destino" :error="erroresTemporal.destino" ancho-completo>
                <textarea 
                  v-model="formularioTemporal.destino" 
                  class="campo-area-texto-modal" 
                  maxlength="100"
                  placeholder="Especifique la facultad, departamento u oficina de destino"
                  @input="erroresTemporal.destino = ''"
                ></textarea>
              </CampoFormulario>
            </SeccionDesplegable>

            <AccionesFormularioModal
              texto-confirmar="Registrar autorización"
              @cancelar="modalRegistroTemporalAbierto = false"
            />
          </form>
      </ModalBase>

    </main>
  </div>
</template>