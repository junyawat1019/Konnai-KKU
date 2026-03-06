<template>
  <DefaultLayout>
    <div class="auth-container">
      <h2>แก้ไขสถานที่</h2>

      <form @submit.prevent="updatePlace">
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
        <input
          v-model="tagsInput"
          placeholder="แท็ก (คั่นด้วย comma เช่น คาเฟ่,วิวสวย)"
        />

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
        <div
          v-if="previewImages.length || existingImages.length"
          class="preview-grid"
        >
          <div
            v-for="(src, index) in existingImages"
            :key="'existing-' + index"
            class="preview-item"
          >
            <img :src="src" class="preview-image" />
            <button type="button" @click="removeExistingImage(index)">
              ลบ
            </button>
          </div>

          <div
            v-for="(src, index) in previewImages"
            :key="'new-' + index"
            class="preview-item"
          >
            <img :src="src" class="preview-image" />
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading"
          :class="{ 'loading-button': loading }"
        >
          {{ loading ? "กำลังบันทึก..." : "บันทึกการแก้ไข" }}
        </button>
      </form>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { db, storage, auth } from "@/firebase";
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

const router = useRouter();
const route = useRoute();
const placeId = route.params.id; // รับ placeId จาก route

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
const existingImages = ref([]); // รูปเดิมของร้าน
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

const removeExistingImage = (index) => {
  existingImages.value.splice(index, 1);
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

const loadPlace = async () => {
  if (!placeId) return;
  const docRef = doc(db, "places", placeId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    name.value = data.name || "";
    description.value = data.description || "";
    type.value = data.categoryId || "";
    priceLevel.value = data.priceLevel || "";
    tagsInput.value = data.tags?.join(",") || "";
    phoneNumber.value = data.phoneNumber || "";
    websiteUrl.value = data.websiteUrl || "";
    locationTags.value = data.locationTags || "";
    address.value = data.location?.address || "";
    district.value = data.location?.district || "";
    province.value = data.location?.province || "";
    lat.value = data.location?.lat || null;
    lng.value = data.location?.lng || null;
    existingImages.value = data.imageUrls || [];
  } else {
    alert("ไม่พบข้อมูลร้านค้า");
    router.push("/");
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

const updatePlace = async () => {
  if (!auth.currentUser) {
    alert("กรุณาเข้าสู่ระบบก่อนแก้ไขสถานที่");
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
    const newImageUrls = await uploadImages();
    const finalImageUrls = [...existingImages.value, ...newImageUrls];

    const placeRef = doc(db, "places", placeId);
    await updateDoc(placeRef, {
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
      imageUrls: finalImageUrls,
      updatedAt: serverTimestamp(),
    });

    alert("แก้ไขสถานที่สำเร็จ!");
    router.push(`/places/${placeId}`);
  } catch (error) {
    alert("เกิดข้อผิดพลาด: " + error.message);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadCategories();
  loadPlace();

  const initMap = () => {
    const defaultLatLng = {
      lat: lat.value || 13.736717,
      lng: lng.value || 100.523186,
    };
    const mapInstance = new google.maps.Map(document.getElementById("map"), {
      center: defaultLatLng,
      zoom: lat.value && lng.value ? 16 : 6,
    });

    const markerInstance = new google.maps.Marker({
      position: defaultLatLng,
      map: mapInstance,
      draggable: true,
    });

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
/* Container หลัก */
.auth-container {
  max-width: 650px;
  margin: 40px auto;
  padding: 25px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  font-family: "Noto Sans Thai", sans-serif;
}

/* Form */
form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* Inputs, Textarea, Select */
input,
select,
textarea {
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 15px;
  transition: border-color 0.2s ease;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #00aeef;
  outline: none;
}

/* Textarea */
textarea {
  resize: vertical;
  min-height: 80px;
}

/* Button */
button {
  background: #00aeef;
  color: white;
  border: none;
  padding: 12px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.1s ease;
}

button:hover {
  background: #007bbd;
  transform: translateY(-1px);
}

/* Loading state */
.loading-button {
  background: #007bbd !important;
  cursor: not-allowed;
}

/* Preview images grid */
.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  margin-top: 10px;
}

/* Preview item */
.preview-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.preview-item img.preview-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #ddd;
}

/* ปุ่มลบรูป */
.preview-item button {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(255, 0, 0, 0.85);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 3px 6px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.preview-item button:hover {
  background: red;
}

/* Map container */
.map-container {
  position: relative;
  margin-bottom: 15px;
}

/* Search box */
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

/* Labels & headings */
h2 {
  margin-bottom: 20px;
  font-size: 22px;
  font-weight: 600;
  color: #333;
}

/* Responsive */
@media (max-width: 768px) {
  .auth-container {
    margin: 20px;
    padding: 20px;
  }

  .preview-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }

  #search-box {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  input,
  select,
  textarea,
  button {
    font-size: 14px;
    padding: 10px;
  }

  .preview-grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  }
}
</style>
