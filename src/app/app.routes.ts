import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { HomeComponent } from './features/home/home.component';

@Component({
  selector: 'app-acceso-denegado',
  template: `<h1>Acceso denegado</h1><p>No tiene permisos para ver esta página.</p>`,
})
export class AccesoDenegadoComponent {}

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'acceso-denegado', component: AccesoDenegadoComponent },
  { path: '**', redirectTo: 'home' },
];