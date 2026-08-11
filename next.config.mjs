/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  output: "standalone",
  swcMinify: false,
};

export default nextConfig;
