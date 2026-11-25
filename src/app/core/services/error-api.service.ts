import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { detalleProblema } from '../utils/problem-detail';

@Injectable({ providedIn: 'root' })
export class ErrorApiService {
  private readonly translate = inject(TranslateService);

  mensaje(error: HttpErrorResponse, claveGenerica: string): string {
    if (error.status === 0) {
      return this.translate.instant('errores.red');
    }
    if (error.status >= 500) {
      return this.translate.instant('errores.servidor');
    }
    if (error.status === 403) {
      return this.translate.instant('errores.prohibido');
    }
    return detalleProblema(error) ?? this.translate.instant(claveGenerica);
  }
}
