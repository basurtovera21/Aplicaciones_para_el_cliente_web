<script setup>
// Reutiliza los botones de aprobación y rechazo en las solicitudes de revisión,
// emitiendo 'aceptar' o 'rechazar' al componente padre.
defineEmits(['aceptar', 'rechazar'])
</script>

<template>
  <div class="contenedor-acciones-revision acciones-revision-dos-botones">
    <button
      type="button"
      class="boton-solicitud-admin fondo-neutro"
      @click="$emit('aceptar')"
    >
      <img src="/recursos/imagenes/aceptar.svg" alt="" />
      <span>Aceptar solicitud</span>
    </button>
    <button
      type="button"
      class="boton-solicitud-admin fondo-peligro"
      @click="$emit('rechazar')"
    >
      <img src="/recursos/imagenes/eliminar.svg" alt="" />
      <span>Rechazar solicitud</span>
    </button>
  </div>
</template>