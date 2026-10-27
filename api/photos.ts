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
    const photos = blobs
      .filter((blob) => imageRegex.test(blob.pathname))
      .map((blob) => ({
        url: blob.url,
        pathname: blob.pathname,
        uploadedAt: blob.uploadedAt,
      }))

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
