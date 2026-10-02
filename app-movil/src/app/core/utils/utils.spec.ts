import { distanciaMetros, formatearDistancia } from './distancia';
import { diaEnAgs, fechaCorta, fechaLarga, horaEnAgs, nombreDia } from './fechas';
import {
  codigoDeEnlace,
  enlaceDeRegistros,
  enlacePulsera,
  generarCodigo,
  normalizarCodigo,
  registroEnlace,
  uidAHex,
} from './pulsera';

describe('fechas', () => {
  it('el día se calcula en hora de Aguascalientes, no en UTC', () => {
    // 2 de octubre 2026, 03:00 UTC = 1 de octubre, 21:00 en Aguascalientes.
    const fecha = new Date(Date.UTC(2026, 9, 2, 3, 0));
    expect(diaEnAgs(fecha)).toBe('2026-10-01');
    expect(horaEnAgs(fecha)).toBe('21:00');
  });

  it('formatos de fecha en español', () => {
    expect(fechaLarga('2026-10-02')).toBe('Viernes 2 de octubre');
    expect(nombreDia('2026-10-03')).toBe('Sábado');
    expect(fechaCorta('2026-10-04')).toBe('Dom 4 oct');
  });
});

describe('distancia', () => {
  it('calcula metros entre dos puntos cercanos', () => {
    // ~111 m por cada 0.001° de latitud.
    const d = distanciaMetros({ lat: 21.88, lng: -102.3 }, { lat: 21.881, lng: -102.3 });
    expect(d).toBeGreaterThan(105);
    expect(d).toBeLessThan(117);
  });

  it('formatea metros y kilómetros', () => {
    expect(formatearDistancia(347)).toBe('350 m');
    expect(formatearDistancia(1234)).toBe('1.2 km');
  });
});

describe('pulsera', () => {
  it('UID del chip en hex mayúsculas', () => {
    expect(uidAHex([4, 161, 178, 195, 212, 229, 246])).toBe('04A1B2C3D4E5F6');
  });

  it('códigos de 6 caracteres sin letras confusas', () => {
    const codigo = generarCodigo();
    expect(codigo).toMatch(/^[2-9A-HJ-NP-Z]{6}$/);
    expect(normalizarCodigo(' k7m-2qx ')).toBe('K7M2QX');
  });

  it('enlace de la pulsera y su código', () => {
    const enlace = enlacePulsera('https://pulsera.web.app/', 'K7M2QX');
    expect(enlace).toBe('https://pulsera.web.app/p/K7M2QX');
    expect(codigoDeEnlace(enlace)).toBe('K7M2QX');
    expect(codigoDeEnlace('https://otra.com/algo')).toBeNull();
  });

  it('el enlace se graba y se lee igual en formato NDEF', () => {
    const url = 'https://pulsera.web.app/p/K7M2QX';
    const registro = registroEnlace(url);
    expect(registro.payload[0]).toBe(4); // prefijo abreviado de 'https://'
    expect(enlaceDeRegistros([registro])).toBe(url);
    expect(enlaceDeRegistros(null)).toBeNull();
  });
});
