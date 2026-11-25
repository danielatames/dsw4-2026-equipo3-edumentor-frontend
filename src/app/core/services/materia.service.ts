import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';
import { Materia, PaginaResponse } from '../models/sesion.models';

@Injectable({ providedIn: 'root' })
export class MateriaService {
  private readonly http = inject(HttpClient);

  /** El backend limita el tamaño de página a 50. */
  listar(tamano = 50): Observable<PaginaResponse<Materia>> {
    const params = new HttpParams().set('pagina', 0).set('tamano', tamano);
    return this.http.get<PaginaResponse<Materia>>(`${API_URL}/materias`, { params });
  }
}
