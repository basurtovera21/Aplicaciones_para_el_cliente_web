<script setup>

import { ref, reactive, computed, onMounted } from 'vue'
import { useInvehStore } from '../stores/inveh'
import Navbar from '../components/Navbar.vue'
import ModalBase from '../components/ModalBase.vue'
import ModalConfirmacionExito from '../components/ModalConfirmacionExito.vue'
import ModalDesvincular from '../components/ModalDesvincular.vue'
import ModalFichaVehicular from '../components/ModalFichaVehicular.vue'
import CampoFormulario from '../components/CampoFormulario.vue'
import SeccionDesplegable from '../components/SeccionDesplegable.vue'
import BannerInformativo from '../components/BannerInformativo.vue'
import AccionesFormularioModal from '../components/AccionesFormularioModal.vue'
import { useTeclaEscape } from '../composables/useTeclaEscape'
import { TIPOS_VEHICULO, TIPOS_IDENTIFICACION, MOTIVOS_VISITA } from '../utils/catalogos'
import { FABRICANTES_COMUNES, obtenerModelosPorFabricante } from '../utils/apiVehiculos'
import {
  LIMITES_VEHICULO,
  limpiarCampos,
  tieneErrores,
  compactarEspaciosTexto,
  esTipoCedula,
  normalizarPlacaCampo,
  normalizarDocumentoCampo,
  normalizarDetalleVehiculo,
  normalizarAnioVehiculo,
  obtenerErrorTexto,
  obtenerErrorDocumento,
  obtenerErrorPlacaRegistro,
  obtenerErrorAnioFabricacion,
  validarDetallesVehiculo,
  validarCamposBaseVisita,
  obtenerErrorFechaVisita,
  obtenerErrorHoraVisita,
  normalizarTelefono,
  normalizarNombrePersona,
  obtenerFechaLocalISO,
  formatearFechaHora
} from '../utils/validaciones'

// Almacén global Pinia
const store = useInvehStore()

// Al cargar la vista, asegurar la sesión y verificar si hay notificaciones
onMounted(() => {
  store.asegurarRolEnSesion('usuario_institucional')
  revisarNotificacionesPendientes()
})

// Calcula las iniciales del usuario para el avatar a partir de su nombre registrado
const inicialesUsuario = computed(() => {
  const nombre = (store.usuarioActual?.nombres_apellidos || '').trim()
  if (!nombre) return ''
  const palabras = nombre.split(/\s+/).filter(Boolean)
  if (palabras.length >= 2) {
    return (palabras[0][0] + palabras[1][0]).toUpperCase()
  }
  return palabras[0].slice(0, 2).toUpperCase()
})

// Vehículos con estado 'Autorizado' pertenecientes al usuario actual
const vehiculosAutorizados = computed(() => {
  return store.vehiculosUsuarioActual.filter(v => v.estadoAutorizacion === 'Autorizado')
})

// Texto dinámico para el botón de registro de vehículo
const textoBotonRegistroVehiculo = computed(() => {
  return vehiculosAutorizados.value.length === 0 
    ? 'Registrar vehículo' 
    : 'Requerir vehículo adicional'
})

// El usuario puede tener máximo 2 vehículos registrados o en trámite
const puedeRegistrarVehiculo = computed(() => {
  return store.cupoUsadoUsuarioActual < 2
})

// Modales del sistema
const modalRegistroAbierto = ref(false)
const modalVisitaAbierto = ref(false)
const modalFichaAbierto = ref(false)
const modalDesvincularAbierto = ref(false)
const modalExitoRegistroAbierto = ref(false)
const modalExitoDesvinculacionAbierto = ref(false)
const modalNotificacionResolucionAbierto = ref(false)
const notificacionResolucion = ref(null)

// Permite cerrar las ventanas modales con la tecla Escape
useTeclaEscape([
  modalExitoRegistroAbierto,
  modalExitoDesvinculacionAbierto,
  modalDesvincularAbierto,
  modalRegistroAbierto,
  modalVisitaAbierto,
  modalFichaAbierto,
  modalNotificacionResolucionAbierto
])

