import { Component, signal } from '@angular/core';

interface Tutoria {
  id: number;
  materia: string;
  estado: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  tutorias = signal<Tutoria[]>([
    {
      id: 1,
      materia: 'Bases de Datos',
      estado: 'Confirmada'
    },
    {
      id: 2,
      materia: 'Ingeniería de Software',
      estado: 'Pendiente'
    },
    {
      id: 3,
      materia: 'Aplicaciones Web',
      estado: 'Confirmada'
    }
  ]);

  agregar(materia: string) {
    if (materia.trim() === '') {
      return;
    }

    this.tutorias.update(lista => [
      ...lista,
      {
        id: Date.now(),
        materia: materia.trim(),
        estado: 'Pendiente'
      }
    ]);
  }

  cambiarEstado(id: number) {
    this.tutorias.update(lista =>
      lista.map(tutoria =>
        tutoria.id === id
          ? {
              ...tutoria,
              estado: tutoria.estado === 'Pendiente'
                ? 'Confirmada'
                : 'Pendiente'
            }
          : tutoria
      )
    );
  }
}