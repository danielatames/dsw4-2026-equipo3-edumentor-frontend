import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

let contador = 0;

@Component({
  selector: 'app-star-rating',
  imports: [TranslatePipe],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StarRatingComponent),
      multi: true,
    },
  ],
  template: `
    <fieldset class="star-rating">
      <legend>{{ etiqueta() }}</legend>
      <div class="star-row">
        @for (n of valores; track n) {
          <input
            type="radio"
            class="star-input"
            [id]="idBase + '-' + n"
            [name]="idBase"
            [value]="n"
            [checked]="valor() === n"
            [disabled]="deshabilitado()"
            (change)="seleccionar(n)"
            (blur)="alTocar()"
          />
          <label class="star-label" [for]="idBase + '-' + n">
            <span aria-hidden="true">{{ n <= (valor() ?? 0) ? '★' : '☆' }}</span>
            <span class="visually-hidden">{{ 'evaluacion.estrellas' | translate: { n: n } }}</span>
          </label>
        }
      </div>
    </fieldset>
  `,
  styles: `
    .star-rating { border: 0; margin: 0; padding: 0; }
    legend { font-weight: 600; color: var(--verde-900); padding: 0; margin-bottom: .35rem; }
    .star-row { display: flex; gap: .25rem; }
    .star-input { position: absolute; opacity: 0; width: 1px; height: 1px; }
    .star-label {
      font-size: 2.2rem; line-height: 1; cursor: pointer; padding: .1rem .2rem;
      color: var(--verde-700); border-radius: 8px;
    }
    .star-input:focus-visible + .star-label { outline: 3px solid var(--verde-500); outline-offset: 2px; }
    .star-input:disabled + .star-label { cursor: not-allowed; opacity: .6; }
    .visually-hidden {
      position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
      overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
    }
  `,
})
export class StarRatingComponent implements ControlValueAccessor {
  readonly etiqueta = input('');
  readonly valores = [1, 2, 3, 4, 5];
  readonly idBase = `estrellas-${++contador}`;
  readonly valor = signal<number | null>(null);
  readonly deshabilitado = signal(false);

  private alCambiar: (valor: number | null) => void = () => undefined;
  private alTocarFn: () => void = () => undefined;

  seleccionar(n: number): void {
    this.valor.set(n);
    this.alCambiar(n);
  }

  alTocar(): void {
    this.alTocarFn();
  }

  writeValue(valor: number | null): void {
    this.valor.set(valor ?? null);
  }

  registerOnChange(fn: (valor: number | null) => void): void {
    this.alCambiar = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.alTocarFn = fn;
  }

  setDisabledState(deshabilitado: boolean): void {
    this.deshabilitado.set(deshabilitado);
  }
}
