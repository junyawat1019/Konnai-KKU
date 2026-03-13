<template>
  <DefaultLayout>
    <div class="auth-container">
      <h2>เพิ่มสถานที่ใหม่</h2>

      <form @submit.prevent="addPlace">
        <!-- ชื่อ -->
        <input v-model="name" placeholder="ชื่อสถานที่" required />

        <!-- คำอธิบาย -->
        <textarea v-model="description" placeholder="คำอธิบาย"></textarea>

        <!-- ประเภท -->
        <select v-model="type" required>
          <option value="">เลือกประเภท</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>

        <!-- ราคา -->
        <select v-model.number="priceLevel" required>
          <option value="">เลือกช่วงราคา</option>
          <option :value="1">0 - 100 บาท</option>
          <option :value="2">101 - 300 บาท</option>
          <option :value="3">301 - 500 บาท</option>
          <option :value="4">501 - 1000 บาท</option>
          <option :value="5">มากกว่า 1000 บาท</option>
        </select>

        <!-- แท็ก -->
        <input v-model="tagsInput" placeholder="แท็ก (คั่นด้วย comma)" />

        <!-- โทร -->
        <input v-model="phoneNumber" placeholder="เบอร์โทรศัพท์" />

        <!-- website -->
        <input v-model="websiteUrl" placeholder="เว็บไซต์" />

        <!-- location tag -->
        <select v-model="locationTags">
          <option value="">เลือกบริเวณ</option>
          <option value="กังสดาล">กังสดาล</option>
          <option value="หลังมอ">หลังมอ</option>
          <option value="โนนม่วง">โนนม่วง</option>
          <option value="โคลัมโบ">โคลัมโบ</option>
          <option value="ในเมือง">ในเมือง</option>
        </select>

        <!-- address -->
        <input v-model="address" placeholder="ที่อยู่" />
        <input v-model="district" placeholder="อำเภอ" />
        <input v-model="province" placeholder="จังหวัด" />

        <!-- MAP -->
        <div class="map-container">
          <input id="search-box" type="text" placeholder="ค้นหาสถานที่" />
          <div id="map" style="height: 350px; margin-bottom: 10px"></div>
        </div>

        <p>พิกัด: {{ lat }} , {{ lng }}</p>

        <!-- Upload Image -->
        <input
          type="file"
          multiple
          @change="onFileChange"
          accept="image/*"
          ref="fileInput"
        />

        <!-- Image Preview -->
        <div v-if="previewImages.length" class="preview-grid">
          <div
            v-for="(src, index) in previewImages"
            :key="src"
            class="preview-item"
          >
            <img :src="src" class="preview-image" />

            <button
              type="button"
              class="remove-btn"
              @click="removePreviewImage(index)"
            >
              ✕
            </button>
          </div>
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? "กำลังเพิ่มสถานที่..." : "เพิ่มสถานที่" }}
        </button>
      </form>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"
import { useRouter } from "vue-router"
import axios from "axios"
import DefaultLayout from "@/layouts/DefaultLayout.vue"

const API = import.meta.env.VITE_API_URL

const router = useRouter()

const loading = ref(false)

const name = ref("")
const description = ref("")
const type = ref("")
const priceLevel = ref("")
const tagsInput = ref("")
const phoneNumber = ref("")
const websiteUrl = ref("")
const locationTags = ref("")
const address = ref("")
const district = ref("")
const province = ref("")
const lat = ref(null)
const lng = ref(null)

const categories = ref([])

const imageFiles = ref([])
const previewImages = ref([])

const fileInput = ref(null)

let map
let marker

/* =========================
FILE CHANGE
========================= */

const onFileChange = (e) => {

  const files = Array.from(e.target.files)

  files.forEach(file => {

    const exists = imageFiles.value.some(
      f => f.name === file.name && f.size === file.size
    )

    if (exists) return

    imageFiles.value.push(file)

    const preview = URL.createObjectURL(file)

    previewImages.value.push(preview)

  })

  if (fileInput.value) {
    fileInput.value.value = ""
  }

}

/* =========================
REMOVE PREVIEW IMAGE
========================= */

const removePreviewImage = (index) => {

  const url = previewImages.value[index]

  URL.revokeObjectURL(url)

  previewImages.value.splice(index, 1)
  imageFiles.value.splice(index, 1)

}

/* =========================
LOAD CATEGORY
========================= */

const loadCategories = async () => {

  try {

    const res = await axios.get(`${API}/categories`)

    if (res.data.success) {
      categories.value = res.data.data
    }

  } catch (err) {

    console.error("load category error", err)

  }

}

/* =========================
MAP
========================= */

const initMap = () => {

  const defaultPos = {
    lat: 13.736717,
    lng: 100.523186
  }

  map = new google.maps.Map(
    document.getElementById("map"),
    {
      center: defaultPos,
      zoom: 15
    }
  )

  marker = new google.maps.Marker({
    position: defaultPos,
    map: map,
    draggable: true
  })

  lat.value = defaultPos.lat
  lng.value = defaultPos.lng

  marker.addListener("dragend", () => {

    const pos = marker.getPosition()

    lat.value = pos.lat()
    lng.value = pos.lng()

  })

  const input = document.getElementById("search-box")

  const searchBox = new google.maps.places.SearchBox(input)

  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input)

  searchBox.addListener("places_changed", () => {

    const places = searchBox.getPlaces()

    if (!places.length) return

    const place = places[0]

    if (!place.geometry) return

    lat.value = place.geometry.location.lat()
    lng.value = place.geometry.location.lng()

    address.value = place.formatted_address || place.name

    map.setCenter(place.geometry.location)
    map.setZoom(16)

    marker.setPosition(place.geometry.location)

  })

  map.addListener("click", (e) => {

    lat.value = e.latLng.lat()
    lng.value = e.latLng.lng()

    marker.setPosition(e.latLng)

  })

}

/* =========================
ADD PLACE
========================= */

const addPlace = async () => {

  const token = localStorage.getItem("token")

  if (!token) {

    alert("กรุณา login")
    router.push("/login")
    return

  }

  if (!lat.value || !lng.value) {

    alert("กรุณาเลือกตำแหน่ง")
    return

  }

  loading.value = true

  try {

    const form = new FormData()

    form.append("name", name.value)
    form.append("description", description.value)
    form.append("category_id", type.value)
    form.append("price_level", priceLevel.value)

    form.append("address", address.value)
    form.append("district", district.value)
    form.append("province", province.value)

    form.append("lat", lat.value)
    form.append("lng", lng.value)

    form.append("phone_number", phoneNumber.value)
    form.append("website_url", websiteUrl.value)
    form.append("location_tag", locationTags.value)

    imageFiles.value.forEach(file => {
      form.append("images", file)
    })

    await axios.post(
      `${API}/places`,
      form,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      }
    )

    alert("เพิ่มสถานที่สำเร็จ")

    router.push("/")

  } catch (err) {

    console.error(err)

    alert("เกิดข้อผิดพลาด")

  } finally {

    loading.value = false

  }

}

/* =========================
INIT
========================= */

onMounted(async () => {

  await loadCategories()

  if (window.google) {

    initMap()

  } else {

    const script = document.createElement("script")

    script.src =
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyA0o70lTNSC3teBOdcJsNm8cWLDNcjwnYk&libraries=places"

    script.async = true
    script.defer = true
    script.onload = initMap

    document.head.appendChild(script)

  }

})

onUnmounted(() => {

  previewImages.value.forEach(URL.revokeObjectURL)

})
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
  transition:
    background 0.2s ease,
    transform 0.1s ease;
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
