import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Idioma = 'es' | 'en';

export const IDIOMAS: readonly Idioma[] = ['es', 'en'];

const STORAGE_KEY = 'edumentor.lang';

@Injectable({ providedIn: 'root' })
export class IdiomaService {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);

  readonly actual = this.translate.currentLang;

  iniciar(): void {
    this.translate.addLangs([...IDIOMAS]);
    this.translate.setFallbackLang('es');
    this.cambiar(this.inicial());
  }

  cambiar(idioma: Idioma): void {
    this.translate.use(idioma).subscribe(() => {
      this.document.documentElement.lang = idioma;
    });
    try {
      localStorage.setItem(STORAGE_KEY, idioma);
    } catch {
      return;
    }
  }

  private inicial(): Idioma {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      if (this.esIdioma(guardado)) {
        return guardado;
      }
    } catch {
      return 'es';
    }
    const navegador = this.translate.getBrowserLang();
    return this.esIdioma(navegador) ? navegador : 'es';
  }

  private esIdioma(valor: string | null | undefined): valor is Idioma {
    return !!valor && (IDIOMAS as readonly string[]).includes(valor);
  }
}
