<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface PhotoItem {
  id: string
  thumbnailSrc: string
  fullSrc: string
  isWide: boolean
}

const fullImageModules = import.meta.glob<string>(
  '@/assets/photography/*.{jpg,jpeg,png,webp,JPG}',
  {
    eager: true,
    query: '?url',
    import: 'default',
  }
)

const lowResImageModules = import.meta.glob<string>(
  '@/assets/photography/*.{jpg,jpeg,png,webp,JPG}',
  {
    eager: true,
    query: {
      w: '800',
      format: 'webp',
      as: 'url',
    },
    import: 'default',
  }
)

const rawItems: PhotoItem[] = Object.keys(fullImageModules)
  .filter((key) => Boolean(fullImageModules[key]))
  .map((key) => ({
    id: key,
    fullSrc: fullImageModules[key] as string,
    thumbnailSrc: (lowResImageModules[key] || fullImageModules[key]) as string,
    isWide: true,
  }))

const portraitImages = ref<PhotoItem[]>([])
const landscapeImages = ref<PhotoItem[]>([])
const selectedPhoto = ref<PhotoItem | null>(null)
const isFullImageLoaded = ref(false)

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

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)

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
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="p-4">
    <h1>Photography</h1>

    <div class="grid grid-cols-1 py-3 gap-3 md:grid-cols-2 lg:grid-cols-4 items-start">
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
          alt="Landscape photograph"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4 items-start">
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
          alt="Portrait photograph"
        />
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
            <!-- Low-res placeholder preview (stays in background and smoothly fades out/blurs while full res crossfades in) -->
            <img
              :src="selectedPhoto.thumbnailSrc"
              class="col-start-1 row-start-1 max-w-[90vw] max-h-[90vh] object-contain rounded transition-all duration-700 ease-out"
              :class="isFullImageLoaded ? 'opacity-0 scale-[0.99] filter blur-md pointer-events-none' : 'opacity-100 scale-100 filter blur-xs'"
              alt="Loading photograph preview"
            />
            <!-- Full-res image crossfading smoothly over the preview -->
            <img
              :src="selectedPhoto.fullSrc"
              class="col-start-1 row-start-1 max-w-[90vw] max-h-[90vh] object-contain rounded shadow-2xl transition-opacity duration-700 ease-out"
              :class="isFullImageLoaded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'"
              alt="Full resolution photograph"
              @load="isFullImageLoaded = true"
            />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
