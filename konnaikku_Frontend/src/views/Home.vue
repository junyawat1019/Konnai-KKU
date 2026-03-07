<template>
  <DefaultLayout @updateLocation="updateLocation">
    <div class="page-container">
      <!-- Slider -->
      <div
        class="slider-container"
        @mouseenter="pauseSlider"
        @mouseleave="resumeSlider"
      >
        <div
          v-for="(img, index) in sliderImages"
          :key="index"
          class="slide"
          :class="{ active: index === currentSlide }"
        >
          <img :src="img.url" :alt="img.alt" />
        </div>

        <button class="slider-btn prev" @click="prevSlide">&#10094;</button>
        <button class="slider-btn next" @click="nextSlide">&#10095;</button>

        <div class="dots">
          <span
            v-for="(img, index) in sliderImages"
            :key="index"
            class="dot"
            :class="{ active: index === currentSlide }"
            @click="goToSlide(index)"
          ></span>
        </div>
      </div>

      <!-- Category Bar -->
      <div class="category-bar">
        <div
          v-for="cat in typeOptions"
          :key="cat.value"
          class="category-item"
          :class="{ active: activeCategory === cat.value }"
          @click="selectCategory(cat.value)"
        >
          <img :src="cat.icon" class="category-icon" alt="" />
          <span>{{ cat.label }}</span>
        </div>
      </div>

      <!-- Recommendation Section -->
      <div class="recommendation-container">
        <div class="recommendation-header">
          <p class="section-title">แนะนำสำหรับคุณ</p>
        </div>

        <!-- Tab Bar -->
        <div class="tab-bar">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="['tab-btn', { active: activeTab === tab.id }]"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Place List -->
        <div v-if="loadingPlaces" class="loading">กำลังโหลด...</div>
        <div v-else>
          <div v-if="displayedPlaces.length" class="place-list">
            <PlaceCard
              v-for="place in displayedPlaces"
              :key="place.id"
              :place="place"
            />
          </div>
          <div v-else class="loading">ไม่มีสถานที่สำหรับหมวดนี้</div>
        </div>
        <div class="view-all-wrapper">
          <button class="view-all-btn" @click="goToAllPlaces">ดูทั้งหมด</button>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import PlaceCard from "@/components/PlaceCard.vue";
import { useRouter } from "vue-router";
import axios from "axios";

const router = useRouter();

/* ==============================
   Slider
============================== */

const sliderImages = [
  {
    url: "https://www.lemon8-app.com/seo/image?item_id=7398129850919272961&index=0",
    alt: "Scenic view 1",
  },
  {
    url: "https://www.lemon8-app.com/seo/image?item_id=7398129850919272961&index=2",
    alt: "Scenic view 2",
  },
  {
    url: "https://www.lemon8-app.com/seo/image?item_id=7339824759103848961&index=2",
    alt: "Scenic view 3",
  },
];

const currentSlide = ref(0);
let sliderTimer = null;

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % sliderImages.length;
};

const prevSlide = () => {
  currentSlide.value =
    (currentSlide.value - 1 + sliderImages.length) % sliderImages.length;
};

const goToSlide = (index) => {
  currentSlide.value = index;
};

const pauseSlider = () => clearInterval(sliderTimer);

const resumeSlider = () => {
  clearInterval(sliderTimer);
  sliderTimer = setInterval(nextSlide, 5000);
};

/* ==============================
   Category
============================== */

const typeOptions = [
  { value: "restaurant", label: "ร้านอาหาร", icon: "/icons/restaurant.png" },
  { value: "cafe", label: "คาเฟ่", icon: "/icons/cafe.png" },
  { value: "hotel", label: "โรงแรม", icon: "/icons/hotel.png" },
  { value: "tourist", label: "ที่เที่ยว", icon: "/icons/travel.png" },
  { value: "apartment", label: "อพาร์ตเมนต์", icon: "/icons/apartment.png" },
  { value: "entertainment", label: "บาร์/ผับ", icon: "/icons/bar.png" },
];

const activeCategory = ref("");

const selectCategory = (category) => {
  activeCategory.value = category;
  router.push({ name: "Place", query: { category } });
};

/* ==============================
   Tabs
============================== */

const activeTab = ref("popular");

const tabs = [
  { id: "popular", label: "ยอดนิยม" },
  { id: "trending", label: "ใหม่มาแรง" },
];

/* ==============================
   Location
============================== */

const selectedLocation = ref("ทั้งหมด");

const updateLocation = (location) => {
  selectedLocation.value = location;
};

/* ==============================
   Places State
============================== */

const places = ref([]);
const loadingPlaces = ref(false);
const errorMessage = ref("");

/* ==============================
   Fetch Places (จาก Backend API)
============================== */

const fetchPlaces = async () => {
  loadingPlaces.value = true;

  try {
    const res = await axios.get("http://localhost:8080/api/places");

    places.value = res.data.map((place) => ({
      id: place.id,
      name: place.name,
      description: place.description,
      imageUrls: place.imageUrls || [],
      categoryName: place.categoryName,
      type: place.type,
      locationTags: place.locationTags || [],
      averageRating: place.averageRating || 0,
      reviewCount: place.reviewCount || 0,
      tags: place.tags || [],
      createdAt: place.createdAt ? new Date(place.createdAt) : new Date(),
    }));
  } catch (error) {
    console.error("Fetch places error:", error);
    errorMessage.value = "โหลดข้อมูลสถานที่ไม่สำเร็จ";
  } finally {
    loadingPlaces.value = false;
  }
};