// Revisa si hay notificaciones de solicitudes aprobadas o rechazadas
function revisarNotificacionesPendientes() {
  const pendientes = store.obtenerNotificacionesPendientesUsuario()
  if (pendientes.length > 0) {
    notificacionResolucion.value = pendientes[0]
    modalNotificacionResolucionAbierto.value = true
  }
}

// Marca la notificación como leída y abre la siguiente si existe
function aceptarNotificacionResolucion() {
  if (notificacionResolucion.value) {
    store.marcarNotificacionLeida(
      notificacionResolucion.value.tipoOrigen,
      notificacionResolucion.value.identificador
    )
    modalNotificacionResolucionAbierto.value = false
    notificacionResolucion.value = null

    setTimeout(() => {
      revisarNotificacionesPendientes()
    }, 200)
  }
}

const mensajeFechaRegistro = ref('')
const vehiculoSeleccionado = ref(null)

// Formulario reactivo para solicitud de vehículo
const formularioVehiculo = reactive({
  placa: '',
  tipo: '',
  fabricante: '',
  modelo: '',
  color: '',
  anio: '',
  observaciones: ''
})

const erroresVehiculo = reactive({
  placa: '',
  tipo: '',
  fabricante: '',
  modelo: '',
  color: '',
  anio: ''
})

// Longitud máxima de placa según el tipo seleccionado
const longitudMaximaPlaca = computed(() => {
  if (formularioVehiculo.tipo === 'Motocicleta') return LIMITES_VEHICULO.longitudMaximaPlacaMoto
  if (formularioVehiculo.tipo === 'Otro') return LIMITES_VEHICULO.longitudMaximaPlacaOtro
  return LIMITES_VEHICULO.longitudMaximaPlacaAuto
})

// Texto de ayuda para el campo placa
const placeholderPlaca = computed(() => {
  if (formularioVehiculo.tipo === 'Motocicleta') return 'Ej. KH463S'
  if (formularioVehiculo.tipo === 'Otro') return 'Opcional'
  return 'Ej. PCN9041'
})

// Lista reactiva de modelos sugeridos mediante la API REST de la NHTSA
const modelosSugeridosVehiculo = ref([])

// Abre el modal para registrar un vehículo y limpia datos anteriores
function abrirModalRegistro() {
  limpiarCampos(erroresVehiculo)
  limpiarCampos(formularioVehiculo)
  modelosSugeridosVehiculo.value = []
  modalRegistroAbierto.value = true
}

// Consulta asíncrona de modelos en la API externa al escribir o seleccionar el fabricante
async function alCambiarFabricanteVehiculo() {
  normalizarDetalleVehiculo(formularioVehiculo, erroresVehiculo, 'fabricante')
  if (formularioVehiculo.fabricante && formularioVehiculo.fabricante.trim().length >= 2) {
    modelosSugeridosVehiculo.value = await obtenerModelosPorFabricante(formularioVehiculo.fabricante)
  } else {
    modelosSugeridosVehiculo.value = []
  }
}

// Al cambiar el tipo de vehículo, revalida la placa si ya fue escrita
function alCambiarTipoVehiculo() {
  erroresVehiculo.tipo = ''
  if (formularioVehiculo.placa) {
    validarPlacaVehiculo()
  } else {
    erroresVehiculo.placa = ''
  }
}

// Valida si la placa cumple con el formato y si no está repetida
function validarPlacaVehiculo() {
  if (formularioVehiculo.placa) {
    erroresVehiculo.placa = obtenerErrorPlacaRegistro(
      formularioVehiculo.placa,
      formularioVehiculo.tipo,
      store.placaEstaRegistrada
    )
  }
}

// Envía la solicitud de registro del vehículo
function enviarSolicitudVehiculo() {
  limpiarCampos(erroresVehiculo)

  erroresVehiculo.tipo = obtenerErrorTexto(formularioVehiculo.tipo)
  erroresVehiculo.placa = obtenerErrorPlacaRegistro(
    formularioVehiculo.placa,
    formularioVehiculo.tipo,
    store.placaEstaRegistrada
  )
  validarDetallesVehiculo(formularioVehiculo, erroresVehiculo)
  erroresVehiculo.anio = obtenerErrorAnioFabricacion(formularioVehiculo.anio)

  if (tieneErrores(erroresVehiculo)) return

  store.solicitarRegistroVehiculo(formularioVehiculo)
  modalRegistroAbierto.value = false
  mensajeFechaRegistro.value = `Fecha y hora en que se registró la solicitud: ${formatearFechaHora()}`
  modalExitoRegistroAbierto.value = true
}

