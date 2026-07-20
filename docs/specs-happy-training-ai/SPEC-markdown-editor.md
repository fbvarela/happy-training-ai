# Happy Training AI — Unified Markdown Editor (Feature Spec)

> **Personal tool — no auth, no payments, single-user local app.**
> Part of The Happy Factory suite. Follows conventions in `HAPPY-FACTORY-CONTEXT.md` and `BRAND-SPEC.md`.
> Scoped feature spec — complements the full product spec in `docs/specs-happy-training-ai/SPEC.md`.
> Design reference: `happy-shelter-ai`, `happy-news-ai`.

---

## 1. Vision

Happy Training AI currently has **three separate, inconsistent editing surfaces** for what is fundamentally the same thing — text authored by one person for their own later reading:

| Surface | Component | Storage format | Formatting |
|---|---|---|---|
| Transcript editing | [`TranscriptBlock.tsx`](../../src/components/resources/TranscriptBlock.tsx) | Sanitized HTML (contentEditable + DOMPurify) | Bold, italic, 4 font sizes via toolbar |
| Resource description | [`ResourceForm.tsx`](../../src/components/resources/ResourceForm.tsx), [`PDFUpload.tsx`](../../src/components/resources/PDFUpload.tsx) | Plain text `<textarea>` | None |
| Code / snippets | [`CodeEditor.tsx`](../../src/components/snippets/CodeEditor.tsx) (CodeMirror) + [`CodeView.tsx`](../../src/components/snippets/CodeView.tsx) (Shiki) | Raw code string + `language` column | Syntax highlighting only, no prose |

This split means three different data formats in the DB (`transcript` HTML, `description` plain text, `code`/`language` raw text), three toolbars to maintain, and no way to mix prose and code in one place — e.g. a transcript note that wants to reference an inline code sample has nowhere natural to put it.

**Core insight:** All of this content is the same primitive — Markdown. A single editor component, storing one canonical Markdown string, can power transcript editing, resource descriptions, and snippet authoring. A fenced code block dropped into a transcript renders exactly like a standalone snippet (same Shiki call); a standalone snippet is really just a one-fence Markdown document.

**Differentiator:** Rather than bolting a third rich-text system onto the two that already exist (HTML contentEditable + CodeMirror), this collapses them into one `MarkdownEditor`/`MarkdownView` pair reused everywhere, cutting the amount of editor code roughly in half and making transcript rewrite output (already plain paragraphs from the Groq pipeline) trivially storable without an HTML-wrapping step.

---

## 2. Target Users

| Persona | Description | Needs from this feature |
|---|---|---|
| Fernando (sole user) | Developer using the app as a personal training/learning knowledge base | One consistent way to write and format notes, whether editing a video transcript, a resource description, or a code snippet — without re-learning a different toolbar each time |

No multi-tenant personas — this is a personal tool, not a SaaS product (see `SPEC.md` §1 banner).

---

## 3. Feature Tiers

Not applicable — single-user personal app, no auth or billing (per `SPEC.md`). Scope is organized by **Core** (ships first, replaces existing pain points) vs **Later** (nice-to-have, deferred) instead of Free/Premium — see §10 Phased Roadmap.

---

## 4. Feature Details

### 4.1 Markdown Editing Core

- Plain `<textarea>`-backed source editor (not `contentEditable`) — avoids the DOM-manipulation fragility of the current `TranscriptBlock` implementation (manual `Range.surroundContents` for font size, `document.execCommand` for bold/italic).
- Toolbar buttons insert Markdown syntax at the cursor/selection instead of wrapping DOM nodes:
  - **Bold** → wraps selection in `**…**`
  - *Italic* → wraps selection in `*…*`
  - Heading → prefixes line with `## `
  - List → prefixes selected lines with `- `
  - Code fence → wraps selection in ` ```lang\n…\n``` `, prompting for language if none set
