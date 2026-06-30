/**
 * Cloudflare R2 storage client.
 *
 * Shared across The Happy Factory suite (same bucket/credentials as
 * happy-garden-ai, happy-sky-ai, etc.) — uploads from this app are
 * namespaced under the `training/` key prefix.
 *
 * Two execution paths:
 * - **Cloudflare Workers**: uses the native `R2_PUBLIC` binding if available.
 * - **Vercel / Node / local dev**: uses the S3-compatible R2 endpoint via
 *   `@aws-sdk/client-s3` (lazy-loaded to keep bundles small).
 *
 * Required env vars (Vercel / Node path):
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET                  (or R2_BUCKET_NAME)
 *   R2_PUBLIC_URL              (or NEXT_PUBLIC_R2_PUBLIC_URL)
 * Plus ONE of:
 *   R2_ENDPOINT                — full S3 endpoint URL
 *   R2_ACCOUNT_ID              (or CLOUDFLARE_ACCOUNT_ID)
 *   — last-resort fallback: derived from `pub-<id>.r2.dev` in R2_PUBLIC_URL
 */

// ─── R2 binding access (Cloudflare Workers only) ────────────────────────────

interface R2Object { key: string; size: number }
interface R2Bucket {
  put(key: string, value: ArrayBuffer | Buffer, options?: { httpMetadata?: { contentType?: string } }): Promise<R2Object>
  delete(key: string): Promise<void>
}

function getR2Binding(): R2Bucket | null {
  try {
    // Hidden from the bundler with `eval('require')` so Turbopack /
    // Webpack don't try to resolve "@opennextjs/cloudflare" at build
    // time. The package is only installed in the CF Workers build;
    // locally and on Vercel the require throws and we fall through
    // to the S3 path.
    // eslint-disable-next-line @typescript-eslint/no-require-imports, no-eval
    const req = eval("require") as NodeRequire
    const { getCloudflareContext } = req("@opennextjs/cloudflare")
    const ctx = getCloudflareContext()
    const bucket = (ctx.env as Record<string, unknown>).R2_PUBLIC as R2Bucket | undefined
    if (bucket) return bucket
  } catch { /* not running in CF Workers */ }
  return null
}

// ─── Configuration resolution ────────────────────────────────────────────────

/** Resolve the S3 endpoint URL, accepting any of three configuration paths. */
function resolveEndpoint(): string | null {
  if (process.env.R2_ENDPOINT) return process.env.R2_ENDPOINT
  const account = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID
  if (account) return `https://${account}.r2.cloudflarestorage.com`
  // Derive from a `pub-<id>.r2.dev` public URL if that's all we have.
  const publicUrl = process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ""
  const match = publicUrl.match(/pub-([a-f0-9]+)\.r2\.dev/i)
  if (match) return `https://${match[1]}.r2.cloudflarestorage.com`
  return null
}

function resolveBucket(): string {
  return (
    process.env.R2_BUCKET ||
    process.env.R2_BUCKET_NAME ||
    "happyfactory-assets"
  )
}

function resolvePublicBase(): string {
  const raw =
    process.env.R2_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    "https://assets.happyfactory.app"
  return raw.replace(/\/$/, "")
}

/** True if R2 has enough config (or a Worker binding) to be usable. */
export function r2Configured(): boolean {
  if (getR2Binding()) return true
  return !!(
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    resolveEndpoint()
  )
}

// ─── Upload validation ───────────────────────────────────────────────────────

const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml",
  "application/pdf",
  "video/mp4", "video/webm", "video/quicktime", "video/x-matroska", "video/x-msvideo",
])

/**
 * 4 MB request-body cap matches Vercel Serverless Functions' platform limit;
 * larger uploads are rejected by the platform before our route sees them.
 * Images are compressed client-side to fit; PDFs/videos/files above this are
 * rejected with a clear message rather than failing opaquely with a 413.
 */
const MAX_BYTES = 4 * 1024 * 1024

/** Returns null if valid, otherwise a human-readable error message. */
export function validateUpload(contentType: string, byteLength: number): string | null {
  if (!ALLOWED_TYPES.has(contentType)) return "Unsupported file type"
  if (byteLength > MAX_BYTES) return "File too large (max 4 MB)"
  return null
}

