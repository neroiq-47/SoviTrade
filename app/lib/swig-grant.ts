/**
 * Swig session grant for Sovereign Mode.
 * Builds a versioned transaction the root wallet signs. The session secret is
 * generated here and must be sealed by the caller — it is not a root key.
 *
 * Program: swigypWHEksbC64pWKwah1WTeh9JXwx8H1rJHLdbQMB
 */
import {
  Actions,
  createEd25519AuthorityInfo,
  createEd25519SessionAuthorityInfo,
  findSwigPda,
  getAddAuthorityInstructions,
  getCreateSwigInstructionBuilder,
  Swig,
} from "@swig-wallet/classic";
import {
  Keypair,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { USDC_MINT } from "@/lib/config";
import { hoursToSlots } from "@/lib/swig-session";

export const SWIG_PROGRAM_ID = new PublicKey("swigypWHEksbC64pWKwah1WTeh9JXwx8H1rJHLdbQMB");

export interface SessionGrantRequest {
  userPublicKey: string;
  durationSlots: bigint;
  maxSpendUsdc: number;
  allowedPrograms: string[];
  allowedMints?: string[];
  recentBlockhash: string;
  currentSlot?: bigint;
  /** Stable 32-byte id. Public. Not a private key. */
  swigId?: Uint8Array;
  /** Raw Swig account bytes when the PDA already exists. */
  swigAccountData?: Uint8Array | null;
}

export interface SessionSummary {
  phase: "create-swig-and-session" | "add-session";
  sessionPublicKey: string;
  swigAddress: string;
  durationSlots: string;
  expirySlot: string;
  maxSpendUsdc: number;
  allowedPrograms: string[];
  instructionCount: number;
  transactionBytes: number;
}

export interface SessionGrantResult {
  sessionKeypair: Keypair;
  createSessionInstructions: TransactionInstruction[];
  transaction: VersionedTransaction;
  expirySlot: bigint;
  swigId: Uint8Array;
  summary: SessionSummary;
}

export function swigAddressFor(swigId: Uint8Array): string {
  return findSwigPda(swigId).toBase58();
}

function limitedActions(maxSpendUsdc: number, programs: string[]) {
  if (!(maxSpendUsdc > 0) || maxSpendUsdc > 1_000_000) {
    throw new Error("Session spend cap must be between 0 and 1,000,000 USDC");
  }
  const raw = BigInt(Math.round(maxSpendUsdc * 1_000_000));
  let builder = Actions.set().tokenLimit({ mint: new PublicKey(USDC_MINT), amount: raw });
  const seen = new Set<string>();
  for (const program of programs) {
    if (seen.has(program)) continue;
    seen.add(program);
    builder = builder.programLimit({ programId: new PublicKey(program) });
  }
  if (seen.size === 0) throw new Error("Session needs at least one allowed program");
  return builder.get();
}

/**
 * Generate a session key and the transaction the root wallet must sign.
 * New wallets: create the Swig (root = user, full control) and add a capped session authority.
 * Existing wallets: add another capped session authority. The root key is only a signer.
 */
export async function prepareSessionGrant(req: SessionGrantRequest): Promise<SessionGrantResult> {
  if (!req.recentBlockhash) throw new Error("Recent blockhash required");
  let user: PublicKey;
  try {
    user = new PublicKey(req.userPublicKey);
  } catch {
    throw new Error("Wallet public key is not a valid Solana address");
  }
  const zero = BigInt(0);
  const durationSlots = req.durationSlots > zero ? req.durationSlots : hoursToSlots(24);
  const currentSlot = req.currentSlot ?? zero;
  const expirySlot = currentSlot + durationSlots;
  const swigId = req.swigId?.length === 32 ? req.swigId : crypto.getRandomValues(new Uint8Array(32));
  const swigAddress = findSwigPda(swigId);
  const sessionKeypair = Keypair.generate();
  const actions = limitedActions(req.maxSpendUsdc, req.allowedPrograms);
  const sessionAuth = createEd25519SessionAuthorityInfo(user, durationSlots, sessionKeypair.publicKey as never);

  let instructions: TransactionInstruction[];
  let phase: SessionSummary["phase"];
  if (req.swigAccountData && req.swigAccountData.length > 0) {
    const swig = Swig.fromRawAccountData(swigAddress, req.swigAccountData);
    const root = swig.roles[0];
    if (!root) throw new Error("Swig account has no root role");
    instructions = await getAddAuthorityInstructions(swig, root.id, sessionAuth, actions, { payer: user });
    phase = "add-session";
  } else {
    const builder = getCreateSwigInstructionBuilder({
      payer: user,
      swigAddress,
      id: swigId,
      actions: Actions.set().all().get(),
      authorityInfo: createEd25519AuthorityInfo(user),
      options: { currentSlot },
    });
    builder.addAuthority(sessionAuth, actions);
    instructions = await builder.getInstructions();
    phase = "create-swig-and-session";
  }

  const transaction = new VersionedTransaction(
    new TransactionMessage({
      payerKey: user,
      recentBlockhash: req.recentBlockhash,
      instructions,
    }).compileToV0Message(),
  );

  return {
    sessionKeypair,
    createSessionInstructions: instructions,
    transaction,
    expirySlot,
    swigId,
    summary: {
      phase,
      sessionPublicKey: sessionKeypair.publicKey.toBase58(),
      swigAddress: swigAddress.toBase58(),
      durationSlots: durationSlots.toString(),
      expirySlot: expirySlot.toString(),
      maxSpendUsdc: req.maxSpendUsdc,
      allowedPrograms: [...new Set(req.allowedPrograms)],
      instructionCount: instructions.length,
      transactionBytes: transaction.serialize().length,
    },
  };
}
