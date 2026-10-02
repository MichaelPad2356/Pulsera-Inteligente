import { Timestamp } from 'firebase/firestore';

import { Progreso, Promocion } from '../models';
import {
  aplicarVisita,
  avanceDe,
  idQueSuma,
  metaDe,
  promocionVigente,
  seccionDe,
  textoRegla,
} from './promociones';

const ahora = Timestamp.fromMillis(1_800_000_000_000);

function promo(regla: Promocion['regla'], extra: Partial<Promocion> = {}): Promocion {
  return {
    titulo: 'Promo',
    lugarId: 'tacos',
    condiciones: '',
    regla,
    vigenciaInicio: '2026-10-01',
    vigenciaFin: '2026-11-30',
    activa: true,
    ...extra,
  };
}

function progreso(contados: string[], meta: number, extra: Partial<Progreso> = {}): Progreso {
  return {
    avance: contados.length,
    meta,
    estado: 'en_progreso',
    contados,
    desbloqueadaEn: null,
    utilizadaEn: null,
    ...extra,
  };
}

describe('reglas de promoción', () => {
  it('vigencia: activa y dentro de las fechas', () => {
    const p = promo({ tipo: 'cantidad', meta: 5 });
    expect(promocionVigente(p, '2026-10-01')).toBe(true);
    expect(promocionVigente(p, '2026-11-30')).toBe(true);
    expect(promocionVigente(p, '2026-09-30')).toBe(false);
    expect(promocionVigente(p, '2026-12-01')).toBe(false);
    expect(promocionVigente({ ...p, activa: false }, '2026-10-15')).toBe(false);
  });

  it('la meta de la regla "lugares" es el tamaño de la lista', () => {
    expect(metaDe({ tipo: 'lugares', meta: 99, lugaresIds: ['a', 'b', 'c'] })).toBe(3);
    expect(metaDe({ tipo: 'cantidad', meta: 5 })).toBe(5);
  });

  it('qué suma cada tipo de regla', () => {
    const visita = { lugarId: 'foro', eventoId: 'concierto' };
    expect(idQueSuma({ tipo: 'cantidad', meta: 5 }, visita)).toBe('foro');
    expect(idQueSuma({ tipo: 'lugares', meta: 2, lugaresIds: ['foro', 'bar'] }, visita)).toBe('foro');
    expect(idQueSuma({ tipo: 'lugares', meta: 2, lugaresIds: ['bar'] }, visita)).toBeNull();
    expect(idQueSuma({ tipo: 'eventos', meta: 2 }, visita)).toBe('concierto');
    expect(idQueSuma({ tipo: 'eventos', meta: 2 }, { lugarId: 'bar' })).toBeNull();
  });

  it('textos de las reglas', () => {
    expect(textoRegla({ tipo: 'cantidad', meta: 5 })).toBe('Visita 5 lugares distintos');
    expect(textoRegla({ tipo: 'lugares', meta: 3, lugaresIds: ['a', 'b', 'c'] })).toBe(
      'Visita los 3 lugares de la ruta',
    );
    expect(textoRegla({ tipo: 'eventos', meta: 2 })).toBe('Asiste a 2 eventos');
  });
});

describe('aplicarVisita', () => {
  const cinco = promo({ tipo: 'cantidad', meta: 5 });

  it('la primera visita crea el progreso en 1 de 5', () => {
    const nuevo = aplicarVisita(cinco, null, { lugarId: 'a' }, ahora);
    expect(nuevo).toEqual(progreso(['a'], 5));
  });

  it('el mismo lugar no cuenta dos veces', () => {
    expect(aplicarVisita(cinco, progreso(['a'], 5), { lugarId: 'a' }, ahora)).toBeNull();
  });

  it('de 2 de 5 pasa a 3 de 5', () => {
    const nuevo = aplicarVisita(cinco, progreso(['a', 'b'], 5), { lugarId: 'c' }, ahora);
    expect(nuevo?.avance).toBe(3);
    expect(nuevo?.estado).toBe('en_progreso');
  });

  it('al llegar a la meta se desbloquea y guarda cuándo', () => {
    const nuevo = aplicarVisita(cinco, progreso(['a', 'b', 'c', 'd'], 5), { lugarId: 'e' }, ahora);
    expect(nuevo?.avance).toBe(5);
    expect(nuevo?.estado).toBe('desbloqueada');
    expect(nuevo?.desbloqueadaEn).toBe(ahora);
  });

  it('una promoción desbloqueada o usada ya no cambia', () => {
    const desbloqueada = progreso(['a', 'b', 'c', 'd', 'e'], 5, { estado: 'desbloqueada' });
    expect(aplicarVisita(cinco, desbloqueada, { lugarId: 'f' }, ahora)).toBeNull();
    const usada = { ...desbloqueada, estado: 'utilizada' as const };
    expect(aplicarVisita(cinco, usada, { lugarId: 'f' }, ahora)).toBeNull();
  });

  it('regla de lugares específicos: solo suman los de la lista', () => {
    const ruta = promo({ tipo: 'lugares', meta: 2, lugaresIds: ['vinos', 'dulces'] });
    expect(aplicarVisita(ruta, null, { lugarId: 'tacos' }, ahora)).toBeNull();
    const uno = aplicarVisita(ruta, null, { lugarId: 'vinos' }, ahora);
    const dos = aplicarVisita(ruta, uno, { lugarId: 'dulces' }, ahora);
    expect(dos?.estado).toBe('desbloqueada');
  });

  it('regla de eventos: cuenta eventos distintos, no lugares', () => {
    const fan = promo({ tipo: 'eventos', meta: 2 });
    const uno = aplicarVisita(fan, null, { lugarId: 'foro', eventoId: 'viernes' }, ahora);
    expect(uno?.avance).toBe(1);
    // Mismo foro otro día, con otro concierto: sí cuenta.
    const dos = aplicarVisita(fan, uno, { lugarId: 'foro', eventoId: 'sabado' }, ahora);
    expect(dos?.estado).toBe('desbloqueada');
  });
});

describe('presentación del progreso', () => {
  it('avance y cuántos faltan, aunque no haya progreso guardado', () => {
    const p = promo({ tipo: 'cantidad', meta: 5 });
    expect(avanceDe(p, null)).toEqual({ avance: 0, meta: 5, faltan: 5, fraccion: 0 });
    expect(avanceDe(p, progreso(['a', 'b', 'c'], 5))).toEqual({
      avance: 3,
      meta: 5,
      faltan: 2,
      fraccion: 0.6,
    });
  });

  it('sección: disponibles, desbloqueadas o utilizadas', () => {
    const p = { ...promo({ tipo: 'cantidad', meta: 5 }), id: 'p' };
    expect(seccionDe(p, undefined, '2026-10-10')).toBe('disponibles');
    expect(seccionDe(p, progreso(['a'], 5, { estado: 'desbloqueada' }), '2026-10-10')).toBe(
      'desbloqueadas',
    );
    expect(seccionDe(p, progreso(['a'], 5, { estado: 'utilizada' }), '2026-10-10')).toBe(
      'utilizadas',
    );
    // Vencida y sin desbloquear: ya no se muestra.
    expect(seccionDe(p, undefined, '2027-01-01')).toBeNull();
  });
});
