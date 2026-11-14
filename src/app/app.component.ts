import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    <a class="skip-link" href="#contenido">Saltar al contenido</a>
    @if (auth.usuario(); as u) {
      <header class="topbar">
        <a class="brand-link" routerLink="/home">EduMentor Hub</a>
        <span>{{ u.nombre }} {{ u.apellido }}</span>
        <span class="chip">{{ u.rol }}</span>
        <button type="button" class="btn" (click)="auth.logout()">Cerrar sesión</button>
      </header>
    }
    <main id="contenido">
      <router-outlet />
    </main>
  `,
})
export class AppComponent {
  readonly auth = inject(AuthService);
}