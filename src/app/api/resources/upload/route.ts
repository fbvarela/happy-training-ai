import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'
import { randomUUID } from 'crypto'

function typeFromExt(ext: string): string {
  if (ext === '.pdf') return 'pdf'
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) return 'image'
  if (['.mp4', '.mov', '.webm', '.mkv', '.avi'].includes(ext)) return 'video'
  return 'file'
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const title = formData.get('title') as string | null
  const topicId = formData.get('topicId') as string | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const ext = extname(file.name).toLowerCase() || '.bin'
  const uploadDir = join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })

  const filename = `${randomUUID()}${ext}`
  await writeFile(join(uploadDir, filename), buffer)

  const fileUrl = `/uploads/${filename}`

  return NextResponse.json({
    fileUrl,
    type: typeFromExt(ext),
    title: title ?? file.name.replace(/\.[^.]+$/, ''),
    topicId: topicId ? Number(topicId) : null,
  })
}
