import { NextRequest, NextResponse } from 'next/server'
import { updateElement } from '@/lib/resources/elementQueries'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ elementId: string }> }) {
  const { elementId } = await params
  const id = Number(elementId)
  const body = await req.json()

  const allowed = ['transcript', 'title', 'url', 'type', 'order']
  const data = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  )

  const updated = await updateElement(id, data)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}
