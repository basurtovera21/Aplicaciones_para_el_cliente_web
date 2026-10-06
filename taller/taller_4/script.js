document.getElementById('registroForm').addEventListener('submit', function (e) {
  e.preventDefault(); // Evita el refresco de página y envío por defecto

  // Limpiar mensajes de error previos
  document.querySelectorAll('.error').forEach(el => (el.innerText = ''));

  let esValido = true;

  // 1. Validar Nombre (solo letras castellanas, tildes, ñ y espacios)
  const nombre = document.getElementById('nombre').value.trim();
  const regexNombre = /^[a-zA-ZÁÉÍÓÚáéíóúñÑ ]+$/;

  if (nombre === "" || !regexNombre.test(nombre)) {
    document.getElementById('errorNombre').innerText = "El nombre solo debe contener letras.";
    esValido = false;
  }

  // 2. Validar Email (formato estándar de dirección de correo electrónico)
  const email = document.getElementById('email').value.trim();
  const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!regexEmail.test(email)) {
    document.getElementById('errorEmail').innerText = "Ingrese un correo electrónico válido.";
    esValido = false;
  }

  // 3. Validar Contraseña (mínimo 8 caracteres, al menos una mayúscula y un número)
  const pass = document.getElementById('password').value;
  const regexPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  if (!regexPass.test(pass)) {
    document.getElementById('errorPass').innerText = "La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número.";
    esValido = false;
  }

  // Si todas las validaciones son exitosas
  if (esValido) {
    alert("¡Formulario enviado con éxito!");
    this.reset(); // Reinicia los campos del formulario
  }
});