- Keyboard shortcuts: `Cmd/Ctrl+B` bold, `Cmd/Ctrl+I` italic — parity with the toolbar, not currently present in `TranscriptBlock`.
- Edit / Preview toggle (or split view later — see §10 Phase 4) instead of always-live-contentEditable rendering.

### 4.2 Snippet / Code Fence Support

- A fenced block (` ```typescript … ``` `) is the unit that used to be a whole separate `snippets` row or `resource_elements.code`/`language` pair.
- Language picker on fence-insert reuses the existing client-safe [`LANGUAGES`](../../src/lib/snippets/languages.ts) constant (already extracted in the snippet-content-type work to avoid pulling the server-only Neon client into client bundles — see §8).
- v1: the fence is edited as plain text inside the same `<textarea>`; the Preview pane pipes fence contents through the same `codeToHtml` (Shiki, `one-dark-pro` theme) call `CodeView.tsx` already uses, so highlighting is pixel-identical to today's snippet view.
- v2 (later): focusing a fence swaps that region to an embedded CodeMirror instance (reusing `CodeEditor.tsx`) for line numbers and language-aware indentation — deferred, not required for parity with today's feature set.

### 4.3 Unified Content Field

Replaces these columns with one `content` (Markdown text, nullable) column, added to each table that currently has bespoke text storage:

| Table | Current column(s) | New column |
|---|---|---|
| `resources` | `transcript` (HTML), `description` (plain text) | `content` (Markdown) — transcript and description become two Markdown fields on the same row, or are merged into one long-form note depending on Phase 3 decision (see §10) |
| `resource_elements` | `transcript` (HTML), `code` + `language` | `content` (Markdown, code lives in a fence) |
| `snippets` | `code`, `language`, `description` | `content` (Markdown, code lives in a fence; `language` becomes derived from the fence info-string rather than a separate column) |

`MarkdownView` (read) and `MarkdownEditor` (write) become the only two components involved, replacing `TranscriptBlock`'s dual-path `HTML_TAG_RE` detection / `plainToHtml` legacy-format conversion, `ResourceForm`'s plain textarea, and `SnippetForm`'s title/description/language/code multi-field form.

### 4.4 Migration Strategy

Follows the additive-column → backfill → verify → drop pattern already used twice in this project (`resource_topics` join table, `resource_elements.language`/`code`):