// Formulario reactivo para solicitud de visita
const formularioVisita = reactive({
  nombres: '',
  tipoIdentificacion: '',
  numeroIdentificacion: '',
  telefono: '',
  placa: '',
  tipoVehiculo: '',
  fabricante: '',
  modelo: '',
  color: '',
  fecha: '',
  hora: '',
  motivo: '',
  destino: ''
})

const erroresVisita = reactive({
  nombres: '',
  tipoIdentificacion: '',
  numeroIdentificacion: '',
  telefono: '',
  placa: '',
  tipoVehiculo: '',
  fabricante: '',
  modelo: '',
  color: '',
  fecha: '',
  hora: '',
  motivo: '',
  destino: ''
})

// Rango de fechas permitidas para la visita (hoy hasta 30 días después)
const fechaMinimaVisita = computed(() => obtenerFechaLocalISO())
const fechaMaximaVisita = computed(() => {
  const limite = new Date()
  limite.setDate(limite.getDate() + 30)
  return obtenerFechaLocalISO(limite)
})

const seccionVehiculoVisitaAbierta = ref(true)
const seccionDetalleVisitaAbierta = ref(true)

// Longitud máxima del documento de identidad
const longitudMaximaDocVisita = computed(() => {
  return esTipoCedula(formularioVisita.tipoIdentificacion) ? 10 : 20
})

function alCambiarTipoIdentificacionVisita() {
  erroresVisita.tipoIdentificacion = ''
  normalizarDocVisita()
}

function normalizarDocVisita() {
  normalizarDocumentoCampo(
    formularioVisita,
    erroresVisita,
    store.identificacionEstaRegistrada
  )
}

function validarDocumentoVisita() {
  if (formularioVisita.numeroIdentificacion) {
    erroresVisita.numeroIdentificacion = obtenerErrorDocumento(
      formularioVisita.tipoIdentificacion,
      formularioVisita.numeroIdentificacion,
      store.identificacionEstaRegistrada,
      'El usuario se encuentra registrado'
    )
  }
}

function validarPlacaVisita() {
  if (formularioVisita.placa) {
    erroresVisita.placa = obtenerErrorPlacaRegistro(
      formularioVisita.placa,
      formularioVisita.tipoVehiculo,
      store.placaEstaRegistrada
    )
  }
}

// Lista reactiva de modelos sugeridos mediante la API REST de la NHTSA para visitas
const modelosSugeridosVisita = ref([])

// Abre el modal para autorizar una visita
function abrirModalVisita() {
  limpiarCampos(erroresVisita)
  limpiarCampos(formularioVisita)
  modelosSugeridosVisita.value = []
  seccionVehiculoVisitaAbierta.value = true
  seccionDetalleVisitaAbierta.value = true
  modalVisitaAbierto.value = true
}

// Consulta asíncrona de modelos en la API externa al escribir o seleccionar el fabricante de la visita
async function alCambiarFabricanteVisita() {
  normalizarDetalleVehiculo(formularioVisita, erroresVisita, 'fabricante')
  if (formularioVisita.fabricante && formularioVisita.fabricante.trim().length >= 2) {
    modelosSugeridosVisita.value = await obtenerModelosPorFabricante(formularioVisita.fabricante)
  } else {
    modelosSugeridosVisita.value = []
  }
}

