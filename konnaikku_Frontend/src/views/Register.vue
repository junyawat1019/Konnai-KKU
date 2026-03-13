<template>
  <DefaultLayout>
    <div class="auth-container">
      <h2>สมัครสมาชิก</h2>

      <form @submit.prevent="registerUser">

        <!-- PROFILE PHOTO -->
        <div class="profile-photo-section">
          <div class="photo-wrapper">
            <img :src="photoURL" class="profile-photo" />
          </div>

          <label class="upload-btn">
            เลือกรูปโปรไฟล์
            <input
              type="file"
              accept="image/*"
              hidden
              @change="uploadProfilePhoto"
            />
          </label>
        </div>

        <input
          v-model.trim="displayName"
          type="text"
          placeholder="ชื่อผู้ใช้"
          required
        />

        <select v-model="gender" required>
          <option disabled value="">เลือกเพศ</option>
          <option value="ชาย">ชาย</option>
          <option value="หญิง">หญิง</option>
          <option value="อื่นๆ">อื่นๆ</option>
        </select>

        <label>วันเกิด</label>
        <input v-model="birthday" type="date" required />

        <input
          v-model.trim="email"
          type="email"
          placeholder="อีเมล"
          required
        />

        <input
          v-model.trim="phoneNumber"
          type="tel"
          placeholder="เบอร์โทรศัพท์"
        />

        <textarea
          v-model.trim="aboutMe"
          placeholder="เกี่ยวกับฉัน"
        />

        <input
          v-model.trim="password"
          type="password"
          placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)"
          required
        />

        <input
          v-model.trim="confirmPassword"
          type="password"
          placeholder="ยืนยันรหัสผ่าน"
          required
        />

        <button type="submit" :disabled="loading">
          {{ loading ? "กำลังสมัคร..." : "สมัครสมาชิก" }}
        </button>
      </form>

      <p v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </p>

      <p class="switch-auth">
        มีบัญชีอยู่แล้ว?
        <router-link to="/login">เข้าสู่ระบบ</router-link>
      </p>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, watch } from "vue"
import { useRouter } from "vue-router"
import axios from "axios"
import api from "@/services/api"
import DefaultLayout from "@/layouts/DefaultLayout.vue"
import defaultAvatar from "@/assets/images/default-avatar.png"

const router = useRouter()

const API = import.meta.env.VITE_API_URL

/* ======================
FORM STATE
====================== */

const displayName = ref("")
const email = ref("")
const password = ref("")
const confirmPassword = ref("")
const gender = ref("")
const birthday = ref("")
const aboutMe = ref("")
const phoneNumber = ref("")
const photoURL = ref(defaultAvatar)

const loading = ref(false)
const errorMessage = ref("")

/* ======================
CLEAR ERROR
====================== */

watch(
  [displayName, email, password, confirmPassword],
  () => {
    errorMessage.value = ""
  }
)

/* ======================
UPLOAD PHOTO
====================== */

const uploadProfilePhoto = async (event) => {

  const file = event.target.files[0]

  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    alert("ไฟล์ต้องไม่เกิน 5MB")
    return
  }

  const preview = URL.createObjectURL(file)
  photoURL.value = preview

  const formData = new FormData()
  formData.append("image", file)

  try {

    const res = await axios.post(
      `${API}/upload/profile-photo`,
      formData,
      {
        headers:{
          "Content-Type":"multipart/form-data"
        }
      }
    )

    photoURL.value = res.data.url

  } catch (err) {

    console.error(err)
    alert("อัปโหลดรูปไม่สำเร็จ")

  }

}

/* ======================
REGISTER
====================== */

const registerUser = async () => {

  if (loading.value) return

  if (!displayName.value) {
    errorMessage.value = "กรุณากรอกชื่อผู้ใช้"
    return
  }

  if (!email.value) {
    errorMessage.value = "กรุณากรอกอีเมล"
    return
  }

  if (password.value.length < 6) {
    errorMessage.value = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = "รหัสผ่านไม่ตรงกัน"
    return
  }

  loading.value = true

  try {

    const res = await api.post("/auth/register", {

      displayName: displayName.value,
      email: email.value,
      password: password.value,

      gender: gender.value,
      birthday: birthday.value,
      aboutMe: aboutMe.value,
      phoneNumber: phoneNumber.value,
      photoURL: photoURL.value

    })

    const { token, user } = res.data

    /* SAVE LOGIN */

    localStorage.setItem("token", token)

    if (user) {
      localStorage.setItem("user", JSON.stringify(user))
      localStorage.setItem("userId", user.id)
    }

    /* REDIRECT */

    window.location.href = "/"

  } catch (error) {

    errorMessage.value =
      error.response?.data?.message || "สมัครสมาชิกไม่สำเร็จ"

  } finally {

    loading.value = false

  }

}
</script>

<style scoped>

/* ===== Container ===== */

.auth-container {
  max-width: 600px;
  margin: 30px auto;
  background: #ffffff;
  padding: 28px;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
}

.auth-container h2 {
  text-align: center;
  font-size: 24px;
  margin-bottom: 25px;
  color: #333;
  font-weight: 600;
}

/* ===== Form Layout ===== */

form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ===== Input Fields ===== */

input,
select,
textarea {
  width: 100%;
  padding: 11px 12px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 14px;
  background: #fafafa;
  box-sizing: border-box;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #00aeef;
  box-shadow: 0 0 0 3px rgba(0,174,239,0.15);
  outline: none;
  background: #fff;
}

/* ===== Select Arrow Custom ===== */

select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;

  background: #fafafa url('data:image/svg+xml;utf8,<svg fill="%23666" height="12" viewBox="0 0 24 24" width="12" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>')
  no-repeat right 12px center;

  background-size: 12px;
  padding-right: 36px;
  cursor: pointer;
}

/* ===== Textarea ===== */

textarea {
  resize: vertical;
  min-height: 90px;
}

/* ===== Profile Photo ===== */

.profile-photo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;
}

.photo-wrapper {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #00aeef;
  box-shadow: 0 2px 8px rgba(0,174,239,0.3);
}

.profile-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.profile-photo:hover {
  transform: scale(1.05);
}

/* ===== Upload Button ===== */

.upload-btn {
  margin-top: 10px;
  cursor: pointer;
  color: #00aeef;
  font-weight: bold;
  font-size: 14px;
  text-decoration: underline;
}

/* ===== Submit Button ===== */

button {
  background: linear-gradient(135deg,#00aeef,#0095d5);
  color: #fff;
  padding: 12px 15px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  font-size: 16px;
  transition: background 0.3s ease, transform 0.1s ease;
  box-shadow: 0 3px 8px rgba(0,174,239,0.25);
}

button:hover {
  background: linear-gradient(135deg,#00a1e0,#007bb5);
  transform: scale(1.01);
}

button:disabled {
  background: #9fdcf6;
  cursor: not-allowed;
  box-shadow: none;
}

/* ===== Error Message ===== */

.error-message {
  margin-top: 14px;
  color: #d32f2f;
  font-size: 14px;
  text-align: center;
  font-weight: 500;
}

/* ===== Switch Auth ===== */

.switch-auth {
  margin-top: 16px;
  text-align: center;
  font-size: 14px;
}

.switch-auth a {
  color: #00aeef;
  font-weight: 600;
  text-decoration: none;
}

.switch-auth a:hover {
  text-decoration: underline;
}

/* ===== Responsive ===== */

@media (max-width:480px){

  .auth-container{
    margin:20px;
    padding:20px;
  }

  .auth-container h2{
    font-size:20px;
  }

  button{
    font-size:15px;
    padding:10px;
  }

}

</style>
