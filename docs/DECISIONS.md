# Decisions

- 2026-11-04 — Stack modernised to latest stable: Next.js 16.4.5, React 19.3, Tailwind 4.3, Zod 4.6, Vitest 5.1. Next 16 uses `proxy.ts` instead of `middleware.ts`, async request APIs, and no longer ships `next lint`.
- 2026-11-04 — Prisma ORM 7.10.1 (stable) instead of the brief's Prisma 6. Prisma 8 is a release candidate and is not used. Prisma 7 requires `prisma.config.ts`, a driver adapter (`@prisma/adapter-pg` + `pg`), a generated client with an explicit output path, ESM (`"type": "module"`), and explicit `prisma generate` / `prisma db seed`.
- 2026-11-04 — Added `@prisma/adapter-pg`, `pg`, and `@types/pg` because Prisma 7 no longer bundles the Rust query engine by default. This is the one dependency addition required by the version change.
- 2026-11-04 — TypeScript kept at 5.9.3, not 7.0.2, because Prisma 7 recommends 5.9.x. Revisit after the core build.
- 2026-11-04 — Next.js `cacheComponents` and `partialPrefetching` experimental flags disabled to avoid caching and Suspense constraints under a hard deadline.
- 2026-11-04 — `@types/bcryptjs` omitted: `bcryptjs` 3 ships its own types and the DefinitelyTyped package is a stub.
- 2026-11-04 — `help.md` is tracked in git; `AGENTS.md` is a short pointer to it so there is only one copy of the brief to maintain.
- 2026-11-04 — Local PostgreSQL via Docker: dev on port 5433, test on 5434, as specified in the brief.
- 2026-11-04 — AI provider is Google Gemini via `@google/genai` 2.32.0 instead of Anthropic, because the free tier and integration are simpler. The `AiClient` interface stays the same, so tests and the rest of the AI flow are provider-agnostic. Key lives in `GEMINI_API_KEY`; model comes from `AI_MODEL` (default `gemini-3.8-flash`). AI still receives only public scheme notice text, never donor data.
- 2026-11-04 — Playwright's Chromium binary is not downloaded at T01; it will be installed at T38 when browser tests are needed.
