import { NextRequest, NextResponse } from 'next/server'
import { updateElement } from '@/lib/resources/elementQueries'
import type { NewResourceElement } from '@/lib/db/schema'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ elementId: string }> }) {
  const { elementId } = await params
  const id = Number(elementId)
  const body = await req.json()

  const allowed = ['transcript', 'title', 'url', 'type', 'order']
  const data: Partial<NewResourceElement> = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  )

  if ('transcript' in data) {
    const transcript = typeof data.transcript === 'string' ? data.transcript.trim() : null
    data.transcript = transcript || null
    data.transcriptStatus = transcript ? 'done' : null
  }

  const updated = await updateElement(id, data)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}
