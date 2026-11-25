import { Rol } from '../models/auth.models';
import { AccionSesion, Disponibilidad, DiaSemana, TutorDisponible } from '../models/sesion.models';
import { EstadoSesion } from '../models/tutoria.models';

/** Horas mínimas de anticipación para cancelar (misma regla que el backend). */
export const HORAS_MIN_CANCELACION = 2;
export const DURACION_MIN = 30;
export const DURACION_MAX = 180;

const DIAS_JS: readonly DiaSemana[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

/**
 * Acciones disponibles según el rol y el estado. Refleja la máquina de estados del backend:
 * SOLICITADA -> ACEPTADA | RECHAZADA | CANCELADA, ACEPTADA -> EN_CURSO | CANCELADA, EN_CURSO -> CONCLUIDA.
 * El coordinador solo consulta.
 */
export function accionesPermitidas(rol: Rol | null, estado: EstadoSesion): AccionSesion[] {
  if (rol === 'TUTOR') {
    switch (estado) {
      case 'SOLICITADA':
        return ['aceptar', 'rechazar', 'cancelar'];
      case 'ACEPTADA':
        return ['iniciar', 'cancelar'];
      case 'EN_CURSO':
        return ['concluir'];
      default:
        return [];
    }
  }
  if (rol === 'ESTUDIANTE') {
    return estado === 'SOLICITADA' || estado === 'ACEPTADA' ? ['cancelar'] : [];
  }
  return [];
}

/** Milisegundos que faltan para que empiece la sesión (negativo si ya empezó). */
export function msParaInicio(fechaHoraIso: string, ahora: Date = new Date()): number {
  return new Date(fechaHoraIso).getTime() - ahora.getTime();
}

/** Cancelar exige al menos 2 horas de anticipación. */
export function puedeCancelarPorTiempo(fechaHoraIso: string, ahora: Date = new Date()): boolean {
  return msParaInicio(fechaHoraIso, ahora) >= HORAS_MIN_CANCELACION * 60 * 60 * 1000;
}

/** "2026-12-01T14:30:00" a partir de una fecha "2026-12-01" y una hora "14:30". */
export function combinarFechaHora(fecha: string, hora: string): string {
  const h = hora.length === 5 ? `${hora}:00` : hora;
  return `${fecha}T${h}`;
}

/** Interpreta fecha y hora como hora local; null si alguna está vacía o es inválida. */
export function fechaLocal(fecha: string, hora: string): Date | null {
  if (!fecha || !hora) {
    return null;
  }
  const d = new Date(combinarFechaHora(fecha, hora));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function aMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Advertencia (no bloqueante) de que la sesión no cabe en un bloque del tutor.
 * Mismo criterio que el backend: mismo día de la semana y [inicio, fin] dentro del bloque.
 */
export function cabeEnDisponibilidad(tutor: TutorDisponible, inicio: Date, duracionMin: number): boolean {
  const dia = DIAS_JS[inicio.getDay()];
  const ini = inicio.getHours() * 60 + inicio.getMinutes();
  const fin = ini + duracionMin;
  if (fin > 24 * 60) {
    return false;
  }
  return tutor.bloques.some(
    (b) => b.diaSemana === dia && ini >= aMinutos(b.horaInicio) && fin <= aMinutos(b.horaFin),
  );
}

/** Agrupa los bloques activos por tutor y los ordena por nombre. */
export function agruparTutores(bloques: Disponibilidad[]): TutorDisponible[] {
  const mapa = new Map<number, TutorDisponible>();
  for (const b of bloques) {
    if (!b.estaActivo) {
      continue;
    }
    const actual = mapa.get(b.tutorId) ?? { id: b.tutorId, nombre: b.tutorNombre, bloques: [] };
    actual.bloques.push(b);
    mapa.set(b.tutorId, actual);
  }
  return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
}
