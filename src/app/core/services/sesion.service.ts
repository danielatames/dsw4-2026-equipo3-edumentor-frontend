import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';
import { AccionSesion, SesionRequest } from '../models/sesion.models';
import { EstadoSesion, Sesion } from '../models/tutoria.models';

@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly http = inject(HttpClient);

  /** El backend decide qué ve cada rol: estudiante lo suyo, tutor lo que le piden, coordinador todo. */
  listar(estado?: EstadoSesion | null): Observable<Sesion[]> {
    let params = new HttpParams();
    if (estado) {
      params = params.set('estado', estado);
    }
    return this.http.get<Sesion[]>(`${API_URL}/sesiones`, { params });
  }

  solicitar(datos: SesionRequest): Observable<Sesion> {
    return this.http.post<Sesion>(`${API_URL}/sesiones`, datos);
  }

  /** PATCH /sesiones/{id}/{aceptar|rechazar|cancelar|iniciar|concluir} */
  ejecutar(id: number, accion: AccionSesion): Observable<Sesion> {
    return this.http.patch<Sesion>(`${API_URL}/sesiones/${id}/${accion}`, {});
  }
}
