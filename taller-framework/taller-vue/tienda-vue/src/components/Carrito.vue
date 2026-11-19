<script setup>
import { carrito, total, quitar } from '../carrito.js'
</script>

<template>
  <section>
    <h2>Carrito</h2>
    <p v-if="carrito.length === 0">El carrito está vacío</p>

    <ul>
      <li v-for="item in carrito" :key="item.id">
        {{ item.nombre }} x{{ item.cantidad }} — ${{ item.precio * item.cantidad }}
        <button @click="quitar(item.id)">Quitar</button>
      </li>
    </ul>

    <p v-if="carrito.length > 0"><strong>Total: ${{ total }}</strong></p>
  </section>
</template>

<style scoped>
ul {
  list-style: none;
  padding: 0;
}

li {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border: 1px solid var(--borde);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
}
</style>