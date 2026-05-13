/** @type {import('next').NextConfig} */
const nextConfig = {
  // livekit-server-sdk uses Node.js crypto — keep it server-side only
  serverExternalPackages: ["livekit-server-sdk"],

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
