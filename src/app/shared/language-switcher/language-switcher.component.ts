import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { IDIOMAS, Idioma, IdiomaService } from '../../core/services/idioma.service';

@Component({
  selector: 'app-language-switcher',
  imports: [TranslatePipe],
  template: `
    <div class="lang-switcher">
      <label for="idioma">{{ 'idioma.etiqueta' | translate }}</label>
      <select id="idioma" [value]="idiomas.actual()" (change)="cambiar($event)">
        @for (i of lista; track i) {
          <option [value]="i" [selected]="i === idiomas.actual()">{{ 'idioma.' + i | translate }}</option>
        }
      </select>
    </div>
  `,
})
export class LanguageSwitcherComponent {
  readonly idiomas = inject(IdiomaService);
  readonly lista = IDIOMAS;

  cambiar(evento: Event): void {
    this.idiomas.cambiar((evento.target as HTMLSelectElement).value as Idioma);
  }
}
