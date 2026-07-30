/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fully static export -> generates an `out/` folder of plain HTML/CSS/JS.
  // The whole app runs client-side, so no Node server is needed to render it;
  // a tiny static file server (server.js) serves `out/` on hosts like Campos Cloud.
  output: "export",
  images: { unoptimized: true },
  // The AI background-removal lib bundles onnxruntime-web, whose huge prebuilt
  // file the SWC minifier can't parse. Disable SWC minify so the build passes.
  swcMinify: false,
  // FFmpeg.wasm core is loaded (single-threaded) from a CDN at runtime.
};

export default nextConfig;
