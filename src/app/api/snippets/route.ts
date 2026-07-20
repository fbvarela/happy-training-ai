import { NextRequest, NextResponse } from 'next/server'
import { createSnippet, getSnippets } from '@/lib/snippets/queries'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const language = searchParams.get('language') ?? undefined
  const list = await getSnippets({ language })
  return NextResponse.json(list)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, description, language, code, tags, resourceId } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  if (!code?.trim()) return NextResponse.json({ error: 'Code is required' }, { status: 400 })

  const snippet = await createSnippet({
    title: title.trim(),
    description: description?.trim() ?? null,
    language: language ?? 'markdown',
    code: code.trim(),
    tags: JSON.stringify(tags ?? []),
    resourceId: resourceId ? Number(resourceId) : null,
  })

  return NextResponse.json(snippet, { status: 201 })
}
