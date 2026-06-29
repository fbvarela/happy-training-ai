# Happy Training AI — Next.js 15 Implementation Plan

> Bootstrap plan for the Next.js 15 App Router app.
> Personal tool — no auth, no payments, single user.
> Tech stack: Next.js 16, Drizzle + Neon PostgreSQL, Tailwind v4, Happy Factory brand system, Groq, Cohere, local file storage.

---

## Phase 1 — Project Scaffold

### Step 1.1 — Create Next.js 15 app

```bash
npx create-next-app@latest happy-training-ai \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"
```

### Step 1.2 — Install core dependencies

```bash
# Database — Neon PostgreSQL
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit

# AI
npm install ai @ai-sdk/groq @ai-sdk/cohere

# YouTube
npm install youtube-transcript

# PDF viewer
npm install react-pdf

# Code editor + syntax highlight
npm install @codemirror/state @codemirror/view @codemirror/lang-javascript
npm install shiki

# Article extractor
npm install @extractus/article-extractor

# Toasts (Sonner via shadcn, only UI primitive kept)
npx shadcn@latest add sonner
```

---

## Phase 2 — Database Schema

### Step 2.1 — Drizzle config (Neon PostgreSQL)

```
drizzle.config.ts
src/lib/db/
  index.ts          ← Neon serverless connection via @neondatabase/serverless
  schema.ts         ← all tables (pg-core: pgTable, serial, text, integer, timestamp)
```

`drizzle.config.ts`:
```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
})
```

`src/lib/db/index.ts`:
```ts
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
```

> **Important:** `drizzle-kit` does not auto-load `.env.local`. Always prefix push commands:
> ```bash
> DATABASE_URL="postgresql://..." npx drizzle-kit push
> ```

### Step 2.2 — Schema tables

1. `topics` — id, name, slug, description, icon, color, parent_id (self-ref)
2. `resources` — id, topic_id, type, title, description, url, file_url, thumbnail_url, transcript, transcript_status, ai_summary, created_at, updated_at
3. `resource_elements` — id, resource_id (FK), type, url, file_url, title, order, transcript, transcript_status, created_at
4. `snippets` — id, resource_id (nullable), title, description, language, code, created_at, updated_at

```bash
DATABASE_URL="postgresql://..." npx drizzle-kit push
```

---

## Phase 3 — Core Layout

### Files

```
src/app/layout.tsx         ← RootLayout, ThemeProvider, Toaster
src/components/layout/
  Sidebar.tsx              ← dark left nav (desktop) with topic list
  BottomNav.tsx            ← mobile bottom navigation
  TopBar.tsx               ← page header with breadcrumb + actions
  FAB.tsx                  ← floating add button (mobile)
```

### Nav items

- Home (`/`)
- Topics (`/topics`)
- Snippets (`/snippets`)
- AI (`/ai`)
- Settings (`/settings`)

---

## Phase 4 — Topics

### Files

```
src/app/topics/
  page.tsx                ← topic grid with resource counts
  new/page.tsx            ← create topic form
  [id]/page.tsx           ← topic detail: resource list + AI synthesis CTA
  [id]/edit/page.tsx      ← edit topic
src/app/api/topics/
  route.ts                ← GET list, POST create
  [id]/route.ts           ← GET, PATCH, DELETE
src/lib/topics/
  queries.ts              ← getTopics(), getTopicById(id), etc.
```

---

## Phase 5 — Resources

### Files

```
src/app/resources/
  page.tsx                ← resource list with filters (type, topic, tags)
  new/page.tsx            ← URL paste + file upload form
  [id]/page.tsx           ← resource detail (auto-routes to reader/pdf/video)
  [id]/edit/page.tsx      ← edit metadata, re-transcribe
  [id]/read/page.tsx      ← clean reader (article / transcript)
  [id]/pdf/page.tsx       ← PDF viewer
src/app/api/resources/
  route.ts                ← GET list, POST create
  [id]/route.ts           ← GET, PATCH, DELETE (soft)
  [id]/transcribe/route.ts ← POST: queue transcription
  upload/route.ts         ← POST: handle PDF file upload
src/lib/resources/
  queries.ts
  transcribe.ts           ← YouTube transcript fetch + Groq cleanup
  articleExtract.ts       ← @extractus/article-extractor wrapper
```

### Resource type routing logic (in `[id]/page.tsx`)

```ts
if (resource.type === 'pdf')     redirect(`/resources/${id}/pdf`)
if (resource.type === 'video')   redirect(`/resources/${id}/read`)
if (resource.type === 'article') redirect(`/resources/${id}/read`)
if (resource.type === 'snippet') redirect(`/snippets/${resource.snippetId}`)
```

