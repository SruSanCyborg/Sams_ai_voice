import type { Vec3 } from "@/types/spatial";

export interface Spherical {
  azimuth: number;
  elevation: number;
  distance: number;
}

export function cartesianToSpherical(
  listenerPos: Vec3,
  sourcePos: Vec3
): Spherical {
  const dx = sourcePos[0] - listenerPos[0];
  const dy = sourcePos[1] - listenerPos[1];
  const dz = sourcePos[2] - listenerPos[2];

  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001;

  // azimuth: angle in XZ plane (0° = front, 90° = right)
  const azimuth = (Math.atan2(dx, -dz) * 180) / Math.PI;

  // elevation: angle above/below XZ plane
  const elevation = (Math.asin(dy / distance) * 180) / Math.PI;

  return { azimuth, elevation, distance };
}

export function haversineAngle(
  az1: number,
  el1: number,
  az2: number,
  el2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLon = toRad(az2 - az1);
  const dLat = toRad(el2 - el1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(el1)) * Math.cos(toRad(el2)) * Math.sin(dLon / 2) ** 2;
  return 2 * Math.asin(Math.sqrt(a)) * (180 / Math.PI);
}

export function participantColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 65%)`;
}

export function distance3D(a: Vec3, b: Vec3): number {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
  );
}
