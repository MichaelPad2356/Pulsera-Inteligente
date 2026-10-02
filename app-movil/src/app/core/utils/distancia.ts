export interface Coordenadas {
  lat: number;
  lng: number;
}

const RADIO_TIERRA_M = 6_371_000;

function aRadianes(grados: number): number {
  return (grados * Math.PI) / 180;
}

/** Distancia en metros entre dos puntos (fórmula de Haversine). */
export function distanciaMetros(a: Coordenadas, b: Coordenadas): number {
  const dLat = aRadianes(b.lat - a.lat);
  const dLng = aRadianes(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(a.lat)) * Math.cos(aRadianes(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_M * Math.asin(Math.sqrt(h));
}

/** 350 → '350 m', 1234 → '1.2 km' */
export function formatearDistancia(metros: number): string {
  if (metros < 1000) {
    return `${Math.round(metros / 10) * 10} m`;
  }
  return `${(metros / 1000).toFixed(1)} km`;
}