1. Add nullable `content` column to `resources`, `resource_elements`, `snippets` (DDL run directly against the live Neon DB with explicit user approval — this project has no `drizzle-kit migrate` history; see `AGENTS.md`/session precedent).
2. Backfill: HTML `transcript` → Markdown via a one-time HTML→MD conversion pass; plain `description` copied as-is (already valid Markdown, since it has no formatting); `code`/`language` wrapped into a single fence (`` ```{language}\n{code}\n``` ``).
3. Dual-read period: `MarkdownView` checks `content` first, falls back to rendering the legacy columns if `content` is null, so nothing breaks mid-migration.
4. Verify visually (live browser check per this project's established verification workflow) across a representative resource, element, and snippet.
5. Drop legacy columns once a codebase-wide grep confirms zero remaining references (same check used before dropping `resources.topic_id`).

### 4.5 Rendering

- `<MarkdownView content={string} />` parses Markdown → sanitized HTML (headings, bold/italic, lists, links, fenced code) and renders via `dangerouslySetInnerHTML`, sanitized with `DOMPurify` — reusing the exact sanitize-then-render pattern already shipped in `TranscriptBlock.tsx` (`ALLOWED_TAGS`/`ALLOWED_ATTR` allowlist), extended with a couple more tags (`ul`/`ol`/`li`/`a`/`pre`/`code`).
- Fenced code blocks inside the parsed HTML are re-rendered through Shiki (`codeToHtml`) as a post-process step, matching `CodeView.tsx` output exactly.

---

## 5. Data Model

Current relevant schema (`src/lib/db/schema.ts`):

```
resources
  id, type, title, description (plain text), url, file_url,
  thumbnail_url, tags, transcript (HTML), transcript_status,
  ai_summary, created_at, updated_at, deleted_at

resource_elements
  id, resource_id, type ('video'|'pdf'|'article'|'file'|'image'|'snippet'),
  url, file_url, title, order,
  transcript (HTML), transcript_status,
  language, code,                    ← added for snippet-as-content (PR #25)
  created_at

snippets
  id, resource_id (nullable), title, description,
  language, code, tags, created_at, updated_at
```

Proposed additive columns (Phase 1–3, see §10):

```
resources.content          text  (nullable)  -- Markdown, replaces transcript + description
resource_elements.content  text  (nullable)  -- Markdown, replaces transcript + code/language
snippets.content           text  (nullable)  -- Markdown, replaces code + language + description
```

`language` on `resource_elements`/`snippets` becomes derived (parsed from the first fence's info-string, e.g. ` ```typescript `) rather than stored — dropped once `content` is the source of truth. `title` and `tags` are untouched; they aren't prose.

---

## 6. AI Integration

| Task | Provider | Current output | Change under this spec |
|---|---|---|---|
| Transcript rewrite (`/api/resources/[id]/rewrite`, `/api/elements/[elementId]/rewrite`) | Groq `llama-3.3-70b-versatile` | Plain paragraphs + `ALL-CAPS` headings, wrapped into HTML by `plainToHtml()` in `TranscriptBlock.tsx` at edit-time | Prompt updated to emit real Markdown (`## HEADING`, blank-line-separated paragraphs) so the output is stored directly in `content` — removes the `plainToHtml` conversion step entirely |
| Snippet explain (`ExplainSnippet.tsx`) | Groq | Reads `snippet.code` + `snippet.language` columns | Reads the fence out of `snippet.content` via a small Markdown fence parser (`content.match(/```(\w+)?\n([\s\S]*?)```/)`) instead of dedicated columns |
| Topic synthesis, resource search | Cohere | Reads `resource.aiSummary`/title | Unaffected — doesn't touch transcript/description directly |

No new AI providers or models introduced by this feature.

---

## 7. Navigation & Screens

Where the new `MarkdownEditor`/`MarkdownView` pair is wired in, replacing the current bespoke editors:

| Screen | Route | Current editor | Becomes |
|---|---|---|---|
| Resource detail — transcript | `/resources/[id]` | `TranscriptBlock.tsx` | `MarkdownEditor` / `MarkdownView` |
| Resource reader — transcript | `/resources/[id]/read` | `TranscriptBlock.tsx` (inline) | `MarkdownView` |
| New/Edit resource — description | `/resources/new`, `/resources/[id]/edit` | Plain `<textarea>` in `ResourceForm.tsx` | `MarkdownEditor` |
| PDF upload — description | `/resources/new` (Upload PDF tab) | Plain `<textarea>` in `PDFUpload.tsx` | `MarkdownEditor` |
| New/Edit snippet | `/snippets/new`, `/snippets/[id]/edit` | `SnippetForm.tsx` (title/description/language + `CodeEditor`) | `MarkdownEditor`, title stays a separate field |
| Snippet detail | `/snippets/[id]` | `CodeView.tsx` | `MarkdownView` |
| Resource workspace — "Add content → Snippet" | `/resources/[id]` (`ResourceWorkspace.tsx` `AddForm`) | Language select + `CodeEditor` | `MarkdownEditor` (fence-first) |

---

## 8. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Markdown parsing | `marked` or `micromark` (new dependency) | Small, no React runtime dependency; pick `marked` for simplicity — matches the "no premature abstraction" preference already visible in this codebase's minimal-dependency choices |
| Sanitization | `isomorphic-dompurify` *(swapped in from plain `dompurify` — see below)* | Same allowlist pattern, extended with list/link/code tags |
| Code highlighting | `shiki` *(already installed)* | Unchanged — `codeToHtml`, `one-dark-pro` theme |
| Code input (v2 fence editing) | `@codemirror/*` *(already installed)* | Reused only for the focused-fence enhancement (§10 Phase 4), not required for v1 |
| DB | Neon Postgres + Drizzle *(already in use)* | Additive nullable columns, same direct-DDL migration pattern as `resource_topics` and `resource_elements.language`/`code` |

Plain `dompurify` has no `window` on the server, so `renderMarkdown()` (`src/lib/markdown/render.ts`) crashed with `DOMPurify.sanitize is not a function` on every server-rendered request that hit the Markdown preview path — latent since `TranscriptBlock` but only surfaced once `SPEC-generic-notes-multi-domain.md` Phase 1 made `markdown` the default note format. `isomorphic-dompurify` wraps `jsdom` so sanitization runs identically on server and client; it's a drop-in replacement, same `DOMPurify.sanitize(html, opts)` call site.

---

## 9. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Markdown parse + sanitize (per render) | < 50ms for a typical transcript (~5k words) |
| Editor typing responsiveness | No visible input lag in the `<textarea>` — plain textarea input is strictly cheaper than the current `contentEditable` + `Range` manipulation |
| Migration data integrity | Every existing HTML transcript, plain description, and code/language pair must round-trip into Markdown with no visible content loss, verified live (screenshot before/after) before legacy columns are dropped — same bar as the `resource_topics` migration verification |
| Accessibility | Toolbar buttons remain keyboard-navigable and screen-reader labeled, same as today's `TranscriptBlock` toolbar |
| Backward compatibility | `MarkdownView` must render pre-migration rows unchanged during the dual-read window (§4.4 step 3) — no "content" flash of empty/broken state |

---

## 10. Phased Roadmap

### Phase 1 — Core editor, transcript only (highest existing pain point)

- [ ] Build `MarkdownEditor` (textarea + Bold/Italic/Heading/List/Code-fence toolbar, keyboard shortcuts)
- [ ] Build `MarkdownView` (parse → sanitize → render, Shiki post-process for fences)
- [ ] Add nullable `resources.content` / `resource_elements.content` columns (direct DDL, user-approved)
- [ ] Wire into `TranscriptBlock.tsx` call sites (`/resources/[id]`, `/resources/[id]/read`), dual-reading legacy `transcript` HTML when `content` is null
- [ ] Update the Groq rewrite prompt to emit Markdown directly

### Phase 2 — Snippets

- [ ] Add nullable `snippets.content` column
- [ ] Rework `SnippetForm.tsx` to use `MarkdownEditor` with a fence-first layout (title field + editor, language derived from fence)
- [ ] Update `ExplainSnippet.tsx` to parse the fence instead of reading `code`/`language` columns
- [ ] Migrate `resource_elements` type `'snippet'` (added in PR #25) onto `content` too, replacing its `language`/`code` columns

### Phase 3 — Resource descriptions

- [ ] Replace the plain `<textarea>` in `ResourceForm.tsx` / `PDFUpload.tsx` with `MarkdownEditor`
- [ ] Decide (at implementation time) whether `description` merges into the same `content` field as `transcript`, or stays a distinct short-form Markdown field — current lean: keep separate, since a resource's description is a caption while its transcript/content is the long-form body

### Phase 4 — Cleanup + enhancements (later)

- [ ] Grep-verify zero remaining references to `transcript`, legacy `description`, `code`, `language` columns; drop them
- [ ] Split-view live preview (side-by-side instead of Edit/Preview toggle)
- [ ] Focused-fence CodeMirror upgrade (line numbers, language-aware indent) reusing `CodeEditor.tsx`
- [ ] Markdown import (paste HTML → auto-convert) / export (download a resource's content as `.md`)

---

## 11. Relationship to Existing Spec

This document scopes one feature area. It does not replace `docs/specs-happy-training-ai/SPEC.md`, which is the full-product spec and predates several since-shipped features (multi-topic resources, R2 file storage, rich-text transcript toolbar, snippet-as-resource-content). Section §5 Data Model above reflects the **current** schema, not `SPEC.md`'s original (now partially stale) model — treat this document as the source of truth for the editor/content-storage area until `SPEC.md` is refreshed.
