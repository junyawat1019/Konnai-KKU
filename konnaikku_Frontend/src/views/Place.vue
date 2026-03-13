<template>
  <DefaultLayout>
    <div class="place-detail-page">

      <!-- Header -->
      <div class="place-header">
        <h1>สถานที่รอบมหาวิทยาลัยขอนแก่น</h1>

        <button class="add-place-btn" @click="goToAddPlace">
          <i class="fa fa-plus"></i>
          เพิ่มสถานที่ใหม่
        </button>
      </div>

      <!-- Filter -->
      <div class="filter-bar">

        <select v-model="filters.category">
          <option value="">ทุกหมวดหมู่</option>
          <option value="restaurant">ร้านอาหาร</option>
          <option value="cafe">คาเฟ่</option>
          <option value="apartment">หอพัก</option>
          <option value="hotel">โรงแรม</option>
          <option value="shopping">ช็อปปิ้ง</option>
          <option value="tourist">สถานที่ท่องเที่ยว</option>
          <option value="sports">ออกกำลังกาย</option>
          <option value="entertainment">บันเทิง</option>
          <option value="services">บริการ</option>
        </select>

        <select v-model="filters.priceLevel">
          <option value="">ทุกช่วงราคา</option>
          <option :value="1">0 - 100 บาท</option>
          <option :value="2">101 - 300 บาท</option>
          <option :value="3">301 - 500 บาท</option>
          <option :value="4">501 - 1000 บาท</option>
          <option :value="5">1000+ บาท</option>
        </select>

        <select v-model="filters.location">
          <option value="">ทุกบริเวณ</option>
          <option value="กังสดาล">กังสดาล</option>
          <option value="หลังมอ">หลังมอ</option>
          <option value="โนนม่วง">โนนม่วง</option>
          <option value="โคลัมโบ">โคลัมโบ</option>
          <option value="ในเมือง">ในเมือง</option>
        </select>

        <select v-model="filters.rating">
          <option value="">ทุกคะแนน</option>
          <option :value="1">1 ดาวขึ้นไป</option>
          <option :value="2">2 ดาวขึ้นไป</option>
          <option :value="3">3 ดาวขึ้นไป</option>
          <option :value="4">4 ดาวขึ้นไป</option>
          <option :value="5">5 ดาว</option>
        </select>

        <button class="reset-btn" @click="resetFilters">
          รีเซ็ต
        </button>

      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-text">
        กำลังโหลดข้อมูล...
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-text">
        {{ error }}
      </div>

      <!-- No data -->
      <div v-else-if="filteredPlaces.length === 0" class="no-data">
        ไม่พบสถานที่
      </div>

      <!-- List -->
      <div v-else class="place-list">

        <PlaceCard
          v-for="place in filteredPlaces"
          :key="place.id"
          :place="place"
        />

      </div>

    </div>
  </DefaultLayout>
</template>
<script setup>
import { ref, computed, onMounted, watch } from "vue"
import { useRouter, useRoute } from "vue-router"
import axios from "axios"

import DefaultLayout from "@/layouts/DefaultLayout.vue"
import PlaceCard from "@/components/PlaceCard.vue"

const router = useRouter()
const route = useRoute()

const API = "http://localhost:8080/api"

/* =====================
STATE
===================== */

const places = ref([])
const loading = ref(false)
const error = ref("")

const filters = ref({
  category: "",
  priceLevel: "",
  location: "",
  rating: ""
})

/* =====================
FETCH DATA
===================== */

const fetchPlaces = async () => {

  loading.value = true
  error.value = ""

  try {

    const res = await axios.get(`${API}/places`)

    places.value = res.data.map(p => ({
      id: p.id,
      name: p.name || "",
      description: p.description || "",
      type: p.category_id || "",
      categoryName: p.category_name || "",
      imageUrls: p.image_urls || [],
      locationTags: p.location_tag || "",
      priceLevel: Number(p.price_level ?? 0),
      averageRating: Number(p.average_rating ?? 0),
      reviewCount: Number(p.review_count ?? 0),
      tags: p.tags || [],
      createdAt: p.created_at
        ? new Date(p.created_at)
        : new Date()
    }))

  } catch (err) {

    console.error(err)
    error.value = "โหลดข้อมูลสถานที่ไม่สำเร็จ"

  } finally {

    loading.value = false

  }

}

/* =====================
FILTER
===================== */

const filteredPlaces = computed(() => {

  return places.value.filter(p => {

    if (filters.value.category &&
        p.type !== filters.value.category)
      return false

    if (filters.value.priceLevel &&
        p.priceLevel != filters.value.priceLevel)
      return false

    if (filters.value.location &&
        !p.locationTags?.includes(filters.value.location))
      return false

    if (filters.value.rating &&
        p.averageRating < filters.value.rating)
      return false

    return true

  })

})

/* =====================
RESET FILTER
===================== */

const resetFilters = () => {

  filters.value = {
    category: "",
    priceLevel: "",
    location: "",
    rating: ""
  }

}

/* =====================
NAVIGATION
===================== */

const goToAddPlace = () => {

  router.push("/add-place")

}

/* =====================
WATCH URL QUERY
===================== */

watch(
  () => route.query.category,
  (cat) => {

    if (cat)
      filters.value.category = cat

  },
  { immediate: true }
)

/* =====================
INIT
===================== */

onMounted(() => {

  fetchPlaces()

})
</script>

<style scoped>
.place-detail-page {
  max-width: 1200px;
  margin: 40px auto;
  padding: 16px;
}

/* หัวข้อ + ปุ่มเพิ่มสถานที่ */
.place-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.place-header h1 {
  font-size: 1.6rem;
  font-weight: 600;
}

.add-place-btn {
  background: #00aeef;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.add-place-btn:hover {
  background: #008ecf;
}

/* Filter bar */
.filter-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.filter-bar select {
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  background: white;
  font-size: 14px;
  cursor: pointer;
}

/* รายการสถานที่ */
.place-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

/* Loading & Empty State */
.loading-text,
.no-data {
  text-align: center;
  color: #666;
  margin-top: 40px;
  font-size: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .place-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .add-place-btn {
    width: 100%;
    text-align: center;
  }

  .filter-bar {
    grid-template-columns: 1fr;
  }

  .place-list {
    grid-template-columns: 1fr;
  }
}
</style>
