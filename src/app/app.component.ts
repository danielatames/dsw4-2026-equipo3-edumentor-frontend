import { Component, inject } from '@angular/core';
import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from './core/services/auth.service';
import { IdiomaService } from './core/services/idioma.service';
import { NAV_ITEMS } from './core/nav/nav-items';
import { LanguageSwitcherComponent } from './shared/language-switcher/language-switcher.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, LanguageSwitcherComponent],
  template: `
    <a class="skip-link" href="#contenido">{{ 'app.skip' | translate }}</a>
    @if (auth.usuario(); as u) {
      <header class="topbar">
        <a class="brand-link" routerLink="/home">{{ 'app.name' | translate }}</a>
        <nav [attr.aria-label]="'nav.principal' | translate">
          <a class="nav-link" routerLink="/sesiones" routerLinkActive="activo">{{ 'nav.sesiones' | translate }}</a>
        <nav class="topbar-nav" [attr.aria-label]="'nav.principal' | translate">
          @for (e of enlaces(); track e.ruta) {
            <a [routerLink]="e.ruta" routerLinkActive="activo" ariaCurrentWhenActive="page">
              {{ e.clave | translate }}
            </a>
          }
        </nav>
        <span>{{ u.nombre }} {{ u.apellido }}</span>
        <span class="chip">{{ 'roles.' + u.rol | translate }}</span>
        <app-language-switcher />
        <button type="button" class="btn" (click)="auth.logout()">{{ 'app.logout' | translate }}</button>
      </header>
    }
    <main id="contenido">
      <router-outlet />
    </main>
  `,
  styles: [
    `
      .brand-link { margin-right: 0; }
      .topbar-nav { display: flex; gap: 1rem; margin-right: auto; margin-left: 1rem; }
      .topbar-nav a { color: #fff; text-decoration: none; padding: .25rem .1rem; border-bottom: 2px solid transparent; }
      .topbar-nav a:hover, .topbar-nav a.activo { border-bottom-color: currentColor; }
    `,
  ],
})
export class AppComponent {
  readonly auth = inject(AuthService);

  readonly enlaces = computed(() =>
    NAV_ITEMS.filter((i) => !i.roles || this.auth.tieneRol(...i.roles)),
  );

  constructor() {
    inject(IdiomaService).iniciar();
  }
}