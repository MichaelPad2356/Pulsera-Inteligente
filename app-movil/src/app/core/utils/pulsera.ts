// Utilidades para identificar pulseras: UID del chip, código impreso y enlace grabado (NDEF).
//
// Cada pulsera lleva grabado el enlace `${urlPublica}/p/{codigo}`. Al acercarla a un teléfono
// (iPhone XS o más nuevo, o Android) se abre ese enlace y la app vincula la pulsera.

/** Letras y números sin los que se confunden (0/O, 1/I/L). */
const ALFABETO = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const LARGO_CODIGO = 6;

/** Código aleatorio de 6 caracteres para imprimir en la pulsera, ej. 'K7M2QX'. */
export function generarCodigo(aleatorio: () => number = Math.random): string {
  let codigo = '';
  for (let i = 0; i < LARGO_CODIGO; i++) {
    codigo += ALFABETO[Math.floor(aleatorio() * ALFABETO.length)];
  }
  return codigo;
}

/** Limpia lo que escribe el usuario: ' k7m-2qx ' → 'K7M2QX'. */
export function normalizarCodigo(texto: string): string {
  return texto.toUpperCase().replace(/[^0-9A-Z]/g, '');
}

/** Bytes del UID del chip → id del documento en `pulseras` (hex mayúsculas, ej. '04A1B2C3D4E5F6'). */
export function uidAHex(bytes: number[]): string {
  return bytes.map((b) => (b & 0xff).toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** Enlace que se graba en la pulsera. */
export function enlacePulsera(urlPublica: string, codigo: string): string {
  return `${urlPublica.replace(/\/$/, '')}/p/${codigo}`;
}

/** Saca el código de un enlace de pulsera, o null si no es uno. */
export function codigoDeEnlace(enlace: string): string | null {
  const coincidencia = /\/p\/([0-9A-Za-z]+)\/?$/.exec(enlace);
  return coincidencia ? normalizarCodigo(coincidencia[1]) : null;
}

// --- NDEF (formato en que se graba el enlace en el chip) ------------------

export interface RegistroNdef {
  tnf: number;
  type: number[];
  id: number[];
  payload: number[];
}

const TNF_WELL_KNOWN = 1;
const TIPO_URI = 0x55; // 'U'
/** Prefijos abreviados del estándar NDEF para URIs (índice = byte de prefijo). */
const PREFIJOS_URI = ['', 'http://www.', 'https://www.', 'http://', 'https://'];

function aBytes(texto: string): number[] {
  return Array.from(new TextEncoder().encode(texto));
}

/** Registro NDEF con un enlace, listo para escribirse en el chip. */
export function registroEnlace(url: string): RegistroNdef {
  let prefijo = 0;
  for (let i = PREFIJOS_URI.length - 1; i > 0; i--) {
    if (url.startsWith(PREFIJOS_URI[i])) {
      prefijo = i;
      break;
    }
  }
  return {
    tnf: TNF_WELL_KNOWN,
    type: [TIPO_URI],
    id: [],
    payload: [prefijo, ...aBytes(url.slice(PREFIJOS_URI[prefijo].length))],
  };
}

/** Primer enlace encontrado en los registros NDEF leídos del chip. */
export function enlaceDeRegistros(registros: RegistroNdef[] | null | undefined): string | null {
  for (const r of registros ?? []) {
    if (r.tnf === TNF_WELL_KNOWN && r.type.length === 1 && r.type[0] === TIPO_URI && r.payload.length > 0) {
      const prefijo = PREFIJOS_URI[r.payload[0]] ?? '';
      return prefijo + new TextDecoder().decode(new Uint8Array(r.payload.slice(1)));
    }
  }
  return null;
}
