// Reglas de las promociones (RF-08) y cálculo del progreso (RF-10).
// Funciones puras, sin Firebase: se usan en el lector al registrar una visita
// y en las pantallas para mostrar el avance. Probadas en promociones.spec.ts.

import type { Timestamp } from 'firebase/firestore';

import { ConId, Progreso, Promocion, ReglaPromocion } from '../models';

/** Lo que pasó en el lector: qué lugar y, si era un foro con evento ese día, qué evento. */
export interface Visita {
  lugarId: string;
  eventoId?: string;
}

/** La promoción está activa y hoy está dentro de su vigencia. */
export function promocionVigente(promo: Promocion, dia: string): boolean {
  return promo.activa && promo.vigenciaInicio <= dia && dia <= promo.vigenciaFin;
}

/** Cuántas cosas hay que juntar para desbloquear. */
export function metaDe(regla: ReglaPromocion): number {
  return regla.tipo === 'lugares' ? regla.lugaresIds.length : regla.meta;
}

/** El id que esta visita suma a la regla (lugar o evento), o null si no cuenta para ella. */
export function idQueSuma(regla: ReglaPromocion, visita: Visita): string | null {
  switch (regla.tipo) {
    case 'cantidad':
      return visita.lugarId;
    case 'lugares':
      return regla.lugaresIds.includes(visita.lugarId) ? visita.lugarId : null;
    case 'eventos':
      return visita.eventoId ?? null;
  }
}

/**
 * Nuevo progreso de una promoción después de una visita, o null si la visita no la cambia
 * (no aplica, ya contaba ese lugar/evento, o la promoción ya estaba desbloqueada o usada).
 */
export function aplicarVisita(
  promo: Promocion,
  progreso: Progreso | null,
  visita: Visita,
  ahora: Timestamp,
): Progreso | null {
  if (progreso && progreso.estado !== 'en_progreso') {
    return null;
  }
  const id = idQueSuma(promo.regla, visita);
  const contados = progreso?.contados ?? [];
  if (id === null || contados.includes(id)) {
    return null;
  }
  const nuevos = [...contados, id];
  const meta = metaDe(promo.regla);
  const desbloqueada = nuevos.length >= meta;
  return {
    avance: Math.min(nuevos.length, meta),
    meta,
    estado: desbloqueada ? 'desbloqueada' : 'en_progreso',
    contados: nuevos,
    desbloqueadaEn: desbloqueada ? ahora : null,
    utilizadaEn: null,
  };
}

/** Avance para mostrar en pantalla, aunque el usuario todavía no tenga progreso guardado. */
export function avanceDe(promo: Promocion, progreso: Progreso | null | undefined) {
  const meta = metaDe(promo.regla);
  const avance = Math.min(progreso?.avance ?? 0, meta);
  return { avance, meta, faltan: meta - avance, fraccion: meta > 0 ? avance / meta : 0 };
}

/** Texto corto de la regla, ej. 'Visita 5 lugares distintos'. */
export function textoRegla(regla: ReglaPromocion): string {
  switch (regla.tipo) {
    case 'cantidad':
      return `Visita ${regla.meta} lugares distintos`;
    case 'lugares':
      return `Visita los ${regla.lugaresIds.length} lugares de la ruta`;
    case 'eventos':
      return regla.meta === 1 ? 'Asiste a 1 evento' : `Asiste a ${regla.meta} eventos`;
  }
}

/** Unidad de lo que se cuenta, para 'Te faltan 2 …'. */
export function unidadRegla(regla: ReglaPromocion, cantidad: number): string {
  if (regla.tipo === 'eventos') {
    return cantidad === 1 ? 'evento' : 'eventos';
  }
  return cantidad === 1 ? 'lugar' : 'lugares';
}

export type SeccionPromocion = 'disponibles' | 'desbloqueadas' | 'utilizadas';

/** En qué pestaña de Promociones va cada una (RF-08: disponibles, desbloqueadas y utilizadas). */
export function seccionDe(
  promo: ConId<Promocion>,
  progreso: Progreso | undefined,
  dia: string,
): SeccionPromocion | null {
  if (progreso?.estado === 'utilizada') return 'utilizadas';
  if (progreso?.estado === 'desbloqueada') return 'desbloqueadas';
  return promocionVigente(promo, dia) ? 'disponibles' : null;
}
