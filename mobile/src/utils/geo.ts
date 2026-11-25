export interface LatLng {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_M = 6371000;
const TILE_SIZE = 256;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Great-circle distance between two coordinates, in metres. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial bearing from a → b, in degrees clockwise from north. */
export function bearingDegrees(a: LatLng, b: LatLng): number {
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLon = toRad(b.longitude - a.longitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Point reached by travelling `distanceMeters` along `bearing` from origin. */
export function destinationPoint(
  origin: LatLng,
  distanceMeters: number,
  bearing: number
): LatLng {
  const angular = distanceMeters / EARTH_RADIUS_M;
  const brng = toRad(bearing);
  const lat1 = toRad(origin.latitude);
  const lon1 = toRad(origin.longitude);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) +
      Math.cos(lat1) * Math.sin(angular) * Math.cos(brng)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    latitude: toDeg(lat2),
    longitude: ((toDeg(lon2) + 540) % 360) - 180,
  };
}

export function midpoint(a: LatLng, b: LatLng): LatLng {
  return {
    latitude: (a.latitude + b.latitude) / 2,
    longitude: (a.longitude + b.longitude) / 2,
  };
}

/** Metres represented by one screen pixel at a given latitude and zoom. */
export function metersPerPixel(latitude: number, zoom: number): number {
  return (156543.03392 * Math.cos(toRad(latitude))) / Math.pow(2, zoom);
}

/** Fractional tile coordinates (not wrapped) at a zoom level. */
export function lonToTileX(longitude: number, zoom: number): number {
  const n = Math.pow(2, zoom);
  return ((longitude + 180) / 360) * n;
}

export function latToTileY(latitude: number, zoom: number): number {
  const n = Math.pow(2, zoom);
  const lat = toRad(Math.max(-85.05112878, Math.min(85.05112878, latitude)));
  return ((1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2) * n;
}

export function worldPixel(
  coordinate: LatLng,
  zoom: number
): { x: number; y: number } {
  return {
    x: lonToTileX(coordinate.longitude, zoom) * TILE_SIZE,
    y: latToTileY(coordinate.latitude, zoom) * TILE_SIZE,
  };
}

export { TILE_SIZE };

/** "420 m" / "1.2 km" */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return '—';
  if (meters < 1000) return `${Math.max(0, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** Stable, positive integer hash for deterministic demo data. */
export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
