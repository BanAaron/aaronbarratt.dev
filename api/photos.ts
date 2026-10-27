import { list } from '@vercel/blob'

export default async function handler() {
  try {
    // Attempt to list blobs with 'photography/' prefix first
    let response = await list({
      prefix: 'photography/',
    })

    let blobs = response.blobs

    // If no blobs were found under 'photography/', list root blobs and filter for image files
    if (blobs.length === 0) {
      const allBlobs = await list()
      blobs = allBlobs.blobs
    }

    const imageRegex = /\.(jpe?g|png|webp|avif|gif)$/i
    const imageBlobs = blobs.filter((blob) => imageRegex.test(blob.pathname))

    // Group blobs by base pathname (without extension) to pair webp and jpeg versions
    const groups = new Map<string, typeof blobs>()
    for (const blob of imageBlobs) {
      const basePath = blob.pathname.replace(/\.[^/.]+$/, '')
      const group = groups.get(basePath) || []
      group.push(blob)
      groups.set(basePath, group)
    }

    const photos = Array.from(groups.entries())
      .map(([basePath, blobGroup]) => {
        const firstBlob = blobGroup[0]
        if (!firstBlob) return null

        const webpBlob = blobGroup.find((b) => /\.webp$/i.test(b.pathname))
        const jpegBlob = blobGroup.find((b) => /\.(jpe?g)$/i.test(b.pathname))
        const fallbackBlob = blobGroup.find((b) => b !== webpBlob && b !== jpegBlob) || firstBlob

        const thumbBlob = webpBlob || jpegBlob || fallbackBlob
        const fullBlob = jpegBlob || webpBlob || fallbackBlob
        const primaryBlob = jpegBlob || webpBlob || fallbackBlob

        return {
          id: basePath,
          url: thumbBlob.url,
          thumbnailUrl: thumbBlob.url,
          fullUrl: fullBlob.url,
          pathname: primaryBlob.pathname,
          uploadedAt: primaryBlob.uploadedAt,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    return new Response(JSON.stringify(photos), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list photos from Vercel Blob'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}
