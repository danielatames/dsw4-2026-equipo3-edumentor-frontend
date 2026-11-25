import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL } from '../api.config';
import { SesionService } from './sesion.service';

describe('SesionService', () => {
  let servicio: SesionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(SesionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista sin filtro cuando no se indica estado', () => {
    servicio.listar().subscribe();
    const req = http.expectOne(`${API_URL}/sesiones`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('estado')).toBeFalse();
    req.flush([]);
  });

  it('lista filtrando por estado', () => {
    servicio.listar('ACEPTADA').subscribe();
    const req = http.expectOne((r) => r.url === `${API_URL}/sesiones`);
    expect(req.request.params.get('estado')).toBe('ACEPTADA');
    req.flush([]);
  });

  it('solicita una sesión con POST /sesiones', () => {
    const cuerpo = { tutorId: 2, materiaId: 1, fechaHora: '2026-12-07T08:30:00', duracionMinutos: 60, tema: null };
    servicio.solicitar(cuerpo).subscribe();
    const req = http.expectOne(`${API_URL}/sesiones`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(cuerpo);
    req.flush({});
  });

  it('ejecuta una acción con PATCH /sesiones/{id}/{accion}', () => {
    servicio.ejecutar(5, 'aceptar').subscribe();
    const req = http.expectOne(`${API_URL}/sesiones/5/aceptar`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });
});
