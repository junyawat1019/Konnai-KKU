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
import { ref, onMounted } from "vue"
import { useRouter, useRoute } from "vue-router"
import axios from "axios"
import DefaultLayout from "@/layouts/DefaultLayout.vue"

const router = useRouter()
const route = useRoute()

const API_URL = "http://localhost:8080/api"

const placeId = route.params.id

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
const existingImages = ref([])

const categories = ref([])

const onFileChange = (e) => {

  const files = Array.from(e.target.files)

  imageFiles.value = files

  previewImages.value.forEach(URL.revokeObjectURL)

  previewImages.value = files.map((f) => URL.createObjectURL(f))

}

const removeExistingImage = (index) => {

  existingImages.value.splice(index,1)

}

const loadCategories = async () => {

  try {

    const res = await axios.get(`${API_URL}/categories`)

    categories.value = res.data

  } catch (err) {

    console.error("โหลดหมวดหมู่ไม่สำเร็จ", err)

  }

}

const loadPlace = async () => {

  try {

    const res = await axios.get(`${API_URL}/places/${placeId}`)

    const data = res.data

    name.value = data.name
    description.value = data.description
    type.value = data.category_id
    priceLevel.value = data.price_level
    phoneNumber.value = data.phone_number
    websiteUrl.value = data.website_url
    locationTags.value = data.location_tag
    address.value = data.address
    district.value = data.district
    province.value = data.province
    lat.value = data.lat
    lng.value = data.lng

    existingImages.value = data.images || []

  } catch (error) {

    console.error("โหลดสถานที่ไม่สำเร็จ", error)

  }

}

const uploadImages = async () => {

  const urls = []

  for (const file of imageFiles.value) {

    const formData = new FormData()

    formData.append("image", file)

    const res = await axios.post(
      `${API_URL}/upload/image`,
      formData,
      {
        headers:{
          "Content-Type":"multipart/form-data"
        }
      }
    )

    urls.push(res.data.imageUrl)

  }

  return urls

}

const updatePlace = async () => {

  const token = localStorage.getItem("token")

  if (!token) {

    alert("กรุณาเข้าสู่ระบบก่อน")

    return

  }

  loading.value = true

  try {

    const newImages = await uploadImages()

    const finalImages = [...existingImages.value,...newImages]

    await axios.put(

      `${API_URL}/places/${placeId}`,

      {
        name:name.value,
        description:description.value,
        category_id:type.value,
        price_level:priceLevel.value,
        phone_number:phoneNumber.value,
        website_url:websiteUrl.value,
        location_tag:locationTags.value,
        address:address.value,
        district:district.value,
        province:province.value,
        lat:lat.value,
        lng:lng.value,
        images:finalImages
      },

      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }

    )

    alert("แก้ไขสำเร็จ")

    router.push(`/places/${placeId}`)

  } catch (error) {

    console.error(error)

    alert("เกิดข้อผิดพลาด")

  } finally {

    loading.value = false

  }

}

onMounted(()=>{

  loadCategories()

  loadPlace()

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
