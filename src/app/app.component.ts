import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from './core/services/auth.service';
import { IdiomaService } from './core/services/idioma.service';
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
})
export class AppComponent {
  readonly auth = inject(AuthService);

  constructor() {
    inject(IdiomaService).iniciar();
  }
}