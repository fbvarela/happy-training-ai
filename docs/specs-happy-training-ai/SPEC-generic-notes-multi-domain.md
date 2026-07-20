# Happy Training AI — Generic Notes for Multi-Domain Content (Feature Spec)

> **Personal tool — no auth, no payments, single-user local app.**
> Part of The Happy Factory suite. Follows conventions in `HAPPY-FACTORY-CONTEXT.md` and `BRAND-SPEC.md`.
> Scoped feature spec — complements the full product spec in `docs/specs-happy-training-ai/SPEC.md`.
> Sibling to `SPEC-ai-topic-content-generation.md` and `SPEC-ai-ask-generate-snippet.md`, both of which currently
> assume the "snippet" concept is code — this spec generalizes it.

---

## 1. Vision

The app was built around programming training — its "Snippets" concept (`src/lib/db/schema.ts:39-49`, `src/app/snippets/*`, `AskAboutContent.tsx`'s save-as-snippet flow) always assumes a `language` + `code` shape: a language picker defaulting to `typescript`, a `CodeEditor` with syntax highlighting, a `Code2` icon everywhere. That's the right shape for "how do I retry a fetch in TypeScript" — it's the wrong shape for "what pruning schedule works for this rose variety" or "restructure this paragraph for clarity."

The user now wants to store *any* kind of training material under topics — writing, gardening, cooking, whatever — not just code. Forcing a language dropdown and a monospace code editor onto a gardening note is actively hostile to that content.

**Core insight:** the infrastructure is closer to domain-agnostic than it looks. `LANGUAGES` (`src/lib/snippets/languages.ts`) already includes `'markdown'` as a value, and `SnippetForm.tsx:96-109` already branches on `language === 'markdown'` to show a Source/Preview `MarkdownPreview` toggle instead of the code editor — i.e. a prose-only note already works today, just mislabeled and hidden behind a form built for code. The fix isn't a new content type; it's renaming and reordering what already exists so prose is the *default* path, not an edge case of the code path.

**Differentiator:** rather than bolting on a parallel "Notes" system, this spec generalizes the single existing snippet/element mechanism so topics can mix code notes and prose notes side by side, with the UI adapting per-note rather than the app assuming everything is code.

---

## 2. Target Users

| Persona | Description | Needs from this feature |
|---|---|---|
| Fernando (sole user) | Uses the app for programming training today; wants to extend it to non-coding topics (writing, gardening, etc.) | Create a topic like "Gardening" and add prose notes to it without a language dropdown, code font, or "Snippets" label getting in the way; keep the existing code-note experience unchanged for programming topics |

No multi-tenant personas — personal tool, no auth/billing.

---

## 3. Feature Tiers

Not applicable — single-user personal app. Scope organized by phase (§10).

---

## 4. Feature Details

### 4.1 Rename "Snippet" → "Note" (code becomes one note kind, not the definition)

- Product-facing rename only where "Snippet" currently implies code: nav label (`Sidebar.tsx:13`, `BottomNav.tsx:13`) "Snippets" → "Notes"; page titles `src/app/snippets/page.tsx` "Snippets" → "Notes", description "Code snippets with syntax highlighting" → "Notes, code, and reference material"; icon `Code2` → a neutral icon (`FileText`, already imported in `topics/icons.ts`) for the nav/list default, with `Code2` retained specifically for notes whose language is a real programming language (see §4.2).
- No renaming of underlying identifiers that would require a migration: `snippets` table, `resourceElements.type === 'snippet'`, `/api/snippets/*`, `/snippets/*` routes all keep their current names. This is a UI/copy-layer rename, not a schema rename — matches this codebase's convention of avoiding non-additive migrations without explicit user approval (see `AGENTS.md` gotchas on `search_vector`-style raw-DDL caution).

### 4.2 Kind inference from language, not a mandatory picker

- `SnippetForm.tsx` and the inline `AddForm`/`MainPanel` snippet editor in `ResourceWorkspace.tsx` currently default `language` to `'typescript'` and always show the language `<select>` (`SnippetForm.tsx:64-75`). Change the default to `'markdown'` — a blank new note opens straight into prose mode (`MarkdownPreview`/Source toggle), matching what a gardening or writing note needs with zero configuration.
- The language picker stays, but reframed as "Format" and collapsed by default behind a "Change format" toggle for non-code topics, expanding only when the user explicitly wants a programming-language note. Coding topics (see §4.3) can default the picker open, since language selection is the common case there.
- `CodeView.tsx` and `CodeEditor.tsx` already fall back gracefully for unrecognized/plain languages (per the `AGENTS.md` gotcha on Shiki's `.catch()` fallback) — no changes needed there; `language === 'markdown'` already routes to prose rendering, so this is purely a defaults/ordering change, not new rendering logic.

### 4.3 Topic-level content-kind hint (optional, non-blocking)

- Add an optional `contentKind` enum-ish text column to `topics` (`'code' | 'prose' | null`), set at topic creation/edit time, purely advisory — never restricts what a resource under that topic can contain.
- When set, it only changes UI defaults: `contentKind: 'code'` topics default new notes to the last-used programming language and keep the picker expanded; `contentKind: 'prose'` (or unset) topics default to `'markdown'` and collapse the picker, per §4.2.
- Topic form (`src/app/topics/new/page.tsx` / edit) gets a simple two-option toggle ("Mostly code" / "Mostly writing") next to the existing icon/color pickers — optional, defaults to prose-friendly since that's the new baseline behavior from §4.2 regardless.

### 4.4 Domain-appropriate topic icons

- `TOPIC_ICONS` (`src/lib/topics/icons.ts`) currently leans technical (`Code2`, `Wrench`, `FlaskConical`, `Rocket`). Add a small set of domain-neutral additions relevant to the stated use cases — e.g. `Sprout` (gardening), `PenTool` (writing), `ChefHat` (cooking) — as pure additive entries in the existing `TOPIC_ICONS` record, no schema change (the `topics.icon` column already stores an arbitrary key string).
- No restriction on which icon goes with which `contentKind` — this is just expanding the picker's options, matching the existing icon-selection UI in the topic form.

### 4.5 AI features stop assuming code

- `AskAboutContent.tsx` (`SPEC-ai-ask-generate-snippet.md` §4.3) currently falls back to `defaultLanguage ?? 'typescript'` when saving an answer as a note if the model's response has no fenced code block. Change the fallback to `'markdown'` — an AI answer about a gardening question shouldn't get labeled `typescript` just because that was the historical default.
- `src/lib/ai/askContentPrompt.ts` and `src/lib/ai/explainCodePrompt.ts` system prompts are inherently code-framed ("senior software engineer", "Key concepts... code example"). These stay as-is for now since they're triggered from code snippets/transcripts specifically (§10 Phase 2 revisits whether a parallel "explain this" prompt tuned for prose content is worth adding once real non-coding content exists to test it against).
- `SPEC-ai-topic-content-generation.md`'s planned `/api/ai/generate` (topic → new resource) should read `topics.contentKind` (§4.3) once both land, to steer its system prompt's "include a code example" instruction — already conditional on "when the topic is code-related" per that spec's §4.1, so this is just wiring a hint into an existing conditional rather than new logic.

### 4.6 Explicitly out of scope

- No per-domain custom fields (e.g. structured "difficulty/soil type" metadata for gardening notes, "word count" for writing notes). A title + Markdown body + optional language tag is deliberately the one shape for all domains — matches this app's existing philosophy of one `resourceElements`/`snippets` shape for everything rather than type-specific tables.
- No separate top-level nav section per domain. Topics already provide the hierarchical organization (`topics.parentId`); a "Gardening" topic tree does that job without new navigation.

---

## 5. Data Model

Builds on the existing `topics` and `snippets`/`resourceElements` tables (`src/lib/db/schema.ts`). One additive column:

```
topics.content_kind   text   nullable   -- 'code' | 'prose' | null (unset = prose-default UI)
```

No changes to `snippets` (`id, resourceId, title, description, language, code, tags, createdAt, updatedAt`) or `resourceElements` (`..., language, code, ...`) — `language: 'markdown'` already fully represents a prose note in the existing schema; `contentKind` only affects form defaults, never storage shape. No new tables.

---

## 6. AI Integration

No new AI routes. Existing routes' defaults change per §4.5:

| Route | Change |
|---|---|
| `POST /api/ai/ask` (`SPEC-ai-ask-generate-snippet.md`) | `AskAboutContent.tsx` save-as-note fallback language: `typescript` → `markdown` |
| `POST /api/ai/generate` (planned, `SPEC-ai-topic-content-generation.md`) | Reads `topics.contentKind` (once §4.3 ships) to decide whether to push for a code example in the generated draft |

---

## 7. Navigation & Screens

| Screen | Route | Change |
|---|---|---|
| Nav (sidebar + bottom) | global | "Snippets" label → "Notes"; icon stays `Code2` in nav per §4.1 unless a neutral swap is preferred — final call deferred to implementation, both are additive copy/icon edits |
| Notes list | `/snippets` | Title/description copy updated (§4.1); list rows unaffected otherwise |
| New/Edit Note | `/snippets/new`, `/snippets/[id]/edit` | `SnippetForm.tsx` defaults to `markdown`, picker collapsed by default (§4.2) |
| Topic new/edit | `/topics/new`, `/topics/[id]/edit` | Add optional content-kind toggle (§4.3); add new icon options (§4.4) |
| Resource detail (inline add) | `/resources/[id]` | `AddForm`'s snippet mode in `ResourceWorkspace.tsx` gets the same `markdown`-default, collapsed-picker treatment as `SnippetForm.tsx` |

---

## 8. Tech Stack

No new dependencies. Pure reuse:

- `MarkdownPreview` (`src/components/markdown/MarkdownPreview.tsx`) — already renders the prose path
- `CodeEditor`/`CodeView` — unchanged, still used when `language !== 'markdown'`
- `LANGUAGES` (`src/lib/snippets/languages.ts`) — unchanged list, just a different default index
- `lucide-react` — source of the additional topic icons (§4.4)

---

## 9. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Backward compatibility | Every existing snippet/note with a real programming language keeps its current editor/highlighting behavior unchanged — this is a *default*, not a forced re-classification of existing rows |
| Migration safety | Single additive nullable column (`topics.content_kind`); no backfill required, no existing behavior depends on it being set |
| Discoverability | A user landing on a blank new-note form for a "Gardening" topic should see a plain text/Markdown editor with no visible language jargon unless they opt into "Change format" |

---

## 10. Phased Roadmap

### Phase 1 — Prose-first defaults (no schema change)

- [ ] `SnippetForm.tsx`: default `language` state to `'markdown'`, collapse the language `<select>` behind a "Change format" toggle
- [ ] `ResourceWorkspace.tsx`'s inline snippet `AddForm`/`MainPanel` editor: same default + collapse treatment
- [ ] Nav/page copy: "Snippets" → "Notes" (`Sidebar.tsx`, `BottomNav.tsx`, `src/app/snippets/page.tsx`)
- [ ] `AskAboutContent.tsx`: save-as-note language fallback `typescript` → `markdown`

### Phase 2 — Topic content-kind hint

- [ ] `topics.content_kind` additive column + migration (direct DDL, user-approved per this codebase's existing migration pattern)
- [ ] Topic new/edit form: "Mostly code" / "Mostly writing" toggle
- [ ] New-note form reads the parent topic/resource's topic(s) to pick the smarter default (code topics keep language picker expanded, last-used language remembered)

### Phase 3 — Domain icon set + AI wiring

- [ ] Add `Sprout`, `PenTool`, `ChefHat` (and similarly neutral additions as real usage reveals gaps) to `TOPIC_ICONS`
- [ ] Wire `topics.content_kind` into the planned `/api/ai/generate` route's system prompt (`SPEC-ai-topic-content-generation.md` §4.1) once that route ships
- [ ] Revisit whether `askContentPrompt.ts`/`explainCodePrompt.ts` need a prose-tuned sibling prompt, based on real non-coding content collected by then
