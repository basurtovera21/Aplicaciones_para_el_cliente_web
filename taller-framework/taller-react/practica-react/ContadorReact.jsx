// 1. Extraer el Hook useState desde React
const { useState } = React;

// 2. Crear el componente funcional BotonMeGusta con estado iniciado en 0
function BotonMeGusta() {
  const [likes, setLikes] = useState(0);

  // 3. Retornar el botón que incrementa el estado al hacer clic
  return (
    <button onClick={() => setLikes(likes + 1)}>
      Me gusta (React): {likes}
    </button>
  );
}

// 4. Renderizar el componente dentro del div con id "root"
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<BotonMeGusta />);