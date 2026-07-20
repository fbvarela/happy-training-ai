import { NextRequest, NextResponse } from 'next/server'
import { createTopic, getTopics, slugify } from '@/lib/topics/queries'

export async function GET() {
  const list = await getTopics()
  return NextResponse.json(list)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, description, icon, color, parentId, contentKind } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const topic = await createTopic({
    name: name.trim(),
    slug: slugify(name),
    description: description?.trim() ?? null,
    icon: icon ?? 'book',
    color: color ?? '#6366f1',
    parentId: parentId ?? null,
    contentKind: contentKind ?? null,
  })

  return NextResponse.json(topic, { status: 201 })
}
