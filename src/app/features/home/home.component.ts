import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { API_URL } from '../../core/api.config';
import { Usuario } from '../../core/models/auth.models';

@Component({
  selector: 'app-home',
  template: `
    <h1>Bienvenido, {{ auth.usuario()?.nombre }}</h1>
    <p>Rol: {{ auth.rol() }}</p>
    <button type="button" (click)="probar()">Probar /usuarios/me</button>
    @if (perfil()) {
      <pre>{{ perfil() | json }}</pre>
    }
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