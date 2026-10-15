/**
 * Swig smart wallet session keys (2026).
 * Docs: https://build.onswig.com · Program: swigypWHEksbC64pWKwah1WTeh9JXwx8H1rJHLdbQMB
 * Used for Sovereign Mode: time-limited, capped, program-allow-listed authority.
 */

export type SessionAuthority = {
  parentPublicKey: string;
  sessionPublicKey: string;
  expirySlot: bigint;
  maxDurationSlots: bigint;
  roleId: number;
  caps: {
    maxSpendUsdc?: number;
    allowedPrograms: string[];
    allowedMints?: string[];
  };
};

/** Outline of the grant flow (client + keeper). */
export const SWIG_GRANT_FLOW = [
  "User connects Wallet Standard wallet",
  "Create or load Swig PDA",
  "Create Ed25519 (or secp256k1) session authority with duration + caps",
  "User signs the create-session transaction",
  "Keeper stores only the session keypair encrypted; root key never leaves user",
  "Keeper executes only within role policies; user can revoke anytime",
] as const;

export function isSessionExpired(session: SessionAuthority, currentSlot: bigint): boolean {
  return currentSlot >= session.expirySlot;
}

/** Recommended defaults for beta bots */
export const DEFAULT_SESSION = {
  durationHours: 24,
  maxSpendUsdc: 500,
  allowedPrograms: [
    "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", // Jupiter
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  ],
};
