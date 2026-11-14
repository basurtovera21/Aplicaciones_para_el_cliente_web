<script setup>

import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useInvehStore } from '../stores/inveh'
import Navbar from '../components/Navbar.vue'
import ModalBase from '../components/ModalBase.vue'
import ModalConfirmacionExito from '../components/ModalConfirmacionExito.vue'
import ModalDesvincular from '../components/ModalDesvincular.vue'
import ModalFichaVehicular from '../components/ModalFichaVehicular.vue'
import CampoFormulario from '../components/CampoFormulario.vue'
import BannerInformativo from '../components/BannerInformativo.vue'
import AccionesFormularioModal from '../components/AccionesFormularioModal.vue'
import AccionesRevisionModal from '../components/AccionesRevisionModal.vue'
import { useTeclaEscape } from '../composables/useTeclaEscape'
import { TIPOS_VEHICULO, TIPOS_USUARIO } from '../utils/catalogos'
import {
  formatearFechaHora,
  obtenerEtiquetaMotivo,
  LIMITES_VEHICULO,
  normalizarDetalleVehiculo,
  obtenerErrorDetalleVehiculo
} from '../utils/validaciones'
import { obtenerRutaCodigoQr, RUTA_QR_RESPALDO } from '../utils/qr'

// Almacén global Pinia
const store = useInvehStore()

// Asegurar que la sesión activa tenga rol administrativo
onMounted(() => {
  store.asegurarRolEnSesion('usuario_administrativo')
})

// Variables para filtros de búsqueda en el padrón vehicular
const busquedaTexto = ref('')
const filtroTipoUsuario = ref('')
const filtroTipoVehiculo = ref('')

// Filtros confirmados (se aplican al presionar "Comprobar")
const filtrosVehicularesAplicados = ref({
  texto: '',
  tipoUsuario: '',
  tipoVehiculo: ''
})

function aplicarFiltrosVehiculares() {
  filtrosVehicularesAplicados.value = {
    texto: busquedaTexto.value.trim().toLowerCase(),
    tipoUsuario: filtroTipoUsuario.value.trim().toLowerCase(),
    tipoVehiculo: filtroTipoVehiculo.value.trim().toLowerCase()
  }
}

// Lista de vehículos autorizados que coinciden con los filtros aplicados
const vehiculosFiltrados = computed(() => {
  const texto = filtrosVehicularesAplicados.value.texto
  const tipoUsuario = filtrosVehicularesAplicados.value.tipoUsuario
  const tipoVehiculo = filtrosVehicularesAplicados.value.tipoVehiculo

  return store.vehiculos.filter(vehiculo => {
    if (vehiculo.estadoAutorizacion !== 'Autorizado') return false

    // Filtro por texto libre
    if (texto) {
      const id = String(vehiculo.identificador || '').toLowerCase()
      const placa = String(vehiculo.placa || '').toLowerCase()
      const propietario = String(vehiculo.propietario?.nombres_apellidos || '').toLowerCase()
      const identificacion = String(vehiculo.propietario?.numero_identificacion || '').toLowerCase()
      const fabricante = String(vehiculo.fabricante || '').toLowerCase()
      const modelo = String(vehiculo.modelo || '').toLowerCase()
      const tipo = String(vehiculo.tipo || '').toLowerCase()

      const coincideTexto = id.includes(texto) ||
        placa.includes(texto) ||
        propietario.includes(texto) ||
        identificacion.includes(texto) ||
        fabricante.includes(texto) ||
        modelo.includes(texto) ||
        tipo.includes(texto)

      if (!coincideTexto) return false
    }

    // Filtro por tipo de usuario
    if (tipoUsuario) {
      const tipoUsuarioVehiculo = String(vehiculo.propietario?.tipo_usuario || '').toLowerCase()
      if (tipoUsuarioVehiculo !== tipoUsuario) return false
    }

    // Filtro por tipo de vehículo
    if (tipoVehiculo) {
      const tipoVehiculoRegistro = String(vehiculo.tipo || '').toLowerCase()
      if (tipoVehiculoRegistro !== tipoVehiculo) return false
    }

    return true
  })
})

