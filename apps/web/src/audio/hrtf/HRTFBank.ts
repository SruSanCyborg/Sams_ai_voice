import type { HRTFEntry, HRTFPair } from "@/types/spatial";
import { haversineAngle } from "@/lib/hrtfUtils";
import { HRTF_LENGTH, HRTF_CACHE_SIZE, HRTF_SKIP_ANGLE_DEG } from "@/lib/constants";

export class HRTFBank {
  private entries: HRTFEntry[] = [];
  private cache = new Map<string, HRTFPair>();
  private lastAz = NaN;
  private lastEl = NaN;

  async load(url: string): Promise<void> {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    const view = new DataView(buf);
    let offset = 0;

    const count = view.getUint32(offset, true);
    offset += 4;

    for (let i = 0; i < count; i++) {
      const azimuth = view.getFloat32(offset, true);
      offset += 4;
      const elevation = view.getFloat32(offset, true);
      offset += 4;

      const left = new Float32Array(HRTF_LENGTH);
      const right = new Float32Array(HRTF_LENGTH);

      for (let j = 0; j < HRTF_LENGTH; j++) {
        left[j] = view.getFloat32(offset, true);
        offset += 4;
      }
      for (let j = 0; j < HRTF_LENGTH; j++) {
        right[j] = view.getFloat32(offset, true);
        offset += 4;
      }

      this.entries.push({ azimuth, elevation, left, right });
    }
  }

  getNearestHRTF(azimuth: number, elevation: number): HRTFPair {
    // Skip recomputation if angle change is below threshold
    if (
      Math.abs(azimuth - this.lastAz) < HRTF_SKIP_ANGLE_DEG &&
      Math.abs(elevation - this.lastEl) < HRTF_SKIP_ANGLE_DEG
    ) {
      const key = `${this.lastAz.toFixed(0)}_${this.lastEl.toFixed(0)}`;
      const cached = this.cache.get(key);
      if (cached) return cached;
    }

    const cacheKey = `${azimuth.toFixed(1)}_${elevation.toFixed(1)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.lastAz = azimuth;
      this.lastEl = elevation;
      return cached;
    }

    const pair = this.interpolate(azimuth, elevation);

    // LRU cache eviction
    if (this.cache.size >= HRTF_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(cacheKey, pair);
    this.lastAz = azimuth;
    this.lastEl = elevation;
    return pair;
  }

  private interpolate(azimuth: number, elevation: number): HRTFPair {
    if (this.entries.length === 0) {
      return {
        left: new Float32Array(HRTF_LENGTH),
        right: new Float32Array(HRTF_LENGTH),
      };
    }

    // Find 3 nearest entries by haversine angle
    const sorted = this.entries
      .map((e) => ({
        entry: e,
        dist: haversineAngle(azimuth, elevation, e.azimuth, e.elevation),
      }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 3);

    if (sorted[0].dist < 1) return { left: sorted[0].entry.left, right: sorted[0].entry.right };

    // Bilinear blend weighted by inverse distance
    const invDists = sorted.map((s) => 1 / (s.dist + 0.0001));
    const total = invDists.reduce((a, b) => a + b, 0);
    const weights = invDists.map((d) => d / total);

    const left = new Float32Array(HRTF_LENGTH);
    const right = new Float32Array(HRTF_LENGTH);

    for (let i = 0; i < 3; i++) {
      const w = weights[i];
      const e = sorted[i].entry;
      for (let j = 0; j < HRTF_LENGTH; j++) {
        left[j] += w * e.left[j];
        right[j] += w * e.right[j];
      }
    }

    return { left, right };
  }

  get isLoaded(): boolean {
    return this.entries.length > 0;
  }

  get entryCount(): number {
    return this.entries.length;
  }
}
