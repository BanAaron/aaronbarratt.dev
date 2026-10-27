<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface ApiPhoto {
  url: string
  pathname: string
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
    const rawItems: Omit<PhotoItem, 'isWide'>[] = data.map((item) => ({
      id: item.pathname || item.url,
      thumbnailSrc: item.url,
      fullSrc: item.url,
      alt: item.pathname
        ? item.pathname.replace(/^photography\//, '').replace(/\.[^/.]+$/, '')
        : 'Photograph',
    }))

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
        class="grid grid-cols-1 py-3 gap-3 md:grid-cols-2 lg:grid-cols-4 items-start"
      >
        <div
          v-for="photo in landscapeImages"
          :key="photo.id"
          class="cursor-pointer overflow-hidden rounded transition-opacity duration-200 hover:opacity-90"
          @click="openPhoto(photo)"
        >
          <img
            :src="photo.thumbnailSrc"
            class="w-full h-auto block"
            loading="lazy"
            :alt="photo.alt || 'Landscape photograph'"
          />
        </div>
      </div>

      <div
        v-if="portraitImages.length > 0"
        class="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4 items-start"
      >
        <div
          v-for="photo in portraitImages"
          :key="photo.id"
          class="cursor-pointer overflow-hidden rounded transition-opacity duration-200 hover:opacity-90"
          @click="openPhoto(photo)"
        >
          <img
            :src="photo.thumbnailSrc"
            class="w-full h-auto block"
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

          <div
            v-if="!isFullImageLoaded"
            class="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <div class="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          </div>

          <div class="relative grid place-items-center max-w-[90vw] max-h-[90vh]">
            <img
              :src="selectedPhoto.fullSrc"
              class="max-w-[90vw] max-h-[90vh] object-contain rounded shadow-2xl transition-opacity duration-300 ease-out"
              :class="isFullImageLoaded ? 'opacity-100' : 'opacity-0'"
              :alt="selectedPhoto.alt || 'Photograph'"
              @load="isFullImageLoaded = true"
            />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
