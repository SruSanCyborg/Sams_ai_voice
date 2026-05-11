"""
Generate synthetic room impulse responses for acoustic presets.
Uses exponential decay + early reflections model.
Output: apps/web/public/ir/*.wav (16-bit mono, 48kHz)
"""
import struct
import math
import numpy as np
from pathlib import Path

SAMPLE_RATE = 48_000
IR_DURATION_S = 2.0   # 2 seconds max
IR_SAMPLES = int(SAMPLE_RATE * IR_DURATION_S)


def write_wav(path: Path, samples: np.ndarray, sample_rate: int = 48_000):
    """Write a 16-bit mono WAV file."""
    samples_int = (samples * 32767).astype(np.int16)
    n_samples = len(samples_int)
    data_size = n_samples * 2

    with open(path, "wb") as f:
        # WAV header
        f.write(b"RIFF")
        f.write(struct.pack("<I", 36 + data_size))  # file size - 8
        f.write(b"WAVE")
        f.write(b"fmt ")
        f.write(struct.pack("<I", 16))       # chunk size
        f.write(struct.pack("<H", 1))        # PCM
        f.write(struct.pack("<H", 1))        # mono
        f.write(struct.pack("<I", sample_rate))
        f.write(struct.pack("<I", sample_rate * 2))  # byte rate
        f.write(struct.pack("<H", 2))        # block align
        f.write(struct.pack("<H", 16))       # bits per sample
        f.write(b"data")
        f.write(struct.pack("<I", data_size))
        f.write(samples_int.tobytes())


def generate_room_ir(
    rt60: float,           # reverberation time (seconds)
    pre_delay_ms: float,   # pre-delay before first reflection (ms)
    early_count: int,      # number of early reflections
    diffuse_start_ms: float,  # when diffuse tail starts (ms)
    high_freq_decay: float,  # additional HF decay factor
    name: str,
) -> np.ndarray:
    """
    Generate a realistic-sounding impulse response:
    [direct] + [early reflections] + [diffuse tail]
    """
    ir = np.zeros(IR_SAMPLES, dtype=np.float64)

    # Direct sound (sample 0)
    ir[0] = 1.0

    # Early reflections
    pre_delay_samples = int(pre_delay_ms * SAMPLE_RATE / 1000)
    rng = np.random.default_rng(hash(name) % (2**32))

    for i in range(early_count):
        delay = pre_delay_samples + int(rng.uniform(0, diffuse_start_ms * SAMPLE_RATE / 1000))
        gain = rng.uniform(0.3, 0.8) * (0.7 ** i)
        polarity = rng.choice([-1, 1])
        if delay < IR_SAMPLES:
            ir[delay] += polarity * gain

    # Diffuse exponential tail
    diffuse_start = int(diffuse_start_ms * SAMPLE_RATE / 1000)
    decay_rate = math.log(1e-6) / (rt60 * SAMPLE_RATE)  # -60dB in rt60 seconds

    noise = rng.standard_normal(IR_SAMPLES)
    t = np.arange(IR_SAMPLES)
    envelope = np.exp(decay_rate * np.maximum(t - diffuse_start, 0))
    envelope[:diffuse_start] = 0.0

    ir += envelope * noise * 0.15

    # High-frequency rolloff (simulates air absorption + surface absorption)
    alpha = 1.0 - high_freq_decay
    filtered = np.zeros_like(ir)
    prev = 0.0
    for i in range(len(ir)):
        filtered[i] = alpha * ir[i] + (1.0 - alpha) * prev
        prev = filtered[i]
    ir = filtered

    # Fade out last 10%
    fade_len = IR_SAMPLES // 10
    fade = np.linspace(1.0, 0.0, fade_len)
    ir[-fade_len:] *= fade

    # Normalize
    peak = np.max(np.abs(ir))
    if peak > 1e-9:
        ir /= peak
        ir *= 0.9

    return ir.astype(np.float32)


ROOM_PRESETS = {
    "studio": dict(
        rt60=0.25,
        pre_delay_ms=1.0,
        early_count=8,
        diffuse_start_ms=15.0,
        high_freq_decay=0.05,
    ),
    "concert_hall": dict(
        rt60=2.2,
        pre_delay_ms=25.0,
        early_count=20,
        diffuse_start_ms=80.0,
        high_freq_decay=0.12,
    ),
    "cave": dict(
        rt60=3.5,
        pre_delay_ms=40.0,
        early_count=30,
        diffuse_start_ms=120.0,
        high_freq_decay=0.08,
    ),
    "outdoor": dict(
        rt60=0.4,
        pre_delay_ms=2.0,
        early_count=4,
        diffuse_start_ms=20.0,
        high_freq_decay=0.18,
    ),
    "bathroom": dict(
        rt60=0.6,
        pre_delay_ms=5.0,
        early_count=12,
        diffuse_start_ms=25.0,
        high_freq_decay=0.03,
    ),
}


def main():
    ir_dir = Path(__file__).parent.parent / "apps" / "web" / "public" / "ir"
    ir_dir.mkdir(parents=True, exist_ok=True)

    for name, params in ROOM_PRESETS.items():
        ir = generate_room_ir(name=name, **params)
        path = ir_dir / f"{name}.wav"
        write_wav(path, ir)
        size_kb = path.stat().st_size / 1024
        print(f"[OK] {name}.wav  ({params['rt60']}s RT60, {size_kb:.1f} KB)")

    print(f"\nAll room IRs written to: {ir_dir}")


if __name__ == "__main__":
    main()
