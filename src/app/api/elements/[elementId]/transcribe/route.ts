import { NextRequest, NextResponse } from 'next/server'
import { updateElement } from '@/lib/resources/elementQueries'
import { db } from '@/lib/db'
import { resourceElements } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { transcribeYouTube } from '@/lib/resources/transcribe'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ elementId: string }> }) {
  const { elementId } = await params
  const id = Number(elementId)

  const rows = await db.select().from(resourceElements).where(eq(resourceElements.id, id))
  const element = rows[0]

  if (!element) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (element.type !== 'video') return NextResponse.json({ error: 'Not a video element' }, { status: 400 })
  if (!element.url) return NextResponse.json({ error: 'No URL' }, { status: 400 })

  await updateElement(id, { transcriptStatus: 'processing' })

  try {
    const result = await transcribeYouTube(element.url)
    await updateElement(id, { transcript: result.formatted, transcriptStatus: 'done' })
    return NextResponse.json({ success: true, summary: result.summary })
  } catch (err) {
    await updateElement(id, { transcriptStatus: 'failed' })
    const message = err instanceof Error ? err.message : 'Transcription failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
