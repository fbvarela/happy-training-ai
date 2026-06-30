import { NextRequest, NextResponse } from 'next/server'
import { extname } from 'path'
import { randomUUID } from 'crypto'
import { uploadToR2, validateUpload } from '@/lib/r2'

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

  const contentType = file.type || 'application/octet-stream'
  const validationError = validateUpload(contentType, file.size)
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

  const ext = extname(file.name).toLowerCase() || '.bin'
  const key = `training/${randomUUID()}${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const { url } = await uploadToR2(key, buffer, contentType)

  return NextResponse.json({
    fileUrl: url,
    type: typeFromExt(ext),
    title: title ?? file.name.replace(/\.[^.]+$/, ''),
    topicId: topicId ? Number(topicId) : null,
  })
}
