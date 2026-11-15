import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { AuthShellComponent } from '../../../shared/auth-shell/auth-shell.component';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, AuthShellComponent, TranslatePipe],
  template: `
    <app-auth-shell>
      <h1>{{ 'auth.login.titulo' | translate }}</h1>
      <p class="subtitle">{{ 'auth.login.subtitulo' | translate }}</p>
      <form [formGroup]="form" (ngSubmit)="enviar()" novalidate>
        <div class="field">
          <label for="email">{{ 'auth.login.email' | translate }}</label>
          <input id="email" type="email" formControlName="email" autocomplete="username" />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <p class="error" role="alert">{{ 'auth.login.errorEmail' | translate }}</p>
          }
        </div>
        <div class="field">
          <label for="password">{{ 'auth.login.password' | translate }}</label>
          <input id="password" type="password" formControlName="password" autocomplete="current-password" />
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <p class="error" role="alert">{{ 'auth.login.errorPassword' | translate }}</p>
          }
        </div>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        <button type="submit" class="btn" [disabled]="cargando()">{{ 'auth.login.enviar' | translate }}</button>
      </form>
      <p class="alt">{{ 'auth.login.sinCuenta' | translate }} <a routerLink="/register">{{ 'auth.login.registrese' | translate }}</a></p>
    </app-auth-shell>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

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
        this.error.set(e.error?.detail ?? this.translate.instant('auth.login.errorGenerico'));
      },
    });
  }
}