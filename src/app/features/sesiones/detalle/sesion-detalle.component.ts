import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { EvaluacionService } from '../../../core/services/evaluacion.service';
import { IdiomaService } from '../../../core/services/idioma.service';
import { RecursoService } from '../../../core/services/recurso.service';
import { SesionDetalleService } from '../../../core/services/sesion-detalle.service';
import {
  EstadoSesion,
  Evaluacion,
  Recurso,
  Sesion,
  TIPOS_ARCHIVO,
} from '../../../core/models/tutoria.models';
import { detalleProblema } from '../../../core/utils/problem-detail';
import { StarRatingComponent } from '../../../shared/star-rating/star-rating.component';

const ESTADOS_CON_RECURSOS: readonly EstadoSesion[] = ['ACEPTADA', 'EN_CURSO', 'CONCLUIDA', 'EVALUADA'];

@Component({
  selector: 'app-sesion-detalle',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, StarRatingComponent],
  template: `
    <div class="page detalle">
      <a class="volver" routerLink="/home">{{ 'sesion.volver' | translate }}</a>

      @if (cargando()) {
        <p role="status">{{ 'sesion.cargando' | translate }}</p>
      } @else if (errorCarga()) {
        <p class="error" role="alert">{{ errorCarga() }}</p>
      } @else {
        @if (sesion(); as s) {
          <header class="card">
            <h1>{{ s.materiaNombre }}</h1>
            <p class="estado-chip">{{ 'estados.' + s.estado | translate }}</p>
            <dl class="datos">
              <div>
                <dt>{{ 'sesion.tutor' | translate }}</dt>
                <dd>{{ s.tutorNombre }}</dd>
              </div>
              <div>
                <dt>{{ 'sesion.estudiante' | translate }}</dt>
                <dd>{{ s.estudianteNombre }}</dd>
              </div>
              <div>
                <dt>{{ 'sesion.fecha' | translate }}</dt>
                <dd>{{ formatearFecha(s.fechaHora) }}</dd>
              </div>
              <div>
                <dt>{{ 'sesion.duracion' | translate }}</dt>
                <dd>{{ 'sesion.minutos' | translate: { n: s.duracionMinutos } }}</dd>
              </div>
              @if (s.tema) {
                <div>
                  <dt>{{ 'sesion.tema' | translate }}</dt>
                  <dd>{{ s.tema }}</dd>
                </div>
              }
            </dl>
          </header>

          <section class="card" aria-labelledby="titulo-recursos">
            <h2 id="titulo-recursos">{{ 'recursos.titulo' | translate }}</h2>
            @if (recursos().length === 0) {
              <p>{{ 'recursos.vacio' | translate }}</p>
            } @else {
              <ul class="lista-recursos">
                @for (r of recursos(); track r.id) {
                  <li>
                    <div>
                      <a [href]="r.urlRecurso" target="_blank" rel="noopener noreferrer">{{ r.titulo }}</a>
                      <span class="chip">{{ 'tipos.' + r.tipoArchivo | translate }}</span>
                    </div>
                    @if (puedeAdministrarRecursos()) {
                      <button
                        type="button"
                        class="btn btn-outline btn-chico"
                        [attr.aria-label]="'recursos.eliminarA' | translate: { titulo: r.titulo }"
                        (click)="eliminarRecurso(r)"
                      >
                        {{ 'recursos.eliminar' | translate }}
                      </button>
                    }
                  </li>
                }
              </ul>
            }
            @if (mensajeRecurso()) {
              <p class="ok" role="status">{{ mensajeRecurso() }}</p>
            }
            @if (errorRecurso()) {
              <p class="error" role="alert">{{ errorRecurso() }}</p>
            }

            @if (puedeAdministrarRecursos()) {
              <form [formGroup]="recursoForm" (ngSubmit)="agregarRecurso()" novalidate>
                <h3>{{ 'recursos.agregar' | translate }}</h3>
                <div class="field">
                  <label for="recurso-titulo">{{ 'recursos.campoTitulo' | translate }}</label>
                  <input id="recurso-titulo" type="text" formControlName="titulo" maxlength="150" />
                  @if (recursoForm.controls.titulo.touched && recursoForm.controls.titulo.invalid) {
                    <p class="error" role="alert">{{ 'recursos.errorTitulo' | translate }}</p>
                  }
                </div>
                <div class="field">
                  <label for="recurso-url">{{ 'recursos.campoUrl' | translate }}</label>
                  <input id="recurso-url" type="url" formControlName="urlRecurso" maxlength="500" placeholder="https://" />
                  @if (recursoForm.controls.urlRecurso.touched && recursoForm.controls.urlRecurso.invalid) {
                    <p class="error" role="alert">{{ 'recursos.errorUrl' | translate }}</p>
                  }
                </div>
                <div class="field">
                  <label for="recurso-tipo">{{ 'recursos.campoTipo' | translate }}</label>
                  <select id="recurso-tipo" formControlName="tipoArchivo">
                    @for (t of tipos; track t) {
                      <option [value]="t">{{ 'tipos.' + t | translate }}</option>
                    }
                  </select>
                </div>
                <button type="submit" class="btn" [disabled]="guardandoRecurso()">
                  {{ 'recursos.enviar' | translate }}
                </button>
              </form>
            }
          </section>

          <section class="card" aria-labelledby="titulo-evaluacion">
            <h2 id="titulo-evaluacion">{{ 'evaluacion.titulo' | translate }}</h2>
            @if (evaluacion(); as e) {
              <p class="estrellas-lectura" role="img" [attr.aria-label]="'evaluacion.resumen' | translate: { n: e.calificacionEstrellas }">
                <span aria-hidden="true">{{ estrellasTexto(e.calificacionEstrellas) }}</span>
              </p>
              <p>{{ 'evaluacion.resumen' | translate: { n: e.calificacionEstrellas } }}</p>
              @if (e.comentario) {
                <blockquote>{{ e.comentario }}</blockquote>
              }
              @if (mensajeEvaluacion()) {
                <p class="ok" role="status">{{ mensajeEvaluacion() }}</p>
              }
            } @else if (puedeEvaluar()) {
              <p>{{ 'evaluacion.instruccion' | translate }}</p>
              <form [formGroup]="evaluacionForm" (ngSubmit)="enviarEvaluacion()" novalidate>
                <app-star-rating formControlName="calificacion" [etiqueta]="'evaluacion.calificacion' | translate" />
                @if (evaluacionForm.controls.calificacion.touched && evaluacionForm.controls.calificacion.invalid) {
                  <p class="error" role="alert">{{ 'evaluacion.errorCalificacion' | translate }}</p>
                }
                <div class="field">
                  <label for="evaluacion-comentario">{{ 'evaluacion.comentario' | translate }}</label>
                  <textarea id="evaluacion-comentario" formControlName="comentario" rows="4" maxlength="500"></textarea>
                </div>
                @if (errorEvaluacion()) {
                  <p class="error" role="alert">{{ errorEvaluacion() }}</p>
                }
                <button type="submit" class="btn" [disabled]="guardandoEvaluacion()">
                  {{ 'evaluacion.enviar' | translate }}
                </button>
              </form>
            } @else if (s.estado === 'CONCLUIDA') {
              <p>{{ 'evaluacion.esperando' | translate }}</p>
            } @else {
              <p>{{ 'evaluacion.noDisponible' | translate }}</p>
            }
          </section>
        }
      }
    </div>
  `,
})
export class SesionDetalleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);
  private readonly sesiones = inject(SesionDetalleService);
  private readonly recursosApi = inject(RecursoService);
  private readonly evaluacionesApi = inject(EvaluacionService);
  private readonly idioma = inject(IdiomaService);
  readonly auth = inject(AuthService);

  readonly tipos = TIPOS_ARCHIVO;
  readonly sesion = signal<Sesion | null>(null);
  readonly recursos = signal<Recurso[]>([]);
  readonly evaluacion = signal<Evaluacion | null>(null);
  readonly cargando = signal(true);
  readonly errorCarga = signal<string | null>(null);
  readonly errorRecurso = signal<string | null>(null);
  readonly mensajeRecurso = signal<string | null>(null);
  readonly errorEvaluacion = signal<string | null>(null);
  readonly mensajeEvaluacion = signal<string | null>(null);
  readonly guardandoRecurso = signal(false);
  readonly guardandoEvaluacion = signal(false);

  readonly esTutorDeLaSesion = computed(
    () => this.auth.rol() === 'TUTOR' && this.sesion()?.tutorId === this.auth.usuario()?.id,
  );
  readonly esEstudianteDeLaSesion = computed(
    () => this.auth.rol() === 'ESTUDIANTE' && this.sesion()?.estudianteId === this.auth.usuario()?.id,
  );
  readonly puedeAdministrarRecursos = computed(() => {
    const estado = this.sesion()?.estado;
    return this.esTutorDeLaSesion() && !!estado && ESTADOS_CON_RECURSOS.includes(estado);
  });
  readonly puedeEvaluar = computed(
    () => this.esEstudianteDeLaSesion() && this.sesion()?.estado === 'CONCLUIDA',
  );

  readonly recursoForm = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(150)]],
    urlRecurso: ['', [Validators.required, Validators.maxLength(500), Validators.pattern(/^https?:\/\/\S+$/)]],
    tipoArchivo: ['ENLACE' as (typeof TIPOS_ARCHIVO)[number], [Validators.required]],
  });

  readonly evaluacionForm = this.fb.group({
    calificacion: this.fb.control<number | null>(null, [Validators.required, Validators.min(1), Validators.max(5)]),
    comentario: this.fb.nonNullable.control('', [Validators.maxLength(500)]),
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.fallarCarga(null);
      return;
    }
    this.sesiones.obtener(id).subscribe({
      next: (s) => {
        this.sesion.set(s);
        this.cargarRecursos(s.id);
        if (s.estado === 'EVALUADA') {
          this.cargarEvaluacion(s.id);
        }
        this.cargando.set(false);
      },
      error: (e: HttpErrorResponse) => this.fallarCarga(e),
    });
  }

  agregarRecurso(): void {
    const s = this.sesion();
    if (!s) {
      return;
    }
    if (this.recursoForm.invalid) {
      this.recursoForm.markAllAsTouched();
      return;
    }
    this.guardandoRecurso.set(true);
    this.errorRecurso.set(null);
    this.mensajeRecurso.set(null);
    this.recursosApi.agregar(s.id, this.recursoForm.getRawValue()).subscribe({
      next: (r) => {
        this.recursos.update((lista) => [...lista, r]);
        this.recursoForm.reset({ titulo: '', urlRecurso: '', tipoArchivo: 'ENLACE' });
        this.mensajeRecurso.set(this.translate.instant('recursos.agregado'));
        this.guardandoRecurso.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.guardandoRecurso.set(false);
        this.errorRecurso.set(detalleProblema(e) ?? this.translate.instant('recursos.errorGenerico'));
      },
    });
  }

  eliminarRecurso(recurso: Recurso): void {
    const s = this.sesion();
    if (!s) {
      return;
    }
    this.errorRecurso.set(null);
    this.mensajeRecurso.set(null);
    this.recursosApi.eliminar(s.id, recurso.id).subscribe({
      next: () => {
        this.recursos.update((lista) => lista.filter((r) => r.id !== recurso.id));
        this.mensajeRecurso.set(this.translate.instant('recursos.eliminado'));
      },
      error: (e: HttpErrorResponse) =>
        this.errorRecurso.set(detalleProblema(e) ?? this.translate.instant('recursos.errorGenerico')),
    });
  }

  enviarEvaluacion(): void {
    const s = this.sesion();
    if (!s) {
      return;
    }
    if (this.evaluacionForm.invalid) {
      this.evaluacionForm.markAllAsTouched();
      return;
    }
    const { calificacion, comentario } = this.evaluacionForm.getRawValue();
    this.guardandoEvaluacion.set(true);
    this.errorEvaluacion.set(null);
    this.evaluacionesApi
      .evaluar(s.id, { calificacionEstrellas: calificacion as number, comentario: comentario.trim() || null })
      .subscribe({
        next: (e) => {
          this.evaluacion.set(e);
          this.sesion.set({ ...s, estado: 'EVALUADA' });
          this.mensajeEvaluacion.set(this.translate.instant('evaluacion.exito'));
          this.guardandoEvaluacion.set(false);
        },
        error: (e: HttpErrorResponse) => {
          this.guardandoEvaluacion.set(false);
          this.errorEvaluacion.set(detalleProblema(e) ?? this.translate.instant('evaluacion.errorGenerico'));
        },
      });
  }

  formatearFecha(iso: string): string {
    return new Date(iso).toLocaleString(this.idioma.actual() ?? 'es', {
      dateStyle: 'full',
      timeStyle: 'short',
    });
  }

  estrellasTexto(n: number): string {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  private cargarRecursos(sesionId: number): void {
    this.recursosApi.listar(sesionId).subscribe({
      next: (lista) => this.recursos.set(lista),
      error: (e: HttpErrorResponse) =>
        this.errorRecurso.set(detalleProblema(e) ?? this.translate.instant('recursos.errorCarga')),
    });
  }

  private cargarEvaluacion(sesionId: number): void {
    this.evaluacionesApi.obtener(sesionId).subscribe({
      next: (e) => this.evaluacion.set(e),
      error: () => this.evaluacion.set(null),
    });
  }

  private fallarCarga(e: HttpErrorResponse | null): void {
    const mensaje =
      (e && detalleProblema(e)) ?? this.translate.instant('sesion.errorCarga');
    this.errorCarga.set(mensaje);
    this.cargando.set(false);
  }
}
