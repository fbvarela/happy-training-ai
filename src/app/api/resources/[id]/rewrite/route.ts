import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resources } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { rewriteTranscript } from '@/lib/resources/rewrite'

export const maxDuration = 120

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rows = await db.select().from(resources).where(eq(resources.id, Number(id)))
  const resource = rows[0]

  if (!resource) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!resource.transcript) return NextResponse.json({ error: 'No transcript to rewrite' }, { status: 400 })

  try {
    const rewritten = await rewriteTranscript(resource.transcript)
    await db.update(resources).set({ transcript: rewritten }).where(eq(resources.id, Number(id)))
    return NextResponse.json({ success: true, transcript: rewritten })
  } catch (err) {
    console.error('[rewrite] failed', err)
    return NextResponse.json({ error: 'Rewrite failed' }, { status: 500 })
  }
}
