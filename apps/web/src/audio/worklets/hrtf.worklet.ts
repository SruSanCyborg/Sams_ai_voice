// AudioWorklet processor — applies UPOLS HRTF convolution to remote audio
// WASM UpolsConvolver is loaded lazily on first HRTF update
declare const WebAssembly: typeof import("@webassembly").WebAssembly;

interface UpolsConvolver {
  process_frame(input: Float32Array, outLeft: Float32Array, outRight: Float32Array): void;
  update_hrtf(left: Float32Array, right: Float32Array): void;
  free(): void;
}

class HRTFProcessor extends AudioWorkletProcessor {
  private convolver: UpolsConvolver | null = null;
  private outLeft = new Float32Array(480);
  private outRight = new Float32Array(480);
  private inputBuffer = new Float32Array(480);
  private inputPos = 0;
  private outputBufferL: Float32Array[] = [];
  private outputBufferR: Float32Array[] = [];
  private outputPos = 0;
  private outputLen = 0;

  constructor() {
    super();
    this.port.onmessage = (e) => {
      if (e.data.type === "hrtf") {
        // Receive new HRTF pair from main thread
        if (this.convolver) {
          this.convolver.update_hrtf(
            new Float32Array(e.data.left),
            new Float32Array(e.data.right)
          );
        }
      } else if (e.data.type === "init_wasm") {
        // WASM module instance passed from main thread
        this.convolver = e.data.convolver as UpolsConvolver;
      }
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const input = inputs[0]?.[0];
    const outL = outputs[0]?.[0];
    const outR = outputs[0]?.[1];
    if (!input || !outL || !outR) return true;

    if (!this.convolver) {
      // Pass through until WASM is ready
      outL.set(input);
      outR.set(input);
      return true;
    }

    // Accumulate 128-sample quanta into 480-sample frames, then convolve
    for (let i = 0; i < input.length; i++) {
      this.inputBuffer[this.inputPos++] = input[i];

      if (this.inputPos >= 480) {
        this.convolver.process_frame(this.inputBuffer, this.outLeft, this.outRight);
        this.outputBufferL.push(this.outLeft.slice());
        this.outputBufferR.push(this.outRight.slice());
        this.outLeft = new Float32Array(480);
        this.outRight = new Float32Array(480);
        this.inputBuffer = new Float32Array(480);
        this.inputPos = 0;
      }
    }

    // Drain output buffers into 128-sample quanta
    if (this.outputBufferL.length > 0) {
      const srcL = this.outputBufferL[0];
      const srcR = this.outputBufferR[0];
      const take = Math.min(outL.length, srcL.length - this.outputPos);
      outL.set(srcL.subarray(this.outputPos, this.outputPos + take));
      outR.set(srcR.subarray(this.outputPos, this.outputPos + take));
      this.outputPos += take;
      if (this.outputPos >= srcL.length) {
        this.outputBufferL.shift();
        this.outputBufferR.shift();
        this.outputPos = 0;
      }
    }

    return true;
  }
}

registerProcessor("hrtf-processor", HRTFProcessor);
