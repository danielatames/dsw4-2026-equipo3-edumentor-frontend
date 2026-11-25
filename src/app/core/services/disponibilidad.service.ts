import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';
import { Disponibilidad } from '../models/sesion.models';

@Injectable({ providedIn: 'root' })
export class DisponibilidadService {
  private readonly http = inject(HttpClient);

  /** Bloques activos de todos los tutores (de aquí sale la lista de tutores a elegir). */
  listarActivas(): Observable<Disponibilidad[]> {
    return this.http.get<Disponibilidad[]>(`${API_URL}/disponibilidades`);
  }
}
