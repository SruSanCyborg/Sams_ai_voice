// AudioWorklet processor — accumulates 128-sample quanta into 480-sample frames
// Applies pre-emphasis filter and posts frames to main thread
class CaptureProcessor extends AudioWorkletProcessor {
  private buffer: Float32Array;
  private writePos = 0;
  private prevSample = 0;
  private readonly FRAME_SIZE = 480;
  private readonly PRE_EMPHASIS = 0.97;

  constructor() {
    super();
    this.buffer = new Float32Array(this.FRAME_SIZE);
  }

  process(inputs: Float32Array[][]): boolean {
    const input = inputs[0]?.[0];
    if (!input) return true;

    for (let i = 0; i < input.length; i++) {
      const sample = input[i] - this.PRE_EMPHASIS * this.prevSample;
      this.prevSample = input[i];
      this.buffer[this.writePos++] = sample;

      if (this.writePos >= this.FRAME_SIZE) {
        // Transfer ownership for zero-copy
        const frame = this.buffer.slice();
        this.port.postMessage({ type: "frame", data: frame }, [frame.buffer]);
        this.buffer = new Float32Array(this.FRAME_SIZE);
        this.writePos = 0;
      }
    }

    return true;
  }
}

registerProcessor("capture-processor", CaptureProcessor);
