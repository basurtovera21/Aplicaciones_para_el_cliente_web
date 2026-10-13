// 1. Referencias al DOM
const formularioTareas = document.getElementById('formulario-tareas');
const tituloTarea = document.getElementById('titulo-tarea');
const descripcionTarea = document.getElementById('descripcion-tarea');
const listaTareas = document.getElementById('lista-tareas');
const btnExportarJson = document.getElementById('btn-exportar-json');
const btnExportarXml = document.getElementById('btn-exportar-xml');

// 2. Estado de la Aplicación
let coleccionTareas = JSON.parse(localStorage.getItem('tareasGuardadas')) || [];

// 3. Pintar tareas en pantalla
function redibujarInterfaz() {
  listaTareas.innerHTML = '';

  coleccionTareas.forEach((tarea, indice) => {
    const elementoLista = document.createElement('li');
    elementoLista.className = 'elemento-tarea';

    elementoLista.innerHTML = `
      <div>
        <h3>${tarea.titulo}</h3>
        <p>${tarea.descripcion}</p>
        <small>Código: ${tarea.codigo} | Registro: ${tarea.fecha}</small>
      </div>
      <button class="btn-eliminar" onclick="removerTarea(${indice})">Eliminar</button>
    `;
    listaTareas.appendChild(elementoLista);
  });
}

// 4. Guardar en LocalStorage
function actualizarAlmacenamientoLocal() {
  localStorage.setItem('tareasGuardadas', JSON.stringify(coleccionTareas));
}

// 5. Alta de tareas
formularioTareas.addEventListener('submit', (evento) => {
  evento.preventDefault();

  const nuevaTarea = {
    codigo: Date.now().toString(),
    titulo: tituloTarea.value.trim(),
    descripcion: descripcionTarea.value.trim(),
    fecha: new Date().toLocaleDateString()
  };

  coleccionTareas.push(nuevaTarea);
  actualizarAlmacenamientoLocal();
  redibujarInterfaz();

  formularioTareas.reset();
});

// 6. Eliminar tarea
window.removerTarea = function(indice) {
  coleccionTareas.splice(indice, 1);
  actualizarAlmacenamientoLocal();
  redibujarInterfaz();
};

// =======================================================
// FORMATOS SEMIESTRUCTURADOS (JSON y XML)
// =======================================================

// Exportar a JSON
btnExportarJson.addEventListener('click', () => {
  if (coleccionTareas.length === 0) return alert('No existen tareas para exportar.');

  const textoJson = JSON.stringify(coleccionTareas, null, 2);
  console.log("--- FLUJO DE DATOS: JSON GENERADO ---");
  console.log(textoJson);

  generarDescarga(textoJson, 'tareas_academicas.json', 'application/json');
});

// Sanitización de entidades XML
function sanitizarTextoXml(textoInseguro) {
  return String(textoInseguro).replace(/[<>&'"]/g, (caracter) => {
    switch (caracter) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return caracter;
    }
  });
}

// Exportar a XML
btnExportarXml.addEventListener('click', () => {
  if (coleccionTareas.length === 0) return alert('No existen tareas para exportar.');

  let textoXml = `<?xml version="1.0" encoding="UTF-8"?>\n<tareas>\n`;

  coleccionTareas.forEach(tarea => {
    textoXml += `  <tarea codigo="${tarea.codigo}">\n`;
    textoXml += `    <titulo>${sanitizarTextoXml(tarea.titulo)}</titulo>\n`;
    textoXml += `    <descripcion>${sanitizarTextoXml(tarea.descripcion)}</descripcion>\n`;
    textoXml += `    <fecha>${tarea.fecha}</fecha>\n`;
    textoXml += `  </tarea>\n`;
  });

  textoXml += `</tareas>`;

  console.log("--- FLUJO DE DATOS: XML GENERADO ---");
  console.log(textoXml);

  generarDescarga(textoXml, 'tareas_academicas.xml', 'application/xml');
});

// Descargar archivo
function generarDescarga(contenidoTexto, nombreArchivo, tipoMime) {
  const bloqueDatos = new Blob([contenidoTexto], { type: tipoMime });
  const urlDescarga = URL.createObjectURL(bloqueDatos);
  const enlaceDescarga = document.createElement('a');

  enlaceDescarga.href = urlDescarga;
  enlaceDescarga.download = nombreArchivo;
  enlaceDescarga.click();

  URL.revokeObjectURL(urlDescarga);
}

// 7. Render inicial
redibujarInterfaz();