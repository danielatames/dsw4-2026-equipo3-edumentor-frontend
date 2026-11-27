import { Component, ElementRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DIAS_SEMANA, DiaSemana, Disponibilidad } from '../../../core/models/sesion.models';
import { DisponibilidadService } from '../../../core/services/disponibilidad.service';
import { ErrorApiService } from '../../../core/services/error-api.service';

/** La hora de fin debe ser posterior a la de inicio (misma regla que el backend). */
function finDespuesDeInicio(grupo: AbstractControl): ValidationErrors | null {
  const inicio = grupo.get('horaInicio')?.value as string;
  const fin = grupo.get('horaFin')?.value as string;
  return inicio && fin && fin <= inicio ? { horarioInvalido: true } : null;
}

type CampoBloque = 'diaSemana' | 'horaInicio' | 'horaFin';

/**
 * Pantalla del TUTOR para armar su horario semanal: agrega, edita y activa o
 * desactiva sus bloques. Los solapes los valida el backend (409) y aquí se muestra el mensaje.
 */
@Component({
  selector: 'app-mi-horario',
  imports: [ReactiveFormsModule, TranslatePipe],
  template: `
    <div class="page horario">
      <header>
        <h1>{{ 'horario.titulo' | translate }}</h1>
        <p class="subtitle">{{ 'horario.intro' | translate }}</p>
      </header>

      <section class="card" aria-labelledby="titulo-bloque">
        <h2 id="titulo-bloque">
          {{ (editandoId() ? 'horario.form.tituloEditar' : 'horario.form.tituloNuevo') | translate }}
        </h2>
        <form [formGroup]="form" (ngSubmit)="guardar()" novalidate>
          <div class="form-fila">
            <div class="field">
              <label for="bloque-dia">{{ 'horario.form.dia' | translate }}</label>
              <select id="bloque-dia" formControlName="diaSemana" #campoDia>
                @for (d of dias; track d) {
                  <option [value]="d">{{ 'dias.' + d | translate }}</option>
                }
              </select>
            </div>
            <div class="field">
              <label for="bloque-inicio">{{ 'horario.form.inicio' | translate }}</label>
              <input id="bloque-inicio" type="time" formControlName="horaInicio" step="900" />
              @if (mostrarError('horaInicio')) {
                <p class="error" role="alert">{{ 'horario.form.errorInicio' | translate }}</p>
              }
            </div>
            <div class="field">
              <label for="bloque-fin">{{ 'horario.form.fin' | translate }}</label>
              <input id="bloque-fin" type="time" formControlName="horaFin" step="900" />
              @if (mostrarError('horaFin')) {
                <p class="error" role="alert">{{ 'horario.form.errorFin' | translate }}</p>
              }
            </div>
          </div>
          @if (form.hasError('horarioInvalido') && (form.controls.horaInicio.touched || form.controls.horaFin.touched)) {
            <p class="error" role="alert">{{ 'horario.form.errorOrden' | translate }}</p>
          }

          <div class="form-botones">
            <button type="submit" class="btn" [disabled]="enviando()">
              {{ (enviando() ? 'horario.form.guardando' : editandoId() ? 'horario.form.guardar' : 'horario.form.agregar') | translate }}
            </button>
            @if (editandoId()) {
              <button type="button" class="btn btn-outline" (click)="cancelarEdicion()">
                {{ 'horario.form.cancelar' | translate }}
              </button>
            }
          </div>
        </form>
      </section>

      <div aria-live="polite">
        @if (mensaje()) {
          <p class="ok">{{ mensaje() }}</p>
        }
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
      </div>

      @if (cargando()) {
        <p role="status">{{ 'horario.cargando' | translate }}</p>
      } @else if (errorCarga()) {
        <p class="error" role="alert">{{ errorCarga() }}</p>
      } @else {
        <section aria-labelledby="titulo-semana">
          <h2 id="titulo-semana">{{ 'horario.semana' | translate }}</h2>
          <div class="semana">
            @for (d of bloquesPorDia(); track d.dia) {
              <section class="dia" [attr.aria-labelledby]="'dia-' + d.dia">
                <h3 [id]="'dia-' + d.dia">{{ 'dias.' + d.dia | translate }}</h3>
                @if (d.bloques.length === 0) {
                  <p class="nota">{{ 'horario.sinBloques' | translate }}</p>
                } @else {
                  <ul>
                    @for (b of d.bloques; track b.id) {
                      <li class="bloque" [class.inactivo]="!b.estaActivo" [class.editando]="editandoId() === b.id">
                        <span class="bloque-horas">{{ b.horaInicio.slice(0, 5) }} – {{ b.horaFin.slice(0, 5) }}</span>
                        @if (!b.estaActivo) {
                          <span class="estado-chip">{{ 'horario.inactivo' | translate }}</span>
                        }
                        <div class="bloque-acciones">
                          <button
                            type="button"
                            class="btn btn-outline btn-chico"
                            [attr.aria-label]="'horario.ariaEditar' | translate: etiqueta(b)"
                            (click)="editar(b)"
                          >
                            {{ 'horario.editar' | translate }}
                          </button>
                          <button
                            type="button"
                            class="btn btn-chico"
                            [class.btn-outline]="b.estaActivo"
                            [disabled]="procesando() === b.id"
                            [attr.aria-label]="(b.estaActivo ? 'horario.ariaDesactivar' : 'horario.ariaActivar') | translate: etiqueta(b)"
                            (click)="cambiarEstado(b)"
                          >
                            {{ (b.estaActivo ? 'horario.desactivar' : 'horario.activar') | translate }}
                          </button>
                        </div>
                      </li>
                    }
                  </ul>
                }
              </section>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [
    `
      .horario { display: grid; gap: 1.25rem; }
      .horario header h1 { margin: 0; }
      .horario header .subtitle { margin: .35rem 0 0; }
      .horario .card { border-radius: min(var(--radio), 16px); }
      .form-fila { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
      .form-fila .field { margin-top: 0; }
      .form-botones { display: flex; gap: .75rem; flex-wrap: wrap; }
      .semana { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: .75rem; }
      .dia { background: var(--blanco); border: 1px solid var(--linea); border-radius: min(var(--radio), 14px); padding: .85rem; }
      .dia h3 { margin: 0 0 .6rem; font-size: 1.05rem; }
      .dia ul { list-style: none; margin: 0; padding: 0; display: grid; gap: .6rem; }
      .bloque { display: grid; gap: .4rem; padding: .6rem; background: var(--papel); border: 1px solid var(--linea); border-radius: min(var(--radio), 10px); }
      .bloque.editando { outline: 3px solid var(--resaltador); }
      .bloque.inactivo .bloque-horas { text-decoration: line-through; color: var(--tinta-suave); }
      .bloque-horas { font-weight: 700; }
      .bloque .estado-chip { justify-self: start; font-size: .8rem; }
      .dia, .bloque { min-width: 0; }
      .bloque-acciones { display: grid; gap: .35rem; }
      .bloque-acciones .btn { width: 100%; margin-top: 0; padding-inline: .5rem; }
      @media (max-width: 720px) { .form-fila { grid-template-columns: 1fr; } }
    `,
  ],
})
export class MiHorarioComponent implements OnInit {
  private readonly api = inject(DisponibilidadService);
  private readonly errores = inject(ErrorApiService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  private readonly campoDia = viewChild<ElementRef<HTMLSelectElement>>('campoDia');

  readonly dias = DIAS_SEMANA;

  readonly bloques = signal<Disponibilidad[]>([]);
  readonly cargando = signal(true);
  readonly errorCarga = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);
  readonly enviando = signal(false);
  readonly procesando = signal<number | null>(null);
  readonly editandoId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      diaSemana: this.fb.nonNullable.control<DiaSemana>('MONDAY', [Validators.required]),
      horaInicio: ['', [Validators.required]],
      horaFin: ['', [Validators.required]],
    },
    { validators: [finDespuesDeInicio] },
  );

  /** Bloques agrupados de lunes a domingo y ordenados por hora de inicio. */
  readonly bloquesPorDia = computed(() =>
    DIAS_SEMANA.map((dia) => ({
      dia,
      bloques: this.bloques()
        .filter((b) => b.diaSemana === dia)
        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
    })),
  );

  ngOnInit(): void {
    this.cargar();
  }

  mostrarError(campo: CampoBloque): boolean {
    const c = this.form.controls[campo];
    return c.touched && c.invalid;
  }

  /** Datos para los aria-label: "Editar bloque del lunes de 08:00 a 10:00". */
  etiqueta(b: Disponibilidad): Record<string, string> {
    return {
      dia: this.translate.instant('dias.' + b.diaSemana),
      inicio: b.horaInicio.slice(0, 5),
      fin: b.horaFin.slice(0, 5),
    };
  }

  guardar(): void {
    this.limpiarMensajes();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.enviando()) {
      return;
    }
    const datos = this.form.getRawValue();
    const id = this.editandoId();
    const peticion = id === null ? this.api.crear(datos) : this.api.actualizar(id, datos);

    this.enviando.set(true);
    peticion.subscribe({
      next: () => {
        this.enviando.set(false);
        this.mensaje.set(this.translate.instant(id === null ? 'horario.creado' : 'horario.actualizado'));
        this.cancelarEdicion();
        this.cargar(false);
      },
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        // 409 = se solapa con otro bloque activo; 422 = fin antes del inicio.
        this.error.set(this.errores.mensaje(e, 'horario.errorGuardar'));
      },
    });
  }

  /** Carga el bloque en el formulario de arriba y lleva el foco ahí. */
  editar(b: Disponibilidad): void {
    this.limpiarMensajes();
    this.editandoId.set(b.id);
    this.form.setValue({
      diaSemana: b.diaSemana,
      horaInicio: b.horaInicio.slice(0, 5),
      horaFin: b.horaFin.slice(0, 5),
    });
    this.campoDia()?.nativeElement.focus();
  }

  cancelarEdicion(): void {
    this.editandoId.set(null);
    this.form.reset();
  }

  cambiarEstado(b: Disponibilidad): void {
    this.limpiarMensajes();
    this.procesando.set(b.id);
    this.api.cambiarEstado(b.id, !b.estaActivo).subscribe({
      next: (actualizado) => {
        this.procesando.set(null);
        this.bloques.update((lista) => lista.map((x) => (x.id === actualizado.id ? actualizado : x)));
        this.mensaje.set(this.translate.instant(actualizado.estaActivo ? 'horario.activado' : 'horario.desactivado'));
      },
      error: (e: HttpErrorResponse) => {
        this.procesando.set(null);
        // Al reactivar, el backend rechaza (409) si choca con otro bloque activo.
        this.error.set(this.errores.mensaje(e, 'horario.errorEstado'));
      },
    });
  }

  private cargar(mostrarCargando = true): void {
    if (mostrarCargando) {
      this.cargando.set(true);
    }
    this.errorCarga.set(null);
    this.api.listarMias().subscribe({
      next: (lista) => {
        this.bloques.set(lista);
        this.cargando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.errorCarga.set(this.errores.mensaje(e, 'horario.errorCarga'));
        this.cargando.set(false);
      },
    });
  }

  private limpiarMensajes(): void {
    this.mensaje.set(null);
    this.error.set(null);
  }
}
