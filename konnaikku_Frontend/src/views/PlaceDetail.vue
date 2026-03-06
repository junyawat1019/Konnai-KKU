<template>
  <DefaultLayout>
    <div v-if="place" class="place-detail-page">
      <!-- รูปภาพร้าน -->
      <div class="place-images-container" v-if="place.imageUrls?.length">
        <!-- รูปใหญ่ -->
        <div class="main-image-wrapper">
          <img :src="place.imageUrls[0]" class="main-image" alt="Main Image" />
        </div>

        <!-- รูปเล็กด้านข้าง -->
        <div class="side-images-grid">
          <div
            v-for="(url, index) in place.imageUrls.slice(1, 5)"
            :key="index"
            class="side-image-wrapper"
            :class="{ clickable: index === 3 && place.imageUrls.length > 5 }"
            @click="
              index === 3 && place.imageUrls.length > 5
                ? openPhotoViewer(index + 1)
                : null
            "
          >
            <img :src="url" class="side-image" />
            <div
              v-if="index === 3 && place.imageUrls.length > 5"
              class="overlay"
            >
              +{{ place.imageUrls.length - 5 }}
            </div>
          </div>
        </div>
      </div>

      <!-- ข้อมูลร้าน -->
      <div class="place-info-card">
        <div class="info-header">
          <h1>{{ place.name }}</h1>
          <p class="category">
            {{ place.categoryName }} - {{ place.location.address }}
          </p>
          <p class="rating">
            <i class="fa fa-star"></i>
            {{ place.averageRating?.toFixed(1) || 0 }} ({{
              place.reviewCount || 0
            }}
            รีวิว)
          </p>
        </div>

        <p class="description">{{ place.description }}</p>

        <div class="place-details">
          <div>
            <strong>ช่วงราคา:</strong> {{ getPriceLabel(place.priceLevel) }}
          </div>
          <div v-if="place.tags?.length">
            <strong>แท็ก:</strong> {{ place.tags.join(", ") }}
          </div>
          <div v-if="place.locationTags?.length">
            <strong>บริเวณ:</strong> {{ place.locationTags }}
          </div>
          <div v-if="place.phoneNumber">
            <strong>เบอร์โทร:</strong> {{ place.phoneNumber }}
          </div>
          <div v-if="place.websiteUrl">
            <strong>เว็บไซต์:</strong>
            <a :href="place.websiteUrl" target="_blank" class="link-wrap">{{
              place.websiteUrl
            }}</a>
          </div>
          <div>
            <strong>พิกัด:</strong>
            <a
              :href="getGoogleMapLink(place.location.lat, place.location.lng)"
              target="_blank"
              class="map-link link-wrap"
            >
              ละติจูด {{ place.location.lat }}, ลองจิจูด
              {{ place.location.lng }}
            </a>
          </div>
        </div>

        <!-- ปุ่ม -->
        <div class="action-buttons">
          <button class="btn-route" @click="goToGoogleMaps">เส้นทาง</button>
          <button class="btn-add-review" @click="scrollToReview">
            เขียนรีวิว
          </button>
          <button
            v-if="currentUserId"
            :class="['btn-favorite', isFavorited ? 'favorited' : '']"
            @click="toggleFavorite"
          >
            {{ isFavorited ? "ยกเลิกบันทึก" : "บันทึกสถานที่โปรด" }}
          </button>
          <button
            v-if="place?.createdBy === currentUserId"
            class="btn-edit"
            @click="goToEditPage"
          >
            แก้ไขร้าน
          </button>
        </div>
      </div>

      <!-- ฟิลเตอร์รีวิว -->
      <div class="reviews-filter">
        <label>กรองรีวิวตามคะแนน:</label>
        <select v-model.number="filterRating">
          <option value="0">ทั้งหมด</option>
          <option v-for="n in 5" :key="n" :value="n">{{ n }} ดาว</option>
        </select>
      </div>

      <!-- รีวิว -->
      <div class="reviews-section">
        <h2>รีวิว</h2>
        <div v-if="filteredReviews.length">
          <ReviewCard
            v-for="r in displayedReviews"
            :key="r.id"
            :review="r"
            :placeId="placeId"
          />
          <button
            v-if="reviewsToShow < filteredReviews.length"
            @click="showAllReviews"
            class="btn-show-all"
          >
            แสดงรีวิวทั้งหมด
          </button>
        </div>
        <div v-else>
          <p>ยังไม่มีรีวิว</p>
        </div>
      </div>

      <!-- เพิ่มรีวิว -->
      <AddReview
        ref="addReviewRef"
        :placeId="placeId"
        @reviewAdded="onReviewAdded"
      />
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import ReviewCard from "@/components/ReviewCard.vue";
import AddReview from "@/components/AddReview.vue";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "@/firebase";

const route = useRoute();
const router = useRouter();
const placeId = route.params.id;

const place = ref(null);
const reviews = ref([]);
const filterRating = ref(0); // 0 = all
const reviewsToShow = ref(7);
const addReviewRef = ref(null);

// favorite
const currentUserId = ref(null);
const isFavorited = ref(false);

// ฟีเจอร์ PhotoView: กดเฉพาะ overlay +N
const openPhotoViewer = (index) => {
  router.push({ name: "PhotoView", params: { id: placeId, index } });
};

const goToEditPage = () => {
  router.push(`/edit-place/${placeId}`);
};

// คำนวณรีวิวตาม filter
const filteredReviews = computed(() => {
  if (filterRating.value === 0) return reviews.value;
  return reviews.value.filter((r) => r.rating === filterRating.value);
});
const displayedReviews = computed(() =>
  filteredReviews.value.slice(0, reviewsToShow.value)
);

