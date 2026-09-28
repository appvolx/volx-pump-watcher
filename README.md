# volx-pump-watcher

**VOLX Ecosystem Tool** — Local Pump.fun launch activity watcher.

Part of the [VOLX](https://volx.app) tooling suite.  
GitHub org: [https://github.com/appvolx](https://github.com/appvolx)

## What it does

`volx-pump-watcher` is a **client-side Node.js utility** that polls a public Solana RPC for recent transactions involving the official Pump.fun program and prints newly observed create / trade activity.

It is intentionally simple:

- Uses only public RPC methods (`getSignaturesForAddress`, `getTransaction`)
- Never holds private keys
- Never submits transactions
- Configurable poll interval and look-back window

Official Pump program ID (mainnet):

```
6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
```

(Source: Pump.fun public docs / VOLX `src/lib/pump/constants.ts`)

## Why it exists

VOLX’s launchpad surface is built around Pump.fun. Developers and operators often want a lightweight terminal feed of new coin creates without running a full indexer or exposing credentials. This tool provides that local feed.

## Features

- TypeScript source, runs with `tsx` or after `tsc`
- Zero or minimal dependencies (`@solana/web3.js` optional; pure `fetch` path available)
- Human-readable and JSON lines output
- Graceful handling of rate-limited public RPCs
- Dry-run friendly (read-only)

## Requirements

- Node.js ≥ 18
- Network access to a Solana RPC

## Installation

```bash
cd volx-pump-watcher
npm install
# development
npx tsx src/watch.ts
# or build
npm run build && node dist/watch.js
```

## Quick start

```bash
# Default public RPC, poll every 15 s
npx tsx src/watch.ts

# Custom RPC + faster poll
npx tsx src/watch.ts --rpc https://api.mainnet-beta.solana.com --interval 10

# JSON lines
npx tsx src/watch.ts --json

# Limit how many past signatures to scan on start
npx tsx src/watch.ts --limit 20
```

## Security model

- Read-only
- No wallet connection
- No environment secrets required (RPC URL may be passed on CLI)
- Safe for public GitHub

## Integration with VOLX

Complements the VOLX launch explore / trades API routes and the on-chain Pump SDK usage in `src/lib/pump/`.  
For production indexing VOLX uses workers with `DRY_RUN=1` by default; this tool is the lightweight local counterpart.

## License

MIT — complementary tooling for the VOLX project (https://volx.app).
