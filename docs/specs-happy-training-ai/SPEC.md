# Happy Training AI — Product Specification

> **Personal tool — no auth, no payments, single-user local app.**
> Part of The Happy Factory suite. Follows conventions in `HAPPY-FACTORY-CONTEXT.md` and `BRAND-SPEC.md`.
> Design reference: `happy-shelter-ai`, `happy-news-ai`.

---

## 1. Vision

Happy Training AI is a personal training knowledge base that turns scattered learning resources — YouTube videos, PDFs, articles, and code snippets — into a structured, AI-enhanced library organized by topic.

**Core insight:** Learning content lives everywhere (YouTube, Drive, GitHub) but thinking happens in one place. Happy Training AI is that place: ingest from anywhere, read, and get AI-powered suggestions without leaving the app.

**Differentiator:** YouTube video transcription pipeline (borrowed from Happy News AI) combined with a code-snippet creator and AI suggestions from Groq and Cohere — purpose-built for technical training and developer self-education.

---

## 2. Feature Details

### 2.1 Topic System

The primary organizing unit. Every resource belongs to a topic.

- **CRUD:** Create topics with name, description, icon/color tag
- **Topic overview:** `/topics/[id]` — grid/list of resources, resource count, last updated
- **Topic sidebar:** Quick-jump to any topic from the left nav (desktop) or bottom nav (mobile)
- **Nested structure:** Optional parent/child topic (e.g., "Programming → TypeScript → Advanced Types")

**Key routes:** `app/topics/page.tsx`, `app/topics/[id]/page.tsx`, `app/topics/new/page.tsx`

### 2.2 Resource Management

Resources are the core content unit. Types: `video`, `pdf`, `article`, `snippet`.

- **Add resource:** URL paste (auto-detects YouTube, PDF, article) or file upload (PDF)
- **Edit resource:** Update title, description, topic assignment, tags
- **Delete resource:** Soft-delete with undo (30s toast)
- **Resource list:** Filterable by type, topic, date, tags; sortable by date/title

**Key routes:** `app/resources/page.tsx`, `app/resources/[id]/page.tsx`, `app/resources/new/page.tsx`

**Resource elements API:**
- `GET/POST  /api/resources/[id]/elements` — list or add elements to a resource
- `PATCH/DELETE /api/resources/[id]/elements/[elementId]` — update or remove an element
- `POST /api/elements/[elementId]/transcribe` — transcribe a video element
- `PATCH /api/elements/[elementId]` — update element fields (transcript, title, url, type, order)
- `POST /api/resources/[id]/rewrite` — rewrite resource transcript for readability (returns new text)
- `POST /api/elements/[elementId]/rewrite` — rewrite element transcript for readability (returns new text)
- `TranscribeButton` accepts optional `isElement` prop to route to the element endpoint
- `TranscriptBlock` client component: inline view/edit/rewrite for any transcript (resource or element)

### 2.3 YouTube Transcription Pipeline + Rewrite

Mirrors the Happy News AI transcription system, with an added readability rewrite step.

- **Input:** YouTube URL (video or playlist)
- **Process:**
  1. Fetch video metadata (title, duration, thumbnail) via YouTube oEmbed
  2. Extract transcript via `youtube-transcript` package
  3. Store raw transcript with timestamps in DB
  4. AI post-process: clean, paragraph-break, and summarize via Groq (`llama-3.3-70b-versatile`)
- **Rewrite for reading:** Separate one-click action (`POST .../rewrite`) that runs a second Groq pass to further clean disfluencies, add ALL-CAPS section headings, and break into readable paragraphs. Uses chunked processing (8 k chars/chunk) with a summarization guard (rejects output shorter than 60 % of input). Ported from Happy News AI `rewriteForReading.ts` but using Groq instead of Cohere.
- **Edit transcript:** `TranscriptBlock` client component in the reader and resource detail page — click Edit → textarea, Save saves via PATCH, Cancel discards.
- **Output:** Readable, formatted transcript rendered in the reader + resource detail
- **UI:** `TranscriptBlock` shows Rewrite and Edit buttons above the transcript text

**Key routes:** `app/api/resources/[id]/transcribe/route.ts`, `app/api/resources/[id]/rewrite/route.ts`, `app/api/elements/[elementId]/rewrite/route.ts`

### 2.4 PDF Viewer

