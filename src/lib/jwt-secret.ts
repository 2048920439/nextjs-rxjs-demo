/**
 * Shared JWT secret accessor.
 * Used by both Edge Runtime (proxy.ts) and Node.js Runtime (auth.ts).
 */
export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return new TextEncoder().encode(secret);
}
