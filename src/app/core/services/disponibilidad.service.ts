import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';
import { Disponibilidad, DisponibilidadRequest } from '../models/sesion.models';

@Injectable({ providedIn: 'root' })
export class DisponibilidadService {
  private readonly http = inject(HttpClient);

  /** Bloques activos de todos los tutores (de aquí sale la lista de tutores a elegir). */
  listarActivas(): Observable<Disponibilidad[]> {
    return this.http.get<Disponibilidad[]>(`${API_URL}/disponibilidades`);
  }

  // Lo siguiente solo lo permite el backend al TUTOR, siempre sobre sus propios bloques.

  /** Todos los bloques del tutor que inició sesión, incluidos los desactivados. */
  listarMias(): Observable<Disponibilidad[]> {
    return this.http.get<Disponibilidad[]>(`${API_URL}/disponibilidades/mias`);
  }

  crear(datos: DisponibilidadRequest): Observable<Disponibilidad> {
    return this.http.post<Disponibilidad>(`${API_URL}/disponibilidades`, datos);
  }

  actualizar(id: number, datos: DisponibilidadRequest): Observable<Disponibilidad> {
    return this.http.put<Disponibilidad>(`${API_URL}/disponibilidades/${id}`, datos);
  }

  /** PATCH /disponibilidades/{id}/estado: activa o desactiva un bloque. */
  cambiarEstado(id: number, activo: boolean): Observable<Disponibilidad> {
    return this.http.patch<Disponibilidad>(`${API_URL}/disponibilidades/${id}/estado`, { activo });
  }
}
