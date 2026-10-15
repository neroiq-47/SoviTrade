/**
 * Swig session grant flow for Sovereign Mode (2026).
 * Uses @swig-wallet/classic or kit patterns.
 * Program: swigypWHEksbC64pWKwah1WTeh9JXwx8H1rJHLdbQMB
 */
import { Keypair, PublicKey } from "@solana/web3.js";

export interface SessionGrantRequest {
  userPublicKey: string;
  durationSlots: bigint;
  maxSpendUsdc: number;
  allowedPrograms: string[];
  allowedMints?: string[];
}

export interface SessionGrantResult {
  sessionKeypair: Keypair; // generated client-side, only public key goes on-chain
  createSessionInstructions: unknown[]; // from getCreateSessionInstructions
  expirySlot: bigint;
}

/**
 * Generate session keypair and prepare create-session instructions.
 * User must sign the resulting transaction with their root authority.
 */
export async function prepareSessionGrant(req: SessionGrantRequest): Promise<SessionGrantResult> {
  const sessionKeypair = Keypair.generate();
  // Placeholder: real call would use
  // getCreateSessionInstructions(swig, rootRoleId, sessionKeypair.publicKey, req.durationSlots, { payer })
  const expirySlot = 0n; // filled after currentSlot + duration
  return {
    sessionKeypair,
    createSessionInstructions: [],
    expirySlot,
  };
}

export const SWIG_PROGRAM_ID = new PublicKey("swigypWHEksbC64pWKwah1WTeh9JXwx8H1rJHLdbQMB");
