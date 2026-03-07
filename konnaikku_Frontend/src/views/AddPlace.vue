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
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import DefaultLayout from "@/layouts/DefaultLayout.vue"
import axios from "axios"

const router = useRouter()

const API_URL = "http://localhost:8080/api"

const loading = ref(false)

const name = ref("")
const description = ref("")
const type = ref("")
const phoneNumber = ref("")
const websiteUrl = ref("")
const address = ref("")
const district = ref("")
const province = ref("")
const lat = ref(null)
const lng = ref(null)
const locationTags = ref("")
const priceLevel = ref("")
const tagsInput = ref("")

const imageFiles = ref([])
const previewImages = ref([])

const categories = ref([])

const onFileChange = (e) => {
  const files = Array.from(e.target.files).filter(f => f.type.startsWith("image/"))
  imageFiles.value = files

  previewImages.value.forEach(URL.revokeObjectURL)

  previewImages.value = files.map(f => URL.createObjectURL(f))
}

const loadCategories = async () => {
  try {
    const res = await axios.get(`${API_URL}/categories`)
    categories.value = res.data
  } catch (err) {
    console.error("โหลดหมวดหมู่ไม่สำเร็จ", err)
  }
}

const addPlace = async () => {

  if (!type.value) {
    alert("กรุณาเลือกประเภทสถานที่")
    return
  }

  if (!lat.value || !lng.value) {
    alert("กรุณาเลือกตำแหน่งบนแผนที่")
    return
  }

  loading.value = true

  try {

    const formData = new FormData()

    formData.append("name", name.value)
    formData.append("description", description.value)
    formData.append("category_id", type.value)
    formData.append("price_level", priceLevel.value)

    formData.append("phone_number", phoneNumber.value)
    formData.append("website_url", websiteUrl.value)

    formData.append("location_tag", locationTags.value)

    formData.append("address", address.value)
    formData.append("district", district.value)
    formData.append("province", province.value)

    formData.append("lat", lat.value)
    formData.append("lng", lng.value)

    imageFiles.value.forEach(file => {
      formData.append("images", file)
    })

    const token = localStorage.getItem("token")

    await axios.post(`${API_URL}/places`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data"
      }
    })

    alert("เพิ่มสถานที่สำเร็จ")

    router.push("/")

  } catch (error) {

    console.error(error)
    alert("เกิดข้อผิดพลาด")

  } finally {
    loading.value = false
  }
}

onMounted(() => {

  loadCategories()

  const initMap = () => {

    const defaultLatLng = { lat: 13.736717, lng: 100.523186 }

    const mapInstance = new google.maps.Map(
      document.getElementById("map"),
      {
        center: defaultLatLng,
        zoom: 6
      }
    )

    const markerInstance = new google.maps.Marker({
      position: defaultLatLng,
      map: mapInstance,
      draggable: true
    })

    lat.value = defaultLatLng.lat
    lng.value = defaultLatLng.lng

    markerInstance.addListener("dragend", () => {
      const pos = markerInstance.getPosition()
      lat.value = pos.lat()
      lng.value = pos.lng()
    })

    const input = document.getElementById("search-box")
    const searchBox = new google.maps.places.SearchBox(input)

    mapInstance.controls[google.maps.ControlPosition.TOP_LEFT].push(input)

    searchBox.addListener("places_changed", () => {

      const places = searchBox.getPlaces()

      if (!places || places.length === 0) return

      const place = places[0]

      if (!place.geometry) return

      lat.value = place.geometry.location.lat()
      lng.value = place.geometry.location.lng()

      address.value = place.formatted_address || place.name

      mapInstance.setCenter(place.geometry.location)
      mapInstance.setZoom(16)

      markerInstance.setPosition(place.geometry.location)

    })

    mapInstance.addListener("click", (e) => {

      lat.value = e.latLng.lat()
      lng.value = e.latLng.lng()

      markerInstance.setPosition(e.latLng)

    })

  }

  if (window.google) {

    initMap()

  } else {

    const script = document.createElement("script")

    script.src =
      "https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAP_API&libraries=places"

    script.async = true
    script.defer = true
    script.onload = initMap

    document.head.appendChild(script)

  }

})
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
