// Uniformly Partitioned Overlap-Save (UPOLS) convolver
// Enables low-latency partitioned convolution for HRTF rendering
use wasm_bindgen::prelude::*;
use rustfft::{FftPlanner, num_complex::Complex};

#[wasm_bindgen]
pub struct UpolsConvolver {
    partition_size: usize,
    fft_size: usize,      // 2 * partition_size
    num_partitions: usize,
    // Frequency-domain HRTF partitions
    hrtf_left_fdl: Vec<Vec<Complex<f32>>>,
    hrtf_right_fdl: Vec<Vec<Complex<f32>>>,
    // Frequency-domain delay line (input history)
    input_fdl: Vec<Vec<Complex<f32>>>,
    fdl_ptr: usize,
    // Overlap-save buffers
    overlap_left: Vec<f32>,
    overlap_right: Vec<f32>,
    // FFT state
    fft: std::sync::Arc<dyn rustfft::Fft<f32>>,
    ifft: std::sync::Arc<dyn rustfft::Fft<f32>>,
    scratch: Vec<Complex<f32>>,
}

#[wasm_bindgen]
impl UpolsConvolver {
    #[wasm_bindgen(constructor)]
    pub fn new(
        hrtf_left: &[f32],
        hrtf_right: &[f32],
        partition_size: usize,
    ) -> UpolsConvolver {
        let fft_size = partition_size * 2;
        let num_partitions = (hrtf_left.len() + partition_size - 1) / partition_size;

        let mut planner = FftPlanner::new();
        let fft = planner.plan_fft_forward(fft_size);
        let ifft = planner.plan_fft_inverse(fft_size);
        let scratch_len = fft.get_inplace_scratch_len().max(ifft.get_inplace_scratch_len());

        let mut conv = UpolsConvolver {
            partition_size,
            fft_size,
            num_partitions,
            hrtf_left_fdl: vec![vec![Complex::default(); fft_size]; num_partitions],
            hrtf_right_fdl: vec![vec![Complex::default(); fft_size]; num_partitions],
            input_fdl: vec![vec![Complex::default(); fft_size]; num_partitions],
            fdl_ptr: 0,
            overlap_left: vec![0.0; partition_size],
            overlap_right: vec![0.0; partition_size],
            fft,
            ifft,
            scratch: vec![Complex::default(); scratch_len],
        };

        conv.compute_hrtf_fdl(hrtf_left, hrtf_right);
        conv
    }

    fn compute_hrtf_fdl(&mut self, left: &[f32], right: &[f32]) {
        for p in 0..self.num_partitions {
            let start = p * self.partition_size;
            let end = (start + self.partition_size).min(left.len());

            let mut buf_l = vec![Complex::default(); self.fft_size];
            let mut buf_r = vec![Complex::default(); self.fft_size];

            for (i, (&l, &r)) in left[start..end].iter().zip(&right[start..end]).enumerate() {
                buf_l[i] = Complex::new(l, 0.0);
                buf_r[i] = Complex::new(r, 0.0);
            }

            self.fft.process_with_scratch(&mut buf_l, &mut self.scratch.clone());
            self.fft.process_with_scratch(&mut buf_r, &mut self.scratch.clone());

            self.hrtf_left_fdl[p] = buf_l;
            self.hrtf_right_fdl[p] = buf_r;
        }
    }

    #[wasm_bindgen]
    pub fn update_hrtf(&mut self, hrtf_left: &[f32], hrtf_right: &[f32]) {
        self.compute_hrtf_fdl(hrtf_left, hrtf_right);
        // Reset overlap buffers on HRTF change for click suppression
        self.overlap_left.fill(0.0);
        self.overlap_right.fill(0.0);
    }

    #[wasm_bindgen]
    pub fn process_frame(
        &mut self,
        input: &[f32],
        out_left: &mut [f32],
        out_right: &mut [f32],
    ) {
        let n = self.partition_size;
        let fft_size = self.fft_size;

        // Build FFT input: zero-pad [overlap | input]
        let mut x_freq = vec![Complex::default(); fft_size];
        // Overlap region comes from previous frame's last `n` samples — already in input_fdl indirectly
        for (i, &s) in input.iter().take(n).enumerate() {
            x_freq[n + i] = Complex::new(s, 0.0);
        }

        self.fft.process_with_scratch(&mut x_freq, &mut self.scratch.clone());

        // Store in FDL
        self.input_fdl[self.fdl_ptr] = x_freq;

        // Multiply-accumulate all partitions
        let mut y_left = vec![Complex::default(); fft_size];
        let mut y_right = vec![Complex::default(); fft_size];

        for p in 0..self.num_partitions {
            let fdl_idx = (self.fdl_ptr + self.num_partitions - p) % self.num_partitions;
            let x = &self.input_fdl[fdl_idx];
            let hl = &self.hrtf_left_fdl[p];
            let hr = &self.hrtf_right_fdl[p];
            for k in 0..fft_size {
                y_left[k] += x[k] * hl[k];
                y_right[k] += x[k] * hr[k];
            }
        }

        self.fdl_ptr = (self.fdl_ptr + 1) % self.num_partitions;

        // IFFT
        self.ifft.process_with_scratch(&mut y_left, &mut self.scratch.clone());
        self.ifft.process_with_scratch(&mut y_right, &mut self.scratch.clone());

        let scale = 1.0 / fft_size as f32;

        // Take second half (OLS: discard first half alias)
        for i in 0..n {
            out_left[i] = y_left[n + i].re * scale;
            out_right[i] = y_right[n + i].re * scale;
        }
    }
}
