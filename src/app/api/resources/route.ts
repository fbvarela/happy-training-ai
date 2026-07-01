import { NextRequest, NextResponse } from 'next/server'
import { createResource, detectType, extractYouTubeId, getResources, setResourceTopics } from '@/lib/resources/queries'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const topicId = searchParams.get('topicId')
  const type = searchParams.get('type')
  const search = searchParams.get('search')

  const list = await getResources({
    topicId: topicId ? Number(topicId) : undefined,
    type: type ?? undefined,
    search: search ?? undefined,
  })
  return NextResponse.json(list)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { url, title, description, topicIds, type: explicitType, tags } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const resolvedType = explicitType ?? (url ? detectType(url) : 'article')
  const thumbnailUrl =
    resolvedType === 'video' && url
      ? `https://img.youtube.com/vi/${extractYouTubeId(url) ?? ''}/hqdefault.jpg`
      : null

  const resource = await createResource({
    title: title.trim(),
    description: description?.trim() ?? null,
    url: url?.trim() ?? null,
    type: resolvedType,
    thumbnailUrl,
    tags: JSON.stringify(tags ?? []),
    transcriptStatus: resolvedType === 'video' ? 'pending' : null,
  })

  const ids: number[] = Array.isArray(topicIds) ? topicIds.map(Number) : []
  if (ids.length > 0) await setResourceTopics(resource.id, ids)

  return NextResponse.json(resource, { status: 201 })
}
