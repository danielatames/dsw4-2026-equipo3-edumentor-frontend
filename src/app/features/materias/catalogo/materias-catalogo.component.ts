import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Materia } from '../../../core/models/sesion.models';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorApiService } from '../../../core/services/error-api.service';
import { MateriaService } from '../../../core/services/materia.service';

/** Cantidad de materias por página del catálogo. */
const TAMANO_PAGINA = 10;

@Component({
  selector: 'app-materias-catalogo',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="page materias">
      <header class="materias-cabecera">
        <div>
          <h1>{{ 'materias.titulo' | translate }}</h1>
          <p class="subtitle">{{ 'materias.intro' | translate }}</p>
        </div>
        @if (esCoordinador()) {
          <a class="btn" routerLink="/materias/nueva">{{ 'materias.nueva' | translate }}</a>
        }
      </header>

      <form class="card filtros" [formGroup]="filtros" (ngSubmit)="buscar()" role="search">
        <div class="field">
          <label for="filtro-nombre">{{ 'materias.buscarNombre' | translate }}</label>
          <input id="filtro-nombre" type="search" formControlName="nombre" maxlength="120" />
        </div>
        <div class="field">
          <label for="filtro-carrera">{{ 'materias.filtroCarrera' | translate }}</label>
          <select id="filtro-carrera" formControlName="carrera">
            <option value="">{{ 'materias.todasCarreras' | translate }}</option>
            @for (c of carreras(); track c) {
              <option [value]="c">{{ c }}</option>
            }
          </select>
        </div>
        <div class="filtros-botones">
          <button type="submit" class="btn btn-chico">{{ 'materias.buscar' | translate }}</button>
          <button type="button" class="btn btn-outline btn-chico" (click)="limpiar()">
            {{ 'materias.limpiar' | translate }}
          </button>
        </div>
      </form>

      <div aria-live="polite">
        @if (mensaje()) {
          <p class="ok">{{ mensaje() }}</p>
        }
        @if (errorAccion()) {
          <p class="error" role="alert">{{ errorAccion() }}</p>
        }
      </div>

      @if (cargando()) {
        <p role="status">{{ 'materias.cargando' | translate }}</p>
      } @else if (errorCarga()) {
        <p class="error" role="alert">{{ errorCarga() }}</p>
      } @else if (materias().length === 0) {
        <p class="vacio">{{ 'materias.vacio' | translate }}</p>
      } @else {
        <div class="tabla-contenedor">
          <table class="tabla-materias">
            <caption class="solo-lector">{{ 'materias.tabla' | translate }}</caption>
            <thead>
              <tr>
                <th scope="col">{{ 'materias.codigo' | translate }}</th>
                <th scope="col">{{ 'materias.nombre' | translate }}</th>
                <th scope="col">{{ 'materias.carrera' | translate }}</th>
                <th scope="col">{{ 'materias.creditos' | translate }}</th>
                @if (esCoordinador()) {
                  <th scope="col">{{ 'materias.acciones' | translate }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (m of materias(); track m.id) {
                <tr>
                  <td><span class="estado-chip">{{ m.codigoMateria }}</span></td>
                  <th scope="row">{{ m.nombreMateria }}</th>
                  <td>{{ m.carrera }}</td>
                  <td>{{ m.creditos }}</td>
                  @if (esCoordinador()) {
                    <td>
                      @if (confirmarId() === m.id) {
                        <div class="confirmar" role="group" [attr.aria-label]="'materias.confirmarEliminar' | translate: { materia: m.nombreMateria }">
                          <p>{{ 'materias.confirmarEliminar' | translate: { materia: m.nombreMateria } }}</p>
                          <button type="button" class="btn btn-chico" [disabled]="procesando() === m.id" (click)="eliminar(m, true)">
                            {{ 'materias.si' | translate }}
                          </button>
                          <button type="button" class="btn btn-outline btn-chico" (click)="confirmarId.set(null)">
                            {{ 'materias.no' | translate }}
                          </button>
                        </div>
                      } @else {
                        <div class="acciones">
                          <a
                            class="btn btn-outline btn-chico"
                            [routerLink]="['/materias', m.id, 'editar']"
                            [attr.aria-label]="'materias.ariaEditar' | translate: { materia: m.nombreMateria }"
                          >
                            {{ 'materias.editar' | translate }}
                          </a>
                          <button
                            type="button"
                            class="btn btn-outline btn-chico"
                            [attr.aria-label]="'materias.ariaEliminar' | translate: { materia: m.nombreMateria }"
                            (click)="eliminar(m)"
                          >
                            {{ 'materias.eliminar' | translate }}
                          </button>
                        </div>
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>

        <nav class="paginacion" [attr.aria-label]="'materias.paginacion' | translate">
          <button type="button" class="btn btn-outline btn-chico" [disabled]="pagina() === 0" (click)="irAPagina(pagina() - 1)">
            {{ 'materias.anterior' | translate }}
          </button>
          <p role="status">
            {{ 'materias.pagina' | translate: { actual: pagina() + 1, total: totalPaginas(), n: totalElementos() } }}
          </p>
          <button type="button" class="btn btn-outline btn-chico" [disabled]="esUltimaPagina()" (click)="irAPagina(pagina() + 1)">
            {{ 'materias.siguiente' | translate }}
          </button>
        </nav>
      }
    </div>
  `,
  styles: [
    `
      .materias { display: grid; gap: 1rem; }
      .materias-cabecera { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
      .materias-cabecera h1 { margin: 0; }
      .materias-cabecera .subtitle { margin: .35rem 0 0; }
      .materias-cabecera .btn { margin-top: 0; text-decoration: none; }
      .filtros { display: grid; grid-template-columns: 2fr 1.5fr auto; gap: 1rem; align-items: end; }
      .filtros .field { margin-top: 0; }
      .filtros-botones { display: flex; gap: .5rem; flex-wrap: wrap; }
      .filtros-botones .btn { margin-top: 0; }
      /* min(): algunos temas usan --radio enorme (píldora) y recortarían las esquinas de la tabla. */
      .tabla-contenedor { overflow-x: auto; background: var(--blanco); border: 1px solid var(--linea); border-radius: min(var(--radio), 16px); }
      .tabla-materias { width: 100%; border-collapse: collapse; }
      .tabla-materias th, .tabla-materias td { padding: .75rem 1rem; text-align: left; vertical-align: middle; border-bottom: 1px solid var(--linea); }
      .tabla-materias thead th { font-size: .85rem; color: var(--tinta-suave); background: var(--papel); }
      .tabla-materias tbody th { font-weight: 700; }
      .tabla-materias tbody tr:last-child > * { border-bottom: none; }
      .acciones { display: flex; gap: .5rem; flex-wrap: wrap; }
      .acciones .btn, .confirmar .btn { margin-top: 0; text-decoration: none; }
      .confirmar { margin-top: 0; border-radius: min(var(--radio), 16px); }
      .paginacion { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
      .paginacion p { margin: 0; color: var(--tinta-suave); }
      .paginacion .btn { margin-top: 0; }
      .solo-lector { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
      @media (max-width: 720px) { .filtros { grid-template-columns: 1fr; } }
    `,
  ],
})
export class MateriasCatalogoComponent implements OnInit {
  private readonly api = inject(MateriaService);
  private readonly errores = inject(ErrorApiService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly esCoordinador = computed(() => this.auth.rol() === 'COORDINADOR');

  readonly filtros = this.fb.nonNullable.group({
    nombre: '',
    carrera: '',
  });

  readonly materias = signal<Materia[]>([]);
  readonly carreras = signal<string[]>([]);
  readonly pagina = signal(0);
  readonly totalPaginas = signal(0);
  readonly totalElementos = signal(0);
  readonly cargando = signal(true);
  readonly errorCarga = signal<string | null>(null);
  readonly errorAccion = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);
  readonly procesando = signal<number | null>(null);
  readonly confirmarId = signal<number | null>(null);

  readonly esUltimaPagina = computed(() => this.pagina() + 1 >= this.totalPaginas());

  ngOnInit(): void {
    this.leerMensajeDeNavegacion();
    this.cargarCarreras();
    this.cargar();
  }

  buscar(): void {
    this.limpiarMensajes();
    this.pagina.set(0);
    this.cargar();
  }

  limpiar(): void {
    this.filtros.reset();
    this.buscar();
  }

  irAPagina(numero: number): void {
    this.limpiarMensajes();
    this.pagina.set(numero);
    this.cargar();
  }

  /** La primera vez solo pide confirmación; el botón "Sí" la llama con confirmado = true. */
  eliminar(m: Materia, confirmado = false): void {
    if (!confirmado) {
      this.limpiarMensajes();
      this.confirmarId.set(m.id);
      return;
    }
    this.procesando.set(m.id);
    this.api.eliminar(m.id).subscribe({
      next: () => {
        this.procesando.set(null);
        this.confirmarId.set(null);
        this.mensaje.set(this.translate.instant('materias.eliminada'));
        // Si se borró la última materia de la página, se vuelve a la anterior.
        if (this.materias().length === 1 && this.pagina() > 0) {
          this.pagina.update((p) => p - 1);
        }
        this.cargar(false);
        this.cargarCarreras();
      },
      error: (e: HttpErrorResponse) => {
        this.procesando.set(null);
        this.confirmarId.set(null);
        // 409 = la materia tiene sesiones asociadas y no se puede borrar.
        this.errorAccion.set(this.errores.mensaje(e, 'materias.errorEliminar'));
      },
    });
  }

  private cargar(mostrarCargando = true): void {
    if (mostrarCargando) {
      this.cargando.set(true);
    }
    this.errorCarga.set(null);
    const { nombre, carrera } = this.filtros.getRawValue();
    this.api
      .buscar({ nombre: nombre.trim(), carrera, pagina: this.pagina(), tamano: TAMANO_PAGINA })
      .subscribe({
        next: (r) => {
          this.materias.set(r.contenido);
          this.totalPaginas.set(r.totalPaginas);
          this.totalElementos.set(r.totalElementos);
          this.cargando.set(false);
        },
        error: (e: HttpErrorResponse) => {
          this.errorCarga.set(this.errores.mensaje(e, 'materias.errorCarga'));
          this.cargando.set(false);
        },
      });
  }

  /** El backend no tiene un endpoint de carreras: se sacan de las materias existentes. */
  private cargarCarreras(): void {
    this.api.listar().subscribe({
      next: (r) => {
        const unicas = new Set(r.contenido.map((m) => m.carrera));
        this.carreras.set([...unicas].sort((a, b) => a.localeCompare(b)));
      },
    });
  }

  private limpiarMensajes(): void {
    this.mensaje.set(null);
    this.errorAccion.set(null);
    this.confirmarId.set(null);
  }

  /** Tras guardar, el formulario navega aquí con un aviso en history.state. */
  private leerMensajeDeNavegacion(): void {
    const estado = history.state as { materiaGuardada?: 'creada' | 'actualizada' | null } | null;
    if (estado?.materiaGuardada) {
      this.mensaje.set(this.translate.instant('materias.' + estado.materiaGuardada));
      history.replaceState({ ...estado, materiaGuardada: null }, '');
    }
  }
}
