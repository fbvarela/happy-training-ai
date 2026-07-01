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
  const { url, fileUrl, title, type: explicitType, order = 0, language, code } = body

  const type = explicitType ?? (url ? detectType(url) : 'file')

  if (type === 'snippet' && !code?.trim()) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 })
  }

  const element = await createElement({
    resourceId: Number(id),
    type,
    url: url?.trim() ?? null,
    fileUrl: fileUrl?.trim() ?? null,
    title: title?.trim() ?? null,
    order,
    transcriptStatus: type === 'video' ? 'pending' : null,
    language: type === 'snippet' ? (language ?? 'typescript') : null,
    code: type === 'snippet' ? code.trim() : null,
  })

  return NextResponse.json(element, { status: 201 })
}
