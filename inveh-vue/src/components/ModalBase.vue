<script setup>
// Componente base para ventanas modales en Vue 3.
//
// Conceptos clave de Vue utilizados:
// - defineProps: Declara los datos que este componente recibe desde su componente padre.
// - defineEmits: Declara los eventos que este componente puede emitir hacia el componente padre.
// - <slot />: Punto de inserción donde el componente padre inyecta su propio contenido HTML/Vue.
// - @click.self: Modificador de evento que solo dispara la acción si se hace clic exactamente sobre el fondo oscuro (overlay), no sobre sus hijos.

defineProps({
  // Controla la visibilidad del modal (verdadero para mostrar, falso para ocultar)
  abierto: {
    type: Boolean,
    required: true
  },
  // Título principal que se muestra en la cabecera del modal
  titulo: {
    type: String,
    required: true
  },
  // Tamaño o ancho del modal (ej: 'registro', 'ficha', 'confirmacion', 'mediano')
  ancho: {
    type: String,
    default: 'mediano'
  },
  // Clase CSS opcional para personalizar estilos específicos del contenedor
  claseContenedor: {
    type: String,
    default: ''
  },
  // Identificador HTML opcional (útil para pruebas o reglas de estilo puntuales)
  modalId: {
    type: String,
    default: ''
  },
  // Alineación del título: centrado por defecto, a la izquierda si es verdadero
  tituloIzquierda: {
    type: Boolean,
    default: false
  }
})

// Evento 'cerrar' para avisar al componente padre que debe cambiar su variable de apertura a falso
defineEmits(['cerrar'])
</script>

<template>
  <!-- La directiva v-if monta o destruye el elemento en el DOM según la condición 'abierto' -->
  <div
    v-if="abierto"
    :id="modalId || undefined"
    class="superposicion-modal activo"
    role="dialog"
    @click.self="$emit('cerrar')"
  >
    <div
      class="contenedor-modal"
      :class="[`modal-ancho-${ancho}`, claseContenedor]"
    >
      <div
        class="cabecera-modal"
        :style="tituloIzquierda ? { justifyContent: 'flex-start', paddingLeft: '0', marginBottom: '12px' } : undefined"
      >
        <h3
          class="titulo-modal"
          :style="tituloIzquierda ? { textAlign: 'left', margin: '0', paddingRight: '48px' } : undefined"
        >
          {{ titulo }}
        </h3>
        <button
          type="button"
          class="boton-cerrar-modal"
          @click="$emit('cerrar')"
          aria-label="Cerrar modal"
        >
          <img src="/recursos/imagenes/eliminar.svg" alt="Cerrar" class="icono-cerrar-modal" />
        </button>
      </div>

      <!-- El slot recibe el contenido dinámico provisto por cada vista que use este modal -->
      <slot />
    </div>
  </div>
</template>
