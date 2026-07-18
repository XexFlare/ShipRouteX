# Installation

## Prerequisites

| Requirement                   | Version              | Why                                                                   |
| ----------------------------- | -------------------- | --------------------------------------------------------------------- |
| [Node.js](https://nodejs.org) | 22 or later          | Runtime for the API and every package. See [`.nvmrc`](../.nvmrc).     |
| npm                           | Bundled with Node 22 | Package manager — this project uses npm workspaces, not pnpm or yarn. |

No Docker, no database, and no external services are required to run ShipRoutesX locally — everything (including the maritime network data) is a file already in the repository.

If you use [nvm](https://github.com/nvm-sh/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows):

```bash
nvm install
nvm use
```

## Clone and install

```bash
git clone https://github.com/<your-fork-or-org>/shiproutesx.git
cd shiproutesx
npm install
```

`npm install` at the repo root installs dependencies for every workspace (`apps/api`, `apps/web`, and all four `packages/*`) in one pass — you never need to run `npm install` inside an individual workspace folder.

## Run it

```bash
npm run dev
```

This starts **two** processes together, labeled in the terminal output:

- **`web`** — the landing page, at `http://localhost:3040`
- **`api`** — the routing API, at `http://localhost:3041`

You'll see the API log its startup sequence, including the maritime graph load:

```
[api] INFO: Maritime graph loaded
[api]     resolution: "20km"
[api]     nodes: 22
[api]     edges: 23
[api]     loadMs: 14
[api] INFO: Server listening at http://127.0.0.1:3041
```

Verify it's working:

```bash
curl http://localhost:3041/health
# {"status":"ok"}
```

Stop both processes with `Ctrl+C`.

## Verify your setup

Run the full check suite (also what CI runs — see [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)):

```bash
npm run build   # type-check + compile every package/app
npm run lint    # ESLint across the repo
npm test        # Vitest across every workspace
```

If all three succeed, your environment is set up correctly.

## Troubleshooting

**"Port 3040/3041 is already in use"**
Something else (often a previous `npm run dev` that didn't shut down cleanly) is holding the port. Find and stop it, then retry. On Windows:

```powershell
Get-NetTCPConnection -LocalPort 3040,3041 | Select-Object OwningProcess
Stop-Process -Id <pid> -Force
```

On macOS/Linux:

```bash
lsof -i :3040 -i :3041
kill <pid>
```

**`npm install` fails on Node < 22**
Check `node --version`. `engines.node` in the root `package.json` requires `>=22`; older versions aren't supported.

**A `POST /route` request returns `{"error":"No maritime network data available for resolution 10km", ...}`**
This is expected, not a bug — only 20km/50km/100km network data exists today (see [`data/README.md`](../data/README.md)). Use one of those three resolutions.

**Next step:** see [`development.md`](development.md) for the day-to-day workflow, or [`api.md`](api.md) for the full API reference.
