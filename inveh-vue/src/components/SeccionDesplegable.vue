<script setup>
// Componente de acordeón / sección desplegable.
//
// Concepto didáctico de Vue 3 (Two-way binding con v-model con argumento):
// - Soporta 'v-model:abierta': Permite que el padre controle la apertura externamente
//   (por ejemplo, para abrirla automáticamente cuando hay errores de validación).
// - Si el padre no pasa 'v-model:abierta', el componente gestiona su propio estado interno
//   mediante la variable reactiva 'internaAbierta'.
import { ref, computed } from 'vue'

const props = defineProps({
  titulo: {
    type: String,
    required: true
  },
  inicialmenteAbierta: {
    type: Boolean,
    default: true
  },
  abierta: {
    type: Boolean,
    default: undefined
  }
})

const emit = defineEmits(['update:abierta'])

// Estado reactivo interno en caso de uso autónomo
const internaAbierta = ref(props.inicialmenteAbierta)

// Propiedad computada: decide si tomar el valor externo (si existe) o el interno
const estaAbierta = computed(() => {
  return props.abierta !== undefined ? props.abierta : internaAbierta.value
})

// Alterna el estado de visibilidad del contenido desplegable.
// Emite el evento estándar de Vue 3 'update:abierta' si el padre tiene v-model enlazado.
function alternarVisibilidad() {
  if (props.abierta !== undefined) {
    emit('update:abierta', !props.abierta)
  } else {
    internaAbierta.value = !internaAbierta.value
  }
}
</script>

<template>
  <div class="seccion-formulario-modal">
    <button
      type="button"
      class="boton-desplegar-compacto"
      :class="{ activo: estaAbierta }"
      @click="alternarVisibilidad"
    >
      <h4 class="titulo-seccion-grande">{{ titulo }}</h4>
      <img src="/recursos/imagenes/select.svg" alt="v" class="icono-flecha-pequena" />
    </button>

    <div class="contenido-desplegable" :class="{ visible: estaAbierta }">
      <div class="cuerpo-grid-formulario">
        <slot />
      </div>
    </div>
  </div>
</template>
