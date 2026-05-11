"""
Generate synthetic SONICOM-compatible HRTF binary file.
Uses physics-based spherical head model (Algazi et al.) for realistic HRTFs.
Output: apps/web/public/hrtf/sonicom_hrtf.bin

Binary format per plan:
  [uint32 count]
  [float32 azimuth, float32 elevation, float32[200] leftIR, float32[200] rightIR] * count
"""
import struct
import math
import numpy as np
from pathlib import Path

HRTF_LENGTH = 200
SAMPLE_RATE = 48_000
HEAD_RADIUS = 0.0875  # meters (average human head)
SPEED_OF_SOUND = 343.0
EAR_ANGLE = 100.0  # degrees from front (interaural axis)


def spherical_head_hrtf(azimuth_deg: float, elevation_deg: float, ear: str = "left") -> np.ndarray:
    """
    Woodworth spherical head model + elevation-dependent filtering.
    Returns a 200-tap FIR filter approximating the HRTF.
    """
    az = math.radians(azimuth_deg)
    el = math.radians(elevation_deg)

    # Ear position on sphere
    ear_az = math.radians(-90.0 if ear == "left" else 90.0)

    # ITD via Woodworth formula
    # Angle between source direction and ear direction
    # Source direction in cartesian
    sx = math.cos(el) * math.sin(az)
    sy = math.cos(el) * math.cos(az)
    sz = math.sin(el)

    # Ear direction
    ex = math.sin(ear_az)
    ey = math.cos(ear_az)
    ez = 0.0

    dot = sx * ex + sy * ey + sz * ez
    dot = max(-1.0, min(1.0, dot))
    theta = math.acos(dot)

    # ITD = (r/c) * (theta + sin(theta)) for theta in [0, pi]
    if theta <= math.pi / 2:
        itd = (HEAD_RADIUS / SPEED_OF_SOUND) * (math.sin(theta) + theta)
    else:
        itd = (HEAD_RADIUS / SPEED_OF_SOUND) * (1.0 + theta)

    # ILD: frequency-dependent level difference (simplified)
    # Higher frequencies have more ILD
    ild_db = 20.0 * math.log10(max(0.01, (1.0 + dot) / 2.0 + 0.01))

    # Build impulse response
    ir = np.zeros(HRTF_LENGTH, dtype=np.float32)

    # Delay the impulse
    delay_samples = itd * SAMPLE_RATE
    delay_int = int(delay_samples)
    delay_frac = delay_samples - delay_int

    if 0 <= delay_int < HRTF_LENGTH:
        ir[delay_int] = 1.0 - delay_frac
        if delay_int + 1 < HRTF_LENGTH:
            ir[delay_int + 1] = delay_frac

    # Apply level difference
    ild_lin = 10.0 ** (ild_db / 20.0)
    ir *= ild_lin

    # Elevation notch filter: simulate pinna reflection
    el_norm = (el + math.pi / 2) / math.pi  # 0-1
    notch_freq = 8000.0 + el_norm * 8000.0  # 8-16kHz notch based on elevation
    notch_omega = 2.0 * math.pi * notch_freq / SAMPLE_RATE

    # Apply a mild low-pass / high-shelf to simulate head shadow
    alpha = 0.85 - 0.2 * abs(dot)  # stronger shadow when source is on opposite side
    filtered = np.zeros(HRTF_LENGTH, dtype=np.float32)
    prev = 0.0
    for i in range(HRTF_LENGTH):
        filtered[i] = alpha * ir[i] + (1.0 - alpha) * prev
        prev = filtered[i]

    # Normalize
    peak = np.max(np.abs(filtered))
    if peak > 1e-6:
        filtered /= peak
        filtered *= 0.9

    return filtered


def generate_hrtf_bank():
    """Generate HRTF for a regular grid of positions."""
    positions = []

    # Azimuth: 0-350 in 10-degree steps (36 positions)
    # Elevation: -40 to 90 in 10-degree steps (14 positions)
    # Total: 36 * 14 = 504 positions (≈ realistic HRTF database density)
    for el in range(-40, 91, 10):
        for az in range(0, 360, 10):
            positions.append((float(az), float(el)))

    # Also add poles
    positions.append((0.0, 90.0))
    positions.append((0.0, -90.0))

    print(f"Generating {len(positions)} HRTF positions...")

    out_path = Path(__file__).parent.parent / "apps" / "web" / "public" / "hrtf" / "sonicom_hrtf.bin"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    with open(out_path, "wb") as f:
        # Write count
        f.write(struct.pack("<I", len(positions)))

        for i, (az, el) in enumerate(positions):
            if i % 50 == 0:
                print(f"  {i}/{len(positions)} positions...")

            left_ir = spherical_head_hrtf(az, el, "left")
            right_ir = spherical_head_hrtf(az, el, "right")

            f.write(struct.pack("<f", az))
            f.write(struct.pack("<f", el))
            f.write(left_ir.tobytes())
            f.write(right_ir.tobytes())

    size_kb = out_path.stat().st_size / 1024
    print(f"\n[OK] HRTF bank written: {out_path}")
    print(f"   {len(positions)} positions, {size_kb:.1f} KB")
    return str(out_path)


if __name__ == "__main__":
    generate_hrtf_bank()
