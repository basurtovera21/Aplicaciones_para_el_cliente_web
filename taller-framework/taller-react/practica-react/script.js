let likes = 0;
const boton = document.getElementById("btn-js");
const textoConteo = document.getElementById("conteo-js");

boton.addEventListener("click", () => {
  likes++;
  textoConteo.textContent = likes;
});