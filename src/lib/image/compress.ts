// Client-side image downscale + JPEG re-encode, shared across the Happy
// Factory suite. Keeps uploads under the serverless function-body limit
// without requiring a presigned-upload flow.

const DEFAULT_MAX_BYTES = 1.8 * 1024 * 1024
const MAX_DIM = 1920

/**
 * Returns a compressed JPEG File when the input is large or HEIC/HEIF,
 * otherwise the original file untouched. Throws if the browser can't decode
 * the image (callers should surface a "couldn't process image" message).
 */
export async function compressImageFile(
  file: File,
  maxBytes: number = DEFAULT_MAX_BYTES,
): Promise<File> {
  if (file.size <= maxBytes && !/heic|heif/i.test(file.type)) return file

  const bitmap = await createImageBitmap(file)
  let quality = 0.85
  let scale = 1
  if (bitmap.width > MAX_DIM || bitmap.height > MAX_DIM) {
    scale = MAX_DIM / Math.max(bitmap.width, bitmap.height)
  }
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = new OffscreenCanvas(w, h)
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  let blob = await canvas.convertToBlob({ type: "image/jpeg", quality })
  while (blob.size > maxBytes && quality > 0.3) {
    quality -= 0.1
    blob = await canvas.convertToBlob({ type: "image/jpeg", quality })
  }
  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" })
}
