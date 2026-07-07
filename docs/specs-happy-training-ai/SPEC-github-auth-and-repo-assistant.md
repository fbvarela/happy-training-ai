# Happy Training AI — GitHub Auth + Repository AI Assistant (Feature Spec)

> **Part of The Happy Factory suite.** Follows conventions in `HAPPY-FACTORY-CONTEXT.md` and `BRAND-SPEC.md`.
> Scoped feature spec — complements the full product spec in `docs/specs-happy-training-ai/SPEC.md`, which
> currently opens with **"Personal tool — no auth, no payments, single-user local app."** This is the first
> feature in the project's history that requires authentication — see §1 for why, and §3 for how the app stays
> single-user despite adding real OAuth.
> Design reference: `happy-shelter-ai`, `happy-news-ai`.

---

## 1. Vision

Every other feature in Happy Training AI answers questions about content the user explicitly pasted in — a YouTube transcript, an uploaded PDF, a hand-written snippet. None of it knows what the user actually *builds*. The gap: the richest source of "what does Fernando need to learn next" isn't a video, it's the code already sitting in his GitHub repos — the libraries in use, the patterns repeated, the half-finished TODOs.

This feature adds GitHub sign-in, lets the user connect one or more repositories, and gives the AI direct read access to that code for two things:

1. **Resource suggestions** — a one-click "Suggest resources from this repo" scan that looks at what a repo actually uses (dependencies, file patterns, doc comments) and proposes topics/resources missing from the library, in the same spirit as `TopicSynthesis`'s existing "knowledge gaps" but grounded in real code instead of self-reported topic coverage.
2. **Code Q&A** — a chat surface scoped to a connected repo: "where do we handle the Groq rate limit retry?", "what's the shape of `resource_elements`?" — answered by an AI with the actual file contents in context, with file-path citations.

**Core insight:** `TopicSynthesis` already asks "what am I missing" against the resources the user chose to add. This feature asks the same question against the resources the user *should* add, inferred from what's actually in their codebase — closing the loop between "what I'm learning" and "what I'm building."

**Differentiator:** Not a general codebase-chat tool (Cursor, Copilot Workspace already do that well). This is scoped narrowly to *pointing the training-content pipeline at real code* — suggestions land as normal `resources`/`topics` rows in the same library as everything else, not a separate chat log.

---

## 2. Why Auth, and Why GitHub Specifically

- Reading a private repo's contents requires an OAuth token scoped to that repo — there's no way around real GitHub authentication once "connect your repos" is a feature.
- GitHub OAuth is also the natural identity provider here: the same login used to own the repos is the login used to access the app. No separate email/password system, no magic-link email infra (this project has no Resend integration, unlike other Happy Factory apps).
- This does **not** turn Happy Training AI into a multi-tenant SaaS product. See §3 — access stays restricted to a single allow-listed GitHub account, consistent with `SPEC.md`'s "personal tool" framing. The `SPEC.md` banner should be updated once this ships to: *"Personal tool — GitHub-gated single-user app, no payments."*

---

## 3. Target Users

| Persona | Description | Needs from this feature |
|---|---|---|
| Fernando (sole user) | Developer using the app as a personal training/learning knowledge base, and the owner of the GitHub account being connected | Sign in with the account he already uses for the actual work; see what the app *infers* he should learn next from real code, not just self-reported topics; ask quick questions about a repo without leaving the training app to open the IDE |

No multi-tenant personas. **Access control:** sign-in succeeds for any GitHub account, but every authenticated route checks the logged-in `login` against a single `ALLOWED_GITHUB_LOGIN` env var (e.g. `fbvarela`) and returns 403 otherwise — same "personal tool" guarantee as today, just backed by real auth instead of the absence of it.

---

## 4. Feature Tiers

Not applicable — single-user personal app (see §3). No Free/Premium split; scope is organized by phase (§10).

---

## 5. Feature Details

### 5.1 GitHub Sign-In

