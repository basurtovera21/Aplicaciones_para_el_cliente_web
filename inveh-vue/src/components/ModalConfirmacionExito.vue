<script setup>

// Componente modal especializado para feedback visual positivo (icono verde de confirmación).
// Recibe 'titulo' y 'mensaje' como props obligatorias y notifica el cierre mediante el evento 'cerrar'.
import ModalBase from './ModalBase.vue'

defineProps({
  abierto: {
    type: Boolean,
    required: true
  },
  titulo: {
    type: String,
    required: true
  },
  mensaje: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    default: 'confirmacion'
  },
  modalId: {
    type: String,
    default: ''
  }
})

defineEmits(['cerrar'])
</script>

<template>
  <ModalBase
    :abierto="abierto"
    :modal-id="modalId"
    ancho="confirmacion"
    clase-contenedor="modal-contenedor-confirmacion"
    :titulo="titulo"
    @cerrar="$emit('cerrar')"
  >
    <div class="cuerpo-modal-confirmacion">
      <div class="contenedor-imagen-alerta">
        <img
          :src="tipo === 'advertencia' ? '/recursos/imagenes/alerta.svg' : '/recursos/imagenes/confirmacion.svg'"
          :alt="tipo === 'advertencia' ? 'Alerta' : 'Éxito'"
          class="icono-visual-alerta"
        />
      </div>
      <div class="bloque-texto-informativo">
        <p class="descripcion-alerta-modal">{{ mensaje }}</p>
      </div>
    </div>

    <div class="contenedor-acciones-centrado">
      <button
        type="button"
        class="boton-accion-modal fondo-neutro"
        @click="$emit('cerrar')"
      >
        <img src="/recursos/imagenes/aceptar.svg" alt="" class="icono-boton-modal" />
        <span>Aceptar</span>
      </button>
    </div>
  </ModalBase>
</template>