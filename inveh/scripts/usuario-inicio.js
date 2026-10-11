document.addEventListener('DOMContentLoaded', () => {
  const botonCerrarSesion = document.getElementById('boton-cerrar-sesion');
  const botonRequerirVehiculo = document.getElementById('boton-abrir-registro-vehiculo');
  const botonFichaVehicular = document.getElementById('boton-abrir-ficha-vehicular');
  const botonDesvincularVehiculo = document.getElementById('boton-abrir-desvincular-vehiculo');
  const botonCrearAutorizacion = document.getElementById('boton-abrir-crear-autorizacion');

  if (botonCerrarSesion) {
    botonCerrarSesion.addEventListener('click', () => {
      window.location.href = 'inicio-sesion.html';
    });
  }

  if (botonRequerirVehiculo) {
    botonRequerirVehiculo.addEventListener('click', () => {
      if (typeof abrirModal === 'function') {
        abrirModal('modal-registro-vehiculo');
      }
    });
  }

  if (botonFichaVehicular) {
    botonFichaVehicular.addEventListener('click', () => {
      if (typeof abrirModal === 'function') {
        abrirModal('modal-ficha-vehicular');
      }
    });
  }

  if (botonDesvincularVehiculo) {
    botonDesvincularVehiculo.addEventListener('click', () => {
      if (typeof abrirModal === 'function') {
        abrirModal('modal-desvincular-vehiculo');
      }
    });
  }

  if (botonCrearAutorizacion) {
    botonCrearAutorizacion.addEventListener('click', () => {
      if (typeof abrirModal === 'function') {
        abrirModal('modal-crear-autorizacion');
      }
    });
  }
});


document.addEventListener('DOMContentLoaded', () => {
    const botonProceder = document.getElementById('boton-proceder-desvincular');

    if (botonProceder) {
        botonProceder.addEventListener('click', () => {
            cerrarModal('modal-desvincular-vehiculo');
            setTimeout(() => {
                abrirModal('modal-desvinculacion-exito');
            }, 400);
        });
    }
});