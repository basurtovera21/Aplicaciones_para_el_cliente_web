<script setup>

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useInvehStore } from '../stores/inveh'
import Navbar from '../components/Navbar.vue'
import CampoFormulario from '../components/CampoFormulario.vue'

const router = useRouter()
const store = useInvehStore()

// Estados reactivos vinculados con v-model a los campos de entrada
const identificador = ref('')
const clave = ref('')
const mostrarClave = ref(false)

// Estados de error
const errorIdentificador = ref('')
const errorClave = ref('')

// Referencia directa al elemento HTML <input type="file"> oculto en el DOM
const refSelectorArchivo = ref(null)

// Limpia los errores del campo identificador al escribir.
function limpiarErrorIdentificador() {
  errorIdentificador.value = ''
  if (errorClave.value === 'Las credenciales registradas no son válidas') {
    errorClave.value = ''
  }
}

// Limpia los errores del campo contraseña al escribir.
function limpiarErrorClave() {
  errorClave.value = ''
  if (errorIdentificador.value === ' ') {
    errorIdentificador.value = ''
  }
}

// Valida los datos y autentica al usuario.
function handleAcceder() {
  let formularioEsValido = true
  const identificadorLimpio = identificador.value.trim()
  const claveLimpia = clave.value.trim()

  // Validación de obligatoriedad: identificador
  if (!identificadorLimpio) {
    errorIdentificador.value = 'Registre un correo institucional o usuario'
    formularioEsValido = false
  } else {
    errorIdentificador.value = ''
  }

  // Validación de obligatoriedad: contraseña
  if (!claveLimpia) {
    errorClave.value = 'Registre la contraseña'
    formularioEsValido = false
  } else {
    errorClave.value = ''
  }

  if (!formularioEsValido) return

  // Autenticación con el almacén central de Pinia
  const resultado = store.iniciarSesion(identificadorLimpio, claveLimpia)

  if (resultado.exito) {
    // Redirección inmediata según el rol del usuario autenticado
    const rutasPorRol = {
      usuario_institucional: '/usuario',
      usuario_administrativo: '/administracion',
      personal_operacion: '/punto-control'
    }
    const rutaDestino = rutasPorRol[resultado.usuario.rol_sistema] || '/usuario'
    router.push(rutaDestino)
  } else {
    errorIdentificador.value = ' '
    errorClave.value = 'Las credenciales ingresadas no son válidas'
  }
}

// Exporta el estado actual de la base de datos a un archivo JSON descargable.
function handleExportarBD() {
  const baseActual = {
    usuarios: store.usuarios,
    vehiculos: store.vehiculos,
    autorizaciones_visitas: store.autorizacionesVisitas,
    historial_movimientos: store.historialMovimientos
  }
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(baseActual, null, 2))
  const elementoDescarga = document.createElement('a')
  elementoDescarga.setAttribute('href', dataStr)
  elementoDescarga.setAttribute('download', 'inveh_base_datos.json')
  document.body.appendChild(elementoDescarga)
  elementoDescarga.click()
  elementoDescarga.remove()
}

// Abre el selector de archivos nativo del sistema operativo.
function abrirSelectorArchivo() {
  if (refSelectorArchivo.value) {
    refSelectorArchivo.value.value = ''
    refSelectorArchivo.value.click()
  }
}

// Lee e importa un archivo JSON para restaurar los datos en el sistema.
function handleImportarBD(evento) {
  const archivo = evento.target.files[0]
  if (!archivo) return

  const lector = new FileReader()
  lector.onload = function(e) {
    const contenido = (e.target.result || '').trim()

    // Si el archivo está en blanco o contiene {}, restablece la base de datos a los valores iniciales limpios
    if (!contenido || contenido === '{}' || contenido === '[]') {
      store.reiniciarDatosCompletos()
      alert('Base de datos restablecida correctamente con los registros iniciales.')
      return
    }

    try {
      const datosParseados = JSON.parse(contenido)
      if (datosParseados && typeof datosParseados === 'object') {
        store.importarBaseDatos(datosParseados)
        alert('Información importada correctamente.')
      }
    } catch (error) {
      alert('El documento no tiene un formato válido')
    }
  }
  lector.readAsText(archivo)
}
</script>

<template>
  <div>
    <!-- Barra de navegación institucional -->
    <Navbar />

    <!-- Contenedor principal de inicio de sesión -->
    <main class="pantalla-inicio-sesion-contenedor">
      <h1 class="titulo-accion-inicio-sesion">Iniciar sesión</h1>

      <!-- Tarjeta del formulario de autenticación -->
      <section class="tarjeta-formulario-inicio-sesion">
        <p class="indicacion-texto-inicio-sesion">
          Acceda utilizando sus credenciales institucionales
        </p>

        <form class="cuerpo-formulario-inicio-sesion" @submit.prevent="handleAcceder" novalidate>
          <!-- Campo de entrada: correo institucional o usuario -->
          <CampoFormulario
            etiqueta="Correo institucional o usuario"
            for-id="campo-correo-institucional"
            error-id="mensaje-error-correo"
            variante="inicio-sesion"
            :error="errorIdentificador"
          >
            <div class="caja-entrada-con-icono">
              <img 
                src="/recursos/imagenes/correo.svg" 
                alt="correo" 
                class="icono-entrada-izquierda"
              />
              <input 
                id="campo-correo-institucional"
                v-model="identificador" 
                type="text" 
                class="campo-texto-inicio-sesion" 
                placeholder="usuario@live.uleam.edu.ec"
                autocomplete="off"
                @input="limpiarErrorIdentificador"
              />
            </div>
          </CampoFormulario>

          <!-- Campo de entrada: contraseña con botón para alternar visibilidad -->
          <CampoFormulario
            etiqueta="Contraseña"
            for-id="campo-clave-acceso"
            error-id="mensaje-error-clave"
            variante="inicio-sesion"
            :error="errorClave"
          >
            <div class="caja-entrada-con-icono">
              <button 
                type="button" 
                class="boton-mostrar-clave" 
                aria-label="Mostrar clave"
                @click="mostrarClave = !mostrarClave"
              >
                <img 
                  :src="mostrarClave ? '/recursos/imagenes/ojo-cerrado.svg' : '/recursos/imagenes/ojo.svg'" 
                  alt="mostrar clave" 
                  class="icono-imagen" 
                />
              </button>
              <input 
                id="campo-clave-acceso"
                v-model="clave" 
                :type="mostrarClave ? 'text' : 'password'" 
                class="campo-texto-inicio-sesion" 
                placeholder="•••••••••"
                maxlength="20"
                @input="limpiarErrorClave"
              />
            </div>
          </CampoFormulario>

          <!-- Botón de envío de credenciales -->
          <button type="submit" class="boton-acceder" id="boton-enviar-acceso">
            Acceder
          </button>
        </form>
      </section>

      <!-- Botones flotantes de exportación e importación de la base de datos -->
      <div class="contenedor-acciones-bd">
        <input 
          ref="refSelectorArchivo"
          type="file" 
          accept=".json" 
          style="display: none;" 
          @change="handleImportarBD"
        />
        
        <button type="button" class="boton-gestion-bd" @click="handleExportarBD">
          <span>Obtener información</span>
        </button>

        <button type="button" class="boton-gestion-bd" @click="abrirSelectorArchivo">
          <span>Importar información</span>
        </button>
      </div>
    </main>
  </div>
</template>