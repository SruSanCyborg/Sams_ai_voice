// First-Order Ambisonics (FOA) B-format encoder
// Encodes a mono source at (azimuth, elevation) into W, X, Y, Z channels
use wasm_bindgen::prelude::*;
use std::f32::consts::PI;

#[wasm_bindgen]
pub struct FoaEncoder {
    azimuth: f32,   // radians
    elevation: f32, // radians
}

#[wasm_bindgen]
impl FoaEncoder {
    #[wasm_bindgen(constructor)]
    pub fn new(azimuth_deg: f32, elevation_deg: f32) -> FoaEncoder {
        FoaEncoder {
            azimuth: azimuth_deg * PI / 180.0,
            elevation: elevation_deg * PI / 180.0,
        }
    }

    pub fn set_position(&mut self, azimuth_deg: f32, elevation_deg: f32) {
        self.azimuth = azimuth_deg * PI / 180.0;
        self.elevation = elevation_deg * PI / 180.0;
    }

    /// Encode mono input into FOA B-format (4 channels: W, X, Y, Z)
    /// Output is interleaved: [W0, X0, Y0, Z0, W1, X1, Y1, Z1, ...]
    #[wasm_bindgen]
    pub fn encode(&self, input: &[f32]) -> Vec<f32> {
        let n = input.len();
        let mut output = vec![0.0f32; n * 4];

        let cos_el = self.elevation.cos();
        let sin_el = self.elevation.sin();
        let cos_az = self.azimuth.cos();
        let sin_az = self.azimuth.sin();

        // B-format coefficients
        let w_gain = std::f32::consts::FRAC_1_SQRT_2;
        let x_gain = cos_el * cos_az;
        let y_gain = cos_el * sin_az;
        let z_gain = sin_el;

        for i in 0..n {
            let s = input[i];
            output[i * 4] = s * w_gain;     // W: omnidirectional
            output[i * 4 + 1] = s * x_gain; // X: front-back
            output[i * 4 + 2] = s * y_gain; // Y: left-right
            output[i * 4 + 3] = s * z_gain; // Z: up-down
        }

        output
    }
}
