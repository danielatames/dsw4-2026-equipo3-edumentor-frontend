import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { HomeComponent } from './features/home/home.component';
import { SesionDetalleComponent } from './features/sesiones/detalle/sesion-detalle.component';

@Component({
  selector: 'app-acceso-denegado',
  imports: [TranslatePipe],
  template: `<h1>{{ 'accesoDenegado.titulo' | translate }}</h1><p>{{ 'accesoDenegado.detalle' | translate }}</p>`,
})
export class AccesoDenegadoComponent {}

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'sesiones/:id', component: SesionDetalleComponent, canActivate: [authGuard] },
  { path: 'acceso-denegado', component: AccesoDenegadoComponent },
  { path: '**', redirectTo: 'home' },
];