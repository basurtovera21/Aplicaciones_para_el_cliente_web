<script setup>
import { ref, computed } from 'vue'
import { productos, categorias } from '../data/productos.js'
import { agregarAlCarrito } from '../carrito.js'

const busqueda = ref('')
const categoria = ref('Todas')

const productosFiltrados = computed(() =>
  productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.value.toLowerCase()) &&
    (categoria.value === 'Todas' || p.categoria === categoria.value)
  )
)
</script>

<template>
  <section>
    <h2>Catálogo</h2>
    <input v-model="busqueda" placeholder="Buscar producto">
    <select v-model="categoria">
      <option v-for="c in categorias" :key="c">{{ c }}</option>
    </select>

    <p v-if="productosFiltrados.length === 0">No se encontraron productos</p>

    <div class="catalogo">
      <div class="tarjeta" v-for="p in productosFiltrados" :key="p.id">
        <h3>{{ p.nombre }}</h3>
        <p>{{ p.categoria }}</p>
        <p>${{ p.precio }}</p>
        <button @click="agregarAlCarrito(p)">Agregar al carrito</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.catalogo {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 16px 0;
}

.tarjeta {
  background: white;
  border: 1px solid var(--borde);
  border-radius: 8px;
  padding: 16px;
}

.tarjeta h3 {
  margin: 0 0 4px;
}

.tarjeta p {
  margin: 4px 0;
}

@media (max-width: 600px) {
  .catalogo {
    grid-template-columns: 1fr;
  }
}
</style>