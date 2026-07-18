# Contributing to ShipRoutesX

Thanks for considering a contribution. This project is young — issues and PRs are especially welcome on the open items in the [Roadmap](README.md#roadmap).

## Before you start

- Read [`docs/architecture.md`](docs/architecture.md) — it explains the package boundaries this project is fairly strict about (e.g. the routing engine never imports Fastify, and never imports `@shiproutesx/platform`). A PR that crosses one of those boundaries without a good reason will likely get asked to change.
- For anything non-trivial, open an issue first describing what you want to change and why, before writing the code. This avoids spending effort on a PR whose direction doesn't fit.
- Small fixes (typos, a clearer error message, a missing test) don't need an issue first — just open the PR.

## Development setup

See [`docs/installation.md`](docs/installation.md) and [`docs/development.md`](docs/development.md). Short version:

```bash
npm install
npm run dev
```

## Making a change

1. Fork the repo and create a branch off `main`.
2. Make your change. See [`docs/development.md`](docs/development.md) for where different kinds of changes belong (routing logic vs. HTTP layer vs. network data).
3. Add tests. This project tests routing logic directly (fast, synchronous, no HTTP) wherever possible — see existing `*.test.ts` files for the pattern before reaching for an HTTP-level test.
4. If you changed a route's request or response shape, update [`openapi.json`](openapi.json), [`docs/api.md`](docs/api.md), and the relevant files under [`docs/examples/`](docs/examples/) to match. These are hand-maintained, not generated — nothing will remind you automatically.
5. Update `docs/architecture.md` or the README if your change affects something they describe (a new package, a new architectural decision, a roadmap item completed).

## Before opening a pull request

Run all four of these and make sure they pass — this is exactly what CI runs:

```bash
npm run build
npm run lint
npm run format:check
npm test
```

If `npm run format:check` fails, run `npm run format` and commit the result.

## Commit and PR conventions

- Keep commits focused; a PR that does one thing is easier to review than one that does three.
- Write commit messages and PR descriptions that explain **why**, not just what — the diff already shows what changed.
- Reference the issue you're closing/addressing, if there is one.

## Code style

- TypeScript strict mode; avoid `any` — if you're reaching for it, there's usually a real type available (check `@shiproutesx/shared`, `@shiproutesx/graph`, or `@shiproutesx/core`'s exports first).
- No comments explaining _what_ code does — name things so that's obvious. A comment should only explain a non-obvious _why_ (a workaround, a subtle invariant, a deliberate scope limitation).
- Prettier formats everything; don't hand-format around it.
- Don't add a dependency for something a few lines of plain code can do — this project has stayed intentionally light on dependencies (see the "review for unnecessary complexity" note in [`docs/architecture.md`](docs/architecture.md)).

## Reporting a bug

Open an issue with:

- What you expected vs. what happened.
- The exact request (if API-related) — a copy-pasteable `curl` command or a `docs/examples/`-style JSON body is ideal.
- Your Node.js version (`node --version`) and OS.

## Reporting a security issue

Please don't open a public issue for a security vulnerability. See the [License](LICENSE) file for contact/ownership information, or open a private security advisory on GitHub if the repository has that enabled.

## License

By contributing, you agree your contribution is licensed under this project's [MIT License](LICENSE).
