import { Disponibilidad, TutorDisponible } from '../models/sesion.models';
import {
  accionesPermitidas,
  agruparTutores,
  cabeEnDisponibilidad,
  combinarFechaHora,
  puedeCancelarPorTiempo,
} from './sesion-reglas';

function bloque(id: number, tutorId: number, nombre: string, dia: Disponibilidad['diaSemana'], ini: string, fin: string, activo = true): Disponibilidad {
  return { id, tutorId, tutorNombre: nombre, diaSemana: dia, horaInicio: ini, horaFin: fin, estaActivo: activo };
}

describe('sesion-reglas', () => {
  describe('accionesPermitidas', () => {
    it('el tutor acepta, rechaza o cancela una solicitud', () => {
      expect(accionesPermitidas('TUTOR', 'SOLICITADA')).toEqual(['aceptar', 'rechazar', 'cancelar']);
    });

    it('el tutor inicia o cancela una sesión aceptada y concluye una en curso', () => {
      expect(accionesPermitidas('TUTOR', 'ACEPTADA')).toEqual(['iniciar', 'cancelar']);
      expect(accionesPermitidas('TUTOR', 'EN_CURSO')).toEqual(['concluir']);
    });

    it('el estudiante solo cancela solicitudes y sesiones aceptadas', () => {
      expect(accionesPermitidas('ESTUDIANTE', 'SOLICITADA')).toEqual(['cancelar']);
      expect(accionesPermitidas('ESTUDIANTE', 'ACEPTADA')).toEqual(['cancelar']);
      expect(accionesPermitidas('ESTUDIANTE', 'EN_CURSO')).toEqual([]);
    });

    it('los estados finales y el coordinador no tienen acciones', () => {
      for (const e of ['RECHAZADA', 'CANCELADA', 'CONCLUIDA', 'EVALUADA'] as const) {
        expect(accionesPermitidas('TUTOR', e)).toEqual([]);
        expect(accionesPermitidas('ESTUDIANTE', e)).toEqual([]);
      }
      expect(accionesPermitidas('COORDINADOR', 'SOLICITADA')).toEqual([]);
    });
  });

  describe('puedeCancelarPorTiempo (regla de 2 horas)', () => {
    const ahora = new Date('2026-12-01T10:00:00');

    it('permite cancelar con exactamente 2 horas', () => {
      expect(puedeCancelarPorTiempo('2026-12-01T12:00:00', ahora)).toBeTrue();
    });

    it('no permite cancelar con menos de 2 horas', () => {
      expect(puedeCancelarPorTiempo('2026-12-01T11:59:00', ahora)).toBeFalse();
    });

    it('no permite cancelar una sesión que ya empezó', () => {
      expect(puedeCancelarPorTiempo('2026-12-01T09:00:00', ahora)).toBeFalse();
    });
  });

  describe('combinarFechaHora', () => {
    it('arma el formato LocalDateTime que espera el backend', () => {
      expect(combinarFechaHora('2026-12-01', '14:30')).toBe('2026-12-01T14:30:00');
    });
  });

  describe('disponibilidad del tutor', () => {
    // 2026-12-07 es lunes
    const tutor: TutorDisponible = {
      id: 1,
      nombre: 'Tutor Uno',
      bloques: [bloque(1, 1, 'Tutor Uno', 'MONDAY', '08:00:00', '10:00:00')],
    };

    it('acepta una sesión que cabe dentro del bloque', () => {
      expect(cabeEnDisponibilidad(tutor, new Date('2026-12-07T08:30:00'), 60)).toBeTrue();
    });

    it('acepta una sesión que termina justo al cierre del bloque', () => {
      expect(cabeEnDisponibilidad(tutor, new Date('2026-12-07T09:00:00'), 60)).toBeTrue();
    });

    it('rechaza una sesión que se sale del bloque', () => {
      expect(cabeEnDisponibilidad(tutor, new Date('2026-12-07T09:30:00'), 60)).toBeFalse();
    });

    it('rechaza otro día de la semana', () => {
      expect(cabeEnDisponibilidad(tutor, new Date('2026-12-08T08:30:00'), 60)).toBeFalse();
    });

    it('agrupa por tutor, ignora bloques inactivos y ordena por nombre', () => {
      const lista = agruparTutores([
        bloque(1, 2, 'Beto', 'MONDAY', '08:00:00', '10:00:00'),
        bloque(2, 1, 'Ana', 'TUESDAY', '08:00:00', '10:00:00'),
        bloque(3, 2, 'Beto', 'FRIDAY', '08:00:00', '10:00:00'),
        bloque(4, 3, 'Carla', 'FRIDAY', '08:00:00', '10:00:00', false),
      ]);
      expect(lista.map((t) => t.nombre)).toEqual(['Ana', 'Beto']);
      expect(lista[1].bloques.length).toBe(2);
    });
  });
});
