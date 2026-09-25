/** @type {import('next').NextConfig} */
const nextConfig = {
  // Everything runs client-side, so the whole site is pre-rendered to
  // static files. That keeps hosting to a plain file server or CDN,
  // keeps the zero-external-request profile the page already had, and
  // removes any server runtime from the deployment surface.
  output: "export",
  // Emits /zh/index.html rather than /zh.html, matching the canonical
  // URLs declared in metadata and the sitemap.
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
