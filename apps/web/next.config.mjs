/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for SharedArrayBuffer (AudioWorklet ↔ Web Worker)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
  webpack(config) {
    // Enable async WebAssembly for WASM modules
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};

export default nextConfig;
