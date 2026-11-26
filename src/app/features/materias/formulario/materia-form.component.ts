import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MateriaRequest } from '../../../core/models/sesion.models';
import { ErrorApiService } from '../../../core/services/error-api.service';
import { MateriaService } from '../../../core/services/materia.service';

/** Límites iguales a los del backend (MateriaRequest.java). */
const CREDITOS_MIN = 1;
const CREDITOS_MAX = 12;

type CampoMateria = 'codigoMateria' | 'nombreMateria' | 'carrera' | 'creditos';

/**
 * Formulario del coordinador. La misma pantalla sirve para crear (/materias/nueva)
 * y para editar (/materias/:id/editar).
 */
@Component({
  selector: 'app-materia-form',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="page detalle">
      <a class="volver" routerLink="/materias">{{ 'materias.form.volver' | translate }}</a>

      <section class="card" aria-labelledby="titulo-materia">
        <h1 id="titulo-materia">
          {{ (esEdicion ? 'materias.form.tituloEditar' : 'materias.form.tituloNueva') | translate }}
        </h1>
        <p class="subtitle">{{ 'materias.form.intro' | translate }}</p>

        @if (cargando()) {
          <p role="status">{{ 'materias.form.cargando' | translate }}</p>
        } @else if (errorCarga()) {
          <p class="error" role="alert">{{ errorCarga() }}</p>
        } @else {
          <form [formGroup]="form" (ngSubmit)="guardar()" novalidate>
            <div class="row-2">
              <div class="field">
                <label for="materia-codigo">{{ 'materias.form.codigo' | translate }}</label>
                <input
                  id="materia-codigo"
                  type="text"
                  formControlName="codigoMateria"
                  maxlength="20"
                  autocomplete="off"
                  aria-describedby="materia-codigo-ayuda"
                />
                <p class="nota" id="materia-codigo-ayuda">{{ 'materias.form.codigoAyuda' | translate }}</p>
                @if (mostrarError('codigoMateria')) {
                  <p class="error" role="alert">{{ 'materias.form.errorCodigo' | translate }}</p>
                }
              </div>
              <div class="field">
                <label for="materia-creditos">{{ 'materias.form.creditos' | translate }}</label>
                <input
                  id="materia-creditos"
                  type="number"
                  formControlName="creditos"
                  [min]="creditosMin"
                  [max]="creditosMax"
                  step="1"
                />
                @if (mostrarError('creditos')) {
                  <p class="error" role="alert">
                    {{ 'materias.form.errorCreditos' | translate: { min: creditosMin, max: creditosMax } }}
                  </p>
                }
              </div>
            </div>

            <div class="field">
              <label for="materia-nombre">{{ 'materias.form.nombre' | translate }}</label>
              <input id="materia-nombre" type="text" formControlName="nombreMateria" maxlength="120" />
              @if (mostrarError('nombreMateria')) {
                <p class="error" role="alert">{{ 'materias.form.errorNombre' | translate }}</p>
              }
            </div>

            <div class="field">
              <label for="materia-carrera">{{ 'materias.form.carrera' | translate }}</label>
              <input id="materia-carrera" type="text" formControlName="carrera" maxlength="120" />
              @if (mostrarError('carrera')) {
                <p class="error" role="alert">{{ 'materias.form.errorCarrera' | translate }}</p>
              }
            </div>

            @if (errorEnvio()) {
              <p class="error" role="alert">{{ errorEnvio() }}</p>
            }

            <button type="submit" class="btn" [disabled]="enviando()">
              {{ (enviando() ? 'materias.form.guardando' : 'materias.form.guardar') | translate }}
            </button>
          </form>
        }
      </section>
    </div>
  `,
})
export class MateriaFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly api = inject(MateriaService);
  private readonly errores = inject(ErrorApiService);

  readonly creditosMin = CREDITOS_MIN;
  readonly creditosMax = CREDITOS_MAX;

  /** Si la URL trae :id, el formulario está en modo edición. */
  private readonly id = Number(this.ruta.snapshot.paramMap.get('id')) || null;
  readonly esEdicion = this.id !== null;

  readonly cargando = signal(this.esEdicion);
  readonly errorCarga = signal<string | null>(null);
  readonly errorEnvio = signal<string | null>(null);
  readonly enviando = signal(false);

  readonly form = this.fb.nonNullable.group({
    codigoMateria: ['', [Validators.required, Validators.maxLength(20)]],
    nombreMateria: ['', [Validators.required, Validators.maxLength(120)]],
    carrera: ['', [Validators.required, Validators.maxLength(120)]],
    creditos: this.fb.nonNullable.control<number>(4, [
      Validators.required,
      Validators.min(CREDITOS_MIN),
      Validators.max(CREDITOS_MAX),
      Validators.pattern(/^\d+$/),
    ]),
  });

  ngOnInit(): void {
    if (this.id === null) {
      return;
    }
    this.api.obtener(this.id).subscribe({
      next: (m) => {
        this.form.setValue({
          codigoMateria: m.codigoMateria,
          nombreMateria: m.nombreMateria,
          carrera: m.carrera,
          creditos: m.creditos,
        });
        this.cargando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.errorCarga.set(this.errores.mensaje(e, 'materias.form.errorCarga'));
        this.cargando.set(false);
      },
    });
  }

  mostrarError(campo: CampoMateria): boolean {
    const c = this.form.controls[campo];
    return c.touched && c.invalid;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.enviando()) {
      return;
    }
    const v = this.form.getRawValue();
    const datos: MateriaRequest = {
      codigoMateria: v.codigoMateria.trim(),
      nombreMateria: v.nombreMateria.trim(),
      carrera: v.carrera.trim(),
      creditos: Number(v.creditos),
    };
    const peticion = this.id === null ? this.api.crear(datos) : this.api.actualizar(this.id, datos);

    this.enviando.set(true);
    this.errorEnvio.set(null);
    peticion.subscribe({
      next: () => {
        this.enviando.set(false);
        this.router.navigate(['/materias'], {
          state: { materiaGuardada: this.esEdicion ? 'actualizada' : 'creada' },
        });
      },
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        // 409 = el código ya existe; 400 = algún campo inválido según el backend.
        this.errorEnvio.set(this.errores.mensaje(e, 'materias.form.errorGenerico'));
      },
    });
  }
}