### PDF file upload

Files saved to `public/uploads/` (or env-configured path). Route handler uses `formidable` to parse multipart form data, saves file, stores path in `resources.file_url`.

---

## Phase 6 — YouTube Transcription

### Files

```
src/lib/resources/transcribe.ts
```

### Pipeline

```ts
import { YoutubeTranscript } from 'youtube-transcript'
import { generateText } from 'ai'
import { groq } from '@ai-sdk/groq'

export async function transcribeYouTube(videoUrl: string) {
  // 1. Extract video ID from URL
  // 2. Fetch raw transcript
  const segments = await YoutubeTranscript.fetchTranscript(videoId)
  const rawTranscript = segments.map(s => s.text).join(' ')
  // 3. Post-process with Groq
  const { text } = await generateText({
    model: groq('llama-3.3-70b-versatile'),
    system: 'You are a technical content editor. Format the transcript into clean paragraphs with chapter markers. Return JSON: { formatted: string, summary: string, keyPoints: string[] }.',
    prompt: rawTranscript,
  })
  return JSON.parse(text)
}
```

---

## Phase 7 — PDF Viewer

### Files

```
src/components/pdf/PDFViewer.tsx   ← react-pdf Document + Page, page nav, zoom
src/app/resources/[id]/pdf/page.tsx
```

### Notes

- `react-pdf` requires `'use client'`
- Set `workerSrc` in useEffect:
  ```ts
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
  ```

---

## Phase 8 — Code Snippets

### Files

```
src/app/snippets/
  page.tsx                ← snippet list (filterable by language, tag)
  new/page.tsx            ← CodeMirror editor + language picker
  [id]/page.tsx           ← Shiki render + AI explain button
  [id]/edit/page.tsx
src/app/api/snippets/
  route.ts
  [id]/route.ts
  [id]/explain/route.ts   ← POST: stream Groq explanation
src/components/snippets/
  SnippetEditor.tsx       ← CodeMirror 6 client component
  SnippetView.tsx         ← Shiki highlighted view with copy button
```

---

## Phase 9 — AI Routes

### Files

```
src/app/api/ai/
  explain/route.ts        ← POST: explain snippet (Groq, streaming)
  summarize/route.ts      ← POST: summarize resource (Groq)
  synthesize/route.ts     ← POST: topic learning map (Cohere command-r-plus)
  suggest/route.ts        ← POST: related resources (Cohere embed + rerank)
```

### Pattern (streaming with Vercel AI SDK)

```ts
import { streamText } from 'ai'
import { groq } from '@ai-sdk/groq'

export async function POST(req: Request) {
  const { code, language } = await req.json()
  const result = await streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: 'You are a senior developer. Explain the code clearly and concisely.',
    prompt: `Language: ${language}\n\n${code}`,
  })
  return result.toDataStreamResponse()
}
```

---

## Phase 10 — Environment Variables

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require

# AI
GROQ_API_KEY=
COHERE_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
UPLOAD_DIR=public/uploads  # local PDF storage path
```

> `DATABASE_URL` is a standard Neon connection string. Get it from the Neon console → Connection Details.

---

## File Structure Summary

```
src/
  app/
    layout.tsx
    page.tsx
    topics/page.tsx
    topics/new/page.tsx
    topics/[id]/page.tsx
    topics/[id]/edit/page.tsx
    resources/page.tsx
    resources/new/page.tsx
    resources/[id]/page.tsx
    resources/[id]/read/page.tsx
    resources/[id]/pdf/page.tsx
    resources/[id]/edit/page.tsx
    snippets/page.tsx
    snippets/new/page.tsx
    snippets/[id]/page.tsx
    snippets/[id]/edit/page.tsx
    ai/page.tsx
    settings/page.tsx
    api/
      topics/route.ts
      topics/[id]/route.ts
      resources/route.ts
      resources/[id]/route.ts
      resources/[id]/transcribe/route.ts
      resources/upload/route.ts
      snippets/route.ts
      snippets/[id]/route.ts
      snippets/[id]/explain/route.ts
      ai/explain/route.ts
      ai/summarize/route.ts
      ai/synthesize/route.ts
      ai/suggest/route.ts
  components/
    layout/Sidebar.tsx
    layout/BottomNav.tsx
    layout/TopBar.tsx
    layout/FAB.tsx
    pdf/PDFViewer.tsx
    snippets/SnippetEditor.tsx
    snippets/SnippetView.tsx
  lib/
    db/index.ts
    db/schema.ts
    topics/queries.ts
    resources/queries.ts
    resources/transcribe.ts
    resources/articleExtract.ts
  middleware.ts
```
