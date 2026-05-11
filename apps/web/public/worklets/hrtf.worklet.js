// HRTF AudioWorklet processor — pure JS OLS convolver (WASM fallback)
class HRTFProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.hrtfLeft = null;
    this.hrtfRight = null;
    this.overlapLeft = null;
    this.overlapRight = null;
    this.inputBuf = new Float32Array(480);
    this.inputPos = 0;
    this.outQueueL = [];
    this.outQueueR = [];
    this.outPos = 0;

    this.port.onmessage = (e) => {
      if (e.data.type === 'hrtf') {
        this.hrtfLeft = new Float32Array(e.data.left);
        this.hrtfRight = new Float32Array(e.data.right);
        const len = this.hrtfLeft.length;
        this.overlapLeft = new Float32Array(len);
        this.overlapRight = new Float32Array(len);
      }
    };
  }

  // Simple time-domain convolution (480 × 200 = 96k muls per frame — fast enough for demo)
  convolve(input, hrtf, overlap) {
    const n = input.length;
    const h = hrtf.length;
    const out = new Float32Array(n + h - 1);

    // Add overlap from previous frame
    for (let i = 0; i < overlap.length && i < out.length; i++) {
      out[i] += overlap[i];
    }

    // Convolve
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < h; j++) {
        out[i + j] += input[i] * hrtf[j];
      }
    }

    // Save overlap for next frame
    overlap.fill(0);
    for (let i = n; i < out.length; i++) {
      overlap[i - n] += out[i];
    }

    return out.subarray(0, n);
  }

  process(inputs, outputs) {
    const input = inputs[0]?.[0];
    const outL = outputs[0]?.[0];
    const outR = outputs[0]?.[1];
    if (!outL || !outR) return true;

    if (!this.hrtfLeft || !input) {
      // Pass through as mono if no HRTF yet
      if (input) { outL.set(input); outR.set(input); }
      return true;
    }

    // Accumulate into 480-sample frames
    for (let i = 0; i < input.length; i++) {
      this.inputBuf[this.inputPos++] = input[i];
      if (this.inputPos >= 480) {
        const l = this.convolve(this.inputBuf, this.hrtfLeft, this.overlapLeft);
        const r = this.convolve(this.inputBuf, this.hrtfRight, this.overlapRight);
        this.outQueueL.push(l.slice());
        this.outQueueR.push(r.slice());
        this.inputBuf = new Float32Array(480);
        this.inputPos = 0;
      }
    }

    // Drain output queues
    if (this.outQueueL.length > 0) {
      const srcL = this.outQueueL[0];
      const srcR = this.outQueueR[0];
      const take = Math.min(outL.length, srcL.length - this.outPos);
      outL.set(srcL.subarray(this.outPos, this.outPos + take));
      outR.set(srcR.subarray(this.outPos, this.outPos + take));
      this.outPos += take;
      if (this.outPos >= srcL.length) {
        this.outQueueL.shift();
        this.outQueueR.shift();
        this.outPos = 0;
      }
    }

    return true;
  }
}

registerProcessor('hrtf-processor', HRTFProcessor);
