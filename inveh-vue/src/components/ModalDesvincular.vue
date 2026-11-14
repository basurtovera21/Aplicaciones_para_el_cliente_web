<script setup>
// GUÍA DIDÁCTICA: MODAL DE ADVERTENCIA PARA ACCIONES DESTRUCTIVAS (ModalDesvincular.vue)
//
// Componente que solicita confirmación antes de anular la autorización de un vehículo.
// Emite 'confirmar' al pulsar el botón de peligro y 'cerrar' si el usuario cancela.
import ModalBase from './ModalBase.vue'

defineProps({
  abierto: {
    type: Boolean,
    required: true
  },
  identificador: {
    type: String,
    default: ''
  },
  modalId: {
    type: String,
    default: ''
  }
})

defineEmits(['confirmar', 'cerrar'])
</script>

<template>
  <ModalBase
    :abierto="abierto && Boolean(identificador)"
    :modal-id="modalId"
    ancho="confirmacion"
    clase-contenedor="modal-contenedor-confirmacion"
    titulo="Confirmar desvinculación"
    @cerrar="$emit('cerrar')"
  >
    <div class="cuerpo-modal-confirmacion">
      <div class="contenedor-imagen-alerta">
        <img src="/recursos/imagenes/alerta.svg" alt="Alerta" class="icono-visual-alerta" />
      </div>
      <div class="bloque-texto-informativo">
        <p class="identificador-vehiculo-enfasis">
          Identificador: <span class="dato-valor">{{ identificador }}</span>
        </p>
        <p class="descripcion-alerta-modal">
          Al desvincular este vehículo, su autorización de acceso quedará invalidada y no podrá ingresar a las instalaciones.
        </p>
      </div>
    </div>

    <div class="contenedor-acciones-horizontal">
      <button
        type="button"
        class="boton-accion-modal fondo-peligro"
        @click="$emit('confirmar')"
      >
        <img src="/recursos/imagenes/aceptar.svg" alt="" class="icono-boton-modal" />
        <span>Sí, desvincular</span>
      </button>
      <button
        type="button"
        class="boton-accion-modal fondo-cancelar"
        @click="$emit('cerrar')"
      >
        <img src="/recursos/imagenes/eliminar.svg" alt="" class="icono-boton-modal" />
        <span>Cancelar</span>
      </button>
    </div>
  </ModalBase>
</template>
