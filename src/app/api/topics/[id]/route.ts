import { NextRequest, NextResponse } from 'next/server'
import { deleteTopic, getTopicById, slugify, updateTopic } from '@/lib/topics/queries'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const topic = await getTopicById(Number(id))
  if (!topic) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(topic)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { name, description, icon, color, parentId, contentKind } = body

  const updated = await updateTopic(Number(id), {
    ...(name && { name: name.trim(), slug: slugify(name) }),
    ...(description !== undefined && { description: description?.trim() ?? null }),
    ...(icon !== undefined && { icon }),
    ...(color !== undefined && { color }),
    ...(parentId !== undefined && { parentId }),
    ...(contentKind !== undefined && { contentKind }),
  })

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await deleteTopic(Number(id))
  return new NextResponse(null, { status: 204 })
}
