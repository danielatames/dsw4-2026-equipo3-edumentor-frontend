import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { HomeComponent } from './features/home/home.component';
import { SesionesListaComponent } from './features/sesiones/lista/sesiones-lista.component';
import { SesionNuevaComponent } from './features/sesiones/nueva/sesion-nueva.component';
import { SesionDetalleComponent } from './features/sesiones/detalle/sesion-detalle.component';
import { MateriasCatalogoComponent } from './features/materias/catalogo/materias-catalogo.component';
import { MateriaFormComponent } from './features/materias/formulario/materia-form.component';

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
  { path: 'sesiones', component: SesionesListaComponent, canActivate: [authGuard] },
  {
    path: 'sesiones/nueva',
    component: SesionNuevaComponent,
    canActivate: [roleGuard],
    data: { roles: ['ESTUDIANTE'] },
  },
  { path: 'sesiones/:id', component: SesionDetalleComponent, canActivate: [authGuard] },
  { path: 'materias', component: MateriasCatalogoComponent, canActivate: [authGuard] },
  {
    path: 'materias/nueva',
    component: MateriaFormComponent,
    canActivate: [roleGuard],
    data: { roles: ['COORDINADOR'] },
  },
  {
    path: 'materias/:id/editar',
    component: MateriaFormComponent,
    canActivate: [roleGuard],
    data: { roles: ['COORDINADOR'] },
  },
  { path: 'acceso-denegado', component: AccesoDenegadoComponent },
  { path: '**', redirectTo: 'home' },
];