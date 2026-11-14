# EduMentor Hub - Frontend

SPA de la plataforma de tutorías académicas entre pares.
Angular 19 (Standalone Components), TypeScript, Reactive Forms.

## Requisitos
- Node.js 20 o 22 (LTS)
- Angular CLI 19: `npm install -g @angular/cli@19`
- Backend en ejecución en http://localhost:8080
  (repositorio `dsw4-2026-equipo3-edumentor-backend`)

## Ejecución local
    npm install
    ng serve

Abrir http://localhost:4200.

## Usuarios de prueba
| Rol | Correo | Contraseña |
|---|---|---|
| ESTUDIANTE | estudiante@ucr.ac.cr | Estudiante123* |
| TUTOR | tutor@ucr.ac.cr | Tutor123* |
| COORDINADOR | coordinador@ucr.ac.cr | Coordinador123* |

## Seguridad en el cliente
- `AuthService` guarda la sesión (token JWT y usuario) y expone el rol.
- Interceptor funcional que agrega `Authorization: Bearer <token>` a las peticiones a la API.
- Guardas funcionales: `authGuard` (requiere sesión), `roleGuard` (requiere rol, con `data: { roles: [...] }`) y `guestGuard` (solo sin sesión).

## Estructura
    src/app/core/      servicios, modelos, guardas e interceptores
    src/app/features/  pantallas por funcionalidad
    src/app/shared/    componentes reutilizables

## Estilos
La paleta vive en variables CSS 

## Flujo de trabajo en Git
- Prohibido hacer commits directos a `main`.
- Una rama por funcionalidad (`feature/*`).
- Pull Request con al menos una aprobación de un compañero.
- Commits semánticos: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`.