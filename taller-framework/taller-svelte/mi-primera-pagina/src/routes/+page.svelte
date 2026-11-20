<script>
  let nombre = $state('');
  let contador = $state(0);
</script>

<main>
  <h1>¡Mi primera página con Svelte!</h1>
  <p>Bienvenido a nuestro proyecto.</p>

  <section>
    <h2>Escribe tu nombre</h2>
    <input
      bind:value={nombre}
      placeholder="Escribe tu nombre..."
    />
    {#if nombre.trim()}
      <h3>¡Hola, {nombre}!</h3>
    {:else}
      <p>Esperando tu nombre...</p>
    {/if}
  </section>

  <section>
    <h2>Contador interactivo</h2>
    <h1>{contador}</h1>
    <button onclick={() => contador++}>
      Aumentar +
    </button>
    <button onclick={() => contador--}>
      Disminuir -
    </button>
    <button onclick={() => contador = 0}>
      Reiniciar
    </button>
  </section>
</main>

<style>
  main {
    max-width: 600px;
    margin: 50px auto;
    padding: 25px;
    text-align: center;
    font-family: Arial, sans-serif;
    background: #f5f5f5;
    border-radius: 15px;
  }

  section {
    margin-top: 25px;
    padding: 20px;
    background: white;
    border-radius: 10px;
  }

  input {
    padding: 12px;
    width: 80%;
    border: 1px solid #ccc;
    border-radius: 8px;
  }

  button {
    margin: 5px;
    padding: 10px 15px;
    border: none;
    border-radius: 7px;
    background: #ff6b35;
    color: white;
    cursor: pointer;
  }

  button:hover {
    background: #e65320;
  }
</style>