// --- 1. ESTADO DE LA APLICACIÓN ---
let libros = JSON.parse(localStorage.getItem('listaLibros')) || [];
let estaEditando = false;

// --- 2. ELEMENTOS DEL DOM ---
const formulario = document.getElementById('formulario-crud');
const entradaTitulo = document.getElementById('titulo');
const entradaAutor = document.getElementById('autor');
const entradaId = document.getElementById('id-elemento');
const cuerpoTabla = document.getElementById('cuerpo-tabla');
const botonGuardar = document.getElementById('boton-guardar');
const botonCancelar = document.getElementById('boton-cancelar');

// --- 3. FUNCIONES OPERATIVAS (CRUD) ---

// [LEER]
function renderizarLibros() {
  cuerpoTabla.innerHTML = '';

  if (libros.length === 0) {
    cuerpoTabla.innerHTML = `<tr><td colspan="3" style="text-align:center;">No hay libros registrados.</td></tr>`;
  } else {
    libros.forEach(libro => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${libro.titulo}</td>
        <td>${libro.autor}</td>
        <td>
          <button class="btn-editar" onclick="prepararEdicion('${libro.id}')">Editar</button>
          <button class="btn-eliminar" onclick="eliminarLibro('${libro.id}')">Eliminar</button>
        </td>
      `;
      cuerpoTabla.appendChild(fila);
    });
  }

  // Sincronizar siempre con el almacenamiento local
  localStorage.setItem('listaLibros', JSON.stringify(libros));
}

// [CREAR Y ACTUALIZAR]
formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();

  const valorTitulo = entradaTitulo.value.trim();
  const valorAutor = entradaAutor.value.trim();
  const idActual = entradaId.value;

  if (estaEditando) {
    // Modo Actualización
    libros = libros.map(libro =>
      libro.id === idActual ? { ...libro, titulo: valorTitulo, autor: valorAutor } : libro
    );
  } else {
    // Modo Creación
    const nuevoLibro = {
      id: crypto.randomUUID(),
      titulo: valorTitulo,
      autor: valorAutor
    };
    libros.push(nuevoLibro);
  }

  reiniciarFormulario();
  renderizarLibros();
});

// [PREPARAR EDICIÓN]
window.prepararEdicion = function(id) {
  const libroEncontrado = libros.find(libro => libro.id === id);
  if (!libroEncontrado) return;

  entradaTitulo.value = libroEncontrado.titulo;
  entradaAutor.value = libroEncontrado.autor;
  entradaId.value = libroEncontrado.id;

  estaEditando = true;
  botonGuardar.textContent = 'Actualizar Libro';
  botonCancelar.classList.remove('oculto');
};

// [ELIMINAR]
window.eliminarLibro = function(id) {
  if (confirm('¿Está seguro de que desea eliminar este libro?')) {
    libros = libros.filter(libro => libro.id !== id);

    // Si se elimina el libro que se estaba editando, restablece el formulario
    if (estaEditando && entradaId.value === id) {
      reiniciarFormulario();
    }
    renderizarLibros();
  }
};

// [CANCELAR Y REINICIAR]
botonCancelar.addEventListener('click', reiniciarFormulario);

function reiniciarFormulario() {
  formulario.reset();
  entradaId.value = '';
  estaEditando = false;
  botonGuardar.textContent = 'Guardar Libro';
  botonCancelar.classList.add('oculto');
}

// --- 4. INICIALIZACIÓN ---
renderizarLibros();