/* ==============================
   Filters
============================== */

const filteredPlaces = computed(() => {
  if (!activeCategory.value) return places.value;

  return places.value.filter(
    (place) => place.type === activeCategory.value
  );
});

const filteredByLocation = computed(() => {
  if (selectedLocation.value === "ทั้งหมด") return filteredPlaces.value;

  return filteredPlaces.value.filter((place) =>
    place.locationTags?.includes(selectedLocation.value)
  );
});

/* ==============================
   Displayed Places
============================== */

const displayedPlaces = computed(() => {
  let list = [...filteredByLocation.value];

  if (activeTab.value === "popular") {
    list.sort((a, b) => b.averageRating - a.averageRating);
  }

  if (activeTab.value === "trending") {
    list.sort((a, b) => b.createdAt - a.createdAt);
  }

  return list.slice(0, 8);
});

/* ==============================
   Navigation
============================== */

const goToAllPlaces = () => {
  router.push({ name: "Place" });
};

/* ==============================
   Lifecycle
============================== */

onMounted(async () => {
  await fetchPlaces();
  resumeSlider();
});

onUnmounted(() => {
  clearInterval(sliderTimer);
});
</script>

<style scoped>
.page-container {
  max-width: 1920px;
  margin: auto;
  padding-bottom: 40px;
  font-family: "Segoe UI", sans-serif;
}

/* Slider */
.slider-container {
  position: relative;
  width: 100%;
  height: clamp(250px, 45vh, 600px);
  overflow: hidden;
  border-radius: 12px;
  margin-bottom: 20px;
}

.slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 1s ease-in-out;
}

.slide.active {
  opacity: 1;
  z-index: 1;
}

.slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.slider-btn {
  position: absolute;
  top: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  z-index: 10;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s;
}

.slider-container:hover .slider-btn {
  opacity: 1;
  visibility: visible;
}

.slider-btn.prev {
  left: 16px;
}

.slider-btn.next {
  right: 16px;
}

.dots {
  position: absolute;
  bottom: 10px;
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #bbb;
  cursor: pointer;
}

.dot.active {
  background: #fff;
}

/* Category Bar */
.category-bar {
  display: flex;
  justify-content: center; /* เริ่มจากซ้าย */
  gap: 60px;
  flex-wrap: nowrap; /* ห้าม wrap เพื่อให้เลื่อน */
  overflow-x: auto; /* เลื่อนได้แนวนอน */
  -webkit-overflow-scrolling: touch; /* smooth scroll บน iOS */
  padding: 10px 0;
  margin-bottom: 20px;
}

.category-bar::-webkit-scrollbar {
  height: 6px;
}

.category-bar::-webkit-scrollbar-thumb {
  border-radius: 3px;
}

.category-item {
  flex: 0 0 auto; /* ไม่ย่อขนาด */
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  color: #444;
  transition: all 0.3s;
  white-space: nowrap; /* กันข้อความ wrap */
}

.category-item.active span {
  color: #00aeef;
  font-weight: bold;
}

.category-item:hover {
  transform: scale(1.1);
}

.category-icon {
  background: #f8f8f8;
  border-radius: 16px;
  width: 32px;
  height: 32px;
  padding: 6px;
}

/* Recommendation Section */
.recommendation-container {
  background: #f8f8f8;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 20px;
  margin: 40px 20px;
}

/* Header */
.recommendation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
}

/* View All Button */
.view-all-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.view-all-btn {
  background: #00aeef;
  color: white;
  border: none;
  padding: 6px 0; /* เพิ่มความสูง */
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
  width: 100%; /* กว้างเต็ม */
  max-width: 1980px; /* จำกัดความกว้างสูงสุด */
  font-size: 16px;
  font-weight: 600;
}

.view-all-btn:hover {
  background: #0095cf;
}

/* Tab Bar */
.tab-bar {
  display: flex;
  justify-content: flex-start;
  border-bottom: 2px solid #eee;
  gap: 20px;
  margin-bottom: 25px;
}

.tab-btn {
  background: none;
  border: none;
  font-size: 16px;
  font-weight: 500;
  color: #777;
  padding-bottom: 10px;
  cursor: pointer;
  position: relative;
  transition: color 0.3s;
}

.tab-btn.active {
  color: #000;
  font-weight: 600;
}

.tab-btn.active::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 100%;
  height: 3px;
  background-color: #00aeef;
  border-radius: 2px;
}

/* Place List */
.place-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

/* Responsive */
@media (max-width: 1024px) {
  .place-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .place-list {
    grid-template-columns: repeat(2, 1fr);
    overflow: hidden;
  }

  .recommendation-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .view-all-btn {
    align-self: flex-end;
  }
  .category-bar {
    gap: 12px;
  }

  .category-item span {
    font-size: 14px;
  }

  .category-icon {
    width: 28px;
    height: 28px;
  }
}

@media (max-width: 480px) {
  .place-list {
    grid-template-columns: 1fr;
  }
}

.loading {
  text-align: center;
  color: #777;
  padding: 20px;
}
</style>
