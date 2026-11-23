import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';
import { Recurso, RecursoRequest } from '../models/tutoria.models';

@Injectable({ providedIn: 'root' })
export class RecursoService {
  private readonly http = inject(HttpClient);

  listar(sesionId: number): Observable<Recurso[]> {
    return this.http.get<Recurso[]>(`${API_URL}/sesiones/${sesionId}/recursos`);
  }

  agregar(sesionId: number, datos: RecursoRequest): Observable<Recurso> {
    return this.http.post<Recurso>(`${API_URL}/sesiones/${sesionId}/recursos`, datos);
  }

  eliminar(sesionId: number, recursoId: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/sesiones/${sesionId}/recursos/${recursoId}`);
  }
}