- Auth.js (`next-auth`, v5 / App Router) with the built-in GitHub provider — new dependency, this project currently has zero auth packages installed (confirmed: no `next-auth`, `iron-session`, or middleware in `src/`).
- OAuth scope: `repo` (needed to read private repository contents; `public_repo` alone isn't sufficient since the user's repos are a mix of public and private).
- Session strategy: **JWT, no database adapter.** Avoids introducing Auth.js's full `accounts`/`sessions`/`verification_tokens` schema for what is fundamentally a single-user login gate — the signed session cookie carries `login`, `id`, `avatarUrl`, and the encrypted access token.
- `middleware.ts` (new file — none exists today) protects everything under `/repos/*` and the new `/api/repos/*`/`/api/repo-ai/*` routes; the rest of the app (`/topics`, `/resources`, `/snippets`) stays open exactly as it is today, so this feature is additive, not a full-app auth gate.
- Post-login allow-list check (§3) happens in the Auth.js `signIn` callback — a non-allow-listed GitHub account is rejected at sign-in time with a clear error page, never reaching a session.

### 5.2 Repo Connection

- New screen `/repos` — lists the signed-in user's repositories (via the GitHub REST API `GET /user/repos`, paginated, using the session's access token), with a "Connect" toggle per repo.
- Connecting a repo stores a `connected_repos` row (owner/name, default branch, private flag) — no code is fetched yet at connect time, keeping this step instant.
- Connected repos appear as cards on `/repos`, each with "Suggest resources" (§5.3) and "Ask a question" (§5.4) actions, plus a "Disconnect" action that deletes the row (and any cached chunks from §5.4).

### 5.3 Resource Suggestions From Code

- Action: `POST /api/repo-ai/suggest` — given a connected repo, builds a compact context from:
  - `package.json`/`requirements.txt`/`go.mod` (whichever exists) — dependency list
  - Root `README.md` if present
  - File tree (paths only, depth-limited) to show structure without full contents
  - Up to N largest/most-central source files by heuristic (entry points, most-imported files) — content included only up to a token budget, not the whole repo
- Sent to Groq (`llama-3.1-8b-instant`, matching the rest of the app post-quota-fix — see `SPEC.md` §2.7) with a system prompt asking for 3–7 concrete topic/resource suggestions with a one-line "why this repo suggests it" justification each (e.g. *"Uses Drizzle's `relations()` extensively but no resource covers query builder joins yet"*).
- Output renders as a list of suggestion cards, each with an "Add as topic" / "Add as resource stub" action that calls the existing `POST /api/topics` or `POST /api/resources` routes — reuses the app's real content model instead of inventing a new one, same principle as `SPEC-ai-topic-content-generation.md` §4.3's "save as resource" pattern.
- No embeddings, no code chunk storage required for this feature alone — it's a single bounded-context prompt per suggestion run, on demand.

### 5.4 Code Q&A

