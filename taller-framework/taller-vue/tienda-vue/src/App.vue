<script setup>
import Catalogo from './components/Catalogo.vue'
import Carrito from './components/Carrito.vue'
</script>

<template>
  <div class="tienda">
    <h1>Mini tienda</h1>
    <Catalogo/>
    <Carrito/>
  </div>
</template>

<style>
:root {
  --verde: #42b883;
  --verde-oscuro: #247a55;
  --azul: #35495e;
  --fondo: #f6f8fa;
  --borde: #d5dde4;
}

body {
  margin: 0;
  background: var(--fondo);
  color: var(--azul);
  font-family: system-ui, 'Segoe UI', sans-serif;
}

.tienda {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 16px;
}

h1 {
  border-bottom: 4px solid var(--verde);
  padding-bottom: 8px;
}

button {
  background: var(--verde-oscuro);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
}

button:hover {
  background: #1c6246;
}

input,
select {
  padding: 8px;
  border: 1px solid var(--borde);
  border-radius: 6px;
  margin-right: 8px;
}
</style>