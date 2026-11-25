import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { Materia, TutorDisponible } from '../../../core/models/sesion.models';
import { DisponibilidadService } from '../../../core/services/disponibilidad.service';
import { MateriaService } from '../../../core/services/materia.service';
import { SesionService } from '../../../core/services/sesion.service';
import { detalleProblema } from '../../../core/utils/problem-detail';
import {
  DURACION_MAX,
  DURACION_MIN,
  agruparTutores,
  cabeEnDisponibilidad,
  combinarFechaHora,
  fechaLocal,
} from '../../../core/utils/sesion-reglas';

/** Duraciones ofrecidas (el backend acepta de 30 a 180 minutos). */
const DURACIONES = [30, 45, 60, 90, 120, 150, 180] as const;

/** La fecha y hora elegidas deben ser posteriores al momento actual. */
function fechaFutura(grupo: AbstractControl): ValidationErrors | null {
  const fecha = grupo.get('fecha')?.value as string;
  const hora = grupo.get('hora')?.value as string;
  const d = fechaLocal(fecha, hora);
  return d && d.getTime() <= Date.now() ? { fechaPasada: true } : null;
}

type CampoReserva = 'materiaId' | 'tutorId' | 'fecha' | 'hora' | 'duracionMinutos' | 'tema';

function hoyLocal(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

@Component({
  selector: 'app-sesion-nueva',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="page detalle">
      <a class="volver" routerLink="/sesiones">{{ 'nuevaSesion.volver' | translate }}</a>

      <section class="card" aria-labelledby="titulo-reserva">
        <h1 id="titulo-reserva">{{ 'nuevaSesion.titulo' | translate }}</h1>
        <p class="subtitle">{{ 'nuevaSesion.intro' | translate }}</p>

        @if (cargando()) {
          <p role="status">{{ 'nuevaSesion.cargando' | translate }}</p>
        } @else if (errorCarga()) {
          <p class="error" role="alert">{{ errorCarga() }}</p>
        } @else if (tutores().length === 0) {
          <p>{{ 'nuevaSesion.sinTutores' | translate }}</p>
        } @else {
          <form [formGroup]="form" (ngSubmit)="enviar()" novalidate>
            <div class="field">
              <label for="reserva-materia">{{ 'nuevaSesion.materia' | translate }}</label>
              <select id="reserva-materia" formControlName="materiaId">
                <option [ngValue]="null">{{ 'nuevaSesion.elegir' | translate }}</option>
                @for (m of materias(); track m.id) {
                  <option [ngValue]="m.id">{{ m.codigoMateria }} · {{ m.nombreMateria }}</option>
                }
              </select>
              @if (mostrarError('materiaId')) {
                <p class="error" role="alert">{{ 'nuevaSesion.errorMateria' | translate }}</p>
              }
            </div>

            <div class="field">
              <label for="reserva-tutor">{{ 'nuevaSesion.tutor' | translate }}</label>
              <select id="reserva-tutor" formControlName="tutorId" aria-describedby="reserva-bloques">
                <option [ngValue]="null">{{ 'nuevaSesion.elegir' | translate }}</option>
                @for (t of tutores(); track t.id) {
                  <option [ngValue]="t.id">{{ t.nombre }}</option>
                }
              </select>
              @if (mostrarError('tutorId')) {
                <p class="error" role="alert">{{ 'nuevaSesion.errorTutor' | translate }}</p>
              }
              <div id="reserva-bloques" class="bloques">
                @if (tutorElegido(); as t) {
                  <p class="nota">{{ 'nuevaSesion.disponibilidad' | translate: { nombre: t.nombre } }}</p>
                  <ul>
                    @for (b of t.bloques; track b.id) {
                      <li>
                        {{ 'dias.' + b.diaSemana | translate }}:
                        {{ b.horaInicio.slice(0, 5) }} – {{ b.horaFin.slice(0, 5) }}
                      </li>
                    }
                  </ul>
                }
              </div>
            </div>

            <div class="row-2">
              <div class="field">
                <label for="reserva-fecha">{{ 'nuevaSesion.fecha' | translate }}</label>
                <input id="reserva-fecha" type="date" formControlName="fecha" [min]="hoy" />
                @if (mostrarError('fecha')) {
                  <p class="error" role="alert">{{ 'nuevaSesion.errorFecha' | translate }}</p>
                }
              </div>
              <div class="field">
                <label for="reserva-hora">{{ 'nuevaSesion.hora' | translate }}</label>
                <input id="reserva-hora" type="time" formControlName="hora" step="900" />
                @if (mostrarError('hora')) {
                  <p class="error" role="alert">{{ 'nuevaSesion.errorHora' | translate }}</p>
                }
              </div>
            </div>
            @if (form.hasError('fechaPasada') && (form.controls.fecha.touched || form.controls.hora.touched)) {
              <p class="error" role="alert">{{ 'nuevaSesion.errorPasada' | translate }}</p>
            }

            <div class="field">
              <label for="reserva-duracion">{{ 'nuevaSesion.duracion' | translate }}</label>
              <select id="reserva-duracion" formControlName="duracionMinutos">
                @for (d of duraciones; track d) {
                  <option [ngValue]="d">{{ 'sesion.minutos' | translate: { n: d } }}</option>
                }
              </select>
              @if (mostrarError('duracionMinutos')) {
                <p class="error" role="alert">{{ 'nuevaSesion.errorDuracion' | translate: { min: duracionMin, max: duracionMax } }}</p>
              }
            </div>

            @if (fueraDeDisponibilidad()) {
              <p class="aviso" role="status">{{ 'nuevaSesion.avisoDisponibilidad' | translate }}</p>
            }

            <div class="field">
              <label for="reserva-tema">{{ 'nuevaSesion.tema' | translate }}</label>
              <textarea id="reserva-tema" formControlName="tema" rows="3" maxlength="300"></textarea>
              @if (mostrarError('tema')) {
                <p class="error" role="alert">{{ 'nuevaSesion.errorTema' | translate }}</p>
              }
            </div>

            @if (errorEnvio()) {
              <p class="error" role="alert">{{ errorEnvio() }}</p>
            }

            <button type="submit" class="btn" [disabled]="enviando()">
              {{ (enviando() ? 'nuevaSesion.enviando' : 'nuevaSesion.enviar') | translate }}
            </button>
          </form>
        }
      </section>
    </div>
  `,
})
export class SesionNuevaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly sesiones = inject(SesionService);
  private readonly materiasApi = inject(MateriaService);
  private readonly disponibilidadesApi = inject(DisponibilidadService);

  readonly duraciones = DURACIONES;
  readonly duracionMin = DURACION_MIN;
  readonly duracionMax = DURACION_MAX;
  readonly hoy = hoyLocal();

  readonly materias = signal<Materia[]>([]);
  readonly tutores = signal<TutorDisponible[]>([]);
  readonly cargando = signal(true);
  readonly errorCarga = signal<string | null>(null);
  readonly errorEnvio = signal<string | null>(null);
  readonly enviando = signal(false);

  readonly form = this.fb.group(
    {
      materiaId: this.fb.control<number | null>(null, [Validators.required]),
      tutorId: this.fb.control<number | null>(null, [Validators.required]),
      fecha: this.fb.nonNullable.control('', [Validators.required]),
      hora: this.fb.nonNullable.control('', [Validators.required]),
      duracionMinutos: this.fb.nonNullable.control<number>(60, [
        Validators.required,
        Validators.min(DURACION_MIN),
        Validators.max(DURACION_MAX),
      ]),
      tema: this.fb.nonNullable.control('', [Validators.maxLength(300)]),
    },
    { validators: [fechaFutura] },
  );

  private readonly valor = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly tutorElegido = computed(() => {
    const id = this.valor().tutorId;
    return this.tutores().find((t) => t.id === id) ?? null;
  });

  /** Aviso no bloqueante: el servidor es quien decide, pero así se evita un intento fallido. */
  readonly fueraDeDisponibilidad = computed(() => {
    const v = this.valor();
    const tutor = this.tutorElegido();
    const inicio = fechaLocal(v.fecha ?? '', v.hora ?? '');
    if (!tutor || !inicio || !v.duracionMinutos) {
      return false;
    }
    return !cabeEnDisponibilidad(tutor, inicio, v.duracionMinutos);
  });

  ngOnInit(): void {
    forkJoin({
      materias: this.materiasApi.listar(),
      bloques: this.disponibilidadesApi.listarActivas(),
    }).subscribe({
      next: ({ materias, bloques }) => {
        this.materias.set(materias.contenido);
        this.tutores.set(agruparTutores(bloques));
        this.cargando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.errorCarga.set(detalleProblema(e) ?? this.translate.instant('nuevaSesion.errorCarga'));
        this.cargando.set(false);
      },
    });
  }

  mostrarError(campo: CampoReserva): boolean {
    const c = this.form.controls[campo];
    return c.touched && c.invalid;
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.enviando()) {
      return;
    }
    const v = this.form.getRawValue();
    this.enviando.set(true);
    this.errorEnvio.set(null);
    this.sesiones
      .solicitar({
        tutorId: v.tutorId as number,
        materiaId: v.materiaId as number,
        fechaHora: combinarFechaHora(v.fecha, v.hora),
        duracionMinutos: v.duracionMinutos,
        tema: v.tema.trim() || null,
      })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.router.navigate(['/sesiones'], { state: { sesionCreada: true } });
        },
        error: (e: HttpErrorResponse) => {
          this.enviando.set(false);
          // 409 = traslape con otra sesión; 422 = sin disponibilidad o fecha pasada; 400 = validación.
          this.errorEnvio.set(detalleProblema(e) ?? this.translate.instant('nuevaSesion.errorGenerico'));
        },
      });
  }
}
