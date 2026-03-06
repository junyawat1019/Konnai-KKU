<template>
  <DefaultLayout>
    <div class="photo-page" v-if="place">
      <button class="back-btn" @click="goBack">กลับ</button>

      <h1 class="place-title">{{ place.name }}</h1>

      <!-- Grid รูปภาพ -->
      <div class="photo-grid">
        <img
          v-for="(url, index) in place.imageUrls"
          :key="index"
          :src="url"
          class="photo-item"
          @click="openLightbox(index)"
        />
      </div>

      <!-- Lightbox -->
      <div v-if="showLightbox" class="lightbox" @click.self="closeLightbox">
        <button class="close-btn" @click="closeLightbox">×</button>

        <!-- ปุ่มเลื่อนภาพ -->
        <button v-if="hasPrev" class="nav-btn left" @click.stop="prevImage">‹</button>
        <button v-if="hasNext" class="nav-btn right" @click.stop="nextImage">›</button>

        <!-- ภาพใหญ่ -->
        <img :src="currentImage" class="lightbox-image" />

        <!-- ปุ่มดาวน์โหลด -->
        <a :href="currentImage" download class="download-btn" title="ดาวน์โหลดรูป">
          ดาวน์โหลด
        </a>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

const route = useRoute();
const router = useRouter();

const placeId = route.params.id;
const startIndex = Number(route.params.index) || 0;

const place = ref(null);
const showLightbox = ref(false);
const currentIndex = ref(startIndex);

const fetchPlace = async () => {
  const docRef = doc(db, "places", placeId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) place.value = { id: docSnap.id, ...docSnap.data() };
};

onMounted(fetchPlace);

const goBack = () => router.back();

const openLightbox = (index) => {
  currentIndex.value = index;
  showLightbox.value = true;
};

const closeLightbox = () => {
  showLightbox.value = false;
};

const prevImage = () => {
  if (currentIndex.value > 0) currentIndex.value--;
};

const nextImage = () => {
  if (currentIndex.value < place.value.imageUrls.length - 1) currentIndex.value++;
};

const currentImage = computed(() => place.value?.imageUrls?.[currentIndex.value]);
const hasPrev = computed(() => currentIndex.value > 0);
const hasNext = computed(() => currentIndex.value < (place.value?.imageUrls?.length || 0) - 1);
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
