<template>
  <DefaultLayout>
    <div class="place-detail-page">
      <!-- ส่วนหัว -->
      <div class="place-header">
        <h1>สถานที่รอบมหาวิทยาลัยขอนแก่น</h1>
        <button class="add-place-btn" @click="goToAddPlace">
          <i class="fa fa-plus"></i> เพิ่มสถานที่ใหม่
        </button>
      </div>

      <!-- แถบกรอง -->
      <div class="filter-bar">
        <!-- หมวดหมู่ -->
        <select v-model="activeCategory" @change="applyFilters">
          <option value="">ทุกหมวดหมู่</option>
          <option value="restaurant">ร้านอาหาร</option>
          <option value="cafe">คาเฟ่ & เครื่องดื่ม</option>
          <option value="apartment">หอพัก / อพาร์ตเมนต์</option>
          <option value="hotel">โรงแรม / ที่พัก</option>
          <option value="shopping">แหล่งช็อปปิ้ง</option>
          <option value="tourist">สถานที่ท่องเที่ยว</option>
          <option value="sports">สถานที่ออกกำลังกาย</option>
          <option value="entertainment">บันเทิง & ไลฟ์สไตล์</option>
          <option value="services">บริการต่าง ๆ</option>
        </select>

        <!-- ช่วงราคา -->
        <select v-model="activePriceLevel" @change="applyFilters">
          <option value="">ทุกช่วงราคา</option>
          <option :value="1">0 - 100 บาท</option>
          <option :value="2">101 - 300 บาท</option>
          <option :value="3">301 - 500 บาท</option>
          <option :value="4">501 - 1000 บาท</option>
          <option :value="5">มากกว่า 1000 บาท</option>
        </select>

        <!-- บริเวณ -->
        <select v-model="activeLocationTag" @change="applyFilters">
          <option value="">ทุกบริเวณ</option>
          <option value="กังสดาล">กังสดาล</option>
          <option value="หลังมอ">หลังมอ</option>
          <option value="โนนม่วง">โนนม่วง</option>
          <option value="โคลัมโบ">โคลัมโบ</option>
          <option value="ในเมือง">ในเมือง</option>
        </select>

        <!-- คะแนนเฉลี่ย -->
        <select v-model="activeRating" @change="applyFilters">
          <option value="">ทุกคะแนน</option>
          <option :value="1">1 ดาวขึ้นไป</option>
          <option :value="2">2 ดาวขึ้นไป</option>
          <option :value="3">3 ดาวขึ้นไป</option>
          <option :value="4">4 ดาวขึ้นไป</option>
          <option :value="5">5 ดาว</option>
        </select>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-text">กำลังโหลดข้อมูล...</div>

      <!-- ถ้าไม่มีข้อมูล -->
      <div v-else-if="filteredPlaces.length === 0" class="no-data">
        ไม่มีสถานที่ที่ตรงกับเงื่อนไข
      </div>

      <!-- แสดงรายการสถานที่ -->
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
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import PlaceCard from "@/components/PlaceCard.vue";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";

const router = useRouter();
const route = useRoute();

const places = ref([]);
const filteredPlaces = ref([]);
const loading = ref(false);

const activeCategory = ref("");
const activePriceLevel = ref("");
const activeLocationTag = ref("");
const activeRating = ref("");

// Fetch data จาก Firestore
const fetchPlaces = async () => {
  loading.value = true;
  places.value = [];
  filteredPlaces.value = [];

  try {
    const snapshot = await getDocs(collection(db, "places"));
    places.value = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name || "",
        categoryId: data.categoryId || "",
        priceLevel: data.priceLevel || 0,
        locationTags: data.locationTags || "",
        averageRating: Number(data.averageRating) || 0,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate()
          : new Date(),
        description: data.description || "",
        imageUrls: data.imageUrls || [],
        tags: data.tags || [],
        address: data.location?.address || "",
      };
    });

    applyFilters();
  } catch (err) {
    console.error("Error fetching places:", err);
  } finally {
    loading.value = false;
  }
};

// ฟังก์ชันกรองแบบ client-side
const applyFilters = () => {
  filteredPlaces.value = places.value.filter((p) => {
    let keep = true;

    // หมวดหมู่
    if (activeCategory.value) {
      keep = keep && p.categoryId === activeCategory.value;
    }

    // ช่วงราคา (ตรงกับ priceLevel 1–5)
    if (activePriceLevel.value) {
      keep = keep && p.priceLevel === Number(activePriceLevel.value);
    }

    // บริเวณ
    if (activeLocationTag.value) {
      keep = keep && p.locationTags === activeLocationTag.value;
    }

    // คะแนนเฉลี่ย
    if (activeRating.value !== "") {
      keep = keep && (Number(p.averageRating) || 0) >= Number(activeRating.value);
    }

    return keep;
  });
};


// กดปุ่มเพิ่มสถานที่
const goToAddPlace = () => router.push("/add-place");

// ดึงค่า category จาก query param
onMounted(() => {
  const categoryQuery = route.query.category;
  if (categoryQuery) activeCategory.value = categoryQuery;

  fetchPlaces();
});
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
