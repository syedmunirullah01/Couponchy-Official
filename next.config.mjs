import dns from "dns";

try {
  dns.setDefaultResultOrder("ipv4first");
  if (process.env.NODE_ENV === "development") {
    dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
    console.log("Configured DNS servers in next.config.mjs:", dns.getServers());
  }
} catch (e) {
  console.error("Failed to configure DNS in next.config.mjs:", e);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/:country(us|gb|ca|au|in|ae|pt|de|it|fr|pl|es|nl|be|se|jp|ch)/:path*",
        destination: "/:path*",
      },
      {
        source: "/:country(us|gb|ca|au|in|ae|pt|de|it|fr|pl|es|nl|be|se|jp|ch)",
        destination: "/",
      },
    ];
  },
};

export default nextConfig;
