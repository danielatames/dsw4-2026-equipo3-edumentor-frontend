import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';
import { FiltroMaterias, Materia, MateriaRequest, PaginaResponse } from '../models/sesion.models';

@Injectable({ providedIn: 'root' })
export class MateriaService {
  private readonly http = inject(HttpClient);

  /** El backend limita el tamaño de página a 50. */
  listar(tamano = 50): Observable<PaginaResponse<Materia>> {
    const params = new HttpParams().set('pagina', 0).set('tamano', tamano);
    return this.http.get<PaginaResponse<Materia>>(`${API_URL}/materias`, { params });
  }

  /** Catálogo con filtros opcionales por nombre y carrera, y paginación. */
  buscar(filtro: FiltroMaterias): Observable<PaginaResponse<Materia>> {
    let params = new HttpParams().set('pagina', filtro.pagina).set('tamano', filtro.tamano);
    if (filtro.nombre) {
      params = params.set('nombre', filtro.nombre);
    }
    if (filtro.carrera) {
      params = params.set('carrera', filtro.carrera);
    }
    return this.http.get<PaginaResponse<Materia>>(`${API_URL}/materias`, { params });
  }

  obtener(id: number): Observable<Materia> {
    return this.http.get<Materia>(`${API_URL}/materias/${id}`);
  }

  // Crear, actualizar y eliminar: el backend solo los permite al COORDINADOR.
  crear(datos: MateriaRequest): Observable<Materia> {
    return this.http.post<Materia>(`${API_URL}/materias`, datos);
  }

  actualizar(id: number, datos: MateriaRequest): Observable<Materia> {
    return this.http.put<Materia>(`${API_URL}/materias/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/materias/${id}`);
  }
}
