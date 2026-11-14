import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    <a class="skip-link" href="#contenido">Saltar al contenido</a>
    <header>
      <nav aria-label="Navegación principal">
        <a routerLink="/home">EduMentor Hub</a>
        @if (auth.usuario(); as u) {
          <span>{{ u.nombre }} ({{ u.rol }})</span>
          <button type="button" (click)="auth.logout()">Cerrar sesión</button>
        } @else {
          <a routerLink="/login">Iniciar sesión</a>
          <a routerLink="/register">Registrarse</a>
        }
      </nav>
    </header>
    <main id="contenido">
      <router-outlet />
    </main>
  `,
  styles: [
    `
      nav { display: flex; gap: 1rem; align-items: center; padding: 1rem; background: #1f3a5f; color: #fff; }
      nav a { color: #fff; }
      main { padding: 1rem; max-width: 600px; margin: 0 auto; }
      .skip-link { position: absolute; left: -999px; }
      .skip-link:focus { left: 0; background: #fff; padding: .5rem; }
    `,
  ],
})
export class AppComponent {
  readonly auth = inject(AuthService);
}