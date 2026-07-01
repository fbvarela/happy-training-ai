import { NextRequest, NextResponse } from 'next/server'
import { deleteElement, updateElement } from '@/lib/resources/elementQueries'

type Ctx = { params: Promise<{ id: string; elementId: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { elementId } = await params
  const body = await req.json()
  const { url, fileUrl, title, type, order, language, code } = body

  const updated = await updateElement(Number(elementId), {
    ...(url !== undefined && { url: url?.trim() ?? null }),
    ...(fileUrl !== undefined && { fileUrl: fileUrl?.trim() ?? null }),
    ...(title !== undefined && { title: title?.trim() ?? null }),
    ...(type !== undefined && { type }),
    ...(order !== undefined && { order }),
    ...(language !== undefined && { language }),
    ...(code !== undefined && { code: code?.trim() ?? null }),
  })

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { elementId } = await params
  await deleteElement(Number(elementId))
  return new NextResponse(null, { status: 204 })
}
