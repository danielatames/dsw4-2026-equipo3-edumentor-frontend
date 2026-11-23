import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';
import { CalificacionTutor, Evaluacion, EvaluacionRequest } from '../models/tutoria.models';

@Injectable({ providedIn: 'root' })
export class EvaluacionService {
  private readonly http = inject(HttpClient);

  evaluar(sesionId: number, datos: EvaluacionRequest): Observable<Evaluacion> {
    return this.http.post<Evaluacion>(`${API_URL}/sesiones/${sesionId}/evaluacion`, datos);
  }

  obtener(sesionId: number): Observable<Evaluacion> {
    return this.http.get<Evaluacion>(`${API_URL}/sesiones/${sesionId}/evaluacion`);
  }

  calificacionDelTutor(tutorId: number): Observable<CalificacionTutor> {
    return this.http.get<CalificacionTutor>(`${API_URL}/tutores/${tutorId}/calificacion`);
  }
}
