// Capture AudioWorklet processor — accumulates 128-sample quanta into 480-sample frames
class CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(480);
    this.writePos = 0;
    this.prevSample = 0;
    this.muted = false;
    this.port.onmessage = (e) => {
      if (e.data.type === 'mute') this.muted = true;
      if (e.data.type === 'resume') this.muted = false;
    };
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;

    for (let i = 0; i < input.length; i++) {
      const raw = this.muted ? 0 : input[i];
      // Pre-emphasis filter
      const sample = raw - 0.97 * this.prevSample;
      this.prevSample = raw;
      this.buffer[this.writePos++] = sample;

      if (this.writePos >= 480) {
        const frame = this.buffer.slice();
        this.port.postMessage({ type: 'frame', data: frame }, [frame.buffer]);
        this.buffer = new Float32Array(480);
        this.writePos = 0;
      }
    }
    return true;
  }
}

registerProcessor('capture-processor', CaptureProcessor);