// Envía la solicitud de visita externa
function enviarSolicitudVisita() {
  limpiarCampos(erroresVisita)

  // Limpiar espacios en blanco
  formularioVisita.nombres = compactarEspaciosTexto(formularioVisita.nombres)
  formularioVisita.placa = formularioVisita.placa.trim().toUpperCase()
  formularioVisita.fabricante = compactarEspaciosTexto(formularioVisita.fabricante)
  formularioVisita.modelo = compactarEspaciosTexto(formularioVisita.modelo)
  formularioVisita.color = compactarEspaciosTexto(formularioVisita.color)
  formularioVisita.destino = compactarEspaciosTexto(formularioVisita.destino)

  validarCamposBaseVisita(
    formularioVisita,
    erroresVisita,
    store.placaEstaRegistrada,
    'El vehículo se encuentra registrado',
    store.identificacionEstaRegistrada,
    'El usuario se encuentra registrado'
  )
  validarDetallesVehiculo(formularioVisita, erroresVisita)

  erroresVisita.fecha = obtenerErrorFechaVisita(formularioVisita.fecha, 30)
  erroresVisita.hora = obtenerErrorHoraVisita(formularioVisita.hora, formularioVisita.fecha)

  // Abrir acordeones si contienen campos con error
  const hayErrorVehiculo = erroresVisita.placa || erroresVisita.tipoVehiculo || erroresVisita.fabricante || erroresVisita.modelo || erroresVisita.color
  if (hayErrorVehiculo) {
    seccionVehiculoVisitaAbierta.value = true
  }

  const hayErrorDetalle = erroresVisita.fecha || erroresVisita.hora || erroresVisita.motivo || erroresVisita.destino
  if (hayErrorDetalle) {
    seccionDetalleVisitaAbierta.value = true
  }

  if (tieneErrores(erroresVisita)) return

  store.solicitarAutorizacionVisita(formularioVisita)
  modalVisitaAbierto.value = false
  mensajeFechaRegistro.value = `Fecha y hora en que se registró la solicitud: ${formatearFechaHora()}`
  modalExitoRegistroAbierto.value = true
}

// Ver ficha vehicular
function verFichaVehiculo(vehiculo) {
  vehiculoSeleccionado.value = vehiculo
  modalFichaAbierto.value = true
}

// Desvinculación de vehículo
function iniciarDesvinculacion(vehiculo) {
  vehiculoSeleccionado.value = vehiculo
  modalDesvincularAbierto.value = true
}

function ejecutarDesvinculacion() {
  if (vehiculoSeleccionado.value) {
    store.desvincularVehiculo(vehiculoSeleccionado.value.identificador)
    modalDesvincularAbierto.value = false
    modalExitoDesvinculacionAbierto.value = true
  }
}
</script>