// Lista unificada de solicitudes pendientes de revisión
const listaSolicitudesPendientes = computed(() => {
  // 1. Solicitudes de vehículos institucionales
  const pendientesVehiculos = store.solicitudesVehiculosPendientes.map(solicitud => ({
    tipoOrigen: 'vehiculo',
    identificador: solicitud.identificador,
    fechaSolicitud: (solicitud.fechaSolicitud || '').split('T')[0],
    nombreSolicitante: `${solicitud.propietario?.nombres_apellidos || 'Usuario'} (${solicitud.propietario?.tipo_usuario || 'Institucional'})`,
    placa: solicitud.placa,
    tipoVehiculo: solicitud.tipo,
    objetoOriginal: solicitud
  }))

  // 2. Solicitudes de autorizaciones de visitas externas
  const pendientesVisitas = store.solicitudesVisitasPendientes.map(solicitud => {
    const nombreSol = solicitud.solicitante?.nombres_apellidos
    const tipoSol = solicitud.solicitante?.tipo_usuario
    const etiquetaSolicitante = nombreSol
      ? `${nombreSol} (${tipoSol || 'Usuario institucional'}) (Visita)`
      : 'Sin solicitante (Visita)'

    return {
      tipoOrigen: 'visita',
      identificador: solicitud.identificador,
      fechaSolicitud: (solicitud.fechaSolicitud || solicitud.detalle?.fecha || '').split('T')[0],
      nombreSolicitante: etiquetaSolicitante,
      placa: solicitud.vehiculo?.placa,
      tipoVehiculo: solicitud.vehiculo?.tipo,
      objetoOriginal: solicitud
    }
  })

  return [...pendientesVehiculos, ...pendientesVisitas]
})

// Estados para abrir o cerrar modales
const modalRevisionRegistroAbierto = ref(false)
const modalRevisionVisitaAbierto = ref(false)
const modalFichaAbierto = ref(false)
const modalModificarAbierto = ref(false)
const modalDesvincularAbierto = ref(false)
const modalExitoGeneralAbierto = ref(false)
const modalExitoDesvinculacionAbierto = ref(false)
const modalActividadesAbierto = ref(false)

// Cerrar modales con tecla Escape
useTeclaEscape([
  modalExitoGeneralAbierto,
  modalExitoDesvinculacionAbierto,
  modalDesvincularAbierto,
  modalModificarAbierto,
  modalRevisionRegistroAbierto,
  modalRevisionVisitaAbierto,
  modalFichaAbierto,
  modalActividadesAbierto
])

const tituloModalExito = ref('Registro creado correctamente')
const mensajeModalExito = ref('')

const solicitudVehiculoSeleccionada = ref(null)
const solicitudVisitaSeleccionada = ref(null)
const vehiculoSeleccionado = ref(null)

// Formulario reactivo para modificar vehículo
const formularioModificar = reactive({
  color: '',
  estadoAutorizacion: 'Autorizado',
  observaciones: ''
})

const erroresModificar = reactive({
  color: ''
})

// Abre el modal de revisión según el tipo de solicitud
function abrirRevision(solicitud) {
  if (solicitud.tipoOrigen === 'vehiculo') {
    solicitudVehiculoSeleccionada.value = solicitud.objetoOriginal
    modalRevisionRegistroAbierto.value = true
  } else {
    solicitudVisitaSeleccionada.value = solicitud.objetoOriginal
    modalRevisionVisitaAbierto.value = true
  }
}

// Resuelve la aprobación o rechazo de una solicitud
function resolverSolicitud(tipo, aprobada) {
  if (tipo === 'vehiculo') {
    if (!solicitudVehiculoSeleccionada.value) return
    const id = solicitudVehiculoSeleccionada.value.identificador

    if (aprobada) {
      store.aprobarVehiculo(id)
      tituloModalExito.value = 'Registro vehicular creado correctamente'
      mensajeModalExito.value = `Fecha y hora en que se creó el registro: ${formatearFechaHora()}`
      modalExitoGeneralAbierto.value = true
    } else {
      store.rechazarVehiculo(id)
    }
    modalRevisionRegistroAbierto.value = false
  } else if (tipo === 'visita') {
    if (!solicitudVisitaSeleccionada.value) return
    const id = solicitudVisitaSeleccionada.value.identificador

    if (aprobada) {
      store.aprobarVisita(id)
      tituloModalExito.value = 'Autorización de acceso creada correctamente'
      mensajeModalExito.value = `Fecha y hora en que se aprobó la solicitud: ${formatearFechaHora()}`
      modalExitoGeneralAbierto.value = true
    } else {
      store.rechazarVisita(id)
    }
    modalRevisionVisitaAbierto.value = false
  }
}

// Ficha vehicular
function verFichaVehiculo(vehiculo) {
  vehiculoSeleccionado.value = vehiculo
  modalFichaAbierto.value = true
}

