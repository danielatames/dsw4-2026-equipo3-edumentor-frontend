import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';

@Component({
  selector: 'app-auth-shell',
  imports: [TranslatePipe, LanguageSwitcherComponent],
  template: `
    <div class="auth-page">
      <div class="auth-aside">
        <p class="brand">{{ 'app.name' | translate }}</p>
        <p class="aside-title">{{ 'auth.aside' | translate }}</p>
    
      </div>
      <section class="auth-main">
        <app-language-switcher class="auth-lang" />
        <div class="auth-card">
          <ng-content />
        </div>
      </section>
    </div>
  `,
})
export class AuthShellComponent {}