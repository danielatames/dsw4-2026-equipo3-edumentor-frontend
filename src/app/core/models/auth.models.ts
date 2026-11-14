export type Rol = 'ESTUDIANTE' | 'TUTOR' | 'COORDINADOR';

export interface Usuario {
  id: number;
  carne: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: Rol;
}

export interface AuthResponse {
  token: string;
  tipo: string;
  usuario: Usuario;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  carne: string;
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rol: Rol;
}