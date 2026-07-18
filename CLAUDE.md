# CLAUDE.md — Repository Guidance

This file is for Claude (and any future AI assistant) working in this
repository. Read this before restructuring, deleting, or "cleaning up"
anything here. See also [`AI.md`](AI.md), which covers the same ground for
non-Claude assistants and human contributors.

## What this repository is

This repository is a **fork of Eurostat's [SeaRoute](https://github.com/eurostat/searoute)**
(a Java/Maven project that computes maritime shipping routes over a
pre-built graph of shipping lanes), and it is **intentionally still a fork**
— not a clean-room rewrite that happens to share a name.

Two things live here side by side, on purpose:

- **`modules/`** — the original SeaRoute Java/Maven project (`core`,
  `marnet`, `jar`, `war` modules), including the real
  `marnet_plus_{5,10,20,50,100}km.gpkg` GeoPackage files, which are the
  actual maritime-network dataset this whole project (Java and TypeScript
  alike) is ultimately about. See `docs/searoute-architecture-analysis.md`
  for a full deep-dive on what every part of `modules/` does and why it's
  structured the way it is.
- **`apps/`, `packages/`, `data/`, `docs/`** (minus
  `searoute-architecture-analysis.md`) — **ShipRoutesX**, a from-scratch
  TypeScript reimplementation: a Fastify API (`apps/api`), a landing page
  (`apps/web`), a generic graph/Dijkstra engine (`packages/graph`), the
  maritime routing domain logic (`packages/core`), cross-cutting types
  (`packages/shared`), and mocked-only platform scaffolding for future auth
  (`packages/platform`).

ShipRoutesX is **inspired by** SeaRoute's architecture — it is not a port,
and it does not currently consume `modules/`'s Java code or its `.gpkg`
files at runtime (`data/networks/*.json` is still a small hand-authored
starter dataset; see `data/README.md` and the "Next" section of the root
`README.md`). That gap — wiring the real SeaRoute-derived network into the
TypeScript engine — is planned future work, and `modules/` is the source
material for it.

## Why `modules/` (and other original files) must not be deleted

**Do not delete, move, or "clean up" `modules/` — or any other original
SeaRoute file — because it looks unused by `apps/`, `packages/`, or
`data/`.** It looks unused today because ShipRoutesX hasn't gotten to the
"import the real network" milestone yet, not because it's dead weight:

- `modules/marnet/src/main/resources/marnet.gpkg` and `pass.gpkg` are the
  **hand-maintained source of truth** for the maritime network (raw
  shipping lanes + strait/channel zones). The five `marnet_plus_*.gpkg`
  files elsewhere under `modules/` are *build outputs* of
  `MarnetBuilding.java` running against those two files — see
  `docs/searoute-architecture-analysis.md` §6 and §10.
  `data/scripts/generate-seed-network.mjs` is a placeholder standing in for
  a real conversion pipeline that would eventually read from these same
  `.gpkg` files.
- `modules/core/src/main/java/.../SeaRouting.java` is a working, tested
  (`SeaRoutingTest.java`) reference implementation of the exact routing
  algorithm `packages/core`/`packages/graph` are reimplementing in
  TypeScript — nearest-node snapping, Dijkstra with a pass-aware edge
  weighter, antimeridian stitching, the direct-line shortcut heuristic. If
  a routing result ever looks wrong, this is the reference to diff against,
  not just the TypeScript tests.
- `modules/jar` and `modules/war` show two other delivery shapes (CLI,
  servlet) for the same engine — useful precedent if ShipRoutesX ever needs
  an equivalent (e.g. a batch/CSV mode).
- The `.gpkg` files are **physically duplicated** across
  `modules/core/src/main/resources/marnet/`, `modules/jar/marnet/`,
  `modules/jar/release/searoute/marnet/`, and
  `modules/war/src/main/{resources,webapp/resources}/marnet/`. This is
  **inherited from the original SeaRoute build layout**, not accidental
  drift introduced by this fork (documented in
  `docs/searoute-architecture-analysis.md` §2: "there's no shared resource
  module; each consuming module just copies the same static files into its
  own resources"). Don't deduplicate these on ShipRoutesX's behalf —
  changing how the original Maven build resolves its own resources is out
  of scope for this project unless someone explicitly decides to touch the
  Java side.

More generally: **historical code, reference implementations, documentation,
tooling, and datasets can all have future value even when nothing currently
imports or executes them.** "Nothing in `apps/` or `packages/` references
this" is not the same as "this is safe to delete." Treat every file already
in this repository's git history as retained on purpose unless you have
explicit, specific instruction to remove it.

## Files that look obsolete but are *not* yours to remove unilaterally

If, while working here, you notice something that looks stale, duplicated,
or superseded (e.g. the `.gpkg` duplication above, or the fact that
`data/networks/{20,50,100}km.json` are currently identical placeholder
files rather than genuinely-generalized per-resolution data — see
`data/README.md`), **say so and ask, rather than deleting it as part of an
unrelated change.** Call it out explicitly in your response so a human can
decide. Do not fold a cleanup into a feature commit.

## Rules for any future refactor or cleanup

1. **Preservation over deletion is the default.** When a refactor could
   either delete an old/unused file or leave it in place, leave it in
   place, unless the task at hand specifically requires removing it.
2. **Never assume "unused = safe to delete."** This applies to the Java
   modules, to `docs/searoute-architecture-analysis.md`, to
   `searoute-master.zip`'s presence in `.gitignore` history, and to
   anything else already committed here — regardless of language, file
   type, or whether current TypeScript code references it.
3. **Large or destructive cleanup operations require explicit, upfront
   confirmation from the repository owner** before touching anything —
   not a quick mention in a summary after the fact. If a task seems to
   imply "delete everything unused," stop and ask what specifically should
   go, rather than inferring scope from file-usage analysis.
4. **Intentional deletions are still welcome** — this repo has already
   removed some original SeaRoute top-level files (e.g. the root `pom.xml`
   and top-level `doc/` from the upstream `searoute-master` layout aren't
   present here) where the maintainer made that call deliberately. The
   distinction that matters is *who decided* and *how explicit that
   decision was*, not whether the file happens to be old.
5. When in doubt about whether something is "original SeaRoute" content vs.
   "ShipRoutesX" content, `modules/` vs. everything else is the reliable
   split today. If that ever stops being true (e.g. `modules/` content gets
   partially absorbed into `data/` or `packages/core`), update this file
   alongside that change.

## Practical pointers for working here

- `npm install && npm run dev` runs the TypeScript side only (`apps/web` +
  `apps/api`); nothing here builds or runs the Java side automatically —
  that would require Maven and is out of scope for the Node tooling.
- `docs/searoute-architecture-analysis.md` is the fastest way to understand
  `modules/` without reading Java — read it before making claims about what
  the original engine does.
- See `docs/architecture.md` for the TypeScript side's own design, and
  `docs/platform-architecture.md` for the (currently mocked, not enabled)
  auth/rate-limiting/usage-tracking plan.
