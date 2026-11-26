import { EstadoSesion } from './tutoria.models';

export const ESTADOS_SESION: readonly EstadoSesion[] = [
  'SOLICITADA',
  'ACEPTADA',
  'RECHAZADA',
  'CANCELADA',
  'EN_CURSO',
  'CONCLUIDA',
  'EVALUADA',
];

export type AccionSesion = 'aceptar' | 'rechazar' | 'cancelar' | 'iniciar' | 'concluir';

export interface SesionRequest {
  tutorId: number;
  materiaId: number;
  fechaHora: string;
  duracionMinutos: number;
  tema: string | null;
}

export interface Materia {
  id: number;
  codigoMateria: string;
  nombreMateria: string;
  carrera: string;
  creditos: number;
}

/** Datos que envía el coordinador al crear o editar una materia. */
export interface MateriaRequest {
  codigoMateria: string;
  nombreMateria: string;
  carrera: string;
  creditos: number;
}

/** Filtros opcionales del catálogo (GET /materias). */
export interface FiltroMaterias {
  nombre?: string;
  carrera?: string;
  pagina: number;
  tamano: number;
}

export interface PaginaResponse<T> {
  contenido: T[];
  pagina: number;
  tamano: number;
  totalElementos: number;
  totalPaginas: number;
}

export type DiaSemana =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface Disponibilidad {
  id: number;
  tutorId: number;
  tutorNombre: string;
  diaSemana: DiaSemana;
  horaInicio: string; // "HH:mm:ss"
  horaFin: string; // "HH:mm:ss"
  estaActivo: boolean;
}

/** Tutor que se puede elegir en el formulario: se arma a partir de sus bloques de disponibilidad. */
export interface TutorDisponible {
  id: number;
  nombre: string;
  bloques: Disponibilidad[];
}
