import { Pipe, PipeTransform } from '@angular/core';
import type { Timestamp } from 'firebase/firestore';

import { diaEnAgs, fechaCorta, fechaLarga, horaEnAgs } from '../../core/utils/fechas';

/** {{ '2026-10-02' | fechaLarga }} → 'Viernes 2 de octubre' */
@Pipe({ name: 'fechaLarga' })
export class FechaLargaPipe implements PipeTransform {
  transform(dia: string): string {
    return fechaLarga(dia);
  }
}

/** {{ '2026-10-02' | fechaCorta }} → 'Vie 2 oct' */
@Pipe({ name: 'fechaCorta' })
export class FechaCortaPipe implements PipeTransform {
  transform(dia: string): string {
    return fechaCorta(dia);
  }
}

/** {{ interaccion.fechaHora | momento }} → 'Viernes 2 de octubre, 21:05' */
@Pipe({ name: 'momento' })
export class MomentoPipe implements PipeTransform {
  transform(momento: Timestamp | null | undefined): string {
    if (!momento) return '';
    const fecha = momento.toDate();
    return `${fechaLarga(diaEnAgs(fecha))}, ${horaEnAgs(fecha)}`;
  }
}
