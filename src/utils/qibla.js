// Qibla geometry: the great-circle direction from anywhere on earth to the
// Kaaba. Note this is the initial bearing of the shortest path, which is what
// every qibla compass shows — it is not the same as a constant-heading
// (rhumb line) course, and the two diverge noticeably at long distances.

/** Kaaba, Masjid al-Haram. */
export const KAABA = { lat: 21.4224779, lng: 39.8251832 };

const EARTH_RADIUS_KM = 6371;
const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

/**
 * Initial great-circle bearing from a point to the Kaaba.
 * @param {number} lat
 * @param {number} lng
 * @returns {number} degrees clockwise from true north, 0-360
 */
export const qiblaBearing = (lat, lng) => {
  const phi1 = toRad(lat);
  const phi2 = toRad(KAABA.lat);
  const deltaLambda = toRad(KAABA.lng - lng);

  const y = Math.sin(deltaLambda);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

/**
 * Great-circle distance to the Kaaba in kilometres.
 * @param {number} lat
 * @param {number} lng
 * @returns {number}
 */
export const distanceToKaaba = (lat, lng) => {
  const phi1 = toRad(lat);
  const phi2 = toRad(KAABA.lat);
  const dPhi = toRad(KAABA.lat - lat);
  const dLambda = toRad(KAABA.lng - lng);

  const a =
    Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Smallest signed angle between two bearings, in (-180, 180]. Positive means
 * `target` lies clockwise of `from`.
 * @param {number} from
 * @param {number} target
 * @returns {number}
 */
export const angleDelta = (from, target) => {
  const diff = ((target - from + 540) % 360) - 180;
  return diff === -180 ? 180 : diff;
};
