import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_URL } from '../api.config';
import { AuthResponse, LoginRequest, RegisterRequest, Rol } from '../models/auth.models';

const STORAGE_KEY = 'edumentor.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly session = signal<AuthResponse | null>(this.cargarSesion());

  readonly usuario = computed(() => this.session()?.usuario ?? null);
  readonly rol = computed(() => this.usuario()?.rol ?? null);

  login(datos: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/login`, datos)
      .pipe(tap((r) => this.guardarSesion(r)));
  }

  register(datos: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/register`, datos)
      .pipe(tap((r) => this.guardarSesion(r)));
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.session.set(null);
    this.router.navigate(['/login']);
  }

  token(): string | null {
    return this.session()?.token ?? null;
  }

  isAuthenticated(): boolean {
    const token = this.token();
    return !!token && !this.estaExpirado(token);
  }

  tieneRol(...roles: Rol[]): boolean {
    const rol = this.rol();
    return !!rol && roles.includes(rol);
  }

  private guardarSesion(r: AuthResponse): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
    this.session.set(r);
  }

  private cargarSesion(): AuthResponse | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthResponse) : null;
    } catch {
      return null;
    }
  }

  private estaExpirado(token: string): boolean {
    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const { exp } = JSON.parse(atob(payload));
      return typeof exp === 'number' && exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}