// ─── S3 API access (Vercel / Node / local dev — lazy-loaded) ─────────────────

function requireS3Config(): { endpoint: string; accessKeyId: string; secretAccessKey: string } {
  const endpoint = resolveEndpoint()
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 not configured: set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and one of " +
      "R2_ENDPOINT or R2_ACCOUNT_ID (plus R2_BUCKET and R2_PUBLIC_URL).",
    )
  }
  return { endpoint, accessKeyId, secretAccessKey }
}

async function uploadViaS3(bucket: string, key: string, body: Buffer | Uint8Array, contentType: string) {
  const cfg = requireS3Config()
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3")
  const r2 = new S3Client({
    region: "auto",
    endpoint: cfg.endpoint,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
  })
  await r2.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }))
}

async function deleteViaS3(bucket: string, key: string) {
  const cfg = requireS3Config()
  const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3")
  const r2 = new S3Client({
    region: "auto",
    endpoint: cfg.endpoint,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
  })
  await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}

// ─── Public API ──────────────────────────────────────────────────────────────

export type UploadResult = { url: string; key: string }

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<UploadResult> {
  const bucket = resolveBucket()
  const binding = getR2Binding()
  if (binding) {
    await binding.put(
      key,
      body instanceof Uint8Array ? (body as unknown as ArrayBuffer) : body,
      { httpMetadata: { contentType } },
    )
  } else {
    await uploadViaS3(bucket, key, body instanceof Uint8Array ? Buffer.from(body) : body, contentType)
  }
  return { url: `${resolvePublicBase()}/${key}`, key }
}

export async function deleteFromR2(key: string): Promise<void> {
  const bucket = resolveBucket()
  const binding = getR2Binding()
  if (binding) {
    await binding.delete(key)
  } else {
    await deleteViaS3(bucket, key)
  }
}

/** Extract the R2 key from a full public URL, or null if the URL doesn't match the bucket base. */
export function keyFromUrl(url: string): string | null {
  const base = resolvePublicBase()
  if (!url.startsWith(base)) return null
  return url.slice(base.length + 1)
}

// ─── Proxy support ───────────────────────────────────────────────────────────
//
// In Spain (and other regions periodically hit by anti-piracy court orders
// targeting Cloudflare IP ranges) the R2 public hostnames are intermittently
// ISP-blocked, so direct <img src="https://...r2.dev/..."> requests fail.
// The /api/uploads/[...path] route fetches via the S3 API (server-side, not
// affected by the client-side block) and streams the bytes back via Vercel
// — so the browser only ever talks to the app domain.

const R2_HOST_RE = /\.r2\.(cloudflarestorage\.com|dev)$/i
const PUB_DEV_HOST_RE = /^pub-[a-f0-9]+\.r2\.dev$/i

/** S3 client for server-side reads (used by the image proxy route). */
export async function getR2S3Client() {
  const cfg = requireS3Config()
  const { S3Client } = await import("@aws-sdk/client-s3")
  return new S3Client({
    region: "auto",
    endpoint: cfg.endpoint,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
  })
}

/** Bucket name used by the proxy route. */
export function getR2Bucket(): string {
  return resolveBucket()
}

/**
 * Rewrite a stored file URL into the same-origin proxy path so the browser
 * fetches it from Vercel (never blocked) instead of from R2 directly. Safe
 * for any URL — returns relative URLs and unknown hosts unchanged.
 */
export function proxyImageUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl) return ""
  // Already same-origin / relative — return as-is.
  if (rawUrl.startsWith("/")) return rawUrl
  // Public-base URL → strip prefix, prepend proxy path.
  const base = resolvePublicBase()
  if (base && rawUrl.startsWith(base + "/")) {
    return "/api/uploads/" + rawUrl.slice(base.length + 1)
  }
  // Any R2 hostname (cloudflarestorage.com, pub-*.r2.dev, custom-domain.r2.dev).
  try {
    const u = new URL(rawUrl)
    if (R2_HOST_RE.test(u.hostname) || PUB_DEV_HOST_RE.test(u.hostname)) {
      return "/api/uploads" + u.pathname
    }
  } catch {
    /* not a URL */
  }
  return rawUrl
}
