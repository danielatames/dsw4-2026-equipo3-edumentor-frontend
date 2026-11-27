import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DIAS_SEMANA, Disponibilidad, TutorDisponible } from '../../../core/models/sesion.models';
import { AuthService } from '../../../core/services/auth.service';
import { DisponibilidadService } from '../../../core/services/disponibilidad.service';
import { ErrorApiService } from '../../../core/services/error-api.service';
import { agruparTutores } from '../../../core/utils/sesion-reglas';

interface DiaConBloques {
  dia: string;
  bloques: Disponibilidad[];
}

/**
 * Consulta de horarios: muestra cada tutor con sus bloques activos de lunes a domingo.
 * La ven el estudiante (para decidir cuándo reservar) y el coordinador.
 */
@Component({
  selector: 'app-tutores-disponibles',
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="page tutores">
      <header class="tutores-cabecera">
        <div>
          <h1>{{ 'tutores.titulo' | translate }}</h1>
          <p class="subtitle">{{ 'tutores.intro' | translate }}</p>
        </div>
        @if (auth.rol() === 'ESTUDIANTE') {
          <a class="btn" routerLink="/sesiones/nueva">{{ 'sesiones.nueva' | translate }}</a>
        }
      </header>

      @if (cargando()) {
        <p role="status">{{ 'tutores.cargando' | translate }}</p>
      } @else if (errorCarga()) {
        <p class="error" role="alert">{{ errorCarga() }}</p>
      } @else if (tutores().length === 0) {
        <p class="vacio">{{ 'tutores.vacio' | translate }}</p>
      } @else {
        <div class="field filtro">
          <label for="filtro-tutor">{{ 'tutores.filtro' | translate }}</label>
          <select id="filtro-tutor" [value]="filtro() ?? ''" (change)="cambiarFiltro($event)">
            <option value="">{{ 'tutores.todos' | translate }}</option>
            @for (t of tutores(); track t.id) {
              <option [value]="t.id" [selected]="t.id === filtro()">{{ t.nombre }}</option>
            }
          </select>
        </div>

        <ul class="tutores-lista">
          @for (t of visibles(); track t.id) {
            <li class="tutor" [attr.aria-labelledby]="'tutor-' + t.id">
              <h2 [id]="'tutor-' + t.id">{{ t.nombre }}</h2>
              <dl class="tutor-dias">
                @for (d of porDia(t); track d.dia) {
                  <div>
                    <dt>{{ 'dias.' + d.dia | translate }}</dt>
                    <dd>
                      @for (b of d.bloques; track b.id) {
                        <span class="franja">{{ b.horaInicio.slice(0, 5) }} – {{ b.horaFin.slice(0, 5) }}</span>
                      }
                    </dd>
                  </div>
                }
              </dl>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [
    `
      .tutores { display: grid; gap: 1rem; }
      .tutores-cabecera { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
      .tutores-cabecera h1 { margin: 0; }
      .tutores-cabecera .subtitle { margin: .35rem 0 0; }
      .tutores-cabecera .btn { margin-top: 0; text-decoration: none; }
      .filtro { margin-top: 0; max-width: 320px; }
      .tutores-lista { list-style: none; margin: 0; padding: 0; display: grid; gap: 1rem; }
      .tutor { background: var(--blanco); border: 1px solid var(--linea); border-radius: min(var(--radio), 16px); padding: 1.25rem 1.5rem; }
      .tutor h2 { margin: 0 0 .75rem; font-size: 1.3rem; }
      .tutor-dias { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: .75rem; margin: 0; }
      .tutor-dias dt { font-size: .85rem; font-weight: 700; color: var(--tinta-suave); }
      .tutor-dias dd { display: flex; flex-wrap: wrap; gap: .35rem; margin: .25rem 0 0; }
      .franja { padding: .15rem .6rem; background: var(--papel); border: 1px solid var(--linea); border-radius: min(var(--radio), 8px); font-weight: 700; }
    `,
  ],
})
export class TutoresDisponiblesComponent implements OnInit {
  private readonly api = inject(DisponibilidadService);
  private readonly errores = inject(ErrorApiService);
  readonly auth = inject(AuthService);

  readonly tutores = signal<TutorDisponible[]>([]);
  readonly filtro = signal<number | null>(null);
  readonly cargando = signal(true);
  readonly errorCarga = signal<string | null>(null);

  readonly visibles = computed(() => {
    const id = this.filtro();
    return id === null ? this.tutores() : this.tutores().filter((t) => t.id === id);
  });

  ngOnInit(): void {
    this.api.listarActivas().subscribe({
      next: (bloques) => {
        this.tutores.set(agruparTutores(bloques));
        this.cargando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.errorCarga.set(this.errores.mensaje(e, 'tutores.errorCarga'));
        this.cargando.set(false);
      },
    });
  }

  cambiarFiltro(evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value;
    this.filtro.set(valor ? Number(valor) : null);
  }

  /** Solo los días en que el tutor atiende, de lunes a domingo y por hora. */
  porDia(t: TutorDisponible): DiaConBloques[] {
    return DIAS_SEMANA.map((dia) => ({
      dia,
      bloques: t.bloques
        .filter((b) => b.diaSemana === dia)
        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
    })).filter((d) => d.bloques.length > 0);
  }
}