- Chat-style panel on a connected repo's detail page: user asks a free-text question, AI answers grounded in the repo's actual files.
- **Retrieval (v1 — no vector search):** keyword/path heuristic — extract likely-relevant terms from the question, match against cached file paths and a lightweight full-text search (Postgres `tsvector` on cached file content, not a separate vector DB) to pick the top ~8 files, include their content in the prompt up to a token budget. Simpler and cheaper than embeddings for a single-user tool with a handful of connected repos; matches this project's stated preference for not introducing infrastructure before it's proven necessary (see `SPEC-markdown-editor.md`'s "no premature abstraction" precedent).
- **Retrieval (v2 — later, optional):** if keyword retrieval proves too weak on larger repos, upgrade to Cohere embeddings (`embed-multilingual-v3.0`, already used for semantic resource search per `SPEC.md` §2.7) + Neon's `pgvector` extension, chunking files into `repo_chunks` rows. Deferred to §10 Phase 4 — not built until v1 retrieval is demonstrably insufficient.
- Answers stream via the same `streamText`/`toTextStreamResponse()` pattern as every other `/api/ai/*` route, with a system prompt requiring **file-path citations** for every claim (e.g. *"Rate limit retries are handled in `src/lib/resources/rewrite.ts:57`"*), and an explicit instruction to say "not found in the indexed files" rather than guessing when the context doesn't contain the answer.
- File content is fetched from the GitHub API (`GET /repos/{owner}/{repo}/contents/{path}` or the git-tree + blob endpoints for batch fetching) and cached in `repo_files` with a short TTL/manual "Re-sync" button — not re-fetched from GitHub on every question.

### 5.5 Entry Points

| Entry point | Location | Behavior |
|---|---|---|
| Nav | Sidebar (desktop) / bottom nav (mobile) | New "Repos" item, only visible when signed in |
| Repos list | `/repos` | Connect/disconnect repos, jump into a repo's detail |
| Repo detail | `/repos/[id]` | "Suggest resources" button (§5.3) + Q&A chat panel (§5.4) |
| AI page | `/ai` | New "From your code" section alongside existing `TopicSynthesis`, surfacing the most recent suggestion run per connected repo |

---

## 6. Data Model

New tables (additive — no existing table changes required):

```
users
  id, github_id (unique), login, avatar_url,
  access_token (encrypted at rest — see §9), created_at

connected_repos
  id, user_id (FK → users),
  github_repo_id, owner, name, full_name (owner/name),
  default_branch, private (boolean),
  last_synced_at (nullable), created_at

repo_files                          ← cached content for Q&A retrieval (§5.4)
  id, repo_id (FK → connected_repos),
  path, sha, size, language (from extension),
  content (text, nullable — null until first sync),
  search_vector (tsvector, generated from content, for v1 keyword retrieval),
  fetched_at

repo_chunks                         ← v2 only (§5.4, §10 Phase 4), not built in v1
  id, repo_id (FK → connected_repos), file_path,
  chunk_index, content (text), embedding (vector),
  created_at

repo_suggestions                    ← history of suggestion runs (§5.3)
  id, repo_id (FK → connected_repos),
  suggestions (jsonb — array of {title, why, addedAsResourceId (nullable)}),
  created_at
```

No changes to `topics`, `resources`, `resource_elements`, or `snippets` — suggestions become real rows in those tables via the existing creation routes, not a parallel schema.

---

## 7. AI Integration

| Task | Provider | Model | Notes |
|---|---|---|---|
| Resource suggestions from repo (§5.3) | Groq | `llama-3.1-8b-instant` | One-shot `generateText`, not streamed — suggestion list is short and structured (JSON-ish list), matches the model already used app-wide after the quota fix |
| Code Q&A (§5.4) | Groq | `llama-3.1-8b-instant` v1; consider `llama-3.3-70b-versatile` for Q&A specifically if answer quality on multi-file reasoning proves weak, gated behind its own quota headroom check | Streamed via `streamText`, file-path-cited answers |
| v2 embeddings (§5.4, deferred) | Cohere | `embed-multilingual-v3.0` | Same model already used for semantic resource search per `SPEC.md` §2.7 — reused, not a new provider |

### Prompt Sketch — Suggestions (§5.3)

```
System: You are a technical mentor reviewing a codebase to suggest what its
author should study next. Given a dependency list, file tree, and excerpts
from key files, suggest 3-7 specific topics they likely need but probably
haven't formally learned, each with a one-sentence justification citing
what in the code suggests it. Be concrete — name the library/pattern, not
"learn more about databases". Output as a JSON array of {title, why}.

Prompt: Repo: {owner}/{name}
Dependencies: {parsed package.json/requirements.txt/go.mod}
File tree: {depth-limited paths}
Key files: {README + top-N file excerpts, token-budgeted}
```

### Prompt Sketch — Q&A (§5.4)

```
System: You answer questions about the given repository using only the
provided file excerpts. Every factual claim must cite the file path (and
line range if visible) it came from. If the excerpts don't contain the
answer, say so explicitly rather than guessing.

Prompt: Question: {userQuestion}
Relevant files:
--- {path1} ---
{content1}
--- {path2} ---
{content2}
...
```

---

## 8. Navigation & Screens

| Screen | Route | Description |
|---|---|---|
| Repos list | `/repos` | Connect/manage repositories (new, auth-gated) |
| Repo detail | `/repos/[id]` | Suggestions + Q&A chat for one connected repo (new, auth-gated) |
| Sign-in | `/login` (custom, brand-styled) | GitHub OAuth handoff — replaces the unbranded Auth.js default sign-in page |
| AI page | `/ai` | Gains a "From your code" section (existing route, extended) |

---

## 9. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Auth | `next-auth` v5 (Auth.js), GitHub provider | New dependency — first auth package in this project |
| Session storage | JWT, no DB adapter | Avoids Auth.js's full relational schema; session cookie carries `login`/`id`/encrypted token |
| Token encryption | Node `crypto` (AES-256-GCM) with a new `AUTH_TOKEN_SECRET` env var | GitHub access tokens are sensitive — never stored plaintext in `users.access_token` |
| GitHub API | `@octokit/rest` (new dependency) | REST client for repo listing, file/tree fetching |
| Route protection | `middleware.ts` (new file) | Scoped to `/repos/*`, `/api/repos/*`, `/api/repo-ai/*` only |
| Keyword retrieval (v1) | Postgres `tsvector`/`tsquery` (native, no new dependency) | `repo_files.search_vector`, GIN-indexed |
| Embeddings (v2, deferred) | Cohere `@ai-sdk/cohere` *(already installed)* + Neon `pgvector` extension | Not built in v1 — see §5.4, §10 Phase 4 |
| AI | Groq `@ai-sdk/groq` *(already installed)* | Same provider/model as the rest of the app |

---

## 10. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Repo connect | Instant (no fetch at connect time — see §5.2) |
| First sync (file cache) | Background-safe for repos up to a few hundred files; explicit "Re-sync" button rather than auto-sync on every visit, to control GitHub API rate-limit usage |
| Suggestion generation | Single request, non-streamed, target < 8s (matches `llama-3.1-8b-instant`'s low latency) |
| Q&A first token | < 2s, streamed |
| Token security | Access tokens encrypted at rest (§9); never logged; never sent to the client after initial OAuth handoff |
| Access control | Every `/api/repos/*` and `/api/repo-ai/*` route re-validates session + `ALLOWED_GITHUB_LOGIN` server-side, not just at the `middleware.ts` layer, in case a route is ever reachable by a path middleware doesn't cover |
| GitHub API rate limits | Respect standard REST rate limits (5,000 req/hr authenticated); file cache (§5.4) exists specifically to avoid re-fetching on every question |

---

## 11. Phased Roadmap

### Phase 1 — Auth only

- [ ] `next-auth` v5 + GitHub provider, JWT session strategy
- [ ] `ALLOWED_GITHUB_LOGIN` allow-list check in the `signIn` callback
- [ ] `middleware.ts` protecting `/repos/*` (routes don't exist yet — this phase just proves sign-in works end-to-end with a placeholder protected page)
- [ ] Sign-in/sign-out UI in the sidebar

### Phase 2 — Repo connection

- [ ] `users`, `connected_repos` tables (direct DDL, user-approved — same pattern as every prior schema change in this project)
- [ ] `/repos` list page — fetch via Octokit, connect/disconnect
- [ ] `/repos/[id]` detail page shell (no AI features yet)

### Phase 3 — Resource suggestions

- [ ] `repo_suggestions` table
- [ ] `POST /api/repo-ai/suggest` route + prompt (§7)
- [ ] Suggestion cards UI with "Add as topic"/"Add as resource stub" actions wired to existing `/api/topics`, `/api/resources`
- [ ] "From your code" section on `/ai`

### Phase 4 — Code Q&A (v1, keyword retrieval)

- [ ] `repo_files` table + GitHub content-fetch/cache + `search_vector` column
- [ ] `POST /api/repo-ai/ask` streaming route + prompt (§7)
- [ ] Chat panel UI on `/repos/[id]`
- [ ] "Re-sync" action

### Phase 5 — Embeddings upgrade (only if v1 retrieval proves insufficient)

- [ ] `repo_chunks` table + Neon `pgvector` extension
- [ ] Cohere embedding pipeline on sync
- [ ] Swap `/api/repo-ai/ask` retrieval from keyword to vector search

---

## 12. Open Questions

- **Token storage location:** encrypted column on `users` (proposed above) vs. never persisting the token server-side and re-authenticating per session — the former is simpler for a background "Re-sync" action to work without the user being actively logged in; the latter is more conservative. Default to encrypted-column storage unless a stronger reason emerges during Phase 1 implementation.
- **Multi-repo suggestion dedup:** if two connected repos suggest the same topic, should `repo_suggestions` dedupe against existing `topics` before showing "Add as topic"? Deferred to Phase 3 implementation — likely a simple name-match check against `getTopics()` before rendering the action.
