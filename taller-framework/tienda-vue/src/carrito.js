import { ref, computed } from 'vue'

export const carrito = ref([])

export const total = computed(() =>
  carrito.value.reduce((suma, item) => suma + item.precio * item.cantidad, 0)
)

export function agregarAlCarrito(producto) {
  const existente = carrito.value.find(item => item.id === producto.id)
  if (existente) {
    existente.cantidad++
  } else {
    carrito.value.push({ ...producto, cantidad: 1 })
  }
}

export function quitar(id) {
  carrito.value = carrito.value.filter(item => item.id !== id)
}