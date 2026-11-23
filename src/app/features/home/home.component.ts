import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  imports: [TranslatePipe],
  template: `
    <div class="page">
      <section class="welcome">
        <h1>{{ 'home.saludo' | translate: { nombre: auth.usuario()?.nombre } }}</h1>
        <p>{{ 'home.sesionComo' | translate }} <strong>{{ 'roles.' + auth.rol() | translate }}</strong>.</p>
      </section>
    </div>
  `,
})
export class HomeComponent {
  readonly auth = inject(AuthService);
}