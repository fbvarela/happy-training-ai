import { NextRequest, NextResponse } from "next/server"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { getR2Bucket, getR2S3Client } from "@/lib/r2"

/**
 * Same-origin file proxy for R2-stored assets.
 *
 * Some regions (notably Spain, due to ongoing court orders against
 * Cloudflare IP ranges) intermittently block direct requests to
 * `*.r2.cloudflarestorage.com` and `*.r2.dev`, which makes uploaded files
 * fail to load for affected users. This route fetches each object from R2
 * server-side (Vercel functions reach R2 normally) and streams the bytes
 * back from the app's own domain, so the browser only ever talks to the
 * Vercel edge.
 *
 * Responses are marked immutable so Vercel's CDN caches by key — after
 * the first request each unique file is served straight from the edge,
 * with no further function invocations or R2 reads.
 */

interface Ctx {
  params: Promise<{ path: string[] }>
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params
  const key = (path ?? []).join("/")
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 })

  try {
    const client = await getR2S3Client()
    const result = await client.send(
      new GetObjectCommand({ Bucket: getR2Bucket(), Key: key }),
    )
    if (!result.Body) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // AWS SDK v3 Body is a StreamingBlobPayloadOutputTypes — it exposes
    // transformToWebStream() in Node 18+, which the Web Response accepts directly.
    const stream = (result.Body as { transformToWebStream(): ReadableStream }).transformToWebStream()

    const headers: Record<string, string> = {
      "Content-Type": result.ContentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    }
    if (result.ContentLength != null) headers["Content-Length"] = String(result.ContentLength)
    if (result.ETag) headers["ETag"] = result.ETag

    return new NextResponse(stream, { headers })
  } catch (err) {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number } }
    if (e.name === "NoSuchKey" || e.$metadata?.httpStatusCode === 404) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    if (e.name === "AccessDenied" || e.$metadata?.httpStatusCode === 403) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json(
      { error: "Failed to fetch from R2", detail: e.name ?? "unknown" },
      { status: 502 },
    )
  }
}