- **Upload:** Drag-and-drop or file picker → store on local filesystem or Vercel Blob
- **Viewer:** In-app PDF rendering via `react-pdf` (PDF.js wrapper)
- **Controls:** Page navigation, zoom, full-screen mode
- **Mobile:** Pinch-zoom, swipe between pages

**Key routes:** `app/resources/[id]/pdf/page.tsx`

### 2.5 User-Friendly Reader

A clean, distraction-free reading view for any resource type.

- **Article resources:** Fetch and parse article body via `@extractus/article-extractor`; render in reader mode
- **YouTube resources:** Embedded player + transcription side-by-side (split view on desktop, tabs on mobile)
- **PDF resources:** PDF viewer embedded inline
- **Snippet resources:** Syntax-highlighted code block (Shiki)
- **Typography:** Clean mono body, generous line-height, max 70ch width

**Key routes:** `app/resources/[id]/read/page.tsx`

### 2.6 Code Snippet Creator

First-class support for code, distinct from full resource pages.

- **Create:** Language selector, title, code editor (CodeMirror), description
- **Syntax highlighting:** Shiki with theme matching app dark/light mode
- **Languages:** TypeScript, JavaScript, Python, SQL, Bash, Go, Rust, JSON, YAML, and more
- **Linking:** A snippet can be linked to a parent resource or standalone
- **Copy button:** One-click copy
- **Tagging:** Tags for quick cross-topic lookup
- **AI assist:** "Explain this snippet" and "Improve this snippet" via Groq

**Key routes:** `app/snippets/page.tsx`, `app/snippets/[id]/page.tsx`, `app/snippets/new/page.tsx`

### 2.7 AI Suggestions (Groq + Cohere)

| Task | Provider | Model |
|---|---|---|
| Transcript post-processing | Groq | `llama-3.3-70b-versatile` |
| Code snippet explanation / improvement | Groq | `llama-3.3-70b-versatile` |
| Resource Q&A | Groq | `llama-3.3-70b-versatile` |
| Semantic resource search | Cohere | `embed-multilingual-v3.0` |
| Topic synthesis (cross-resource summary) | Cohere | `command-r-plus` |
| Related resource suggestions | Cohere | Rerank API |

**Integration:** Via Vercel AI SDK (`ai` package) with streaming responses.

**Key routes:** `app/api/ai/suggest/route.ts`, `app/api/ai/explain/route.ts`, `app/api/ai/synthesize/route.ts`

---

## 3. Data Model

```
topics
  id, name, slug, description, icon, color,
  parent_id (nullable → self-ref for nesting), created_at, updated_at

resources                          ← learning unit / container
  id, topic_id (FK → topics),
  type (video/pdf/article/snippet), -- legacy single-type; elements[] is the new way
  title, description, url (nullable), file_url (nullable),
  thumbnail_url, tags (text[]),
  transcript (text, nullable), transcript_status (pending/processing/done/failed),
  ai_summary (text, nullable),
  created_at, updated_at, deleted_at (soft delete)

resource_elements                  ← one-to-many: a resource bundles multiple media items
  id, resource_id (FK → resources),
  type (video/pdf/image/article/file),  -- image (png/jpg/jpeg/gif/webp/svg) renders inline with a click-to-zoom lightbox
  url (nullable), file_url (nullable),
  title (optional label),
  order (integer, display order),
  transcript (text, nullable), transcript_status,
  created_at

snippets
  id, resource_id (nullable FK → resources),
  title, description, language, code (text),
  tags (text[]), created_at, updated_at
```

A resource is a **learning unit** — its `resource_elements` hold the actual media (video + PDF + article all linked together). The reader renders them in `order` sequence.

---

## 4. AI Integration

### Providers

| Provider | SDK | Purpose |
|---|---|---|
| **Groq** | `@ai-sdk/groq` | Fast inference: transcription cleanup, snippet Q&A, real-time suggestions |
| **Cohere** | `@ai-sdk/cohere` | Embeddings for semantic search, rerank for related resources, topic synthesis |

### Prompt Approach

- **Transcription cleanup:** System prompt as "technical content editor"; outputs paragraphs + key concepts list.
- **Topic synthesis:** Collects all resource summaries for a topic → "learning map" (what's covered, what's missing, suggested next steps).
- **Related resources:** Cohere embed resource titles + summaries → vector search → rerank → top 5 suggestions.
- **Snippet explain:** Code + language → step-by-step explanation with complexity and caveats.

