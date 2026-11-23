export type EstadoSesion =
  | 'SOLICITADA'
  | 'ACEPTADA'
  | 'RECHAZADA'
  | 'CANCELADA'
  | 'EN_CURSO'
  | 'CONCLUIDA'
  | 'EVALUADA';

export type TipoArchivo = 'ENLACE' | 'PDF' | 'VIDEO' | 'DOCUMENTO' | 'PRESENTACION' | 'OTRO';

export const TIPOS_ARCHIVO: readonly TipoArchivo[] = [
  'ENLACE',
  'PDF',
  'VIDEO',
  'DOCUMENTO',
  'PRESENTACION',
  'OTRO',
];

export interface Sesion {
  id: number;
  estudianteId: number;
  estudianteNombre: string;
  tutorId: number;
  tutorNombre: string;
  materiaId: number;
  materiaNombre: string;
  fechaHora: string;
  fechaFin: string;
  duracionMinutos: number;
  estado: EstadoSesion;
  tema: string | null;
}

export interface Recurso {
  id: number;
  sesionId: number;
  titulo: string;
  urlRecurso: string;
  tipoArchivo: TipoArchivo;
}

export interface RecursoRequest {
  titulo: string;
  urlRecurso: string;
  tipoArchivo: TipoArchivo;
}

export interface Evaluacion {
  id: number;
  sesionId: number;
  calificacionEstrellas: number;
  comentario: string | null;
  fechaEvaluacion: string;
}

export interface EvaluacionRequest {
  calificacionEstrellas: number;
  comentario: string | null;
}

export interface CalificacionTutor {
  tutorId: number;
  tutorNombre: string;
  promedio: number;
  totalEvaluaciones: number;
}
