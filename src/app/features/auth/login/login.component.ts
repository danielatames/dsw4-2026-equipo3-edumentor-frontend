import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { AuthShellComponent } from '../../../shared/auth-shell/auth-shell.component';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, AuthShellComponent],
  template: `
    <app-auth-shell>
      <h1>Iniciar sesión</h1>
      <p class="subtitle">Ingrese con su correo institucional.</p>
      <form [formGroup]="form" (ngSubmit)="enviar()" novalidate>
        <div class="field">
          <label for="email">Correo electrónico</label>
          <input id="email" type="email" formControlName="email" autocomplete="username" />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <p class="error" role="alert">Ingrese un correo válido.</p>
          }
        </div>
        <div class="field">
          <label for="password">Contraseña</label>
          <input id="password" type="password" formControlName="password" autocomplete="current-password" />
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <p class="error" role="alert">La contraseña es obligatoria.</p>
          }
        </div>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        <button type="submit" class="btn" [disabled]="cargando()">Ingresar</button>
      </form>
      <p class="alt">¿No tiene cuenta? <a routerLink="/register">Regístrese</a></p>
    </app-auth-shell>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
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
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (e: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(e.error?.detail ?? 'No se pudo iniciar sesión.');
      },
    });
  }
}