import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JsonPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { API_URL } from '../../core/api.config';
import { Usuario } from '../../core/models/auth.models';

@Component({
  selector: 'app-home',
  imports: [JsonPipe],
  template: `
    <div class="page">
      <section class="welcome">
        <h1>Hola, {{ auth.usuario()?.nombre }}</h1>
        <p>Ha iniciado sesión como <strong>{{ auth.rol() }}</strong>.</p>
        <button type="button" class="btn btn-outline" (click)="probar()">Probar /usuarios/me</button>
      </section>
      @if (perfil()) {
        <pre>{{ perfil() | json }}</pre>
      }
    </div>
  `,
})
export class HomeComponent {
  readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  readonly perfil = signal<Usuario | null>(null);

  probar(): void {
    this.http.get<Usuario>(`${API_URL}/usuarios/me`).subscribe((u) => this.perfil.set(u));
  }
}