import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AccionSesion, ESTADOS_SESION } from '../../../core/models/sesion.models';
import { EstadoSesion, Sesion } from '../../../core/models/tutoria.models';
import { AuthService } from '../../../core/services/auth.service';
import { IdiomaService } from '../../../core/services/idioma.service';
import { SesionService } from '../../../core/services/sesion.service';
import { detalleProblema } from '../../../core/utils/problem-detail';
import {
  HORAS_MIN_CANCELACION,
  accionesPermitidas,
  puedeCancelarPorTiempo,
} from '../../../core/utils/sesion-reglas';

interface Confirmacion {
  id: number;
  accion: AccionSesion;
}

/** Acciones que piden confirmación antes de ejecutarse (no se pueden deshacer). */
const ACCIONES_CON_CONFIRMACION: readonly AccionSesion[] = ['rechazar', 'cancelar'];

@Component({
  selector: 'app-sesiones-lista',
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="page sesiones">
      <header class="sesiones-cabecera">
        <h1>{{ 'sesiones.titulo' | translate }}</h1>
        @if (auth.rol() === 'ESTUDIANTE') {
          <a class="btn" routerLink="/sesiones/nueva">{{ 'sesiones.nueva' | translate }}</a>
        }
      </header>

      <div class="field filtro">
        <label for="filtro-estado">{{ 'sesiones.filtro' | translate }}</label>
        <select id="filtro-estado" [value]="filtro() ?? ''" (change)="cambiarFiltro($event)">
          <option value="">{{ 'sesiones.todos' | translate }}</option>
          @for (e of estados; track e) {
            <option [value]="e" [selected]="e === filtro()">{{ 'estados.' + e | translate }}</option>
          }
        </select>
      </div>

      <div aria-live="polite">
        @if (mensaje()) {
          <p class="ok">{{ mensaje() }}</p>
        }
        @if (errorAccion()) {
          <p class="error" role="alert">{{ errorAccion() }}</p>
        }
      </div>

      @if (cargando()) {
        <p role="status">{{ 'sesiones.cargando' | translate }}</p>
      } @else if (errorCarga()) {
        <p class="error" role="alert">{{ errorCarga() }}</p>
      } @else if (sesiones().length === 0) {
        <p class="vacio">{{ 'sesiones.vacio' | translate }}</p>
      } @else {
        <ul class="sesiones-lista">
          @for (s of sesiones(); track s.id) {
            <li class="sesion-item">
              <div class="sesion-cabecera">
                <h2>{{ s.materiaNombre }}</h2>
                <span class="estado-chip">{{ 'estados.' + s.estado | translate }}</span>
              </div>

              <dl class="datos">
                @if (auth.rol() !== 'TUTOR') {
                  <div>
                    <dt>{{ 'sesion.tutor' | translate }}</dt>
                    <dd>{{ s.tutorNombre }}</dd>
                  </div>
                }
                @if (auth.rol() !== 'ESTUDIANTE') {
                  <div>
                    <dt>{{ 'sesion.estudiante' | translate }}</dt>
                    <dd>{{ s.estudianteNombre }}</dd>
                  </div>
                }
                <div>
                  <dt>{{ 'sesion.fecha' | translate }}</dt>
                  <dd>{{ formatearFecha(s.fechaHora) }}</dd>
                </div>
                <div>
                  <dt>{{ 'sesion.duracion' | translate }}</dt>
                  <dd>{{ 'sesion.minutos' | translate: { n: s.duracionMinutos } }}</dd>
                </div>
                @if (s.tema) {
                  <div>
                    <dt>{{ 'sesion.tema' | translate }}</dt>
                    <dd>{{ s.tema }}</dd>
                  </div>
                }
              </dl>

              @if (confirmacion(); as c) {
                @if (c.id === s.id) {
                  <div class="confirmar" role="group" [attr.aria-label]="'sesiones.confirmar.' + c.accion | translate">
                    <p>{{ 'sesiones.confirmar.' + c.accion | translate }}</p>
                    <button type="button" class="btn btn-chico" [disabled]="procesando() === s.id" (click)="ejecutar(s, c.accion, true)">
                      {{ 'sesiones.confirmar.si' | translate }}
                    </button>
                    <button type="button" class="btn btn-outline btn-chico" (click)="confirmacion.set(null)">
                      {{ 'sesiones.confirmar.no' | translate }}
                    </button>
                  </div>
                }
              }

              <div class="sesion-acciones">
                <a class="btn btn-outline btn-chico" [routerLink]="['/sesiones', s.id]">{{ 'sesiones.verDetalle' | translate }}</a>

                @if (auth.rol() === 'ESTUDIANTE' && s.estado === 'CONCLUIDA') {
                  <a class="btn btn-chico" [routerLink]="['/sesiones', s.id]">{{ 'sesiones.evaluar' | translate }}</a>
                }

                @for (a of acciones(s); track a) {
                  <button
                    type="button"
                    class="btn btn-chico"
                    [class.btn-outline]="a === 'rechazar' || a === 'cancelar'"
                    [disabled]="procesando() === s.id || (a === 'cancelar' && !puedeCancelar(s))"
                    [attr.aria-describedby]="a === 'cancelar' && !puedeCancelar(s) ? 'bloqueo-' + s.id : null"
                    [attr.aria-label]="'sesiones.ariaAccion' | translate: { accion: ('sesiones.acciones.' + a | translate), materia: s.materiaNombre }"
                    (click)="ejecutar(s, a)"
                  >
                    {{ 'sesiones.acciones.' + a | translate }}
                  </button>
                }
              </div>

              @if (acciones(s).includes('cancelar') && !puedeCancelar(s)) {
                <p class="nota" [id]="'bloqueo-' + s.id">
                  {{ 'sesiones.cancelarBloqueado' | translate: { horas: horasMinCancelacion } }}
                </p>
              }
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class SesionesListaComponent implements OnInit {
  private readonly api = inject(SesionService);
  private readonly translate = inject(TranslateService);
  private readonly idioma = inject(IdiomaService);
  readonly auth = inject(AuthService);

  readonly estados = ESTADOS_SESION;
  readonly horasMinCancelacion = HORAS_MIN_CANCELACION;

  readonly sesiones = signal<Sesion[]>([]);
  readonly filtro = signal<EstadoSesion | null>(null);
  readonly cargando = signal(true);
  readonly errorCarga = signal<string | null>(null);
  readonly errorAccion = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);
  readonly procesando = signal<number | null>(null);
  readonly confirmacion = signal<Confirmacion | null>(null);

  ngOnInit(): void {
    this.leerMensajeDeNavegacion();
    this.cargar();
  }

  cambiarFiltro(evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value;
    this.filtro.set(valor ? (valor as EstadoSesion) : null);
    this.limpiarMensajes();
    this.cargar();
  }

  acciones(s: Sesion): AccionSesion[] {
    return accionesPermitidas(this.auth.rol(), s.estado);
  }

  puedeCancelar(s: Sesion): boolean {
    return puedeCancelarPorTiempo(s.fechaHora);
  }

  /**
   * Ejecuta una acción de la máquina de estados. Rechazar y cancelar piden confirmación:
   * la primera vez solo se abre el aviso; el botón "Sí" la llama con confirmado = true.
   */
  ejecutar(s: Sesion, accion: AccionSesion, confirmado = false): void {
    if (this.procesando() !== null) {
      return;
    }
    if (ACCIONES_CON_CONFIRMACION.includes(accion) && !confirmado) {
      this.confirmacion.set({ id: s.id, accion });
      return;
    }
    this.limpiarMensajes();
    this.confirmacion.set(null);
    this.procesando.set(s.id);
    this.api.ejecutar(s.id, accion).subscribe({
      next: (actualizada) => {
        this.procesando.set(null);
        this.mensaje.set(this.translate.instant('sesiones.exito.' + accion));
        this.reemplazar(actualizada);
      },
      error: (e: HttpErrorResponse) => {
        this.procesando.set(null);
        this.errorAccion.set(detalleProblema(e) ?? this.translate.instant('sesiones.errorAccion'));
        // El estado pudo cambiar en el servidor (otro usuario actuó antes): se refresca la lista.
        if (e.status === 409) {
          this.cargar(false);
        }
      },
    });
  }

  formatearFecha(iso: string): string {
    return new Date(iso).toLocaleString(this.idioma.actual() ?? 'es', {
      dateStyle: 'full',
      timeStyle: 'short',
    });
  }

  private cargar(mostrarCargando = true): void {
    if (mostrarCargando) {
      this.cargando.set(true);
    }
    this.errorCarga.set(null);
    this.api.listar(this.filtro()).subscribe({
      next: (lista) => {
        this.sesiones.set(lista);
        this.cargando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.errorCarga.set(detalleProblema(e) ?? this.translate.instant('sesiones.errorCarga'));
        this.cargando.set(false);
      },
    });
  }

  /** Aplica la sesión devuelta por el servidor; si el filtro activo ya no la incluye, la quita. */
  private reemplazar(actualizada: Sesion): void {
    const filtro = this.filtro();
    this.sesiones.update((lista) =>
      lista
        .map((s) => (s.id === actualizada.id ? actualizada : s))
        .filter((s) => !filtro || s.estado === filtro),
    );
  }

  private limpiarMensajes(): void {
    this.mensaje.set(null);
    this.errorAccion.set(null);
    this.confirmacion.set(null);
  }

  /** Tras reservar, el formulario navega aquí con un aviso en history.state. */
  private leerMensajeDeNavegacion(): void {
    const estado = history.state as { sesionCreada?: boolean } | null;
    if (estado?.sesionCreada) {
      this.mensaje.set(this.translate.instant('sesiones.creada'));
      history.replaceState({ ...estado, sesionCreada: false }, '');
    }
  }
}
