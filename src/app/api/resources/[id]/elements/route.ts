import { NextRequest, NextResponse } from 'next/server'
import { createElement, getElementsByResourceId } from '@/lib/resources/elementQueries'
import { detectType, extractYouTubeId } from '@/lib/resources/queries'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const elements = await getElementsByResourceId(Number(id))
  return NextResponse.json(elements)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { url, fileUrl, title, type: explicitType, order = 0 } = body

  const type = explicitType ?? (url ? detectType(url) : 'file')

  const element = await createElement({
    resourceId: Number(id),
    type,
    url: url?.trim() ?? null,
    fileUrl: fileUrl?.trim() ?? null,
    title: title?.trim() ?? null,
    order,
    transcriptStatus: type === 'video' ? 'pending' : null,
  })

  return NextResponse.json(element, { status: 201 })
}