// Abre el modal para editar datos del vehículo
function abrirModificarVehiculo() {
  if (vehiculoSeleccionado.value) {
    erroresModificar.color = ''
    formularioModificar.color = vehiculoSeleccionado.value.color || ''
    formularioModificar.estadoAutorizacion = vehiculoSeleccionado.value.estadoAutorizacion || 'Autorizado'
    formularioModificar.observaciones = vehiculoSeleccionado.value.observaciones || ''
    modalFichaAbierto.value = false
    modalModificarAbierto.value = true
  }
}

// Guarda los cambios realizados en el modal de modificación
function guardarModificacionVehiculo() {
  erroresModificar.color = obtenerErrorDetalleVehiculo(formularioModificar.color, 'color')
  if (erroresModificar.color) return

  if (vehiculoSeleccionado.value) {
    store.modificarVehiculo(vehiculoSeleccionado.value.identificador, formularioModificar)
    modalModificarAbierto.value = false
    tituloModalExito.value = 'Registro vehicular modificado correctamente'
    mensajeModalExito.value = `Fecha y hora en que se modificó el registro: ${formatearFechaHora()}`
    modalExitoGeneralAbierto.value = true
  }
}

const usarRespaldoQrCredencial = ref(false)

watch(
  () => [vehiculoSeleccionado.value?.identificador, vehiculoSeleccionado.value?.placa, vehiculoSeleccionado.value?.codigoQrRuta],
  () => {
    usarRespaldoQrCredencial.value = false
  }
)

const rutaQrCredencial = computed(() => {
  return usarRespaldoQrCredencial.value
    ? RUTA_QR_RESPALDO
    : obtenerRutaCodigoQr(vehiculoSeleccionado.value)
})

function exportarFichaPDF() {
  const imagenQr = document.querySelector('#area-impresion-credencial .credencial-imagen-qr')
  if (imagenQr && !imagenQr.complete) {
    imagenQr.onload = () => window.print()
    imagenQr.onerror = () => window.print()
  } else {
    window.print()
  }
}

function iniciarDesvinculacionDesdeFicha() {
  modalFichaAbierto.value = false
  modalDesvincularAbierto.value = true
}

function ejecutarDesvinculacion() {
  if (vehiculoSeleccionado.value) {
    store.desvincularVehiculo(vehiculoSeleccionado.value.identificador)
    modalDesvincularAbierto.value = false
    modalExitoDesvinculacionAbierto.value = true
  }
}

// Registro de actividades (historial de entradas y salidas)
const filtroActividadTexto = ref('')
const filtroActividadFecha = ref('')
const filtroActividadPunto = ref('')
const filtroActividadMovimiento = ref('')

function abrirRegistroActividades() {
  filtroActividadTexto.value = ''
  filtroActividadFecha.value = ''
  filtroActividadPunto.value = ''
  filtroActividadMovimiento.value = ''
  modalActividadesAbierto.value = true
}

// Filtra los movimientos según los criterios seleccionados en el modal de actividades
const actividadesFiltradas = computed(() => {
  const texto = filtroActividadTexto.value.trim().toLowerCase()
  return store.historialMovimientos.filter(movimiento => {
    if (texto) {
      const coincideId = movimiento.identificador?.toLowerCase().includes(texto)
      const coincidePlaca = movimiento.placa?.toLowerCase().includes(texto)
      const coincidePropietario = movimiento.propietario?.toLowerCase().includes(texto)
      if (!coincideId && !coincidePlaca && !coincidePropietario) return false
    }

    if (filtroActividadFecha.value && movimiento.fecha !== filtroActividadFecha.value) {
      return false
    }

    if (filtroActividadPunto.value && !movimiento.puntoControl?.includes(filtroActividadPunto.value)) {
      return false
    }

    if (filtroActividadMovimiento.value && movimiento.tipoMovimiento !== filtroActividadMovimiento.value) {
      return false
    }

    return true
  })
})
</script>

