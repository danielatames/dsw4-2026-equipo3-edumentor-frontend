import { Component, ElementRef, input, output, viewChild } from '@angular/core';

let siguienteId = 0;

/**
 * Ventana de confirmación con los colores del tema activo.
 * Usa el elemento nativo <dialog>: con showModal() el navegador atrapa el foco,
 * oscurece el fondo y permite cerrar con Esc (accesible sin código extra).
 *
 * Uso:
 *   <app-dialogo-confirmacion #d titulo="..." textoConfirmar="..." textoCancelar="..." (confirmado)="hacerAlgo()" />
 *   <button (click)="d.abrir()">...</button>
 */
@Component({
  selector: 'app-dialogo-confirmacion',
  template: `
    <dialog
      #dialogo
      class="dialogo"
      [attr.aria-labelledby]="idTitulo"
      [attr.aria-describedby]="mensaje() ? idMensaje : null"
      (close)="alCerrar()"
      (click)="clicEnFondo($event)"
    >
      <div class="dialogo-contenido">
        <div class="dialogo-icono" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>
        <h2 [id]="idTitulo">{{ titulo() }}</h2>
        @if (mensaje()) {
          <p [id]="idMensaje">{{ mensaje() }}</p>
        }
        <div class="dialogo-botones">
          <!-- El foco empieza en "Cancelar", la opción segura. -->
          <button type="button" class="btn btn-outline" autofocus (click)="responder(false)">
            {{ textoCancelar() }}
          </button>
          <button type="button" class="btn" (click)="responder(true)">{{ textoConfirmar() }}</button>
        </div>
      </div>
    </dialog>
  `,
  styles: [
    `
      .dialogo {
        width: min(420px, calc(100vw - 2rem));
        padding: 0;
        color: var(--tinta);
        background: var(--blanco, #fff);
        border: var(--grosor, 2px) solid var(--tinta);
        /* min(): algunos temas usan --radio de píldora (999px). */
        border-radius: min(var(--radio), 20px);
        box-shadow: var(--sombra, 0 20px 45px rgba(0, 0, 0, 0.25));
      }
      .dialogo::backdrop { background: rgba(15, 15, 25, 0.55); backdrop-filter: blur(2px); }
      .dialogo[open] { animation: aparecer 0.18s ease-out; }
      @keyframes aparecer {
        from { opacity: 0; transform: translateY(10px) scale(0.97); }
        to { opacity: 1; transform: none; }
      }
      @media (prefers-reduced-motion: reduce) { .dialogo[open] { animation: none; } }

      .dialogo-contenido { padding: 2rem 1.75rem 1.75rem; text-align: center; }
      .dialogo-icono {
        display: grid; place-items: center; width: 60px; height: 60px; margin: 0 auto 1rem;
        border-radius: 50%; color: var(--primario); background: var(--papel); border: 2px solid var(--primario);
      }
      .dialogo h2 { margin: 0 0 0.5rem; font-size: 1.45rem; }
      .dialogo p { margin: 0; color: var(--tinta-suave); }
      .dialogo-botones { display: flex; justify-content: center; flex-wrap: wrap; gap: 0.75rem; margin-top: 1.6rem; }
      .dialogo-botones .btn { margin-top: 0; }
    `,
  ],
})
export class DialogoConfirmacionComponent {
  readonly titulo = input.required<string>();
  /** Texto opcional debajo del título. */
  readonly mensaje = input<string>('');
  readonly textoConfirmar = input.required<string>();
  readonly textoCancelar = input.required<string>();

  /** Se emite solo si el usuario eligió confirmar. */
  readonly confirmado = output<void>();

  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');
  private aceptado = false;

  readonly idTitulo = `dialogo-titulo-${siguienteId}`;
  readonly idMensaje = `dialogo-mensaje-${siguienteId++}`;

  abrir(): void {
    this.aceptado = false;
    this.dialogo().nativeElement.showModal();
  }

  responder(acepta: boolean): void {
    this.aceptado = acepta;
    this.dialogo().nativeElement.close();
  }

  /** Se ejecuta al cerrar por cualquier vía (botones, Esc o clic fuera). */
  alCerrar(): void {
    if (this.aceptado) {
      this.confirmado.emit();
    }
  }

  /** Un clic sobre el fondo oscuro (fuera de la tarjeta) equivale a cancelar. */
  clicEnFondo(evento: MouseEvent): void {
    if (evento.target === this.dialogo().nativeElement) {
      this.responder(false);
    }
  }
}