---

## 5. Navigation & Screens

| Screen | Route | Description |
|---|---|---|
| Home / Dashboard | `/` | Recent resources, quick add, topic overview cards |
| Topics List | `/topics` | All topics with resource counts |
| Topic Detail | `/topics/[id]` | Resources within a topic, AI synthesis CTA |
| Resource Detail | `/resources/[id]` | Reader view auto-selected by type |
| Resource Reader | `/resources/[id]/read` | Clean reader (article / transcript) |
| PDF Viewer | `/resources/[id]/pdf` | In-app PDF with controls |
| New Resource | `/resources/new` | URL paste / file upload form |
| Edit Resource | `/resources/[id]/edit` | Edit metadata, re-transcribe |
| Snippets List | `/snippets` | All code snippets, filterable by language/tag |
| Snippet Detail | `/snippets/[id]` | Syntax-highlighted view + AI explain |
| New Snippet | `/snippets/new` | Editor + language picker |
| AI Suggestions | `/ai` | Topic synthesis, related resource discovery |
| Settings | `/settings` | API keys reference + editable AI prompts (code explain, transcript explain/rewrite, summarize, topic synthesis) |

---

## 6. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Server Components, streaming, Route Handlers |
| **Language** | TypeScript | Strict mode |
| **Database** | Neon PostgreSQL | `@neondatabase/serverless` + `drizzle-orm/neon-http` |
| **ORM** | Drizzle ORM | `drizzle-orm/pg-core`, `drizzle-kit push` (explicit `DATABASE_URL=…` prefix) |
| **File Storage** | Local filesystem | PDFs stored in `public/uploads/` or configurable path |
| **AI — Fast** | Groq via `@ai-sdk/groq` | Transcription, Q&A, snippet explain |
| **AI — Semantic** | Cohere via `@ai-sdk/cohere` | Embeddings, rerank, synthesis |
| **AI SDK** | Vercel AI SDK (`ai`) | Streaming, unified interface |
| **PDF** | `react-pdf` (PDF.js) | Client-side PDF rendering |
| **Code editor** | CodeMirror 6 | Snippet creator |
| **Syntax highlight** | Shiki | Reader + snippet view |
| **YouTube** | `youtube-transcript` | Caption extraction |
| **Styling** | Tailwind CSS v4 + HF brand CSS tokens | `@variant dark (&:where(.dark, .dark *))` for class-based dark mode |
| **Components** | Happy Factory brand system | `.btn`, `.hf-card`, `.hf-input`, `.hf-badge` — no shadcn/ui except Toaster |
| **Deployment** | Local / Vercel | Runs locally; optional Vercel deploy |

---

## 7. Non-Functional Requirements

| Requirement | Target |
|---|---|
| First Contentful Paint | < 1.5s |
| PDF load (< 5MB) | < 2s |
| Transcript processing | < 30s (streamed progress) |
| Responsive breakpoints | 375px, 768px, 1024px, 1440px |
| Mobile tap targets | ≥ 44px |

---

## 8. Phased Roadmap

### Phase 1 — MVP (v1.0)

- [ ] Project scaffold (Next.js 15, Drizzle, SQLite/Turso, Tailwind, shadcn/ui)
- [ ] Topic CRUD
- [ ] Resource CRUD (video URL + PDF upload)
- [ ] YouTube transcription pipeline (Groq post-process)
- [ ] PDF viewer (`react-pdf`)
- [ ] Reader view (article extractor + transcript view)
- [ ] Code snippet creator (CodeMirror + Shiki)
- [ ] Basic AI suggestions (Groq — explain snippet, summarize resource)
- [ ] Dark sidebar + mobile bottom nav layout

### Phase 2 — AI Enhancement (v1.1)

- [ ] Cohere embeddings for semantic resource search
- [ ] Related resource suggestions (Cohere rerank)
- [ ] Topic synthesis — cross-resource "learning map" (Cohere command-r-plus)
- [ ] YouTube playlist import (bulk transcription queue)

### Phase 3 — Reader UX (v1.2)

- [ ] Highlight-to-snippet (select PDF/transcript text → create snippet)
- [ ] Transcript timestamp deep-links (click timestamp → seek YouTube embed)
- [ ] Resource full-text search

---

## 9. Implementation Plan

See `docs/specs-happy-training-ai/PLAN.md` for the step-by-step build plan with file structure and commands.
