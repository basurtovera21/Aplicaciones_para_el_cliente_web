// GUÍA DIDÁCTICA: COMPOSABLES EN VUE 3 (useTeclaEscape.js)
//
// 1. ¿Qué es un Composable?
//    Es una función que aprovecha la Composition API de Vue para encapsular y reutilizar
//    lógica reactiva con estado en diferentes componentes (reemplaza a los antiguos mixins).
//
// 2. Ciclos de vida en composables:
//    Permite registrar 'onMounted' y 'onUnmounted' directamente, asegurando que los
//    listeners globales en 'window' se limpien automáticamente al destruir el componente,
//    evitando fugas de memoria (memory leaks).
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
