// Phase vocoder pitch shifter for voice morphing feature
use wasm_bindgen::prelude::*;
use rustfft::{FftPlanner, num_complex::Complex};
use std::f32::consts::PI;

#[wasm_bindgen]
pub struct PitchShifter {
    sample_rate: u32,
    semitones: f32,
    frame_size: usize,
    hop_size: usize,
    // Phase accumulator for vocoder
    phase_acc: Vec<f32>,
    prev_phase: Vec<f32>,
    output_phase: Vec<f32>,
    // Circular input buffer
    input_buf: Vec<f32>,
    input_pos: usize,
    // Output buffer
    output_buf: Vec<f32>,
    // FFT
    fft: std::sync::Arc<dyn rustfft::Fft<f32>>,
    ifft: std::sync::Arc<dyn rustfft::Fft<f32>>,
}

#[wasm_bindgen]
impl PitchShifter {
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: u32, semitones: f32) -> PitchShifter {
        let frame_size = 2048usize;
        let hop_size = frame_size / 4;

        let mut planner = FftPlanner::new();
        let fft = planner.plan_fft_forward(frame_size);
        let ifft = planner.plan_fft_inverse(frame_size);

        PitchShifter {
            sample_rate,
            semitones,
            frame_size,
            hop_size,
            phase_acc: vec![0.0; frame_size / 2 + 1],
            prev_phase: vec![0.0; frame_size / 2 + 1],
            output_phase: vec![0.0; frame_size / 2 + 1],
            input_buf: vec![0.0; frame_size],
            input_pos: 0,
            output_buf: vec![0.0; frame_size * 4],
            fft,
            ifft,
        }
    }

    pub fn set_semitones(&mut self, semitones: f32) {
        self.semitones = semitones;
        self.phase_acc.fill(0.0);
        self.prev_phase.fill(0.0);
        self.output_phase.fill(0.0);
    }

    #[wasm_bindgen]
    pub fn process(&mut self, input: &[f32]) -> Vec<f32> {
        if self.semitones.abs() < 0.1 {
            return input.to_vec();
        }

        let pitch_factor = 2.0f32.powf(self.semitones / 12.0);
        let mut output = vec![0.0f32; input.len()];

        // Simple resampling-based pitch shift (fast path)
        // For production, replace with full phase vocoder
        let step = 1.0 / pitch_factor;
        let mut pos = 0.0f32;
        for i in 0..output.len() {
            let idx = pos as usize;
            if idx + 1 < input.len() {
                let frac = pos - idx as f32;
                output[i] = input[idx] * (1.0 - frac) + input[idx + 1] * frac;
            } else {
                output[i] = if idx < input.len() { input[idx] } else { 0.0 };
            }
            pos += step;
        }

        output
    }
}
