import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { Rol } from '../../../core/models/auth.models';
import { AuthShellComponent } from '../../../shared/auth-shell/auth-shell.component';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, AuthShellComponent],
  template: `
    <app-auth-shell>
      <h1>Crear cuenta</h1>
      <p class="subtitle">Únase como estudiante o como tutor.</p>
      <form [formGroup]="form" (ngSubmit)="enviar()" novalidate>
        <div class="field">
          <label for="carne">Carné</label>
          <input id="carne" type="text" formControlName="carne" />
          @if (form.controls.carne.touched && form.controls.carne.invalid) {
            <p class="error" role="alert">El carné es obligatorio.</p>
          }
        </div>
        <div class="row-2">
          <div class="field">
            <label for="nombre">Nombre</label>
            <input id="nombre" type="text" formControlName="nombre" autocomplete="given-name" />
            @if (form.controls.nombre.touched && form.controls.nombre.invalid) {
              <p class="error" role="alert">El nombre es obligatorio.</p>
            }
          </div>
          <div class="field">
            <label for="apellido">Apellido</label>
            <input id="apellido" type="text" formControlName="apellido" autocomplete="family-name" />
            @if (form.controls.apellido.touched && form.controls.apellido.invalid) {
              <p class="error" role="alert">El apellido es obligatorio.</p>
            }
          </div>
        </div>
        <div class="field">
          <label for="email">Correo electrónico</label>
          <input id="email" type="email" formControlName="email" autocomplete="email" />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <p class="error" role="alert">Ingrese un correo válido.</p>
          }
        </div>
        <div class="field">
          <label for="password">Contraseña (mínimo 8 caracteres)</label>
          <input id="password" type="password" formControlName="password" autocomplete="new-password" />
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <p class="error" role="alert">La contraseña debe tener al menos 8 caracteres.</p>
          }
        </div>
        <div class="field">
          <label for="rol">Rol</label>
          <select id="rol" formControlName="rol">
            <option value="ESTUDIANTE">Estudiante</option>
            <option value="TUTOR">Tutor</option>
          </select>
        </div>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        <button type="submit" class="btn" [disabled]="cargando()">Registrarme</button>
      </form>
      <p class="alt">¿Ya tiene cuenta? <a routerLink="/login">Inicie sesión</a></p>
    </app-auth-shell>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    carne: ['', [Validators.required, Validators.maxLength(20)]],
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    apellido: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    rol: ['ESTUDIANTE' as Rol, [Validators.required]],
  });
  readonly error = signal<string | null>(null);
  readonly cargando = signal(false);

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (e: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(e.error?.detail ?? 'No se pudo completar el registro.');
      },
    });
  }
}