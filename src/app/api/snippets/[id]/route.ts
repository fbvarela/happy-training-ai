import { NextRequest, NextResponse } from 'next/server'
import { deleteSnippet, getSnippetById, updateSnippet } from '@/lib/snippets/queries'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const snippet = await getSnippetById(Number(id))
  if (!snippet) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(snippet)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { title, description, language, code, tags } = body

  const updated = await updateSnippet(Number(id), {
    ...(title !== undefined && { title: title.trim() }),
    ...(description !== undefined && { description: description?.trim() ?? null }),
    ...(language !== undefined && { language }),
    ...(code !== undefined && { code: code.trim() }),
    ...(tags !== undefined && { tags: JSON.stringify(tags) }),
  })

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await deleteSnippet(Number(id))
  return new NextResponse(null, { status: 204 })
}
