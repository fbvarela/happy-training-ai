import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getResourceById, softDeleteResource, updateResource } from '@/lib/resources/queries'

function revalidateResourceViews(id: number) {
  revalidatePath('/')
  revalidatePath('/resources')
  revalidatePath(`/resources/${id}`)
  revalidatePath('/topics', 'layout')
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const resource = await getResourceById(Number(id))
  if (!resource) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(resource)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { title, description, topicId, tags, url } = body

  const updated = await updateResource(Number(id), {
    ...(title !== undefined && { title: title.trim() }),
    ...(description !== undefined && { description: description?.trim() ?? null }),
    ...(topicId !== undefined && { topicId: topicId ? Number(topicId) : null }),
    ...(tags !== undefined && { tags: JSON.stringify(tags) }),
    ...(url !== undefined && { url: url?.trim() ?? null }),
  })

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  revalidateResourceViews(Number(id))
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await softDeleteResource(Number(id))
  revalidateResourceViews(Number(id))
  return new NextResponse(null, { status: 204 })
}