<template>
  <div>
    <!-- Barra de navegación superior -->
    <Navbar />

    <main class="contenedor-principal">

      <!-- Tarjeta resumen: perfil del usuario institucional -->
      <section class="tarjeta-resumen-usuario">
        <div class="bloque-perfil-informacion">
          <div class="insignia-circular">{{ inicialesUsuario }}</div>
          <div class="detalles-personales-usuario">
            <div class="fila-superior-perfil">
              <h2 class="nombre-rol-usuario">
                {{ store.usuarioActual?.nombres_apellidos }} ({{ store.usuarioActual?.tipo_usuario }})
              </h2>
              <div class="indicador-contador-vehiculos">
                Registro de vehículos: {{ vehiculosAutorizados.length }} de 2 permitidos
              </div>
            </div>
            <div class="fila-datos-institucionales">
              <span>Número de identificación: <span class="dato-valor">{{ store.usuarioActual?.numero_identificacion }}</span></span>
              <span>Correo institucional: <span class="dato-valor">{{ store.usuarioActual?.correo_institucional }}</span></span>
              <span>Facultad: <span class="dato-valor">{{ store.usuarioActual?.facultad }}</span></span>
            </div>
          </div>
        </div>
      </section>

      <!-- Botón para requerir el registro de un vehículo adicional -->
      <div v-if="puedeRegistrarVehiculo" class="fila-accion-vehiculo-adicional">
        <button 
          type="button" 
          class="boton-requerir-vehiculo" 
          id="boton-abrir-registro-vehiculo"
          @click="abrirModalRegistro"
        >
          <img src="/recursos/imagenes/mas.svg" alt="+" class="icono-imagen-boton" />
          <span>{{ textoBotonRegistroVehiculo }}</span>
        </button>
      </div>

      <!-- Rejilla de tarjetas vehiculares registradas -->
      <div class="rejilla-vehiculos-usuario">
        <section 
          v-for="vehiculo in vehiculosAutorizados" 
          :key="vehiculo.identificador" 
          class="tarjeta-vehiculo-registrado"
        >
          <div class="fila-cabecera-vehiculo">
            <span class="etiqueta-placa-vehicular">{{ vehiculo.placa }}</span>
            <span class="etiqueta-estado-instalaciones">{{ vehiculo.estadoPresencia }}</span>
          </div>
          <div class="bloque-identificador-sistema">
            <span>Identificador: <span class="dato-valor">{{ vehiculo.identificador }}</span></span>
          </div>
          <div class="rejilla-especificaciones-vehiculo">
            <div class="columna-especificacion">
              <p>Tipo de vehículo: <span>{{ vehiculo.tipo }}</span></p>
              <p>Color: <span>{{ vehiculo.color }}</span></p>
            </div>
            <div class="columna-especificacion">
              <p>Fabricante / Modelo: <span>{{ vehiculo.fabricante }} {{ vehiculo.modelo }}</span></p>
            </div>
          </div>
          <div class="fila-botones-accion-vehiculo">
            <button 
              type="button" 
              class="boton-ficha-vehicular" 
              @click="verFichaVehiculo(vehiculo)"
            >
              <img src="/recursos/imagenes/ficha-vehicular.svg" alt="" class="icono-imagen-boton" />
              <span>Ficha vehicular</span>
            </button>
            <button 
              type="button" 
              class="boton-desvincular-vehiculo" 
              @click="iniciarDesvinculacion(vehiculo)"
            >
              <img src="/recursos/imagenes/eliminar.svg" alt="" class="icono-imagen-boton" />
              <span>Desvincular vehículo</span>
            </button>
          </div>
        </section>
      </div>

      <!-- Tarjeta informativa para solicitar autorización de visitas -->
      <section class="tarjeta-autorizacion-visitas">
        <div class="textos-autorizacion-visitas">
          <h3 class="titulo-seccion-visitas">Autorización de visitas</h3>
          <p class="descripcion-seccion-visitas">
            Solicite la autorización de acceso vehicular para sus visitas antes de su llegada a las instalaciones
          </p>
        </div>
        <button 
          type="button" 
          class="boton-crear-autorizacion" 
          id="boton-abrir-crear-autorizacion"
          @click="abrirModalVisita"
        >
          <img src="/recursos/imagenes/crear-autorizacion.svg" alt="+" class="icono-imagen-boton" />
          <span>Solicitar autorización</span>
        </button>
      </section>

      <!-- Modal: Solicitud de registro vehicular -->
      <ModalBase
        :abierto="modalRegistroAbierto"
        ancho="registro"
        titulo="Solicitud de registro vehicular"
        @cerrar="modalRegistroAbierto = false"
      >
        <BannerInformativo>
          <span class="dato-valor">Estado de autorización:</span> 
          Una vez enviada la solicitud, el vehículo quedará en estado 'Pendiente' mientras se realiza la revisión correspondiente
        </BannerInformativo>

        <form class="formulario-registro-vehiculo" @submit.prevent="enviarSolicitudVehiculo" novalidate>
          <div class="cuerpo-grid-formulario">
            <!-- Placa -->
            <CampoFormulario etiqueta="Placa vehicular" :error="erroresVehiculo.placa">
              <input 
                v-model="formularioVehiculo.placa" 
                type="text" 
                class="campo-texto-modal" 
                :maxlength="longitudMaximaPlaca"
                :placeholder="placeholderPlaca"
                @input="normalizarPlacaCampo(formularioVehiculo, erroresVehiculo, 'placa', longitudMaximaPlaca, store.placaEstaRegistrada)"
                @blur="validarPlacaVehiculo"
              />
            </CampoFormulario>

            <!-- Tipo de vehículo -->
            <CampoFormulario etiqueta="Tipo de vehículo" :error="erroresVehiculo.tipo">
              <select 
                v-model="formularioVehiculo.tipo" 
                class="campo-texto-modal"
                :class="{ 'campo-sin-seleccion': !formularioVehiculo.tipo }"
                @change="alCambiarTipoVehiculo"
              >
                <option value="" disabled>Elija una opción</option>
                <option v-for="tipo in TIPOS_VEHICULO" :key="tipo" :value="tipo">{{ tipo }}</option>
              </select>
            </CampoFormulario>

            <!-- Fabricante -->
            <CampoFormulario etiqueta="Fabricante" :error="erroresVehiculo.fabricante">
              <input 
                v-model="formularioVehiculo.fabricante" 
                type="text" 
                class="campo-texto-modal" 
                list="lista-fabricantes-vehiculo"
                :maxlength="LIMITES_VEHICULO.longitudMaximaFabricante"
                placeholder="Ej. Toyota"
                @input="alCambiarFabricanteVehiculo"
                @change="alCambiarFabricanteVehiculo"
              />
              <datalist id="lista-fabricantes-vehiculo">
                <option v-for="fab in FABRICANTES_COMUNES" :key="fab" :value="fab" />
              </datalist>
            </CampoFormulario>

            <!-- Modelo -->
            <CampoFormulario etiqueta="Modelo" :error="erroresVehiculo.modelo">
              <input 
                v-model="formularioVehiculo.modelo" 
                type="text" 
                class="campo-texto-modal" 
                list="lista-modelos-vehiculo"
                :maxlength="LIMITES_VEHICULO.longitudMaximaModelo"
                placeholder="Ej. Raize"
                @input="normalizarDetalleVehiculo(formularioVehiculo, erroresVehiculo, 'modelo')"
              />
              <datalist id="lista-modelos-vehiculo">
                <option v-for="mod in modelosSugeridosVehiculo" :key="mod" :value="mod" />
              </datalist>
            </CampoFormulario>

            <!-- Color -->
            <CampoFormulario etiqueta="Color" :error="erroresVehiculo.color">
              <input 
                v-model="formularioVehiculo.color" 
                type="text" 
                class="campo-texto-modal" 
                :maxlength="LIMITES_VEHICULO.longitudMaximaColor"
                placeholder="Ej. Blanco"
                @input="normalizarDetalleVehiculo(formularioVehiculo, erroresVehiculo, 'color')"
              />
            </CampoFormulario>

            <!-- Año de fabricación -->
            <CampoFormulario etiqueta="Año de fabricación" :error="erroresVehiculo.anio">
              <input 
                v-model="formularioVehiculo.anio" 
                type="text"
                inputmode="numeric"
                maxlength="4"
                class="campo-texto-modal" 
                placeholder="Ej. 2020" 
                @input="normalizarAnioVehiculo(formularioVehiculo, erroresVehiculo)"
              />
            </CampoFormulario>

            <!-- Observaciones -->
            <CampoFormulario etiqueta="Observaciones" ancho-completo>
              <textarea 
                v-model="formularioVehiculo.observaciones" 
                class="campo-area-texto-modal" 
                :maxlength="LIMITES_VEHICULO.longitudMaximaObservaciones"
                placeholder="Proporcione información adicional que facilite la identificación del vehículo. (Opcional)"
              ></textarea>
            </CampoFormulario>
          </div>

          <AccionesFormularioModal
            texto-confirmar="Enviar solicitud"
            @cancelar="modalRegistroAbierto = false"
          />
        </form>
      </ModalBase>

      <!-- Modal: Confirmación de solicitud enviada -->
      <ModalConfirmacionExito
        :abierto="modalExitoRegistroAbierto"
        titulo="Solicitud registrada correctamente"
        :mensaje="mensajeFechaRegistro"
        @cerrar="modalExitoRegistroAbierto = false"
      />

      <!-- Modal: Ficha técnica vehicular -->
      <ModalFichaVehicular
        :abierto="modalFichaAbierto"
        :vehiculo="vehiculoSeleccionado"
        @cerrar="modalFichaAbierto = false"
      />

      <!-- Modal: Confirmar desvinculación vehicular -->
      <ModalDesvincular
        :abierto="modalDesvincularAbierto"
        :identificador="vehiculoSeleccionado?.identificador || ''"
        @confirmar="ejecutarDesvinculacion"
        @cerrar="modalDesvincularAbierto = false"
      />

      <!-- Modal: Desvinculación completada -->
      <ModalConfirmacionExito
        :abierto="modalExitoDesvinculacionAbierto"
        titulo="Desvinculación completada"
        mensaje="La desvinculación se ha realizado satisfactoriamente. El vehículo ya no se encuentra asociado a la cuenta institucional y no dispone de autorización para acceder a las instalaciones."
        @cerrar="modalExitoDesvinculacionAbierto = false"
      />

      <!-- Modal: Notificación de resolución administrativa de solicitudes -->
      <ModalConfirmacionExito
        :abierto="modalNotificacionResolucionAbierto && Boolean(notificacionResolucion)"
        :titulo="notificacionResolucion?.titulo || ''"
        :mensaje="notificacionResolucion?.mensaje || ''"
        :tipo="notificacionResolucion?.tipoModal || 'confirmacion'"
        @cerrar="aceptarNotificacionResolucion"
      />

      <!-- Modal: Autorización de visitas -->
      <ModalBase
        :abierto="modalVisitaAbierto"
        ancho="registro"
        titulo="Autorización de acceso vehicular"
        @cerrar="modalVisitaAbierto = false"
      >

          <BannerInformativo>
            Los datos registrados facilitarán el proceso de identificación y control del acceso vehicular dentro de las instalaciones de la institución
          </BannerInformativo>

          <form class="formulario-registro-vehiculo" @submit.prevent="enviarSolicitudVisita" novalidate>
            <!-- Sección 1: Información del visitante -->
            <div class="seccion-formulario-modal">
              <h4 class="titulo-seccion-grande">Información del visitante</h4>
              <div class="cuerpo-grid-formulario">
                <CampoFormulario etiqueta="Apellidos y nombres" :error="erroresVisita.nombres">
                  <input 
                    v-model="formularioVisita.nombres" 
                    type="text" 
                    class="campo-texto-modal" 
                    placeholder="Ej. Alcivar Mero Luis Alfonso"
                    maxlength="80"
                    @input="normalizarNombrePersona(formularioVisita, erroresVisita)"
                  />
                </CampoFormulario>

                <CampoFormulario etiqueta="Tipo de identificación" :error="erroresVisita.tipoIdentificacion">
                  <select 
                    v-model="formularioVisita.tipoIdentificacion" 
                    class="campo-texto-modal"
                    :class="{ 'campo-sin-seleccion': !formularioVisita.tipoIdentificacion }"
                    @change="alCambiarTipoIdentificacionVisita"
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

                <CampoFormulario etiqueta="Número de identificación" :error="erroresVisita.numeroIdentificacion">
                  <input 
                    v-model="formularioVisita.numeroIdentificacion" 
                    type="text" 
                    class="campo-texto-modal" 
                    placeholder="Ej. 1307892139"
                    :maxlength="longitudMaximaDocVisita"
                    @input="normalizarDocVisita"
                    @change="normalizarDocVisita"
                    @blur="validarDocumentoVisita"
                  />
                </CampoFormulario>

                <CampoFormulario etiqueta="Número de teléfono" :error="erroresVisita.telefono">
                  <input 
                    v-model="formularioVisita.telefono" 
                    type="text" 
                    class="campo-texto-modal" 
                    placeholder="Ej. 0991237891"
                    maxlength="10"
                    inputmode="numeric"
                    @input="normalizarTelefono(formularioVisita, erroresVisita)"
                  />
                </CampoFormulario>
              </div>
            </div>

            <!-- Sección 2: Información del vehículo visitante -->
            <SeccionDesplegable v-model:abierta="seccionVehiculoVisitaAbierta" titulo="Información del vehículo">
              <CampoFormulario etiqueta="Placa vehicular" :error="erroresVisita.placa">
                <input 
                  v-model="formularioVisita.placa" 
                  type="text" 
                  class="campo-texto-modal" 
                  maxlength="8"
                  placeholder="Ej. PCN9041"
                  @input="normalizarPlacaCampo(formularioVisita, erroresVisita, 'placa', 8, store.placaEstaRegistrada)"
                  @blur="validarPlacaVisita"
                />
              </CampoFormulario>

              <CampoFormulario etiqueta="Tipo de vehículo" :error="erroresVisita.tipoVehiculo">
                <select 
                  v-model="formularioVisita.tipoVehiculo" 
                  class="campo-texto-modal"
                  :class="{ 'campo-sin-seleccion': !formularioVisita.tipoVehiculo }"
                  @change="erroresVisita.tipoVehiculo = ''"
                >
                  <option value="" disabled>Elija una opción</option>
                  <option v-for="tipo in TIPOS_VEHICULO" :key="tipo" :value="tipo">{{ tipo }}</option>
                </select>
              </CampoFormulario>

              <CampoFormulario etiqueta="Fabricante" :error="erroresVisita.fabricante">
                <input 
                  v-model="formularioVisita.fabricante" 
                  type="text" 
                  class="campo-texto-modal" 
                  list="lista-fabricantes-visita"
                  :maxlength="LIMITES_VEHICULO.longitudMaximaFabricante"
                  placeholder="Ej. Toyota"
                  @input="alCambiarFabricanteVisita"
                  @change="alCambiarFabricanteVisita"
                />
                <datalist id="lista-fabricantes-visita">
                  <option v-for="fab in FABRICANTES_COMUNES" :key="fab" :value="fab" />
                </datalist>
              </CampoFormulario>

              <CampoFormulario etiqueta="Modelo" :error="erroresVisita.modelo">
                <input 
                  v-model="formularioVisita.modelo" 
                  type="text" 
                  class="campo-texto-modal" 
                  list="lista-modelos-visita"
                  :maxlength="LIMITES_VEHICULO.longitudMaximaModelo"
                  placeholder="Ej. Raize"
                  @input="normalizarDetalleVehiculo(formularioVisita, erroresVisita, 'modelo')"
                />
                <datalist id="lista-modelos-visita">
                  <option v-for="mod in modelosSugeridosVisita" :key="mod" :value="mod" />
                </datalist>
              </CampoFormulario>

              <CampoFormulario etiqueta="Color" :error="erroresVisita.color">
                <input 
                  v-model="formularioVisita.color" 
                  type="text" 
                  class="campo-texto-modal" 
                  :maxlength="LIMITES_VEHICULO.longitudMaximaColor"
                  placeholder="Ej. Blanco"
                  @input="normalizarDetalleVehiculo(formularioVisita, erroresVisita, 'color')"
                />
              </CampoFormulario>
            </SeccionDesplegable>

            <!-- Sección 3: Detalle de la visita programada -->
            <SeccionDesplegable v-model:abierta="seccionDetalleVisitaAbierta" titulo="Detalle de la visita">
              <CampoFormulario etiqueta="Fecha programada" :error="erroresVisita.fecha">
                <input 
                  v-model="formularioVisita.fecha" 
                  type="date" 
                  class="campo-texto-modal"
                  :class="{ 'campo-sin-seleccion': !formularioVisita.fecha }"
                  :min="fechaMinimaVisita"
                  :max="fechaMaximaVisita"
                  @click="$event.target.showPicker && $event.target.showPicker()"
                  @input="erroresVisita.fecha = ''"
                />
              </CampoFormulario>

              <CampoFormulario etiqueta="Hora programada" :error="erroresVisita.hora">
                <input 
                  v-model="formularioVisita.hora" 
                  type="time" 
                  min="07:00"
                  max="19:00"
                  class="campo-texto-modal"
                  :class="{ 'campo-sin-seleccion': !formularioVisita.hora }"
                  @click="$event.target.showPicker && $event.target.showPicker()"
                  @input="erroresVisita.hora = ''"
                />
              </CampoFormulario>

              <CampoFormulario etiqueta="Motivo de la visita" :error="erroresVisita.motivo">
                <select 
                  v-model="formularioVisita.motivo" 
                  class="campo-texto-modal"
                  :class="{ 'campo-sin-seleccion': !formularioVisita.motivo }"
                  @change="erroresVisita.motivo = ''"
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

              <CampoFormulario etiqueta="Área de destino" :error="erroresVisita.destino" ancho-completo>
                <textarea 
                  v-model="formularioVisita.destino" 
                  class="campo-area-texto-modal" 
                  maxlength="100"
                  placeholder="Especifique la facultad, departamento u oficina de destino"
                  @input="erroresVisita.destino = ''"
                ></textarea>
              </CampoFormulario>
            </SeccionDesplegable>

            <AccionesFormularioModal
              texto-confirmar="Enviar solicitud"
              @cancelar="modalVisitaAbierto = false"
            />
          </form>
      </ModalBase>

    </main>
  </div>
</template>