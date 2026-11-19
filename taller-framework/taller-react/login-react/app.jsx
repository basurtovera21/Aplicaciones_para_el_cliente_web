const { useState } = React;

// Componente hijo que recibe datos mediante Props
function VentanaModal({ mostrar, correcto, mensaje, cerrar, continuar }) {
  if (!mostrar) return null;

  return (
    <div className="modal-fondo">
      <div className="modal-caja">
        <h3>{correcto ? "¡Todo correcto!" : "Error de acceso"}</h3>
        <p>{mensaje}</p>
        {correcto ? (
          <button className="btn-verde" onClick={continuar}>
            Entrar al sistema
          </button>
        ) : (
          <button className="btn-rojo" onClick={cerrar}>
            Intentar de nuevo
          </button>
        )}
      </div>
    </div>
  );
}

// Componente principal
function App() {
  const correoValido = "admin@correo.com";
  const claveValida = "1234";

  // Estados para guardar los datos del formulario y de la ventana
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [ventana, setVentana] = useState({
    mostrar: false,
    correcto: false,
    mensaje: ""
  });

  // Verifica los 4 posibles casos al enviar el formulario
  const validarLogin = (e) => {
    e.preventDefault();

    const correoOk = correo === correoValido;
    const claveOk = clave === claveValida;

    if (!correoOk && !claveOk) {
      setVentana({
        mostrar: true,
        correcto: false,
        mensaje: "El correo y la contraseña son incorrectos."
      });
    } else if (!correoOk) {
      setVentana({
        mostrar: true,
        correcto: false,
        mensaje: "El correo es incorrecto."
      });
    } else if (!claveOk) {
      setVentana({
        mostrar: true,
        correcto: false,
        mensaje: "La contraseña es incorrecta."
      });
    } else {
      setVentana({
        mostrar: true,
        correcto: true,
        mensaje: "Credenciales válidas. Ya puedes continuar."
      });
    }
  };

  return (
    <div className="caja-login">
      <h2>Iniciar Sesión</h2>
      <form onSubmit={validarLogin}>
        <label>Correo:</label>
        <input
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
        />

        <label>Contraseña:</label>
        <input
          type="password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          required
        />

        <button type="submit">Ingresar</button>
      </form>

      <VentanaModal
        mostrar={ventana.mostrar}
        correcto={ventana.correcto}
        mensaje={ventana.mensaje}
        cerrar={() => setVentana({ ...ventana, mostrar: false })}
        continuar={() => (window.location.href = "panel.html")}
      />
    </div>
  );
}

// Dibuja la aplicación en el HTML
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);