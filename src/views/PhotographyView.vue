<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface ApiPhoto {
  id?: string
  url?: string
  thumbnailUrl?: string
  fullUrl?: string
  pathname?: string
  uploadedAt?: string
}

interface PhotoItem {
  id: string
  thumbnailSrc: string
  fullSrc: string
  alt: string
  isWide: boolean
}

const portraitImages = ref<PhotoItem[]>([])
const landscapeImages = ref<PhotoItem[]>([])
const selectedPhoto = ref<PhotoItem | null>(null)
const isFullImageLoaded = ref(false)
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)

function openPhoto(photo: PhotoItem) {
  isFullImageLoaded.value = false
  selectedPhoto.value = photo
}

function closePhoto() {
  selectedPhoto.value = null
  isFullImageLoaded.value = false
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && selectedPhoto.value) {
    closePhoto()
  }
}

async function fetchPhotos() {
  isLoading.value = true
  errorMessage.value = null

  try {
    const response = await fetch('/api/photos')
    const contentType = response.headers.get('content-type') || ''

    if (!response.ok) {
      if (contentType.includes('application/json')) {
        const errorJson = await response.json()
        throw new Error(errorJson.error || `Failed to load photos (${response.status})`)
      }
      throw new Error(`Failed to load photos (${response.status})`)
    }

    if (!contentType.includes('application/json')) {
      throw new Error('Received non-JSON response from /api/photos. Ensure the API endpoint or dev server is properly configured.')
    }

    const data: ApiPhoto[] = await response.json()

    // Group items by base pathname in case the API returned flat un-grouped blobs
    const groups = new Map<string, ApiPhoto[]>()
    for (const item of data) {
      const pathname = item.pathname || item.id || item.thumbnailUrl || item.fullUrl || item.url || ''
      const basePath = pathname.replace(/\.[^/.]+$/, '')
      const group = groups.get(basePath) || []
      group.push(item)
      groups.set(basePath, group)
    }

    const rawItems: Omit<PhotoItem, 'isWide'>[] = []

    for (const [basePath, group] of groups.entries()) {
      const firstItem = group[0]
      if (!firstItem) continue

      if (group.length === 1 && firstItem.thumbnailUrl && firstItem.fullUrl) {
        const cleanName = (firstItem.pathname || basePath)
          .replace(/^photography\//, '')
          .replace(/\.[^/.]+$/, '')

        rawItems.push({
          id: firstItem.id || basePath,
          thumbnailSrc: firstItem.thumbnailUrl,
          fullSrc: firstItem.fullUrl,
          alt: cleanName || 'Photograph',
        })
        continue
      }

      const webpItem = group.find((item) =>
        item.thumbnailUrl
          ? /\.webp$/i.test(item.thumbnailUrl)
          : item.pathname
            ? /\.webp$/i.test(item.pathname)
            : item.url
              ? /\.webp$/i.test(item.url)
              : false
      )
      const jpegItem = group.find((item) =>
        item.fullUrl
          ? /\.(jpe?g)$/i.test(item.fullUrl)
          : item.pathname
            ? /\.(jpe?g)$/i.test(item.pathname)
            : item.url
              ? /\.(jpe?g)$/i.test(item.url)
              : false
      )
      const fallbackItem = group.find((item) => item !== webpItem && item !== jpegItem) || firstItem

      const thumbnailSrc =
        webpItem?.thumbnailUrl ||
        webpItem?.url ||
        jpegItem?.thumbnailUrl ||
        jpegItem?.url ||
        fallbackItem.thumbnailUrl ||
        fallbackItem.url ||
        ''

      const fullSrc =
        jpegItem?.fullUrl ||
        jpegItem?.url ||
        webpItem?.fullUrl ||
        webpItem?.url ||
        fallbackItem.fullUrl ||
        fallbackItem.url ||
        thumbnailSrc

      const cleanName = (jpegItem?.pathname || webpItem?.pathname || fallbackItem.pathname || basePath)
        .replace(/^photography\//, '')
        .replace(/\.[^/.]+$/, '')

      rawItems.push({
        id: basePath || cleanName,
        thumbnailSrc,
        fullSrc,
        alt: cleanName || 'Photograph',
      })
    }

    if (typeof Image === 'undefined') {
      landscapeImages.value = rawItems.map((item) => ({ ...item, isWide: true }))
      return
    }

    const loaded = await Promise.all(
      rawItems.map((item) => {
        return new Promise<PhotoItem>((resolve) => {
          const img = new Image()
          img.onload = () => {
            resolve({
              ...item,
              isWide: img.naturalWidth >= img.naturalHeight,
            })
          }
          img.onerror = () => {
            resolve({
              ...item,
              isWide: true,
            })
          }
          img.src = item.thumbnailSrc
        })
      })
    )

    portraitImages.value = loaded.filter((item) => !item.isWide)
    landscapeImages.value = loaded.filter((item) => item.isWide)
  } catch (error) {
    console.error('Error fetching photography gallery:', error)
    errorMessage.value = error instanceof Error ? error.message : 'Failed to load photos'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  fetchPhotos()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="p-4">
    <h1>Photography</h1>
    <h2>Clicking images will load the full resolution version. It might take a while if your connection is slow.</h2>

    <div v-if="isLoading" class="py-12 flex justify-center items-center">
      <div class="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
    </div>

    <div v-else-if="errorMessage" class="py-8 text-red-500">
      <p>{{ errorMessage }}</p>
    </div>

    <div v-else-if="landscapeImages.length === 0 && portraitImages.length === 0" class="py-8 text-gray-500">
      <p>No photos found.</p>
    </div>

    <div v-else>
      <div
        v-if="landscapeImages.length > 0"
        class="grid grid-cols-1 py-3 gap-3 md:grid-cols-2 lg:grid-cols-4 items-stretch"
      >
        <div
          v-for="photo in landscapeImages"
          :key="photo.id"
          class="cursor-pointer overflow-hidden rounded transition-opacity duration-200 hover:opacity-90"
          @click="openPhoto(photo)"
        >
          <img
            :src="photo.thumbnailSrc"
            class="w-full h-full object-cover block"
            loading="lazy"
            :alt="photo.alt || 'Landscape photograph'"
          />
        </div>
      </div>

      <div
        v-if="portraitImages.length > 0"
        class="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4 items-stretch"
      >
        <div
          v-for="photo in portraitImages"
          :key="photo.id"
          class="cursor-pointer overflow-hidden rounded transition-opacity duration-200 hover:opacity-90"
          @click="openPhoto(photo)"
        >
          <img
            :src="photo.thumbnailSrc"
            class="w-full h-full object-cover block"
            loading="lazy"
            :alt="photo.alt || 'Portrait photograph'"
          />
        </div>
      </div>
    </div>

    <!-- Full-resolution Lightbox Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="selectedPhoto"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 select-none"
          @click.self="closePhoto"
        >
          <button
            type="button"
            class="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl font-light p-2 cursor-pointer focus:outline-none z-10 leading-none"
            aria-label="Close"
            @click="closePhoto"
          >
            &times;
          </button>

          <div class="relative grid place-items-center max-w-[90vw] max-h-[90vh]">
            <!-- Skeleton Loader -->
            <div
              v-if="!isFullImageLoaded"
              class="animate-pulse bg-neutral-800/90 rounded-lg shadow-2xl flex items-center justify-center overflow-hidden"
              :class="selectedPhoto.isWide ? 'w-[85vw] max-w-4xl aspect-[3/2] max-h-[85vh]' : 'w-[70vw] max-w-md aspect-[2/3] max-h-[85vh]'"
            >
              <svg class="w-12 h-12 text-neutral-600/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>

            <img
              :src="selectedPhoto.fullSrc"
              class="max-w-[90vw] max-h-[90vh] object-contain rounded shadow-2xl transition-opacity duration-300 ease-out"
              :class="isFullImageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0 m-auto pointer-events-none'"
              :alt="selectedPhoto.alt || 'Photograph'"
              @load="isFullImageLoaded = true"
            />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
