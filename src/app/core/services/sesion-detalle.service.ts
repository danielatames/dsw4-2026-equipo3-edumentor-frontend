import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';
import { Sesion } from '../models/tutoria.models';

@Injectable({ providedIn: 'root' })
export class SesionDetalleService {
  private readonly http = inject(HttpClient);

  obtener(id: number): Observable<Sesion> {
    return this.http.get<Sesion>(`${API_URL}/sesiones/${id}`);
  }
}
