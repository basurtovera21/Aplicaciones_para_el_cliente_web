<script setup>
// GUÍA DIDÁCTICA: BOTONES DE ACCIÓN PARA MODALES DE FORMULARIO (AccionesFormularioModal.vue)
//
// Reutiliza la botonera estándar de modales:
// - Botón de envío (type="submit") con texto e icono configurables por prop.
// - Botón de cancelación (type="button") que emite el evento 'cancelar'.
defineProps({
  textoConfirmar: {
    type: String,
    required: true
  },
  iconoConfirmar: {
    type: String,
    default: '/recursos/imagenes/aceptar.svg'
  }
})

defineEmits(['cancelar'])
</script>

<template>
  <div class="contenedor-acciones-extremos">
    <button type="submit" class="boton-accion-modal fondo-neutro">
      <img :src="iconoConfirmar" alt="" class="icono-boton-modal" />
      <span>{{ textoConfirmar }}</span>
    </button>
    <button
      type="button"
      class="boton-accion-modal fondo-cancelar"
      @click="$emit('cancelar')"
    >
      <img src="/recursos/imagenes/eliminar.svg" alt="" class="icono-boton-modal" />
      <span>Cancelar</span>
    </button>
  </div>
</template>
