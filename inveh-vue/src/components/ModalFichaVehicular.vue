<script setup>
// 1. Composición sobre Herencia:
//    Envuelve el componente estructural 'ModalBase', transmitiéndole props
//    y re-emitiendo sus eventos hacia el componente padre que lo invocó.
//
// 2. Props tipadas ('defineProps'):
//    - 'abierto': Booleano que controla si la ventana modal está activa o no.
//    - 'vehiculo': Objeto con las propiedades del vehículo a visualizar.
//    - 'modalId': Identificador HTML opcional para testing automatizado.
//
// 3. Fallback de imágenes resiliente:
//    Si la imagen del código QR institucional no se encuentra en el servidor local,
//    el evento '@error' activa 'usarRespaldoQr', cargando inmediatamente el QR por defecto.
import { ref, computed, watch, useSlots } from 'vue'
import ModalBase from './ModalBase.vue'
import { obtenerRutaCodigoQr, RUTA_QR_RESPALDO } from '../utils/qr'

const props = defineProps({
  abierto: {
    type: Boolean,
    required: true
  },
  vehiculo: {
    type: Object,
    default: null
  },
  modalId: {
    type: String,
    default: ''
  }
})

defineEmits(['cerrar'])

const slots = useSlots()
const usarRespaldoQr = ref(false)

watch(
  () => [props.abierto, props.vehiculo?.identificador, props.vehiculo?.placa, props.vehiculo?.codigoQrRuta],
  () => {
    usarRespaldoQr.value = false
  }
)

const rutaImagenQr = computed(() => {
  return usarRespaldoQr.value ? RUTA_QR_RESPALDO : obtenerRutaCodigoQr(props.vehiculo)
})

const fechaRegistro = computed(() => {
  return (props.vehiculo?.fechaSolicitud || '').split('T')[0]
})

const fechaActualizacion = computed(() => {
  const fecha = props.vehiculo?.fechaActualizacion
    || props.vehiculo?.fechaAprobacion
    || props.vehiculo?.fechaSolicitud
    || ''
  return fecha.split('T')[0] || ''
})
</script>

<template>
  <ModalBase
    :abierto="abierto && Boolean(vehiculo)"
    :modal-id="modalId"
    ancho="ficha"
    titulo="Ficha vehicular"
    @cerrar="$emit('cerrar')"
  >
    <div class="cuerpo-grid-ficha">
      <!-- Fila 1: Placa e identificador institucional -->
      <div class="fila-centrada-modal">
        <span class="etiqueta-placa-ficha">{{ vehiculo?.placa }}</span>
      </div>
      <div class="fila-centrada-modal">
        <span class="identificador-texto-modal">
          Identificador: <span class="dato-valor">{{ vehiculo?.identificador }}</span>
        </span>
      </div>

      <!-- Fila 2: Código QR e información del registro -->
      <div class="tarjeta-qr-modal">
        <img
          :src="rutaImagenQr"
          alt="Código QR institucional"
          class="imagen-qr-modal"
          @error="usarRespaldoQr = true"
        />
      </div>
      <div class="tarjeta-informacion-modal">
        <h4 class="subtitulo-modal">Información del registro</h4>
        <div class="lista-datos-modal">
          <p class="item-dato-modal">Fecha de registro: <span>{{ fechaRegistro }}</span></p>
          <p class="item-dato-modal">Fecha de actualización: <span>{{ fechaActualizacion }}</span></p>
          <p class="item-dato-modal">Estado de autorización: <span>{{ vehiculo?.estadoAutorizacion || 'Autorizado' }}</span></p>
        </div>
      </div>

      <!-- Fila 3: Información de vehículo y propietario -->
      <div class="tarjeta-informacion-modal">
        <h4 class="subtitulo-modal">Información del vehículo</h4>
        <div class="lista-datos-modal">
          <p class="item-dato-modal">Tipo de vehículo: <span>{{ vehiculo?.tipo }}</span></p>
          <p class="item-dato-modal">Fabricante / Modelo: <span>{{ vehiculo?.fabricante }} {{ vehiculo?.modelo }}</span></p>
          <p class="item-dato-modal">Año de fabricación: <span>{{ vehiculo?.anio }}</span></p>
          <p class="item-dato-modal">Color: <span>{{ vehiculo?.color }}</span></p>
          <p class="item-dato-modal">Observaciones: <span>{{ vehiculo?.observaciones }}</span></p>
        </div>
      </div>
      <div class="tarjeta-informacion-modal">
        <h4 class="subtitulo-modal">Información del propietario</h4>
        <div class="lista-datos-modal">
          <p class="item-dato-modal">Apellidos y nombres: <span>{{ vehiculo?.propietario?.nombres_apellidos || vehiculo?.nombrePersona }}</span></p>
          <p class="item-dato-modal">Número de identificación: <span>{{ vehiculo?.propietario?.numero_identificacion || vehiculo?.identificacionPersona }}</span></p>
          <p class="item-dato-modal">Correo institucional: <span>{{ vehiculo?.propietario?.correo_institucional || vehiculo?.correoPersona || 'No aplica' }}</span></p>
          <p class="item-dato-modal">Tipo de usuario: <span>{{ vehiculo?.propietario?.tipo_usuario || vehiculo?.tipoUsuarioPersona }}</span></p>
          <p class="item-dato-modal">Facultad: <span>{{ vehiculo?.propietario?.facultad || vehiculo?.facultadPersona }}</span></p>
          <p class="item-dato-modal">Carrera: <span>{{ vehiculo?.propietario?.carrera || vehiculo?.carreraPersona || 'No aplica' }}</span></p>
        </div>
      </div>

      <div v-if="!slots['acciones-pie']" class="contenedor-acciones-modal">
        <button
          type="button"
          class="boton-accion-modal fondo-neutro"
          @click="$emit('cerrar')"
        >
          <img src="/recursos/imagenes/aceptar.svg" alt="" class="icono-boton-modal" />
          <span>Aceptar</span>
        </button>
      </div>
    </div>

    <slot name="acciones-pie" />
  </ModalBase>
</template>
