import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resourceElements } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { rewriteTranscript } from '@/lib/resources/rewrite'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ elementId: string }> }) {
  const { elementId } = await params
  const id = Number(elementId)

  const rows = await db.select().from(resourceElements).where(eq(resourceElements.id, id))
  const element = rows[0]

  if (!element) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!element.transcript) return NextResponse.json({ error: 'No transcript to rewrite' }, { status: 400 })

  const rewritten = await rewriteTranscript(element.transcript)
  await db.update(resourceElements).set({ transcript: rewritten }).where(eq(resourceElements.id, id))
  return NextResponse.json({ success: true, transcript: rewritten })
}
