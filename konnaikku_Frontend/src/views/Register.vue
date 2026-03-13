<template>
  <DefaultLayout>
    <div class="auth-container">

      <h2>สมัครสมาชิก</h2>

      <form @submit.prevent="registerUser">

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
          v-model.trim="password"
          type="password"
          placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
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

import { ref, onMounted, onUnmounted, watch } from "vue"
import { useRouter, useRoute } from "vue-router"
import axios from "axios"

const router = useRouter()
const route = useRoute()

const API = "http://localhost:8080/api"

/* =========================
   USER
========================= */

const user = ref(null)

const defaultAvatar = "/default-avatar.png"

const loadUserFromLocal = () => {

  const savedUser = localStorage.getItem("user")

  if (!savedUser) {
    user.value = null
    return
  }

  try {

    user.value = JSON.parse(savedUser)

  } catch {

    localStorage.removeItem("user")
    user.value = null

  }

}

const fetchUser = async () => {

  const token = localStorage.getItem("token")

  if (!token) return

  try {

    const res = await axios.get(`${API}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    user.value = res.data

    localStorage.setItem("user", JSON.stringify(res.data))

  } catch {

    localStorage.removeItem("token")
    localStorage.removeItem("user")

    user.value = null

  }

}

/* =========================
   WATCH ROUTE
========================= */

watch(
  () => route.fullPath,
  () => {
    loadUserFromLocal()
  }
)

/* =========================
   STORAGE LISTENER
========================= */

const handleStorageChange = () => {
  loadUserFromLocal()
}

/* =========================
   SEARCH
========================= */

const searchQuery = ref("")
const searchResults = ref([])

const searchPlaces = async () => {

  if (!searchQuery.value) {
    searchResults.value = []
    return
  }

  try {

    const res = await axios.get(
      `${API}/places/search?q=${searchQuery.value}`
    )

    searchResults.value = res.data

  } catch {

    searchResults.value = []

  }

}

const goToPlace = (id) => {

  searchResults.value = []

  router.push(`/place/${id}`)

}

const search = () => {

  if (searchResults.value.length) {
    router.push(`/place/${searchResults.value[0].id}`)
  }

}

/* =========================
   LOCATION
========================= */

const selectedLocation = ref("ทั้งหมด")

const changeLocation = () => {

  router.push(`/?location=${selectedLocation.value}`)

}

/* =========================
   NAVIGATION
========================= */

const goHome = () => router.push("/")
const goLogin = () => router.push("/login")
const goProfile = () => router.push("/me")

/* =========================
   LOGOUT
========================= */

const logout = () => {

  localStorage.removeItem("token")
  localStorage.removeItem("user")

  user.value = null

  router.push("/")

}

/* =========================
   INIT
========================= */

onMounted(() => {

  loadUserFromLocal()
  fetchUser()

  window.addEventListener("storage", handleStorageChange)

})

onUnmounted(() => {

  window.removeEventListener("storage", handleStorageChange)

})

</script>

<style scoped>

.auth-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

input,
select {
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 14px;
}

button {
  padding: 12px;
  border: none;
  border-radius: 6px;
  background: #00aeef;
  color: white;
  cursor: pointer;
  font-weight: bold;
}

button:disabled {
  background: #99d6f2;
  cursor: not-allowed;
}

.error-message {
  margin-top: 10px;
  color: red;
  font-size: 14px;
  text-align: center;
}

.switch-auth {
  margin-top: 12px;
  text-align: center;
  font-size: 14px;
}

</style>