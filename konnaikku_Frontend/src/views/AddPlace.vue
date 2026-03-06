<template>
  <DefaultLayout>
    <div class="auth-container">
      <h2>เพิ่มสถานที่ใหม่</h2>

      <form @submit.prevent="addPlace">
        <!-- ข้อมูลพื้นฐาน -->
        <input v-model="name" placeholder="ชื่อสถานที่" required />
        <textarea v-model="description" placeholder="คำอธิบาย"></textarea>

        <!-- ประเภท -->
        <select v-model="type" required>
          <option value="">เลือกประเภท</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>

        <!-- ช่วงราคา -->
        <select v-model.number="priceLevel" required>
          <option value="">เลือกช่วงราคา</option>
          <option :value="1">0 - 100 บาท</option>
          <option :value="2">101 - 300 บาท</option>
          <option :value="3">301 - 500 บาท</option>
          <option :value="4">501 - 1000 บาท</option>
          <option :value="5">มากกว่า 1000 บาท</option>
        </select>

        <!-- แท็ก -->
        <input v-model="tagsInput" placeholder="แท็ก (คั่นด้วย comma เช่น คาเฟ่,วิวสวย)" />

        <!-- ข้อมูลติดต่อ -->
        <input v-model="phoneNumber" placeholder="เบอร์โทรศัพท์" />
        <input v-model="websiteUrl" placeholder="เว็บไซต์" />

        <!-- แท็กบริเวณ -->
        <select v-model="locationTags">
          <option value="">เลือกบริเวณ</option>
          <option value="กังสดาล">กังสดาล</option>
          <option value="หลังมอ">หลังมอ</option>
          <option value="โนนม่วง">โนนม่วง</option>
          <option value="โคลัมโบ">โคลัมโบ</option>
          <option value="ในเมือง">ในเมือง</option>
        </select>

        <!-- ที่อยู่ -->
        <input v-model="address" placeholder="ที่อยู่" />
        <input v-model="district" placeholder="อำเภอ" />
        <input v-model="province" placeholder="จังหวัด" />

        <!-- Google Map Search Box -->
        <div class="map-container">
          <input id="search-box" type="text" placeholder="ค้นหาสถานที่" />
          <div id="map" style="height: 350px; margin-bottom: 10px"></div>
        </div>

        <p>พิกัด: ละติจูด {{ lat }}, ลองจิจูด {{ lng }}</p>

        <!-- อัปโหลดรูปภาพ -->
        <input type="file" multiple @change="onFileChange" accept="image/*" />

        <!-- แสดงรูปตัวอย่าง -->
        <div v-if="previewImages.length" class="preview-grid">
          <div v-for="(src, index) in previewImages" :key="index" class="preview-item">
            <img :src="src" class="preview-image" />
          </div>
        </div>

        <button type="submit" :disabled="loading" :class="{ 'loading-button': loading }">
          {{ loading ? "กำลังเพิ่มสถานที่..." : "เพิ่มสถานที่" }}
        </button>
      </form>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { db, storage, auth } from "@/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

const router = useRouter();

const loading = ref(false);

const name = ref("");
const description = ref("");
const type = ref("");
const phoneNumber = ref("");
const websiteUrl = ref("");
const address = ref("");
const district = ref("");
const province = ref("");
const lat = ref(null);
const lng = ref(null);
const locationTags = ref("");
const priceLevel = ref("");
const tagsInput = ref("");
const imageFiles = ref([]);
const previewImages = ref([]);
const categories = ref([]);

const fallbackCategories = [
  { id: "restaurant", name: "ร้านอาหาร" },
  { id: "cafe", name: "คาเฟ่ & เครื่องดื่ม" },
  { id: "apartment", name: "หอพัก / อพาร์ตเมนต์" },
  { id: "hotel", name: "โรงแรม / ที่พัก" },
  { id: "shopping", name: "แหล่งช็อปปิ้ง" },
  { id: "tourist", name: "สถานที่ท่องเที่ยว" },
  { id: "sports", name: "สถานที่ออกกำลังกาย" },
  { id: "entertainment", name: "บันเทิง & ไลฟ์สไตล์" },
  { id: "services", name: "บริการต่าง ๆ" },
];

const onFileChange = (e) => {
  const files = Array.from(e.target.files).filter((f) =>
    f.type.startsWith("image/")
  );
  imageFiles.value = files;
  previewImages.value.forEach(URL.revokeObjectURL);
  previewImages.value = files.map((f) => URL.createObjectURL(f));
};

const loadCategories = async () => {
  try {
    const catSnap = await getDocs(collection(db, "categories"));
    categories.value = catSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    if (categories.value.length === 0) {
      categories.value = fallbackCategories;
    }
  } catch (error) {
    console.error("ไม่สามารถโหลดหมวดหมู่จาก Firestore:", error);
    categories.value = fallbackCategories;
  }
};

