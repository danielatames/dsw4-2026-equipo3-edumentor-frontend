import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe } from '@ngx-translate/core';
import { ErrorApiService } from '../../../core/services/error-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Rol } from '../../../core/models/auth.models';
import { AuthShellComponent } from '../../../shared/auth-shell/auth-shell.component';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, AuthShellComponent, TranslatePipe],
  template: `
    <app-auth-shell>
      <h1>{{ 'auth.register.titulo' | translate }}</h1>
      <p class="subtitle">{{ 'auth.register.subtitulo' | translate }}</p>
      <form [formGroup]="form" (ngSubmit)="enviar()" novalidate>
        <div class="field">
          <label for="carne">{{ 'auth.register.carne' | translate }}</label>
          <input id="carne" type="text" formControlName="carne" />
          @if (form.controls.carne.touched && form.controls.carne.invalid) {
            <p class="error" role="alert">{{ 'auth.register.errorCarne' | translate }}</p>
          }
        </div>
        <div class="row-2">
          <div class="field">
            <label for="nombre">{{ 'auth.register.nombre' | translate }}</label>
            <input id="nombre" type="text" formControlName="nombre" autocomplete="given-name" />
            @if (form.controls.nombre.touched && form.controls.nombre.invalid) {
              <p class="error" role="alert">{{ 'auth.register.errorNombre' | translate }}</p>
            }
          </div>
          <div class="field">
            <label for="apellido">{{ 'auth.register.apellido' | translate }}</label>
            <input id="apellido" type="text" formControlName="apellido" autocomplete="family-name" />
            @if (form.controls.apellido.touched && form.controls.apellido.invalid) {
              <p class="error" role="alert">{{ 'auth.register.errorApellido' | translate }}</p>
            }
          </div>
        </div>
        <div class="field">
          <label for="email">{{ 'auth.register.email' | translate }}</label>
          <input id="email" type="email" formControlName="email" autocomplete="email" />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <p class="error" role="alert">{{ 'auth.register.errorEmail' | translate }}</p>
          }
        </div>
        <div class="field">
          <label for="password">{{ 'auth.register.password' | translate }}</label>
          <input id="password" type="password" formControlName="password" autocomplete="new-password" />
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <p class="error" role="alert">{{ 'auth.register.errorPassword' | translate }}</p>
          }
        </div>
        <div class="field">
          <label for="rol">{{ 'auth.register.rol' | translate }}</label>
          <select id="rol" formControlName="rol">
            <option value="ESTUDIANTE">{{ 'roles.ESTUDIANTE' | translate }}</option>
            <option value="TUTOR">{{ 'roles.TUTOR' | translate }}</option>
          </select>
        </div>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        <button type="submit" class="btn" [disabled]="cargando()">{{ 'auth.register.enviar' | translate }}</button>
      </form>
      <p class="alt">{{ 'auth.register.conCuenta' | translate }} <a routerLink="/login">{{ 'auth.register.iniciar' | translate }}</a></p>
    </app-auth-shell>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly errores = inject(ErrorApiService);

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
        this.error.set(this.errores.mensaje(e, 'auth.register.errorGenerico'));
      },
    });
  }
}