<template>
  <div v-if="place" class="place-card" @click="goToDetail">
    <!-- Image -->
    <div class="place-img-wrapper">
      <img
        :src="displayImage"
        alt="place"
        class="place-img"
        @error="handleImageError"
      />
    </div>

    <!-- Info -->
    <div class="place-info">
      <h2 class="place-name">
        {{ place.name }}
      </h2>

      <div class="category">
        {{ place.categoryName }}
      </div>

      <!-- ราคา -->
      <div v-if="place.priceLevel" class="price-range">
        <strong>ช่วงราคา:</strong>
        {{ priceLabel }}
      </div>

      <div v-if="place.locationTags" class="location-tags">
        <strong>บริเวณ:</strong>
        {{ place.locationTags }}
      </div>

      <div v-if="place.tags?.length" class="tags">
        {{ place.tags.join(", ") }}
      </div>

      <div class="rating-review">
        <span class="rating">
          <i class="fa fa-star"></i>
          {{ rating }}
        </span>

        <span class="review-count"> ({{ reviewCount }} รีวิว) </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

const router = useRouter();

const props = defineProps({
  place: {
    type: Object,
    required: true,
  },
});

/* ======================
   PLACE STATE
====================== */

const placeData = ref(props.place);

/* ======================
   PLACEHOLDER IMAGE
====================== */

const placeholderImage = "https://placehold.co/400x300?text=No+Image";

/* ======================
   FETCH IMAGES
====================== */

const fetchImages = async () => {
  try {
    if (!placeData.value?.id) return;

    const res = await axios.get(`${API}/places/${placeData.value.id}/images`);

    const imageUrls = (res.data || []).map((i) => i.image_url);

    placeData.value.imageUrls = imageUrls;
  } catch (err) {
    console.error("fetch images error", err);
  }
};

/* ======================
   IMAGE
====================== */

const displayImage = computed(() => {
  if (!placeData.value) return placeholderImage;

  if (placeData.value.imageUrls && placeData.value.imageUrls.length > 0) {
    return placeData.value.imageUrls[0];
  }

  return placeholderImage;
});

const handleImageError = (e) => {
  e.target.src = placeholderImage;
};

/* ======================
   RATING
====================== */

const rating = computed(() => {
  return Number(placeData.value?.averageRating ?? 0).toFixed(1);
});

const reviewCount = computed(() => {
  return Number(placeData.value?.reviewCount ?? 0);
});

/* ======================
   PRICE LEVEL
====================== */

const priceLabel = computed(() => {
  const level = Number(placeData.value?.priceLevel ?? 0);

  switch (level) {
    case 1:
      return "0 - 100 บาท";
    case 2:
      return "101 - 300 บาท";
    case 3:
      return "301 - 500 บาท";
    case 4:
      return "501 - 1000 บาท";
    case 5:
      return "มากกว่า 1000 บาท";

    default:
      return "-";
  }
});

/* ======================
   NAVIGATION
====================== */

const goToDetail = () => {
  if (!placeData.value?.id) return;

  router.push(`/place/${placeData.value.id}`);
};

/* ======================
   MOUNTED
====================== */

onMounted(() => {
  fetchImages();
});
</script>

<style scoped>
/* CSS เหมือนเดิมของคุณ */
.place-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.place-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}
.place-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}
.place-info {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
.place-info h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}
.category,
.location-tags {
  font-size: 16px;
  font-weight: 500;
  color: #d32f2f;
}
.price-range {
  font-size: 16px;
  font-weight: 500;
  color: #d32f2f;
}
.rating-review {
  margin-top: auto;
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
.review-count {
  font-size: 12px;
  color: #777;
}
.loading {
  text-align: center;
  padding: 20px;
  color: #777;
}
</style>
