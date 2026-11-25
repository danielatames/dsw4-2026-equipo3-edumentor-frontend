import { Rol } from '../models/auth.models';

export interface NavItem {
  ruta: string;
  clave: string; 
  roles?: Rol[]; 
}

export const NAV_ITEMS: NavItem[] = [
  { ruta: '/home', clave: 'nav.inicio' },
  { ruta: '/sesiones', clave: 'nav.sesiones' },
  //falta:
  //{ ruta: '/materias', clave: 'nav.materias' },
  //{ ruta: '/disponibilidad', clave: 'nav.disponibilidad', roles: ['TUTOR'] },
];