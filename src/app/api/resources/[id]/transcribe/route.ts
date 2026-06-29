import { NextRequest, NextResponse } from 'next/server'
import { getResourceById, updateResource } from '@/lib/resources/queries'
import { transcribeYouTube } from '@/lib/resources/transcribe'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const resource = await getResourceById(Number(id))

  if (!resource) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (resource.type !== 'video') return NextResponse.json({ error: 'Not a video resource' }, { status: 400 })
  if (!resource.url) return NextResponse.json({ error: 'No URL' }, { status: 400 })

  await updateResource(Number(id), { transcriptStatus: 'processing' })

  try {
    const result = await transcribeYouTube(resource.url)

    await updateResource(Number(id), {
      transcript: result.formatted,
      aiSummary: result.summary,
      transcriptStatus: 'done',
    })

    return NextResponse.json({ success: true, summary: result.summary, keyPoints: result.keyPoints })
  } catch (err) {
    await updateResource(Number(id), { transcriptStatus: 'failed' })
    const message = err instanceof Error ? err.message : 'Transcription failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
