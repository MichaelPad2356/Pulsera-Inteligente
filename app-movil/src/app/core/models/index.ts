// Modelo de datos de Firestore. Importar siempre desde aquí:
//   import { Lugar, COL } from '../core/models';
//
// Fechas de calendario como texto 'YYYY-MM-DD' y horas como 'HH:mm': se ordenan
// bien como texto y son fáciles de capturar en el panel. Los momentos exactos
// (visitas, canjes) son Timestamp.

export * from './colecciones';
export * from './usuario.model';
export * from './pulsera.model';
export * from './lugar.model';
export * from './actividad.model';
export * from './evento.model';
export * from './promocion.model';
export * from './interaccion.model';
export * from './progreso.model';
