<script setup>
// Componente envoltorio para campos de formulario.
// - Estandariza la etiqueta (label), el control de entrada (mediante <slot />)
//   y el mensaje de error de validación en una sola estructura reutilizable.
defineProps({
  // Texto que describe el dato solicitado
  etiqueta: {
    type: String,
    required: true
  },
  // Mensaje de error de validación (si está vacío, no se muestra)
  error: {
    type: String,
    default: undefined
  },
  forId: {
    type: String,
    default: ''
  },
  errorId: {
    type: String,
    default: ''
  },
  // Si es verdadero, el campo se expande para ocupar todo el ancho de la fila
  anchoCompleto: {
    type: Boolean,
    default: false
  },
  // Variante visual ('modal' para ventanas emergentes o 'inicio-sesion' para login)
  variante: {
    type: String,
    default: 'modal'
  }
})
</script>

<template>
  <div
    :class="[
      variante === 'inicio-sesion' ? 'bloque-campo-inicio-sesion' : 'bloque-campo-formulario',
      { 'campo-ancho-completo': anchoCompleto, 'campo-con-error': Boolean(error) }
    ]"
  >
    <label
      :for="forId || undefined"
      :class="variante === 'inicio-sesion' ? 'etiqueta-formulario-inicio-sesion' : 'etiqueta-formulario'"
    >
      {{ etiqueta }}
    </label>

    <!-- El slot permite que el componente padre coloque un input, select o textarea -->
    <slot />

    <!-- Mensaje de alerta visual cuando el campo tiene un error de validación -->
    <span
      v-if="error !== undefined"
      :id="errorId || undefined"
      class="texto-alerta-error"
      :class="{ visible: Boolean(error && error.trim()) }"
    >
      {{ error }}
    </span>
  </div>
</template>