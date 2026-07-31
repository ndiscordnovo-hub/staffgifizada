/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // NOTE: static export was removed to enable the server-side logging backend
  // (app/api/log). Vercel now builds this as a full app (SSG pages + serverless
  // functions). The Discord webhook URLs live in server env vars, never shipped
  // to the browser.
  images: { unoptimized: true },
  // The AI background-removal lib bundles onnxruntime-web, whose huge prebuilt
  // file the SWC minifier can't parse. Disable SWC minify so the build passes.
  swcMinify: false,
  // FFmpeg.wasm core is loaded (single-threaded) from a CDN at runtime.
};

export default nextConfig;
