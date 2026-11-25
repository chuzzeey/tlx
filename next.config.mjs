/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : null;

const nextConfig = {
  // output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [100],
    remotePatterns: [
      { protocol: "https", hostname: "api.slingacademy.com" },
      { protocol: "https", hostname: "kwwhzyzuzvewxbvoaatc.supabase.co" },
      ...(supabaseHostname ? [{ protocol: "https", hostname: supabaseHostname }] : []),
    ],
  },
};

export default nextConfig;
