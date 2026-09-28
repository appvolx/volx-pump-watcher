/**
 * volx-pump-watcher — local Pump.fun program activity poller.
 * VOLX ecosystem tool (https://volx.app). Client-side only. Public RPC.
 */

const PUMP_PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const DEFAULT_RPC = "https://api.mainnet-beta.solana.com";
const USER_AGENT = "volx-pump-watcher/1.0 (+https://volx.app)";

type SigInfo = {
  signature: string;
  slot: number;
  err: unknown;
  blockTime: number | null;
};

async function rpc<T>(url: string, method: string, params: unknown[]): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from RPC`);
  }
  const body = (await res.json()) as {
    result?: T;
    error?: { message: string };
  };
  if (body.error) {
    throw new Error(body.error.message);
  }
  return body.result as T;
}

async function getSignatures(
  rpcUrl: string,
  limit: number,
  before?: string,
): Promise<SigInfo[]> {
  const params: unknown[] = [
    PUMP_PROGRAM_ID,
    {
      limit,
      ...(before ? { before } : {}),
    },
  ];
  return rpc<SigInfo[]>(rpcUrl, "getSignaturesForAddress", params);
}

function parseArgs(argv: string[]) {
  const opts = {
    rpc: DEFAULT_RPC,
    interval: 15,
    limit: 15,
    json: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--rpc" && argv[i + 1]) opts.rpc = argv[++i];
    else if (a === "--interval" && argv[i + 1]) opts.interval = Number(argv[++i]);
    else if (a === "--limit" && argv[i + 1]) opts.limit = Number(argv[++i]);
    else if (a === "--json") opts.json = true;
    else if (a === "--help" || a === "-h") {
      console.log(`volx-pump-watcher — VOLX (volx.app)

Usage:
  npx tsx src/watch.ts [--rpc URL] [--interval SEC] [--limit N] [--json]

Official Pump program: ${PUMP_PROGRAM_ID}
`);
      process.exit(0);
    }
  }
  return opts;
}

function formatSig(s: SigInfo, asJson: boolean): string {
  if (asJson) {
    return JSON.stringify({
      signature: s.signature,
      slot: s.slot,
      blockTime: s.blockTime,
      err: s.err,
      program: PUMP_PROGRAM_ID,
      explorer: `https://solscan.io/tx/${s.signature}`,
    });
  }
  const t = s.blockTime
    ? new Date(s.blockTime * 1000).toISOString()
    : "unknown-time";
  const status = s.err ? "ERR" : "OK";
  return `[${t}] slot=${s.slot} ${status} ${s.signature}`;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const seen = new Set<string>();

  console.error(
    `volx-pump-watcher starting — program ${PUMP_PROGRAM_ID}\nRPC: ${opts.rpc}\nPoll every ${opts.interval}s\n`,
  );

  // Initial backfill
  try {
    const initial = await getSignatures(opts.rpc, opts.limit);
    for (const s of initial.reverse()) {
      if (seen.has(s.signature)) continue;
      seen.add(s.signature);
      console.log(formatSig(s, opts.json));
    }
  } catch (e) {
    console.error("Initial fetch failed:", e);
  }

  setInterval(async () => {
    try {
      const batch = await getSignatures(opts.rpc, opts.limit);
      for (const s of batch.reverse()) {
        if (seen.has(s.signature)) continue;
        seen.add(s.signature);
        console.log(formatSig(s, opts.json));
      }
      // Bound memory
      if (seen.size > 5000) {
        const arr = [...seen];
        for (const old of arr.slice(0, arr.length - 2000)) seen.delete(old);
      }
    } catch (e) {
      console.error("Poll error:", e);
    }
  }, opts.interval * 1000);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
