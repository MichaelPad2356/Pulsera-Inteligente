// Fechas en hora de Aguascalientes. En Firestore los días se guardan como 'YYYY-MM-DD'
// y las horas como 'HH:mm'; aquí se convierten a texto para mostrar.

export const ZONA_HORARIA = 'America/Mexico_City'; // Aguascalientes, sin horario de verano

const formatoDia = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }); // da 'YYYY-MM-DD'
const formatoHora = new Intl.DateTimeFormat('es-MX', {
  timeZone: ZONA_HORARIA,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const formatoMesLargo = new Intl.DateTimeFormat('es-MX', { timeZone: 'UTC', month: 'long' });
const formatoSemana = new Intl.DateTimeFormat('es-MX', { timeZone: 'UTC', weekday: 'long' });
const formatoMes = new Intl.DateTimeFormat('es-MX', { timeZone: 'UTC', month: 'short' });

/** Día 'YYYY-MM-DD' de una fecha (por defecto, hoy) en Aguascalientes. */
export function diaEnAgs(fecha: Date = new Date()): string {
  return formatoDia.format(fecha);
}

/** Hora 'HH:mm' de una fecha en Aguascalientes. */
export function horaEnAgs(fecha: Date): string {
  return formatoHora.format(fecha);
}

/** 'YYYY-MM-DD' → Date a mediodía UTC (evita que la zona horaria cambie el día). */
function aFecha(dia: string): Date {
  const [anio, mes, d] = dia.split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, d, 12));
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** '2026-10-02' → 'Viernes 2 de octubre' */
export function fechaLarga(dia: string): string {
  const fecha = aFecha(dia);
  return `${nombreDia(dia)} ${fecha.getUTCDate()} de ${formatoMesLargo.format(fecha)}`;
}

/** '2026-10-02' → 'Viernes' */
export function nombreDia(dia: string): string {
  return capitalizar(formatoSemana.format(aFecha(dia)));
}

/** '2026-10-02' → 'Vie 2 oct' */
export function fechaCorta(dia: string): string {
  const fecha = aFecha(dia);
  const semana = nombreDia(dia).slice(0, 3);
  const mes = formatoMes.format(fecha).replace('.', '');
  return `${semana} ${fecha.getUTCDate()} ${mes}`;
}
