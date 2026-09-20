<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# happy-training-ai

## Project Overview

A personal web app for storing and organizing training material: videos, PDFs,
articles, uploaded files, and code snippets, tagged under a hierarchical topic
tree. Videos get auto-transcribed (verbatim captions, no summarization) and
AI-summarized; a separate "repo AI" feature connects a GitHub repo so you can
ask questions about its code and get AI-suggested snippet extractions.
Single-user app gated by GitHub OAuth with an allow-list of exactly one login.

Part of the Happy Factory suite of ~23 sibling Next.js apps sharing brand/auth
patterns (siblings live under a separate `ai/` checkout elsewhere; brand
tokens and auth conventions are mirrored here).

Design specs for features live in `docs/specs-happy-training-ai/` (SPEC.md,
PLAN.md, plus per-feature specs). Read the relevant spec before major changes.

## Quick Start / Commands

Package manager is **npm** (only `package-lock.json` exists; lockfiles are
gitignored, so don't expect them committed).

```bash
npm run dev          # next dev
npm run build        # next build
npm run start        # next start
npm run lint         # eslint

npm run db:generate  # drizzle-kit generate (create migration from schema.ts)
npm run db:migrate   # drizzle-kit migrate
npm run db:studio    # drizzle-kit studio (browse the DB)
```

There is no test suite / test runner configured in this project.

## Architecture

- **Framework**: Next.js 16 (App Router), React 19, TypeScript, Tailwind v4.
- **Database**: Neon serverless Postgres via `@neondatabase/serverless` +
  Drizzle ORM (`drizzle-orm/neon-http`). Client: `src/lib/db/index.ts`.
  Schema: `src/lib/db/schema.ts`. Migrations output to `src/lib/db/migrations`
  (config in `drizzle.config.ts`).
- **Data flow**: App Router pages under `src/app/*` render server components
  that call query helpers directly (`src/lib/{resources,topics,snippets,
  settings,repos}/queries.ts`); client components hit the route handlers under
  `src/app/api/*`, which also call the same query-helper modules. No
  tRPC/GraphQL layer — plain REST-ish JSON routes returning
  `NextResponse.json(...)`.
- **Key domain modules** (`src/lib/`):
  - `db/` — Drizzle schema + client.
  - `resources/` — resource queries plus domain logic: `transcribe.ts`
    (YouTube pipeline: caption scrape via `youtubeCaptions.ts`, falls back to
    Gemini video understanding in `youtubeGemini.ts`, returns the **verbatim**
    transcript — rewriting is a separate explicit action), `rewrite.ts`
    (Cohere, chunked, near-verbatim-preserving), `articleExtract.ts`
    (`@extractus/article-extractor`), `elementQueries.ts` (resource
    sub-elements), `icons.ts`.
  - `ai/*Prompt.ts` — system prompts with DB-overridable defaults via the
    `settings` table: `askContentPrompt`, `explainCodePrompt`,
    `explainTranscriptPrompt`, `rewriteTranscriptPrompt`, `summarizePrompt`,
    `synthesizePrompt`. Each exports a `<NAME>_PROMPT_KEY` + default.
  - `github/` — `client.ts` (per-user Octokit via stored encrypted token),
    `repoSync.ts` (pulls repo files into `repo_files`), `repoContext.ts`
    (builds context for repo Q&A).
  - `auth/tokenCrypto.ts` — encrypts GitHub access tokens at rest
    (`AUTH_TOKEN_SECRET`); `auth/session.ts` — `getCurrentUser()` helper.
  - `r2.ts` — Cloudflare R2 object storage client, shared bucket/creds across
    the Happy Factory suite, this app's uploads namespaced under
    `training/`. Supports both the native CF Workers R2 binding and an
    S3-compatible endpoint (Vercel/Node), auto-detected at runtime. Two
    upload paths: `POST /api/resources/upload` proxies small files (≤4MB,
    Vercel's serverless function body-size ceiling) through our own
    function; anything larger uses `getSignedUploadUrl()` +
    `POST /api/resources/upload-url` + the client-side
    `uploadFileDirect()` helper (`src/lib/uploadClient.ts`) to PUT straight
    from the browser to R2, capped at 200MB (`validateDirectUpload`). All
    three upload UIs (`ResourceWorkspace.tsx`, `PDFUpload.tsx`,
    `ElementsEditor.tsx`) use the direct-upload helper.
  - `image/compress.ts`, `text/stripHtml.ts`, `markdown/` — small utilities.
- **AI SDK usage**: Vercel AI SDK (`ai` package) with `@ai-sdk/cohere` (chat/
  summarize/explain/rewrite/ask/suggest, model `command-a-03-2025`) — Cohere is
  the only provider actually called in `src/` (`@ai-sdk/groq` is an unused
  dependency). Gemini and YouTube Data API are called directly via `fetch`/
  `GOOGLE_API_KEY` / `GEMINI_API_KEY` (not through the AI SDK). Streaming
  routes use `streamText(...).toTextStreamResponse()`.
- **Directory layout**:
  - `src/app/` — routes; API handlers under `src/app/api/**/route.ts`.
    `src/app/ai/` is the "AI Suggestions" page (topic synthesis, explanations).
  - `src/app/api/ai/` — `ask`, `explain`, `explain-transcript`, `summarize`,
    `synthesize` (content AI). `src/app/api/repo-ai/` — `ask`, `suggest`,
    `sync` (repo AI). `src/app/api/elements/*` and
    `src/app/api/resources/[id]/elements/*` — resource sub-elements.
  - `src/components/{layout,ai,pdf,markdown,repos,resources,settings,
    snippets,topics,ui}/` — feature components + shadcn `ui/` primitives.
  - `src/lib/` — domain logic (see above).

## Auth

- NextAuth v5 (`next-auth@5.0.0-beta.31`), GitHub provider only, JWT session
  strategy. Split into two files because middleware always runs on the Edge
  runtime:
  - `src/auth.config.ts` — Edge-safe config (provider, pages, `signIn`
    callback). Must not import anything touching the DB or Node's `crypto`.
  - `src/auth.ts` — full config; `jwt`/`session` callbacks upsert the GitHub
    user into the `users` table and encrypt/store their access token.
- `src/middleware.ts` protects only `/repos/:path*`, `/api/repos/:path*`, and
  `/api/repo-ai/:path*` — redirects unauthenticated requests to `/login`.
  **Other routes (resources, topics, snippets, settings, uploads, ai) are not
  gated by middleware** — treat this as a single-user/trusted-network app,
  not a multi-tenant one.
- Access is restricted to one GitHub login via `ALLOWED_GITHUB_LOGIN` checked
  in the `signIn` callback — anyone else's OAuth login is rejected.
  Login page: `/login`; error page: `/auth-error`.
  There is no `/api/auth/test-login` bypass route in this app.
- `getCurrentUser()` (`src/lib/auth/session.ts`) wraps `auth()` for use in
  server components/route handlers needing the current user id/login/avatar.
- GitHub access tokens are stored encrypted (`src/lib/auth/tokenCrypto.ts`,
  keyed by `AUTH_TOKEN_SECRET`) and decrypted per-request to build an Octokit
  client (`src/lib/github/client.ts`) — needed for repo sync/Q&A features and
  requested with `read:user repo` scope.

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `ALLOWED_GITHUB_LOGIN` | Sole GitHub login permitted to sign in |
| `AUTH_TOKEN_SECRET` | Key for encrypting stored GitHub access tokens |
| `COHERE_API_KEY` | Cohere (via `@ai-sdk/cohere`) — all AI SDK calls: summarize/explain/rewrite/ask/repo AI |
| `GEMINI_API_KEY` / `GOOGLE_API_KEY` | Gemini video-understanding fallback for transcription |
| `GEMINI_VIDEO_MODEL` / `GEMINI_VIDEO_FALLBACKS` | Override Gemini model / fallback model list |
| `YOUTUBE_API_KEY` | YouTube Data API (video metadata) |
| `SUPADATA_API_KEY` | Supadata (caption/transcript fetching) |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R2 S3-compatible credentials |
| `R2_BUCKET` (or `R2_BUCKET_NAME`) | R2 bucket name |
| `R2_PUBLIC_URL` / `NEXT_PUBLIC_R2_PUBLIC_URL` | Public base URL for R2 objects |
| `R2_ENDPOINT` | Full S3 endpoint URL (or derive from `R2_ACCOUNT_ID`/`CLOUDFLARE_ACCOUNT_ID`) |

## Code Conventions

- Path alias `@/*` → `src/*` (see `tsconfig.json`). shadcn aliases in
  `components.json`: `@/components`, `@/components/ui`, `@/lib`, `@/hooks`.
- shadcn style `base-nova`, base color `neutral`, icons from `lucide-react`.
  `cn()` helper (`src/lib/utils.ts`) wraps `clsx` + `tailwind-merge`.
- Styling: Tailwind v4 with CSS-variable design tokens defined in
  `src/app/globals.css` under `@theme` (Happy Factory brand tokens —
  `--color-bark`, `--color-leaf`, `--color-sun`, `--color-clay`, etc., plus
  `--font-sans` "DM Sans", `--font-serif` "Fraunces", `--font-accent`
  "Caveat"). Dark mode via `.dark` class, not media query.
- Drizzle schema: `snake_case` DB columns mapped to `camelCase` TS fields;
  every table exports both a `Select` and an `Insert` inferred type (e.g.
  `Topic` / `NewTopic`).
- API route handlers follow a plain pattern: parse `NextRequest`, call a
  `src/lib/<domain>/queries.ts` helper, return `NextResponse.json(...)` with
  explicit status codes for errors (400/404/500).
- Route params are async: `{ params }: { params: Promise<{ id: string }> }`
  then `await params` (Next 16 convention).

## Gotchas

- `src/lib/db/index.ts` and any module it imports cannot run on the Edge
  runtime — this is why auth is split into `auth.config.ts` (Edge-safe, used
  by `middleware.ts`) vs `auth.ts` (full, DB-touching, used everywhere else).
- `repo_files.search_vector` (a `tsvector` + GIN index for repo code search)
  is *not* represented in `schema.ts` — Drizzle 0.45's pg-core has no
  generated-column helper, so it was created via raw DDL and is queried with
  the `sql` escape hatch. Don't expect `drizzle-kit generate` to know about it.
- `src/lib/r2.ts` deliberately hides the Cloudflare Workers R2 binding
  `require()` behind `eval("require")` so Turbopack/Webpack don't try to
  resolve `@opennextjs/cloudflare` at build time on Vercel; it falls through
  to the S3-compatible path there.
- Only `/repos`, `/api/repos`, `/api/repo-ai` are behind auth middleware —
  most CRUD routes (resources/topics/snippets/settings/uploads/ai) have no
  session check. Don't assume auth is enforced app-wide when adding routes.
- YouTube transcription is deliberately **literal** (verbatim words, no
  summaries/chapters) — recent change. Rewriting/summarizing is a separate
  user-triggered action; don't "helpfully" make the transcript more legible in
  the transcribe step.