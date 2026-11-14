// Composable.- Es una función que aprovecha la Composition API de Vue para encapsular y reutilizar
// lógica reactiva con estado en diferentes componentes.

import { onMounted, onUnmounted } from 'vue'

// Escucha la tecla Escape mientras la vista esté montada y cierra el modal
// abierto con mayor prioridad según el orden del arreglo recibido.
export function useTeclaEscape(modalesPorPrioridad) {
  function cerrarModalSuperiorEscape(evento) {
    if (evento.key !== 'Escape') return
    const modalActivo = modalesPorPrioridad.find(modal => modal.value)
    if (modalActivo) {
      modalActivo.value = false
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', cerrarModalSuperiorEscape)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', cerrarModalSuperiorEscape)
  })
}