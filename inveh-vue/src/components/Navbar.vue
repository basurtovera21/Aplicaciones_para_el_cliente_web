<script setup>
// GUÍA DIDÁCTICA: BARRA DE NAVEGACIÓN INSTITUCIONAL (Navbar.vue)
//
// 1. Vue Router ('useRoute' y 'useRouter'):
//    - 'useRoute()': Proporciona información reactiva de la ruta activa (ej. 'route.name').
//    - 'useRouter()': Objeto que permite redirigir al usuario programáticamente ('router.push').
//
// 2. Renderizado Condicional:
//    - Si estamos en la pantalla de login ('esPantallaInicioSesion'), muestra el lema de la universidad.
//    - Si hay un usuario autenticado, renderiza su nombre, rol y el botón para cerrar sesión.
//
// 3. Enlace Dinámico de Clases CSS (:class):
//    ':class="{ 'barra-navegacion-inicio-sesion': esPantallaInicioSesion }"' aplica la clase CSS
//    únicamente cuando la propiedad computada es verdadera.
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInvehStore } from '../stores/inveh'

const route = useRoute()
const router = useRouter()
const store = useInvehStore()

// Determina si la vista activa es el inicio de sesión
const esPantallaInicioSesion = computed(() => {
  return route.name === 'inicio-sesion' || !store.estaAutenticado
})

// Título descriptivo para el área derecha de la cabecera según el rol
const nombreSesion = computed(() => {
  if (!store.usuarioActual) return ''
  const rol = store.usuarioActual.rol_sistema
  if (rol === 'usuario_administrativo' || rol === 'personal_operacion') {
    return store.usuarioActual.area_asignada || (rol === 'usuario_administrativo' ? 'Administracion' : 'Punto de control N01')
  }
  return store.usuarioActual.nombres_apellidos || 'Usuario institucional'
})

// Subtítulo del rol que acompaña al nombre
const rolSesion = computed(() => {
  if (!store.usuarioActual) return ''
  const rol = store.usuarioActual.rol_sistema
  if (rol === 'usuario_administrativo') {
    return 'Personal administrativo'
  }
  if (rol === 'personal_operacion') {
    return 'Personal de operación'
  }
  return 'Usuario institucional'
})

// Finaliza la sesión en el almacén global y redirige al inicio de sesión
function cerrarSesionUsuario() {
  store.cerrarSesion()
  router.push('/inicio-sesion')
}
</script>

<template>
  <header class="barra-navegacion" :class="{ 'barra-navegacion-inicio-sesion': esPantallaInicioSesion }">
    <div class="barra-navegacion-identidad">
      <img 
        src="/recursos/imagenes/logotipo-uleam.png" 
        alt="Logotipo institucional ULEAM" 
        class="barra-navegacion-identificador"
      />
      <div class="barra-navegacion-textos-identidad">
        <span class="barra-navegacion-titulo">Inveh</span>
        <span class="barra-navegacion-subtitulo">Plataforma de identificación y control vehicular</span>
      </div>
    </div>

    <div class="barra-navegacion-usuario">
      <!-- Caso 1: Pantalla de inicio de sesión -->
      <span v-if="esPantallaInicioSesion" class="barra-navegacion-institucion">
        Universidad Laica “Eloy Alfaro de Manabí”
      </span>

      <!-- Caso 2: Sesión activa en cualquier módulo -->
      <template v-else>
        <div class="barra-navegacion-detalles-usuario">
          <span class="nombre-usuario-sesion">{{ nombreSesion }}</span>
          <span class="rol-usuario-sesion">{{ rolSesion }}</span>
        </div>
        <button 
          type="button" 
          class="boton-cerrar-sesion" 
          @click="cerrarSesionUsuario" 
          aria-label="Cerrar sesión"
        >
          <img src="/recursos/imagenes/cerrar-sesion.svg" alt="Cerrar sesión" class="icono-imagen" />
        </button>
      </template>
    </div>
  </header>
</template>
