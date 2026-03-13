<template>
  <DefaultLayout>
    <div class="photo-page">
      <button class="back-btn" @click="goBack">กลับ</button>

      <!-- Loading -->
      <div v-if="loading" class="loading">กำลังโหลดรูปภาพ...</div>

      <div v-else-if="place">
        <h1 class="place-title">
          {{ place.name }}
        </h1>

        <!-- Photo Grid -->
        <div v-if="place.imageUrls?.length" class="photo-grid">
          <img
            v-for="(url, index) in place.imageUrls"
            :key="index"
            :src="url"
            class="photo-item"
            loading="lazy"
            @click="openLightbox(index)"
          />
        </div>

        <div v-else class="no-photo">ไม่มีรูปภาพ</div>
      </div>

      <!-- Lightbox -->
      <div v-if="showLightbox" class="lightbox" @click.self="closeLightbox">
        <button class="close-btn" @click="closeLightbox">×</button>

        <button v-if="hasPrev" class="nav-btn left" @click.stop="prevImage">
          ‹
        </button>

        <button v-if="hasNext" class="nav-btn right" @click.stop="nextImage">
          ›
        </button>

        <img :src="currentImage" class="lightbox-image" />

        <a :href="currentImage" download class="download-btn"> ดาวน์โหลด </a>

        <!-- Image Counter -->
        <div class="image-counter">
          {{ currentIndex + 1 }} / {{ place.imageUrls.length }}
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import axios from "axios"

import DefaultLayout from "@/layouts/DefaultLayout.vue"

const route = useRoute()
const router = useRouter()

const placeId = route.params.id
const startIndex = Number(route.params.index) || 0

const place = ref(null)
const loading = ref(true)

const showLightbox = ref(false)
const currentIndex = ref(startIndex)

/* =======================
   FETCH PLACE FROM API
======================= */

const fetchPlace = async () => {
  try {

    /* ---------- PLACE INFO ---------- */

    const placeRes = await axios.get(
      `http://localhost:8080/api/places/${placeId}`
    )

    /* ---------- IMAGES ---------- */

    const imageRes = await axios.get(
      `http://localhost:8080/api/places/${placeId}/images`
    )

    const imageUrls = imageRes.data.map(i => i.image_url)

    place.value = {
      id: placeRes.data.id,
      name: placeRes.data.name,
      imageUrls
    }

    if (imageUrls.length && startIndex >= 0) {
      showLightbox.value = true
    }

  } catch (error) {

    console.error("Fetch place error:", error)

  } finally {

    loading.value = false

  }
}

/* =======================
   NAVIGATION
======================= */

const goBack = () => {
  router.back()
}

const openLightbox = (index) => {
  currentIndex.value = index
  showLightbox.value = true
}

const closeLightbox = () => {
  showLightbox.value = false
}

/* =======================
   IMAGE CONTROL
======================= */

const prevImage = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

const nextImage = () => {
  if (currentIndex.value < place.value.imageUrls.length - 1) {
    currentIndex.value++
  }
}

const currentImage = computed(
  () => place.value?.imageUrls?.[currentIndex.value]
)

const hasPrev = computed(
  () => currentIndex.value > 0
)

const hasNext = computed(
  () =>
    currentIndex.value <
    (place.value?.imageUrls?.length || 0) - 1
)

/* =======================
   KEYBOARD CONTROL
======================= */

const handleKey = (e) => {

  if (!showLightbox.value) return

  if (e.key === "ArrowLeft") prevImage()

  if (e.key === "ArrowRight") nextImage()

  if (e.key === "Escape") closeLightbox()
}

onMounted(() => {

  fetchPlace()

  window.addEventListener("keydown", handleKey)

})

onUnmounted(() => {

  window.removeEventListener("keydown", handleKey)

})
</script>

<style scoped>
.photo-page {
  max-width: 1000px;
  margin: auto;
  padding: 20px;
  background: #f8fafc;
  min-height: 100vh;
}

.back-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #007bff;
  cursor: pointer;
  margin-bottom: 10px;
}
.back-btn:hover {
  text-decoration: underline;
}

.place-title {
  text-align: center;
  font-size: 26px;
  font-weight: bold;
  margin-bottom: 20px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.photo-item {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s ease;
}
.photo-item:hover {
  transform: scale(1.03);
}

/* Lightbox */
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.lightbox-image {
  max-width: 90%;
  max-height: 80vh;
  border-radius: 10px;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 30px;
  background: none;
  border: none;
  color: white;
  font-size: 36px;
  cursor: pointer;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.4);
  color: white;
  border: none;
  font-size: 30px;
  cursor: pointer;
  border-radius: 50%;
  width: 50px;
  height: 50px;
}
.nav-btn.left {
  left: 20px;
}
.nav-btn.right {
  right: 20px;
}

.download-btn {
  position: absolute;
  bottom: 30px;
  right: 40px;
  background: #007bff;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  text-decoration: none;
}
.download-btn:hover {
  background: #0056b3;
}
</style>
