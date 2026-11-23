import { HttpErrorResponse } from '@angular/common/http';

export function detalleProblema(error: HttpErrorResponse): string | null {
  const cuerpo = error.error;
  if (!cuerpo || typeof cuerpo !== 'object') {
    return null;
  }
  const errores = (cuerpo as { errores?: unknown }).errores;
  if (errores && typeof errores === 'object') {
    const mensajes = Object.values(errores).filter((m): m is string => typeof m === 'string');
    if (mensajes.length > 0) {
      return mensajes.join(' ');
    }
  }
  const detalle = (cuerpo as { detail?: unknown }).detail;
  return typeof detalle === 'string' && detalle.length > 0 ? detalle : null;
}