<template>
  <div>
    <!-- Barra de navegación institucional -->
    <Navbar />

    <main class="contenedor-principal">

      <!-- Tarjeta 1: Resumen de métricas -->
      <section class="tarjeta-resumen-metricas">
        <div class="bloque-identidad-admin">
          <div class="insignia-circular">AD</div>
        </div>

        <div class="rejilla-contadores-metricas">
          <div class="bloque-metrica-individual">
            <span class="numero-metrica" id="metrica-vehiculos-autorizados">
              {{ store.metricasVehiculosAutorizados }}
            </span>
            <span class="descripcion-metrica">Vehículos autorizados</span>
          </div>

          <div class="bloque-metrica-individual">
            <span class="numero-metrica" id="metrica-vehiculos-instalaciones">
              {{ store.metricasVehiculosEnInstalaciones }}
            </span>
            <span class="descripcion-metrica">Vehículos en instalaciones</span>
          </div>

          <div class="bloque-metrica-individual metrica-alerta">
            <span class="numero-metrica color-alerta" id="metrica-solicitudes-pendientes">
              {{ store.metricasSolicitudesPendientes }}
            </span>
            <span class="descripcion-metrica">Solicitudes pendientes</span>
          </div>

          <div class="bloque-metrica-individual">
            <span class="numero-metrica" id="metrica-visitas-hoy">
              {{ store.metricasVisitasAutorizadasHoy }}
            </span>
            <span class="descripcion-metrica">Visitas autorizadas hoy</span>
          </div>
        </div>

        <div class="bloque-accion-registro">
          <button 
            type="button" 
            class="boton-registro-actividades" 
            id="boton-registro-actividades"
            @click="abrirRegistroActividades"
          >
            <img src="/recursos/imagenes/archivo.svg" alt="" class="icono-boton-accion" />
            <span>Registro de actividades</span>
          </button>
        </div>
      </section>

      <!-- Tarjeta 2: Solicitudes pendientes de revisión -->
      <section class="tarjeta-panel tarjeta-panel-fijo">
        <header class="cabecera-panel-tabla">
          <h2 class="titulo-panel">Solicitudes pendientes de revisión</h2>
        </header>

        <div class="contenedor-tabla-desplazable">
          <table class="tabla-gestion-inveh">
            <thead>
              <tr>
                <th>Fecha de solicitud</th>
                <th>Solicitante</th>
                <th>Placa vehicular</th>
                <th>Tipo de vehículo</th>
                <th class="columna-centrada">Solicitud</th>
              </tr>
            </thead>
            <tbody id="cuerpo-tabla-pendientes">
              <tr v-if="listaSolicitudesPendientes.length === 0">
                <td colspan="5" class="mensaje-tabla-vacia">
                  No existen solicitudes pendientes de revisión
                </td>
              </tr>
              <tr v-for="sol in listaSolicitudesPendientes" :key="sol.identificador">
                <td>{{ sol.fechaSolicitud }}</td>
                <td>{{ sol.nombreSolicitante }}</td>
                <td>{{ sol.placa }}</td>
                <td>{{ sol.tipoVehiculo }}</td>
                <td class="columna-centrada">
                  <button 
                    type="button" 
                    class="boton-tabla-icono" 
                    title="Auditar solicitud"
                    @click="abrirRevision(sol)"
                  >
                    <img src="/recursos/imagenes/archivo.svg" alt="Revisar" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Tarjeta 3: Registro vehicular institucional y filtros -->
      <section class="tarjeta-panel tarjeta-panel-fijo">
        <header class="cabecera-panel-tabla">
          <h2 class="titulo-panel">Registro vehicular institucional</h2>
        </header>

        <div class="barra-filtros-vehiculares">
          <div class="campo-busqueda-contenedor">
            <input 
              v-model="busquedaTexto"
              type="text" 
              id="filtro-busqueda-general" 
              class="entrada-busqueda-inveh" 
              placeholder="Buscar por ID, placa vehicular o propietario"
              autocomplete="off"
            />
          </div>

          <div class="select-filtro-contenedor">
            <select
              v-model="filtroTipoUsuario"
              id="filtro-tipo-usuario"
              class="selector-filtro-inveh"
              :class="{ 'campo-sin-seleccion': !filtroTipoUsuario }"
              @keydown.enter="aplicarFiltrosVehiculares"
            >
              <option value="">Tipo de usuario</option>
              <option v-for="tipo in TIPOS_USUARIO" :key="tipo" :value="tipo">{{ tipo }}</option>
            </select>
          </div>

          <div class="select-filtro-contenedor">
            <select
              v-model="filtroTipoVehiculo"
              id="filtro-tipo-vehiculo"
              class="selector-filtro-inveh"
              :class="{ 'campo-sin-seleccion': !filtroTipoVehiculo }"
              @keydown.enter="aplicarFiltrosVehiculares"
            >
              <option value="">Tipo de vehículo</option>
              <option v-for="tipo in TIPOS_VEHICULO" :key="tipo" :value="tipo">{{ tipo }}</option>
            </select>
          </div>

          <button 
            type="button" 
            class="boton-comprobar-filtros" 
            id="boton-ejecutar-filtro"
            @click="aplicarFiltrosVehiculares"
          >
            <img src="/recursos/imagenes/buscar.svg" alt="" class="icono-comprobar" />
            <span>Comprobar</span>
          </button>
        </div>

        <div class="contenedor-tabla-desplazable">
          <table class="tabla-gestion-inveh">
            <thead>
              <tr>
                <th>Identificador</th>
                <th>Propietario</th>
                <th>Placa vehicular</th>
                <th>Tipo de vehículo</th>
                <th class="columna-centrada">Ficha vehicular</th>
              </tr>
            </thead>
            <tbody id="cuerpo-tabla-registro-institucional">
              <tr v-if="vehiculosFiltrados.length === 0">
                <td colspan="5" class="mensaje-tabla-vacia">
                  {{
                    store.vehiculos.some(v => v.estadoAutorizacion === 'Autorizado')
                      ? 'No se encontraron registros de vehículos con los criterios seleccionados'
                      : 'No existen vehículos registrados en el sistema'
                  }}
                </td>
              </tr>
              <tr v-for="v in vehiculosFiltrados" :key="v.identificador">
                <td>{{ v.identificador }}</td>
                <td>{{ v.propietario?.nombres_apellidos }}</td>
                <td>{{ v.placa }}</td>
                <td>{{ v.tipo }}</td>
                <td class="columna-centrada">
                  <button 
                    type="button" 
                    class="boton-tabla-icono" 
                    title="Ver ficha vehicular"
                    @click="verFichaVehiculo(v)"
                  >
                    <img src="/recursos/imagenes/archivo.svg" alt="Ficha" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Modal: Revisión de registro vehicular -->
      <ModalBase
        :abierto="modalRevisionRegistroAbierto && Boolean(solicitudVehiculoSeleccionada)"
        modal-id="modal-revision-registro"
        ancho="registro"
        titulo="Solicitud de registro vehicular"
        @cerrar="modalRevisionRegistroAbierto = false"
      >
        <BannerInformativo>
          Una vez aprobada la solicitud, el sistema emitirá el identificador vehicular y el código QR correspondiente. El vehículo adquirirá el estado 'Autorizado' y podrá acceder a las instalaciones universitarias.
        </BannerInformativo>

        <div class="seccion-revision-datos">
          <h4 class="titulo-seccion-revision">Información del solicitante</h4>
          <div class="lista-datos-revision">
            <p class="item-revision">Apellidos y nombres: <span class="dato-valor">{{ solicitudVehiculoSeleccionada.propietario?.nombres_apellidos }}</span></p>
            <p class="item-revision">Número de identificación: <span class="dato-valor">{{ solicitudVehiculoSeleccionada.propietario?.numero_identificacion }}</span></p>
            <p class="item-revision">Correo institucional: <span class="dato-valor">{{ solicitudVehiculoSeleccionada.propietario?.correo_institucional }}</span></p>
            <p class="item-revision">Tipo de usuario: <span class="dato-valor">{{ solicitudVehiculoSeleccionada.propietario?.tipo_usuario }}</span></p>
            <p class="item-revision">Facultad: <span class="dato-valor">{{ solicitudVehiculoSeleccionada.propietario?.facultad }}</span></p>
          </div>
        </div>

        <div class="seccion-revision-datos">
          <h4 class="titulo-seccion-revision">Información del vehículo</h4>
          <div class="lista-datos-revision">
            <p class="item-revision">Placa vehicular: <span class="dato-valor">{{ solicitudVehiculoSeleccionada.placa }}</span></p>
            <p class="item-revision">Tipo de vehículo: <span class="dato-valor">{{ solicitudVehiculoSeleccionada.tipo }}</span></p>
            <p class="item-revision">Fabricante / Modelo: <span class="dato-valor">{{ solicitudVehiculoSeleccionada.fabricante }} {{ solicitudVehiculoSeleccionada.modelo }}</span></p>
            <p class="item-revision">Año de fabricación: <span class="dato-valor">{{ solicitudVehiculoSeleccionada.anio }}</span></p>
            <p class="item-revision">Color: <span class="dato-valor">{{ solicitudVehiculoSeleccionada.color }}</span></p>
            <p class="item-revision">Observaciones: <span class="dato-valor">{{ solicitudVehiculoSeleccionada.observaciones }}</span></p>
          </div>
        </div>

        <AccionesRevisionModal
          @aceptar="resolverSolicitud('vehiculo', true)"
          @rechazar="resolverSolicitud('vehiculo', false)"
        />
      </ModalBase>

      <!-- Modal: Revisión de autorización de visitas -->
      <ModalBase
        :abierto="modalRevisionVisitaAbierto && Boolean(solicitudVisitaSeleccionada)"
        modal-id="modal-revision-autorizacion"
        ancho="registro"
        titulo="Solicitud de autorización de acceso vehicular"
        @cerrar="modalRevisionVisitaAbierto = false"
      >
        <BannerInformativo>
          Una vez aprobada la solicitud, el vehículo del visitante podrá acceder a las instalaciones universitarias en la fecha y hora programada
        </BannerInformativo>

        <div class="seccion-revision-datos">
          <h4 class="titulo-seccion-revision">Información del solicitante</h4>
          <div class="lista-datos-revision">
            <p class="item-revision">Apellidos y nombres: <span class="dato-valor">{{ solicitudVisitaSeleccionada.solicitante?.nombres_apellidos }}</span></p>
            <p class="item-revision">Número de identificación: <span class="dato-valor">{{ solicitudVisitaSeleccionada.solicitante?.numero_identificacion }}</span></p>
            <p class="item-revision">Facultad: <span class="dato-valor">{{ solicitudVisitaSeleccionada.solicitante?.facultad }}</span></p>
            <p class="item-revision">Tipo de usuario: <span class="dato-valor">{{ solicitudVisitaSeleccionada.solicitante?.tipo_usuario }}</span></p>
          </div>
        </div>

        <div class="seccion-revision-datos">
          <h4 class="titulo-seccion-revision">Información del visitante</h4>
          <div class="lista-datos-revision">
            <p class="item-revision">Apellidos y nombres: <span class="dato-valor">{{ solicitudVisitaSeleccionada.visitante?.nombres_apellidos }}</span></p>
            <p class="item-revision">Tipo de documento: <span class="dato-valor">{{ solicitudVisitaSeleccionada.visitante?.tipo_identificacion }}</span></p>
            <p class="item-revision">Número de identificación: <span class="dato-valor">{{ solicitudVisitaSeleccionada.visitante?.numero_identificacion }}</span></p>
            <p class="item-revision">Número de teléfono: <span class="dato-valor">{{ solicitudVisitaSeleccionada.visitante?.telefono }}</span></p>
          </div>
        </div>

        <div class="seccion-revision-datos">
          <h4 class="titulo-seccion-revision">Información del vehículo</h4>
          <div class="lista-datos-revision">
            <p class="item-revision">Placa vehicular: <span class="dato-valor">{{ solicitudVisitaSeleccionada.vehiculo?.placa }}</span></p>
            <p class="item-revision">Tipo: <span class="dato-valor">{{ solicitudVisitaSeleccionada.vehiculo?.tipo }}</span></p>
            <p class="item-revision">Fabricante / Modelo: <span class="dato-valor">{{ solicitudVisitaSeleccionada.vehiculo?.fabricante }} {{ solicitudVisitaSeleccionada.vehiculo?.modelo }}</span></p>
            <p class="item-revision">Color: <span class="dato-valor">{{ solicitudVisitaSeleccionada.vehiculo?.color }}</span></p>
          </div>
        </div>

        <div class="seccion-revision-datos">
          <h4 class="titulo-seccion-revision">Detalle de la visita</h4>
          <div class="lista-datos-revision">
            <p class="item-revision">Fecha programada: <span class="dato-valor">{{ solicitudVisitaSeleccionada.detalle?.fecha }}</span></p>
            <p class="item-revision">Hora programada: <span class="dato-valor">{{ solicitudVisitaSeleccionada.detalle?.hora }}</span></p>
            <p class="item-revision">Motivo de la visita: <span class="dato-valor">{{ obtenerEtiquetaMotivo(solicitudVisitaSeleccionada.detalle?.motivo) }}</span></p>
            <p class="item-revision">Área de destino: <span class="dato-valor">{{ solicitudVisitaSeleccionada.detalle?.destino }}</span></p>
          </div>
        </div>

        <AccionesRevisionModal
          @aceptar="resolverSolicitud('visita', true)"
          @rechazar="resolverSolicitud('visita', false)"
        />
      </ModalBase>

      <!-- Modal: Ficha vehicular administrativa -->
      <ModalFichaVehicular
        :abierto="modalFichaAbierto"
        modal-id="modal-ficha-vehicular"
        :vehiculo="vehiculoSeleccionado"
        @cerrar="modalFichaAbierto = false"
      >
        <template #acciones-pie>
          <div class="contenedor-acciones-ficha-admin">
            <div class="grupo-acciones-ficha-izq">
              <button 
                type="button" 
                class="boton-ficha-admin boton-ficha-admin-corto fondo-neutro" 
                id="btn-admin-modificar-vehiculo"
                @click="abrirModificarVehiculo"
              >
                <img src="/recursos/imagenes/modificar.svg" alt="" class="icono-boton-accion" />
                <span>Modificar</span>
              </button>

              <button 
                type="button" 
                class="boton-ficha-admin boton-ficha-admin-corto fondo-neutro" 
                id="btn-admin-exportar-pdf"
                @click="exportarFichaPDF"
              >
                <img src="/recursos/imagenes/exportar.svg" alt="" class="icono-boton-accion" />
                <span>Exportar</span>
              </button>
            </div>

            <div class="grupo-acciones-ficha-der">
              <button 
                type="button" 
                class="boton-ficha-admin fondo-peligro" 
                id="btn-admin-desvincular-ficha"
                @click="iniciarDesvinculacionDesdeFicha"
              >
                <img src="/recursos/imagenes/eliminar.svg" alt="" class="icono-boton-accion" />
                <span>Desvincular vehículo</span>
              </button>

              <button 
                type="button" 
                class="boton-ficha-admin fondo-neutro" 
                id="btn-admin-aceptar-ficha"
                @click="modalFichaAbierto = false"
              >
                <img src="/recursos/imagenes/aceptar.svg" alt="" class="icono-boton-accion" />
                <span>Aceptar</span>
              </button>
            </div>
          </div>
        </template>
      </ModalFichaVehicular>

      <!-- Modal: Modificar registro vehicular -->
      <ModalBase
        :abierto="modalModificarAbierto && Boolean(vehiculoSeleccionado)"
        modal-id="modal-modificar-vehiculo"
        ancho="registro"
        titulo="Modificar información de registro vehicular"
        @cerrar="modalModificarAbierto = false"
      >
        <BannerInformativo>
          Restricción de edición: Los datos asociados al propietario y las características principales del vehículo son de carácter no editable
        </BannerInformativo>

        <div class="bloque-seccion-no-editable">
          <h4 class="subtitulo-seccion-revision">Información no modificable</h4>
          
          <div class="fila-centrada-modal">
            <span class="identificador-texto-modal">
              Identificador: <span class="dato-valor">{{ vehiculoSeleccionado.identificador }}</span>
            </span>
          </div>

          <div class="rejilla-no-editable-columnas">
            <div class="columna-datos-no-editable">
              <p class="item-revision">Placa vehicular: <span class="dato-valor">{{ vehiculoSeleccionado.placa }}</span></p>
              <p class="item-revision">Tipo de vehículo: <span class="dato-valor">{{ vehiculoSeleccionado.tipo }}</span></p>
            </div>

            <div class="columna-datos-no-editable">
              <p class="item-revision">Fabricante / Modelo: <span class="dato-valor">{{ vehiculoSeleccionado.fabricante }} {{ vehiculoSeleccionado.modelo }}</span></p>
              <p class="item-revision">Año de fabricación: <span class="dato-valor">{{ vehiculoSeleccionado.anio }}</span></p>
            </div>
          </div>
        </div>

        <form class="formulario-registro-vehiculo" @submit.prevent="guardarModificacionVehiculo" novalidate>
          <div class="cuerpo-grid-formulario">
            <CampoFormulario etiqueta="Color" :error="erroresModificar.color">
              <input 
                v-model="formularioModificar.color" 
                type="text" 
                class="campo-texto-modal" 
                :maxlength="LIMITES_VEHICULO.longitudMaximaColor"
                @input="normalizarDetalleVehiculo(formularioModificar, erroresModificar, 'color')"
              />
            </CampoFormulario>

            <CampoFormulario etiqueta="Estado de autorización">
              <select v-model="formularioModificar.estadoAutorizacion" class="campo-texto-modal">
                <option value="Autorizado">Autorizado</option>
                <option value="Pendiente">Pendiente</option>
              </select>
            </CampoFormulario>

            <CampoFormulario etiqueta="Observaciones" ancho-completo>
              <textarea 
                v-model="formularioModificar.observaciones" 
                class="campo-area-texto-modal" 
                :maxlength="LIMITES_VEHICULO.longitudMaximaObservaciones"
                placeholder="Proporcione información adicional que facilite la identificación del vehículo"
              ></textarea>
            </CampoFormulario>
          </div>

          <AccionesFormularioModal
            texto-confirmar="Confirmar cambios"
            icono-confirmar="/recursos/imagenes/modificar.svg"
            @cancelar="modalModificarAbierto = false"
          />
        </form>
      </ModalBase>

      <!-- Modal: Confirmar desvinculación -->
      <ModalDesvincular
        :abierto="modalDesvincularAbierto"
        modal-id="modal-desvincular-vehiculo"
        :identificador="vehiculoSeleccionado?.identificador || ''"
        @confirmar="ejecutarDesvinculacion"
        @cerrar="modalDesvincularAbierto = false"
      />

      <!-- Modal: Desvinculación exitosa -->
      <ModalConfirmacionExito
        :abierto="modalExitoDesvinculacionAbierto"
        modal-id="modal-desvinculacion-exito"
        titulo="Desvinculación completada"
        mensaje="La desvinculación se ha realizado satisfactoriamente. El vehículo ya no se encuentra asociado a la cuenta institucional y no dispone de autorización para acceder a las instalaciones."
        @cerrar="modalExitoDesvinculacionAbierto = false"
      />

      <!-- Modal: Éxito general -->
      <ModalConfirmacionExito
        :abierto="modalExitoGeneralAbierto"
        modal-id="modal-admin-exito"
        :titulo="tituloModalExito"
        :mensaje="mensajeModalExito"
        @cerrar="modalExitoGeneralAbierto = false"
      />

      <!-- Modal: Registro de actividades históricas -->
      <ModalBase
        :abierto="modalActividadesAbierto"
        modal-id="modal-registro-actividades"
        ancho="actividades"
        titulo="Registro de actividades"
        titulo-izquierda
        @cerrar="modalActividadesAbierto = false"
      >
        <p class="descripcion-alerta-modal" style="text-align: left; margin: 0 0 24px 0; max-width: 100%;">
          Consulte los movimientos vehiculares registrados en los diferentes puntos de control.
        </p>

        <!-- Barra de filtros del historial -->
        <div class="barra-filtros-actividades">
          <div class="campo-busqueda-contenedor">
            <input 
              v-model="filtroActividadTexto"
              type="text" 
              class="campo-texto-modal" 
              placeholder="Buscar por ID o placa vehicular" 
              autocomplete="off"
            />
          </div>
          
          <div class="select-filtro-contenedor">
            <input 
              v-model="filtroActividadFecha"
              type="date" 
              class="campo-texto-modal"
              :class="{ 'campo-sin-seleccion': !filtroActividadFecha }"
            />
          </div>
          
          <div class="select-filtro-contenedor">
            <select
              v-model="filtroActividadPunto"
              class="campo-texto-modal"
              :class="{ 'campo-sin-seleccion': !filtroActividadPunto }"
            >
              <option value="">Punto de acceso</option>
              <option value="N01">N01</option>
              <option value="N02">N02</option>
              <option value="N03">N03</option>
              <option value="N04">N04</option>
            </select>
          </div>

          <div class="select-filtro-contenedor">
            <select
              v-model="filtroActividadMovimiento"
              class="campo-texto-modal"
              :class="{ 'campo-sin-seleccion': !filtroActividadMovimiento }"
            >
              <option value="">Movimiento</option>
              <option value="Entrada">Entrada</option>
              <option value="Salida">Salida</option>
            </select>
          </div>
        </div>

        <div class="contenedor-tabla-desplazable" style="max-height: 440px;">
          <table class="tabla-gestion-inveh">
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Identificador</th>
                <th>Placa vehicular</th>
                <th>Tipo de vehículo</th>
                <th>Punto de control</th>
                <th>Movimiento</th>
                <th class="columna-centrada">Ficha vehicular</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="actividadesFiltradas.length === 0">
                <td colspan="7" class="mensaje-tabla-vacia">
                  No existen movimientos registrados con los filtros seleccionados
                </td>
              </tr>
              <tr v-for="act in actividadesFiltradas" :key="act.id">
                <td>{{ act.fecha }} - {{ act.hora }}</td>
                <td>{{ act.identificador }}</td>
                <td>{{ act.placa }}</td>
                <td>{{ act.tipoVehiculo }}</td>
                <td>{{ act.puntoControl }}</td>
                <td>{{ act.tipoMovimiento }}</td>
                <td class="columna-centrada">
                  <button 
                    v-if="store.vehiculos.some(v => v.identificador === act.identificador)"
                    type="button" 
                    class="boton-tabla-icono" 
                    title="Ver ficha"
                    @click="verFichaVehiculo(store.vehiculos.find(v => v.identificador === act.identificador))"
                  >
                    <img src="/recursos/imagenes/archivo.svg" alt="Ficha" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ModalBase>

    </main>

    <Teleport to="body">
      <div id="area-impresion-credencial" aria-hidden="true">
        <div class="credencial-placa">{{ vehiculoSeleccionado?.placa || '-' }}</div>
        <div class="credencial-tarjeta-qr">
          <img
            :src="rutaQrCredencial"
            alt="Código QR"
            class="credencial-imagen-qr"
            @error="usarRespaldoQrCredencial = true"
          />
        </div>
        <p class="credencial-identificador">
          Identificador: <span>{{ vehiculoSeleccionado?.identificador || '-' }}</span>
        </p>
      </div>
    </Teleport>
  </div>
</template>