/**
 * Cloudflare cron entry. Dry-run unless KEEPER_DRY_RUN=false.
 * Session secrets come only from the SESSION_KEY_MATERIAL secret (pubkey → base64).
 * They are never logged. With no secret, live mode refuses to send.
 */
import { keeperTick, type BotConfig } from "../../../app/lib/server/keeper";

export interface Env {
  KEEPER_DRY_RUN?: string;
  BOTS_JSON?: string;
  SOLANA_RPC_URL?: string;
  SESSION_KEY_MATERIAL?: string;
  JUPITER_API_URL?: string;
  JUPITER_SWAP_URL?: string;
  JUPITER_API_KEY?: string;
}

type WaitCtx = { waitUntil(promise: Promise<unknown>): void };

function parseBots(raw: string | undefined): BotConfig[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed as BotConfig[] : [];
  } catch {
    console.info(JSON.stringify({ keeper: "bots-json-invalid" }));
    return [];
  }
}

function parseSecrets(raw: string | undefined): Map<string, Uint8Array> {
  const out = new Map<string, Uint8Array>();
  if (!raw) return out;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    for (const [pub, b64] of Object.entries(parsed)) {
      if (typeof b64 !== "string" || !b64) continue;
      out.set(pub, Uint8Array.from(Buffer.from(b64, "base64")));
    }
  } catch {
    console.info(JSON.stringify({ keeper: "session-material-invalid" }));
  }
  return out;
}

async function run(env: Env) {
  const dryRun = env.KEEPER_DRY_RUN !== "false";
  const now = Date.now();
  const secrets = parseSecrets(env.SESSION_KEY_MATERIAL);
  const bots = parseBots(env.BOTS_JSON).filter((bot) => bot.nextTickAt == null || bot.nextTickAt <= now);
  const results = await keeperTick(bots, {
    dryRun,
    now,
    rpcUrl: env.SOLANA_RPC_URL,
    sessionSecretFor: (pub) => secrets.get(pub),
  });
  for (const secret of secrets.values()) secret.fill(0);
  console.info(JSON.stringify({ keeper: "cron", dryRun, bots: bots.length, actions: results.map((row) => row.action) }));
  return { ok: true, dryRun, results };
}

export default {
  async scheduled(_event: unknown, env: Env, ctx: WaitCtx) {
    ctx.waitUntil(run(env));
  },
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === "POST" && url.pathname === "/tick") {
      const body = await run(env);
      return Response.json(body);
    }
    return new Response("SoviTrade keeper. POST /tick or wait for the cron. Dry-run is the default. No session secrets are logged.");
  },
};
