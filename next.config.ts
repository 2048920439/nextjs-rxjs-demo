import type { NextConfig } from "next";

const rxjsDebugEnabled = process.env.NODE_ENV === "production" ? "false" : "true";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_RXJS_DEBUG: rxjsDebugEnabled,
  },
};

export default nextConfig;
