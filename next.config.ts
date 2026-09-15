import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Clerk serves collaborator avatars from its own CDN, so `next/image` has to
    // be told the host is allowed before it will optimise (rather than error on)
    // the URLs that `useOthers` hands the presence avatars.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
};

export default nextConfig;
