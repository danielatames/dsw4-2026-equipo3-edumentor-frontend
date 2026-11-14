import { Component } from '@angular/core';

@Component({
  selector: 'app-auth-shell',
  template: `
    <div class="auth-page">
      <div class="auth-aside">
        <p class="brand">EduMentor Hub</p>
        <p class="aside-title">Aprende de quien ya pasó por ahí.</p>
    
      </div>
      <section class="auth-main">
        <div class="auth-card">
          <ng-content />
        </div>
      </section>
    </div>
  `,
})
export class AuthShellComponent {}