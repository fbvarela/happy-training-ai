import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const title = formData.get('title') as string | null
  const topicId = formData.get('topicId') as string | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const uploadDir = join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })

  const filename = `${randomUUID()}.pdf`
  const filePath = join(uploadDir, filename)
  await writeFile(filePath, buffer)

  const fileUrl = `/uploads/${filename}`

  return NextResponse.json({
    fileUrl,
    title: title ?? file.name.replace(/\.pdf$/i, ''),
    topicId: topicId ? Number(topicId) : null,
  })
}
