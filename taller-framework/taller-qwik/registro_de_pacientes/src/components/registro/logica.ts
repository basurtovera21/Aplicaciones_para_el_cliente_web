import { $, useStore, useVisibleTask$ } from "@builder.io/qwik";

export interface Paciente {
  nombre: string;
  cedula: string;
  telefono: string;
  sangre: string;
}

export const usePacientes = () => {
  const estado = useStore({
    nombre: "",
    cedula: "",
    telefono: "",
    sangre: "",
    error: "",
    editando: -1,
    pacientes: [] as Paciente[],
  });

  useVisibleTask$(() => {
    const guardado = localStorage.getItem("pacientes");
    if (guardado) estado.pacientes = JSON.parse(guardado);
  });

  const limpiar = $(() => {
    estado.nombre = "";
    estado.cedula = "";
    estado.telefono = "";
    estado.sangre = "";
    estado.error = "";
    estado.editando = -1;
  });

  const registrar = $(() => {
    if (
      !estado.nombre.trim() ||
      !/^\d{10}$/.test(estado.cedula) ||
      !/^\d{10}$/.test(estado.telefono) ||
      !estado.sangre
    ) {
      estado.error = "Complete todos los campos: nombre, cédula, teléfono y tipo de sangre";
      return;
    }

    const paciente: Paciente = {
      nombre: estado.nombre,
      cedula: estado.cedula,
      telefono: estado.telefono,
      sangre: estado.sangre,
    };

    if (estado.editando >= 0) {
      estado.pacientes[estado.editando] = paciente;
    } else {
      estado.pacientes.push(paciente);
    }

    localStorage.setItem("pacientes", JSON.stringify(estado.pacientes));
    limpiar();
  });

  const editar = $((i: number) => {
    const p = estado.pacientes[i];
    estado.nombre = p.nombre;
    estado.cedula = p.cedula;
    estado.telefono = p.telefono;
    estado.sangre = p.sangre;
    estado.error = "";
    estado.editando = i;
  });

  const eliminar = $((i: number) => {
    estado.pacientes.splice(i, 1);
    localStorage.setItem("pacientes", JSON.stringify(estado.pacientes));
    limpiar();
  });

  return { estado, registrar, editar, eliminar, limpiar };
};