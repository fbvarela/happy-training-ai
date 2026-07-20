import { NextRequest, NextResponse } from 'next/server'
import { extname } from 'path'
import { randomUUID } from 'crypto'
import { getSignedUploadUrl, validateDirectUpload } from '@/lib/r2'

function typeFromExt(ext: string): string {
  if (ext === '.pdf') return 'pdf'
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) return 'image'
  if (['.mp4', '.mov', '.webm', '.mkv', '.avi'].includes(ext)) return 'video'
  return 'file'
}

/**
 * Hands out a presigned R2 PUT URL so the browser can upload the file bytes
 * directly to storage — this request body is just JSON metadata, so it never
 * hits Vercel's serverless function body-size limit that /api/resources/upload
 * runs into for anything over ~4MB.
 */
export async function POST(req: NextRequest) {
  const { filename, contentType, size } = await req.json()

  if (!filename || typeof filename !== 'string') {
    return NextResponse.json({ error: 'Missing filename' }, { status: 400 })
  }
  if (typeof size !== 'number') {
    return NextResponse.json({ error: 'Missing size' }, { status: 400 })
  }

  const resolvedContentType = contentType || 'application/octet-stream'
  const validationError = validateDirectUpload(resolvedContentType, size)
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

  const ext = extname(filename).toLowerCase() || '.bin'
  const key = `training/${randomUUID()}${ext}`

  const { uploadUrl, publicUrl } = await getSignedUploadUrl(key, resolvedContentType)

  return NextResponse.json({
    uploadUrl,
    fileUrl: publicUrl,
    type: typeFromExt(ext),
  })
}