const uploadImages = async () => {
  const urls = [];
  for (const file of imageFiles.value) {
    const uniqueFileName = `${Date.now()}_${file.name}`;
    const imgRef = storageRef(storage, `places/${uniqueFileName}`);
    const uploadTask = uploadBytesResumable(imgRef, file);

    await new Promise((resolve, reject) => {
      uploadTask.on("state_changed", null, reject, async () => {
        const downloadURL = await getDownloadURL(imgRef);
        urls.push(downloadURL);
        resolve();
      });
    });
  }
  return urls;
};

const addPlace = async () => {
  if (!auth.currentUser) {
    alert("กรุณาเข้าสู่ระบบก่อนเพิ่มสถานที่");
    router.push("/login");
    return;
  }
  if (!type.value) {
    alert("กรุณาเลือกประเภทของสถานที่");
    return;
  }
  if (!lat.value || !lng.value) {
    alert("กรุณาเลือกตำแหน่งบนแผนที่");
    return;
  }
  if (!priceLevel.value) {
    alert("กรุณาเลือกช่วงราคา");
    return;
  }

  loading.value = true;

  try {
    const imageUrls = await uploadImages();

    const placeData = {
      name: name.value,
      description: description.value,
      categoryId: type.value,
      categoryName:
        categories.value.find((cat) => cat.id === type.value)?.name || "",
      priceLevel: priceLevel.value,
      tags: tagsInput.value
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag),
      phoneNumber: phoneNumber.value || "",
      websiteUrl: websiteUrl.value || "",
      locationTags: locationTags.value,
      location: {
        address: address.value,
        district: district.value,
        province: province.value,
        lat: lat.value,
        lng: lng.value,
      },
      imageUrls,
      averageRating: 0,
      reviewCount: 0,
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser.uid,
    };

    await addDoc(collection(db, "places"), placeData);
    alert("เพิ่มสถานที่สำเร็จ!");
    router.push("/");
  } catch (error) {
    alert("เกิดข้อผิดพลาด: " + error.message);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadCategories();

  const initMap = () => {
    const defaultLatLng = { lat: 13.736717, lng: 100.523186 };
    const mapInstance = new google.maps.Map(document.getElementById("map"), {
      center: defaultLatLng,
      zoom: 6,
    });

    const markerInstance = new google.maps.Marker({
      position: defaultLatLng,
      map: mapInstance,
      draggable: true,
    });

    lat.value = defaultLatLng.lat;
    lng.value = defaultLatLng.lng;

    markerInstance.addListener("dragend", () => {
      const pos = markerInstance.getPosition();
      lat.value = pos.lat();
      lng.value = pos.lng();
    });

    const input = document.getElementById("search-box");
    const searchBox = new google.maps.places.SearchBox(input);

    mapInstance.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    searchBox.addListener("places_changed", () => {
      const places = searchBox.getPlaces();
      if (!places || places.length === 0) return;

      const place = places[0];
      if (!place.geometry) return;

      lat.value = place.geometry.location.lat();
      lng.value = place.geometry.location.lng();
      address.value = place.formatted_address || place.name;

      const districtComponent = place.address_components?.find(
        (c) =>
          c.types.includes("sublocality_level_1") ||
          c.types.includes("administrative_area_level_2")
      );
      district.value = districtComponent?.long_name || "";

      mapInstance.setCenter(place.geometry.location);
      mapInstance.setZoom(16);

      markerInstance.setPosition(place.geometry.location);
    });

    mapInstance.addListener("click", (e) => {
      lat.value = e.latLng.lat();
      lng.value = e.latLng.lng();
      markerInstance.setPosition(e.latLng);
    });
  };

  if (window.google) {
    initMap();
  } else {
    const script = document.createElement("script");
    script.src =
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyA0o70lTNSC3teBOdcJsNm8cWLDNcjwnYk&libraries=places";
    script.async = true;
    script.defer = true;
    script.onload = initMap;
    document.head.appendChild(script);
  }
});
</script>

<style scoped>
.auth-container {
  max-width: 650px;
  margin: 40px auto;
  padding: 25px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  font-family: "Noto Sans Thai", sans-serif;
}

form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

input,
select,
textarea {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
}

button {
  background: #00aeef;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
}

button:hover {
  background: #007bbd;
}

/* ปุ่มตอนกำลังโหลดให้สีเข้มขึ้น */
.loading-button {
  background: #007bbd !important;
  cursor: not-allowed;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.preview-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border: 1px solid #ddd;
  border-radius: 6px;
}

#search-box {
  box-sizing: border-box;
  border: 1px solid transparent;
  width: 240px;
  height: 40px;
  padding: 0 12px;
  border-radius: 3px;
  font-size: 16px;
  outline: none;
  margin-top: 10px;
}

.map-container {
  position: relative;
}
</style>
