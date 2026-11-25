import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  imports: [JsonPipe, RouterLink, TranslatePipe],
  imports: [TranslatePipe],
  template: `
    <div class="page">
      <section class="welcome">
        <h1>{{ 'home.saludo' | translate: { nombre: auth.usuario()?.nombre } }}</h1>
        <p>{{ 'home.sesionComo' | translate }} <strong>{{ 'roles.' + auth.rol() | translate }}</strong>.</p>
        <a class="btn" routerLink="/sesiones">{{ 'nav.sesiones' | translate }}</a>
        @if (auth.rol() === 'ESTUDIANTE') {
          <a class="btn btn-outline" routerLink="/sesiones/nueva">{{ 'sesiones.nueva' | translate }}</a>
        }
        <button type="button" class="btn btn-outline" (click)="probar()">{{ 'home.probar' | translate }}</button>
      </section>
    </div>
  `,
})
export class HomeComponent {
  readonly auth = inject(AuthService);
}