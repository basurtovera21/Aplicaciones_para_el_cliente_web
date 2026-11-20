import { component$, useStyles$ } from "@builder.io/qwik";
import estilos from "./registro.css?inline";
import { usePacientes } from "./logica";

export default component$(() => {
  useStyles$(estilos);
  const { estado, registrar, editar, eliminar, limpiar } = usePacientes();

  return (
    <div class="pagina">
      <div class="caja">
        <h1>Registro de pacientes</h1>

        <input
          placeholder="Nombre"
          value={estado.nombre}
          onInput$={(_, el) => (estado.nombre = el.value)}
        />

        <input
          type="text"
          inputMode="numeric"
          placeholder="Cédula"
          minLength={10}
          maxLength={10}
          value={estado.cedula}
          onInput$={(_, el) => {
            el.value = el.value.replace(/\D/g, "");
            estado.cedula = el.value;
          }}
        />

        <input
          type="text"
          inputMode="numeric"
          placeholder="Teléfono"
          minLength={10}
          maxLength={10}
          value={estado.telefono}
          onInput$={(_, el) => {
            el.value = el.value.replace(/\D/g, "");
            estado.telefono = el.value;
          }}
        />

        <select
          value={estado.sangre}
          onChange$={(_, el) => (estado.sangre = el.value)}
        >
          <option value="">Tipo de sangre</option>
          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <button onClick$={registrar}>
          {estado.editando >= 0 ? "Actualizar" : "Registrar"}
        </button>

        {estado.editando >= 0 && (
          <button class="cancelar" onClick$={limpiar}>Cancelar</button>
        )}

        {estado.error && <p class="error">{estado.error}</p>}

        <ul>
          {estado.pacientes.map((p, i) => (
            <li key={i}>
              <span>{p.nombre} - {p.cedula} - {p.telefono} - {p.sangre}</span>
              <span class="acciones">
                <button class="mini" onClick$={() => editar(i)}>Editar</button>
                <button class="mini rojo" onClick$={() => eliminar(i)}>Eliminar</button>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});