// Google Map Link
const getGoogleMapLink = (lat, lng) => {
  if (!lat || !lng) return "#";
  return `https://www.google.com/maps?q=${lat},${lng}&hl=th`;
};
const goToGoogleMaps = () => {
  if (place.value?.location) {
    window.open(
      getGoogleMapLink(place.value.location.lat, place.value.location.lng),
      "_blank"
    );
  }
};

// scroll ไปยัง AddReview
const scrollToReview = () => {
  nextTick(() => {
    addReviewRef.value?.$el.scrollIntoView({ behavior: "smooth" });
  });
};

// แสดงรีวิวทั้งหมด
const showAllReviews = () => {
  reviewsToShow.value = filteredReviews.value.length;
};

// fetch place
const fetchPlace = async () => {
  const docRef = doc(db, "places", placeId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) place.value = { id: docSnap.id, ...docSnap.data() };
};

// รีวิว realtime
let unsubscribeReviews = null;
const fetchReviewsRealtime = () => {
  if (unsubscribeReviews) unsubscribeReviews();
  const reviewsRef = collection(db, "places", placeId, "reviews");
  unsubscribeReviews = onSnapshot(reviewsRef, (snapshot) => {
    const loadedReviews = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    loadedReviews.sort(
      (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );
    reviews.value = loadedReviews;
  });
};

// favorite
const checkIfFavorited = async () => {
  if (!currentUserId.value) return;
  const favRef = doc(db, "users", currentUserId.value, "favorites", placeId);
  const favSnap = await getDoc(favRef);
  isFavorited.value = favSnap.exists();
};
const toggleFavorite = async () => {
  if (!currentUserId.value) return alert("กรุณาเข้าสู่ระบบก่อน");
  const favRef = doc(db, "users", currentUserId.value, "favorites", placeId);
  if (isFavorited.value) await deleteDoc(favRef);
  else
    await setDoc(favRef, {
      placeId,
      name: place.value.name || "",
      addedAt: new Date(),
    });
  isFavorited.value = !isFavorited.value;
};

// rating label
const getPriceLabel = (level) => {
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
};

// เมื่อมีรีวิวใหม่
const onReviewAdded = () => {
  reviewsToShow.value = 7;
  scrollToReview();
};

onMounted(() => {
  fetchPlace();
  fetchReviewsRealtime();
  auth.onAuthStateChanged((user) => {
    if (user) currentUserId.value = user.uid;
    checkIfFavorited();
  });
});
onUnmounted(() => {
  if (unsubscribeReviews) unsubscribeReviews();
});
</script>

<style scoped>
.place-detail-page {
  max-width: 1100px;
  margin: auto;
  padding: 24px;
  font-family: "Inter", sans-serif;
  color: #333;
  background-color: #f9f9f9;
}

/* รูปภาพ Layout ใหม่ */
.place-images-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
  margin-bottom: 28px;
}

.main-image-wrapper {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}

.main-image-wrapper:hover {
  transform: scale(1.03);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.main-image {
  max-height: 550px;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 16px;
}

.side-images-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.side-image-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  cursor: pointer;
  background-color: #f4f4f4;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.side-image-wrapper:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
}
.side-image-wrapper.clickable {
  cursor: pointer;
}

.side-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 12px;
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  border-radius: 12px;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
}

/* ข้อมูลร้าน */
.place-info-card {
  background: #fff;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

.place-info-card h1 {
  font-size: 1.9rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.category {
  color: #777;
  margin-bottom: 8px;
}

.description {
  margin: 12px 0;
  color: #555;
  line-height: 1.6;
}

.place-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 20px;
  font-size: 0.95rem;
  color: #555;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
}

.link-wrap,
.map-link {
  display: inline-block;
  max-width: 100%;
  overflow-wrap: break-word;
  word-break: break-word;
  color: #007bff;
  text-decoration: underline;
}

.link-wrap:hover,
.map-link:hover {
  color: #0056b3;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}

.action-buttons button {
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-route,
.btn-add-review,
.btn-edit,
.btn-favorite {
  background-color: #00aeef;
  color: white;
}

.btn-route:hover,
.btn-add-review:hover,
.btn-edit:hover,
.btn-favorite:hover {
  background-color: #0096cf;
}

.btn-favorite.favorited {
  background-color: #ff4d4f;
}

.btn-favorite.favorited:hover {
  background-color: #e03b3f;
}

/* รีวิว filter */
.reviews-filter {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.reviews-filter select {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

/* ปุ่มแสดงรีวิวทั้งหมด */
.btn-show-all {
  margin-top: 12px;
  padding: 8px 16px;
  border-radius: 12px;
  background-color: #00aeef;
  color: #fff;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-show-all:hover {
  background-color: #0096cf;
}

/* รีวิว Section */
.reviews-section h2 {
  font-size: 1.5rem;
  margin-bottom: 12px;
}

/* Responsive */
@media screen and (max-width: 1024px) {
  .place-images-container {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .main-image {
    height: 550px;
  }
}

@media screen and (max-width: 768px) {
  .place-images-container {
    grid-template-columns: 1fr;
  }

  .main-image {
    height: 220px;
  }

  .side-images-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .side-image-wrapper {
    height: 120px;
  }

  .place-details {
    grid-template-columns: 1fr;
  }
}

@media screen and (max-width: 480px) {
  .main-image {
    height: 180px;
  }

  .side-image-wrapper {
    height: 100px;
  }

  .place-info-card {
    padding: 16px;
  }

  .place-info-card h1 {
    font-size: 1.4rem;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
