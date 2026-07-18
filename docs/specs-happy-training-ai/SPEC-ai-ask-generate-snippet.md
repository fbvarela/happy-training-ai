# Happy Training AI — Ask AI to Generate a Snippet from Any Resource (Feature Spec)

> **Personal tool — no auth, no payments, single-user local app.**
> Part of The Happy Factory suite. Follows conventions in `HAPPY-FACTORY-CONTEXT.md` and `BRAND-SPEC.md`.
> Scoped feature spec — complements the full product spec in `docs/specs-happy-training-ai/SPEC.md`.
> Sibling to `SPEC-ai-topic-content-generation.md` (topic → new *resource*) — this spec is content → new *snippet element*.

---

## 1. Vision

The app already has one-click, fixed AI actions per element type: `ExplainTranscript.tsx` explains a video transcript, `ExplainSnippet.tsx` explains a code snippet. Both are read-only — they stream an explanation and, in the transcript case, let you save the whole output back as a new `snippet` element (`ExplainTranscript.tsx:56-78`, POSTing to `/api/resources/[id]/elements`).

What's missing is a **free-text question** aimed at that same content. Example from the feature request: given a Python code snippet, ask "how do I write this in Java instead?" and get back a new snippet — title, language, and Markdown/code body — saved into the same resource, next to the original.

**Core insight:** every element type already has a text body worth asking questions about — `transcript` (video/article text), `code` (snippet), and even `aiSummary` on the resource itself. Rather than one explain button per type, a single "Ask AI" action takes any of those bodies plus a free-text question and produces a properly-typed `snippet` `ResourceElement`, using the exact same save path `ExplainTranscript.tsx` already established.

**Differentiator:** this isn't a chat window bolted onto the resource page — the output lands as a first-class, reusable element (browsable, copyable, searchable) in the same list as hand-written snippets, not a transient conversation.

---

## 2. Target Users

| Persona | Description | Needs from this feature |
|---|---|---|
| Fernando (sole user) | Developer using the app as a personal training/learning knowledge base | Ask a targeted follow-up ("port this to Java", "what's the equivalent in Postgres", "summarize this transcript as a checklist") without leaving the resource, and keep the answer as a reusable artifact |

No multi-tenant personas — personal tool, no auth/billing.

---

## 3. Feature Tiers

Not applicable — single-user personal app. Scope organized by phase (§10).

---

## 4. Feature Details

### 4.1 Ask AI Panel

- A new component, `AskAboutContent.tsx`, generalizes the pattern in `ExplainTranscript.tsx` and `ExplainSnippet.tsx`: same trigger button → streaming panel → save-as-snippet flow, but the trigger opens a single-line text input for the question instead of firing immediately.
- Rendered wherever content already exists to ask about:
  - Next to each `snippet` element's code view (alongside the existing `ExplainSnippet` "Explain with AI" button)
  - Next to each `transcript`-bearing element (video/article), alongside `ExplainTranscript`
  - On the resource's `aiSummary`, if present, on the resource detail page
- Props: `{ content: string, contentLabel: string, resourceId: number, defaultLanguage?: string, onSaved?: (element: ResourceElement) => void }`. `contentLabel` (e.g. "this transcript", "this snippet") is interpolated into the prompt so the model knows what it's looking at without leaking implementation details into the UI copy.

### 4.2 Question → Generation

- New streaming route `POST /api/ai/ask`, following the exact `streamText(...).toTextStreamResponse()` pattern used by `/api/ai/explain` (`src/app/api/ai/explain/route.ts`).
- Request body: `{ content: string, question: string, language?: string }`.
- System prompt (DB-overridable via `settings`, same pattern as `EXPLAIN_CODE_PROMPT_KEY` in `src/lib/ai/explainCodePrompt.ts`) instructs the model to:
  1. Answer the question directly, grounded only in the provided content — no fabricated context
  2. Format the answer as Markdown prose plus at least one fenced code block when the question implies code (language translation, refactor, "show me how")
  3. Use the actual target language's fence tag (e.g. request "in Java" → ` ```java `), not the source language, when a translation/port is requested
  4. Suggest a short title line first (`# <title>`) so the save step has a sane default snippet title instead of reusing the parent element's title
- User prompt assembled as:
  ```
  Content (${contentLabel}):
  ${content}

  Question: ${question}
  ```
- Same model as the existing explain routes: `groq('llama-3.1-8b-instant')`, `maxOutputTokens: 2048` (matches `/api/ai/explain`); bump to `1600`-`2048` range only if truncation is observed in testing.

### 4.3 Save as Snippet

