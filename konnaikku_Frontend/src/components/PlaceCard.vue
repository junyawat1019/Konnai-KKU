<template>
  <div v-if="place" class="place-card" @click="goToDetail">
    
    <!-- Image -->
    <div class="place-img-wrapper">
      <img
        :src="mainImage"
        alt="place"
        class="place-img"
        loading="lazy"
      />
    </div>

    <!-- Info -->
    <div class="place-info">
      <h2>{{ place.name || "ไม่มีชื่อร้าน" }}</h2>

      <p class="category">
        {{ place.categoryName || "ไม่ระบุหมวด" }}
      </p>

      <div
        v-if="place.locationTags"
        class="location-tags"
      >
        <strong>บริเวณ:</strong> {{ place.locationTags }}
      </div>

      <div
        v-if="place.tags?.length"
        class="tags"
      >
        {{ place.tags.join(", ") }}
      </div>

      <div class="rating-review">
        <span class="rating">
          <i class="fa fa star"> </i> {{ rating }}
        </span>

        <span class="review-count">
          ({{ reviewCount }} รีวิว)
        </span>
      </div>

    </div>

  </div>

  <div v-else class="loading">
    กำลังโหลดข้อมูล...
  </div>
</template>

<script setup>
import { computed } from "vue"
import { useRouter } from "vue-router"

const props = defineProps({
  place: Object
})

const router = useRouter()

const placeholderImage =
  "https://placehold.co/400x300?text=No+Image"

/*
|--------------------------------------------------------------------------
| Computed
|--------------------------------------------------------------------------
*/

const mainImage = computed(() => {
  return props.place?.imageUrls?.[0] || placeholderImage
})

const rating = computed(() => {
  return Number(props.place?.averageRating || 0).toFixed(1)
})

const reviewCount = computed(() => {
  return props.place?.reviewCount || 0
})

/*
|--------------------------------------------------------------------------
| Navigation
|--------------------------------------------------------------------------
*/

const goToDetail = () => {
  if (!props.place?.id) return
  router.push(`/place/${props.place.id}`)
}
</script>

<style scoped>
.place-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.place-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.place-img-wrapper {
  position: relative;
}

.place-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.price-level {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(0, 174, 239, 0.9);
  color: white;
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
}

.place-info {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 0px;
  flex-grow: 1;
}

.place-info h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.category {
  font-size: 18px;
  font-weight: 500;
  color: #d32f2f;
  margin-bottom: 0px;
  /* เพิ่มระยะห่างจากแท็กหรือส่วนถัดไป */
}

.location-tags {
  font-size: 16px;
  font-weight: 500;
  color: #d32f2f;
  margin-bottom: 0px;
  /* เพิ่มระยะห่างจากแท็กหรือส่วนถัดไป */
}

.tags {
  font-size: 12px;
  color: #d32f2f;
  margin-bottom: 0px;
  /* เพิ่มระยะห่างจาก rating */
}

.rating-review {
  margin-top: auto;
  /* ดัน rating ไปด้านล่าง */
  display: flex;
  align-items: center;
  gap: 6px;
}

.rating {
  background: #ff4d4f;
  color: white;
  font-size: 12px;
  padding: 4px 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.rating i {
  margin-right: 4px;
}

.review-count {
  font-size: 12px;
  color: #777;
  margin-left: 6px;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #777;
}
</style>
