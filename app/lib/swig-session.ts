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
  "Create Ed25519 session authority with duration + USDC cap + program allow-list",
  "User signs the create-session transaction",
  "Keeper stores only the session public key and an encrypted key-material reference",
  "Root key never leaves the wallet. User can revoke the authority anytime",
] as const;

export function isSessionExpired(session: SessionAuthority, currentSlot: bigint): boolean {
  return currentSlot >= session.expirySlot;
}

/** Solana slots are ~400ms. 24h ≈ 216_000 slots. */
export function hoursToSlots(hours: number): bigint {
  if (!Number.isFinite(hours) || hours <= 0 || hours > 24 * 14) {
    throw new Error("Session duration must be between 0 and 14 days");
  }
  return BigInt(Math.round((hours * 3_600_000) / 400));
}

/** Programs a Sovereign swap is allowed to invoke at the top level. Inner AMMs are CPIs of Jupiter. */
export const SESSION_PROGRAMS = {
  jupiter: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
  token: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  token2022: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
  ata: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
  compute: "ComputeBudget111111111111111111111111111111",
  system: "11111111111111111111111111111111",
} as const;

/** Recommended defaults for beta bots. */
export const DEFAULT_SESSION = {
  durationHours: 24,
  maxSpendUsdc: 500,
  allowedPrograms: Object.values(SESSION_PROGRAMS),
};
