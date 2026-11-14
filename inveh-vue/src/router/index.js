import { createRouter, createWebHistory } from 'vue-router'
import InicioSesionView from '../views/InicioSesionView.vue'
import UsuarioView from '../views/UsuarioView.vue'
import AdministracionView from '../views/AdministracionView.vue'
import PuntoControlView from '../views/PuntoControlView.vue'

// Clave utilizada para almacenar la sesión activa en el navegador
const CLAVE_SESION_ACTIVA = 'inveh_sesion_activa'

// Obtiene el rol del usuario actualmente autenticado desde localStorage.
// @returns {string|null} Rol del usuario ('usuario_institucional', 'usuario_administrativo', 'personal_operacion') o null si no hay sesión.
function obtenerRolSesion() {
  try {
    const sesion = JSON.parse(localStorage.getItem(CLAVE_SESION_ACTIVA) || 'null')
    return sesion?.rol_sistema || null
  } catch {
    return null
  }
}

// Definición de rutas del sistema:
// Cada ruta asocia un camino (path) con un componente de vista (View).
// La propiedad 'meta.requiereRol' indica qué rol de usuario tiene autorización para acceder.
const routes = [
  {
    path: '/',
    redirect: '/inicio-sesion'
  },
  {
    path: '/inicio-sesion',
    name: 'inicio-sesion',
    component: InicioSesionView
  },
  {
    path: '/usuario',
    name: 'usuario',
    component: UsuarioView,
    meta: { requiereRol: 'usuario_institucional' }
  },
  {
    path: '/administracion',
    name: 'administracion',
    component: AdministracionView,
    meta: { requiereRol: 'usuario_administrativo' }
  },
  {
    path: '/punto-control',
    name: 'punto-control',
    component: PuntoControlView,
    meta: { requiereRol: 'personal_operacion' }
  },
  {
    // Ruta para capturar cualquier dirección no registrada y redirigir al inicio de sesión.
    path: '/:pathMatch(.*)*',
    redirect: '/inicio-sesion'
  }
]

// Creación de la instancia del enrutador con historial HTML5 limpio
const router = createRouter({
  history: createWebHistory(),
  routes
})


// Verifica si la ruta destino requiere un rol específico y si el usuario dispone de una sesión válida.
router.beforeEach((to, _from, next) => {
  const rolRequerido = to.meta?.requiereRol

  // Si la ruta no exige rol, se permite el paso directo
  if (!rolRequerido) {
    next()
    return
  }

  const rolActual = obtenerRolSesion()

  // Si no hay sesión iniciada, se redirige al inicio de sesión
  if (!rolActual) {
    next({ name: 'inicio-sesion' })
    return
  }

  // Si el usuario tiene una sesión activa pero intenta ingresar a una vista que no corresponde a su rol,
  // se le redirige automáticamente a la vista autorizada para su perfil.
  if (rolActual !== rolRequerido) {
    const destinosPorRol = {
      usuario_institucional: 'usuario',
      usuario_administrativo: 'administracion',
      personal_operacion: 'punto-control'
    }
    next({ name: destinosPorRol[rolActual] || 'inicio-sesion' })
    return
  }

  // Si todo es correcto, se autoriza la navegación
  next()
})

export default router