- Reuses the existing `POST /api/resources/[id]/elements` route (`src/app/api/resources/[id]/elements/route.ts`) with `{ type: 'snippet', title, language, code }` — no new API surface, exactly the call `ExplainTranscript.tsx:59-63` already makes for `title: 'AI Explanation'`.
- Title: parsed from the model's leading `# <title>` line (stripped from the saved body); falls back to `Q&A: ${question.slice(0, 60)}` if the model omits it.
- Language: parsed from the first fenced code block's info string if present and it's a member of `LANGUAGES` (`src/lib/snippets/languages.ts`); otherwise falls back to the `defaultLanguage` prop, then `'markdown'`.
- Code body: the full streamed Markdown text (prose + fences), same as `ExplainTranscript`'s save behavior — `code` here means "the element's stored body", not literally code-only, matching how the schema already overloads that column (`resourceElements.code`, `src/lib/db/schema.ts:68`).
- Saved element is appended to the same resource's element list (`order` = current max + 1, matching the existing elements POST handler behavior) so the Q&A output sits alongside the source content it was generated from.

### 4.4 Question History (in-panel only)

- No persistence of the question text itself — only the generated answer, once saved, persists (as a `resourceElements` row). The question is ephemeral UI state, consistent with how `ExplainTranscript`/`ExplainSnippet` treat their triggering action as stateless until "Save".
- Regenerate: same confirm-free re-ask affordance as `ExplainTranscript`'s retry-on-failure button — re-running with the same question and content is idempotent and cheap enough not to need a confirmation gate.

---

## 5. Data Model

No schema changes. The feature is purely a new generation path into the existing `resourceElements` table (`src/lib/db/schema.ts:57-70`), using the already-present `type: 'snippet'` / `language` / `code` columns exactly as manually-created snippets do. No new columns, no new tables.

---

## 6. AI Integration

| Task | Provider | Model | Notes |
|---|---|---|---|
| Ask-about-content generation | Groq | `llama-3.1-8b-instant` | New route `/api/ai/ask`; same model/config as `/api/ai/explain` and `/api/ai/explain-transcript` for consistency and speed |

### Prompt Sketch

```
System (settings key: ask_content_prompt, default below):
You are a senior software engineer and technical writer. You are given a
piece of content from the user's training library and a question about it.
Answer the question directly and completely, grounded only in the given
content — do not invent context that isn't there.

Start your response with a one-line title: "# <short title>".
Then answer in Markdown. If the question implies producing or translating
code, include at least one fenced code block using the correct language tag
for the REQUESTED language (not the source language) — e.g. translating
Python to Java must use ```java, never ```python.
Be direct. Skip generic preambles.

Prompt:
Content (${contentLabel}):
${content}

Question: ${question}
```

---

## 7. Navigation & Screens

| Screen | Route | Change |
|---|---|---|
| Resource detail | `/resources/[id]` | Each `snippet` element gains an "Ask AI" trigger next to `ExplainSnippet`'s "Explain with AI"; each transcript-bearing element gains one next to `ExplainTranscript`'s "AI Explain" |
| Resource detail (summary) | `/resources/[id]` | If `resource.aiSummary` is present, an "Ask AI" trigger appears below it |
| (No new routes) | — | Entirely inline panels reusing the existing resource detail page; no new pages |

---

## 8. Tech Stack

No new dependencies. Reuses:

- `ai` (Vercel AI SDK) + `@ai-sdk/groq` — same `streamText`/`toTextStreamResponse()` pattern as `/api/ai/explain`
- `StreamingText.tsx` — existing streaming markdown/text renderer used by both `ExplainTranscript` and `ExplainSnippet`
- `src/lib/settings/queries.ts` (`getSetting`/`setSetting`) — DB-overridable system prompt, same as `EXPLAIN_CODE_PROMPT_KEY`
- `src/lib/snippets/languages.ts` (`LANGUAGES`) — language validation for the parsed fence tag

---

## 9. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Generation latency | First token < 2s (Groq, matches existing explain routes); streamed, not blocking |
| Idempotency | Save button disabled while save request in flight (`saving` state, same pattern as `ExplainTranscript.tsx:20,56-78`) |
| Content safety | System prompt forbids fabricated context/citations; no auto-save — user must click "Save as snippet" before anything hits the DB |
| Failure handling | Same retry-on-failure UX as `ExplainTranscript.tsx` (`failed` state + `RotateCcw` retry button) |
| Empty question guard | "Ask AI" input disables submit until non-empty question text is entered |

---

## 10. Phased Roadmap

### Phase 1 — Route + snippet-only trigger

- [ ] `POST /api/ai/ask` route (content + question → streamed Markdown, title-line + fence parsing)
- [ ] `src/lib/ai/askContentPrompt.ts` (default system prompt + `ASK_CONTENT_PROMPT_KEY`, settings-overridable)
- [ ] `AskAboutContent.tsx` component (question input → stream → save), wired only into snippet elements next to `ExplainSnippet`

### Phase 2 — Transcript + summary triggers

- [ ] Wire `AskAboutContent.tsx` into transcript-bearing elements next to `ExplainTranscript`
- [ ] Wire into resource `aiSummary` block on `/resources/[id]`

### Phase 3 — Polish

- [ ] Title/language parsing edge cases (no leading `# title` line, unrecognized fence language) verified against real Groq output
- [ ] Regenerate-with-same-question affordance
- [ ] Consider surfacing the originating question as a caption on the saved snippet card (would require a small schema note, not a column — could reuse `title` prefix, e.g. `"Q: <question>"`, deferred until real usage shows it's needed)
