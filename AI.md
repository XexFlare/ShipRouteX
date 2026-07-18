# AI.md — Guidance for AI Assistants and Contributors

This document exists because this repository has history and context that
isn't visible from the current file tree alone. It's written for any AI
coding assistant (Claude, Copilot, Cursor, etc.) or human contributor
picking this repository up for the first time. Claude specifically should
also read [`CLAUDE.md`](CLAUDE.md), which covers the same ground with a few
Claude-specific notes.

## Repository background

This is a **fork of Eurostat's [SeaRoute](https://github.com/eurostat/searoute)**,
a Java 9/Maven project (~700 lines across 5 classes, wrapped around GeoTools
and a set of pre-built maritime-network GeoPackage files) that computes
shortest maritime shipping routes using Dijkstra's algorithm over a static
graph of shipping lanes.

**ShipRoutesX** — the TypeScript project under `apps/`, `packages/`, and
`data/` — was built inside this fork, architecturally inspired by SeaRoute
but written from scratch (not a port). The fork was **kept intentionally**,
not left behind by accident: the original Java project's data and code are
this project's reference material and, eventually, its real data source.

Concretely, the repository root looks like this:

| Path                                        | What it is                                                                            | Status                                                       |
| -------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `modules/`                                    | Original SeaRoute Java/Maven project (`core`, `marnet`, `jar`, `war`)                   | **Preserve.** Reference implementation + real dataset source. |
| `apps/api`, `apps/web`                        | ShipRoutesX's Fastify API and landing page                                              | Active development.                                          |
| `packages/graph`, `core`, `shared`, `platform` | ShipRoutesX's TypeScript routing engine, in dependency order `api → core → graph → shared`, plus `api → platform` | Active development.                                          |
| `data/networks/*.json`                        | A small **hand-authored starter** network (not yet derived from `modules/`'s real `.gpkg` data) | Active development; see `data/README.md`.                    |
| `docs/` (all files except one)                | ShipRoutesX's own architecture/API/installation/development docs                        | Active development.                                          |
| `docs/searoute-architecture-analysis.md`      | A deep-dive analysis of the **original** SeaRoute project (§1–§17), written to inform ShipRoutesX's design | Reference document — explains `modules/` in detail.          |
| `searoute-master.zip`                         | The original upstream zip download, kept locally for reference                          | Gitignored — not tracked, not part of any commit.            |

## The one rule that matters most

**"Nothing currently imports this" is not evidence that a file is safe to
delete.** This repository holds original SeaRoute Java source, a real
maritime-network dataset (`.gpkg` GeoPackage files), and a from-scratch
TypeScript reimplementation side by side, on purpose, at different stages of
completion. A file being unreferenced by today's TypeScript code is exactly
the expected state for reference material that hasn't been consumed yet —
not a sign of dead weight.

Do not:

- Delete, move, or restructure anything under `modules/` because it "isn't
  used by the API." It's the real data source and reference engine
  ShipRoutesX's own `data/README.md` describes replacing the starter
  network with, eventually.
- Treat the five-times-duplicated `.gpkg` files (across
  `modules/core/.../marnet/`, `modules/jar/marnet/`,
  `modules/jar/release/searoute/marnet/`, and
  `modules/war/.../marnet/`) as an accidental mess to clean up. That
  duplication is inherited from the original SeaRoute build (each Maven
  module vendors its own copy of the same resources — see
  `docs/searoute-architecture-analysis.md` §2) and predates this fork.
- Assume a large, sweeping "repository cleanup" pass is welcome. It isn't,
  by default. Removing files that look unused, stale, or superseded is a
  **design decision that needs the repository owner's explicit, specific
  sign-off** — not something to infer from static analysis of what's
  currently imported.
- Silently delete something you believe is obsolete or duplicated. If you
  notice a candidate for removal, name it explicitly in your response and
  let a human decide — don't fold it into an unrelated change.

Do:

- Prefer adding new files (new docs, new data, new code) over replacing old
  ones, when both are reasonable.
- Treat `docs/searoute-architecture-analysis.md` as the reference for
  understanding what `modules/` does, before making claims about the
  original engine's behavior.
- Recognize that **intentional** removals of original SeaRoute content have
  already happened here and are fine — e.g. the upstream `searoute-master`
  layout's root-level `pom.xml` and top-level `doc/` aren't present in this
  fork. That was a deliberate call by the repository owner. The difference
  between that and an unwelcome deletion is that it was a specific,
  intentional decision — not an inference that an unreferenced file must be
  dead.
- When a task explicitly asks for a deletion (an intentional removal the
  owner has called out), include it — don't fight the instruction by
  trying to preserve everything unconditionally. Preservation is the
  *default*, not an override of explicit instructions.

## Practical notes

- The Node/TypeScript tooling (`npm install`, `npm run dev`, `npm run
  build`, `npm test`, `npm run lint`) only touches `apps/`, `packages/`,
  and the repo-root config files. It does not build, run, or depend on
  `modules/` (the Java side) in any way — building `modules/` requires
  Maven and is a separate, currently-manual concern.
- `packages/*/package.json` point `"main"`/`"types"` at raw TypeScript
  source (not compiled `dist/`), consumed directly via `tsx` in dev and
  `vitest` in tests — see `docs/architecture.md` and
  `docs/development.md` before assuming a package needs to be built before
  it can be imported elsewhere in the monorepo.
- `apps/api`'s Netlify Functions deployment path (`apps/api/netlify/`,
  `apps/api/netlify.toml`, `apps/api/scripts/copy-netlify-assets.mjs`) is
  additive — it wraps the existing Fastify app for serverless use without
  replacing `apps/api/src/index.ts`, the local-dev/`npm start` entrypoint.
  Both are meant to keep working side by side.

## Keeping this document current

If the split described in the table above changes — for example, if
`modules/`'s `.gpkg` data eventually gets converted into
`data/networks/*.json` and `modules/` is deliberately archived or trimmed —
update this file (and `CLAUDE.md`) as part of that change, rather than
letting them describe a repository layout that no longer exists.
