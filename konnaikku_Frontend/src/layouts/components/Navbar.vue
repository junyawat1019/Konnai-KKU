<template>
  <nav class="navbar">

    <!-- Logo -->
    <div class="navbar-left">
      <img
        src="@/assets/images/logos/konnai_logo.png"
        class="logo"
        @click="goHome"
      />
    </div>

    <!-- Center -->
    <div class="navbar-center">

      <!-- Location -->
      <div class="location">
        <select v-model="selectedLocation" @change="changeLocation">
          <option value="ทั้งหมด">ทั้งหมด</option>
          <option value="กังสดาล">กังสดาล</option>
          <option value="หลังมอ">หลังมอ</option>
          <option value="โนนม่วง">โนนม่วง</option>
          <option value="โคลัมโบ">โคลัมโบ</option>
          <option value="ในเมือง">ในเมือง</option>
        </select>
      </div>

      <!-- Search -->
      <div class="search-bar hide-on-mobile">
        <input
          v-model="searchQuery"
          placeholder="ค้นหาร้านอาหาร, โรงแรม, ที่เที่ยว..."
          @input="onSearchInput"
          @focus="showDropdown"
          @blur="hideDropdown"
        />

        <button @click="search" class="search-btn">
          ค้นหา
        </button>
      </div>

    </div>

    <!-- Right -->
    <div class="navbar-right">

      <!-- Logged in -->
      <template v-if="user">

        <div class="profile-button hide-on-mobile" @click="goProfile">
          <img
            :src="user.photo || defaultAvatar"
            class="profile-icon"
          />
          <span class="username">
            {{ user.name || "ผู้ใช้" }}
          </span>
        </div>

        <!-- Hamburger -->
        <div class="dropdown-button" @click.stop="toggleDropdown">
          <i class="fas fa-bars"></i>

          <div v-if="dropdownOpen" class="dropdown-panel">

            <div class="dropdown-header">
              <img
                :src="user.photo || defaultAvatar"
                class="dropdown-avatar"
              />

              <div class="user-info">
                <strong>{{ user.name }}</strong>
                <p class="email">{{ user.email }}</p>
              </div>
            </div>

            <button class="view-profile" @click="goProfile">
              ดูโปรไฟล์ของฉัน »
            </button>

            <div class="dropdown-section">
              <button>ที่บันทึกไว้</button>
              <button>ข้อความ</button>
              <button>ตั้งค่า</button>
            </div>

            <div class="dropdown-footer">
              <button class="logout" @click="logout">
                ออกจากระบบ
              </button>
            </div>

          </div>
        </div>

      </template>

      <!-- Not logged -->
      <template v-else>

        <button class="login-btn" @click="goLogin">
          เข้าสู่ระบบ
        </button>

      </template>

    </div>

  </nav>

  <!-- Search Dropdown -->
  <transition name="dropdown-fade">

    <div
      v-if="searchQuery.trim() && showResults"
      class="search-dropdown"
      :style="{
        top: dropdownPosition.top + 'px',
        left: dropdownPosition.left + 'px',
        width: dropdownPosition.width + 'px'
      }"
    >

      <div v-if="searchResults.length">

        <div
          v-for="item in searchResults"
          :key="item.id"
          class="dropdown-item"
          @mousedown.prevent="selectItem(item)"
        >
          {{ item.name }}
        </div>

      </div>

      <div v-else class="dropdown-item no-result">
        ไม่พบสถานที่
      </div>

    </div>

  </transition>
</template>

<script setup>

import { ref, onMounted, nextTick } from "vue"
import { useRouter } from "vue-router"
import axios from "axios"

const router = useRouter()

const API = "http://localhost:8080/api"

/* USER */

const user = ref(null)
const defaultAvatar = "/default-avatar.png"

/* NAVBAR STATE */

const selectedLocation = ref("ทั้งหมด")
const searchQuery = ref("")
const searchResults = ref([])

const showResults = ref(false)
const dropdownOpen = ref(false)

/* DROPDOWN POSITION */

const dropdownPosition = ref({
  top: 0,
  left: 0,
  width: 0
})

const updateDropdownPosition = async () => {

  await nextTick()

  const input = document.querySelector(".search-bar input")

  if (!input) return

  const rect = input.getBoundingClientRect()

  dropdownPosition.value = {
    top: rect.bottom + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width
  }

}

/* SEARCH */

const onSearchInput = async () => {

  const q = searchQuery.value.trim()

  if (!q) {
    searchResults.value = []
    showResults.value = false
    return
  }

  try {

    const res = await axios.get(`${API}/places/search`, {
      params: { q }
    })

    searchResults.value = Array.isArray(res.data) ? res.data : []

    showResults.value = true

    updateDropdownPosition()

  } catch (err) {

    console.error("search error", err)
    searchResults.value = []

  }

}

const selectItem = (item) => {

  searchQuery.value = item.name
  showResults.value = false

  router.push(`/place/${item.id}`)

}

const search = () => {

  if (searchResults.value.length) {
    router.push(`/place/${searchResults.value[0].id}`)
  }

}

/* DROPDOWN */

const showDropdown = async () => {

  if (searchQuery.value.trim()) {

    await updateDropdownPosition()

    showResults.value = true

  }

}

const hideDropdown = () => {

  setTimeout(() => showResults.value = false, 200)

}

/* LOAD USER */

const loadUser = async () => {

  const token = localStorage.getItem("token")
  const userId = localStorage.getItem("userId")

  if (!token || !userId) {
    user.value = null
    return
  }

  try {

    const res = await axios.get(
      `${API}/users/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    const data = res.data || {}

    user.value = {
      id: data.id,
      name: data.display_name || "ผู้ใช้",
      email: data.email || "",
      photo: data.photo_url || defaultAvatar
    }

    localStorage.setItem("user", JSON.stringify(user.value))

  } catch (err) {

    console.error("loadUser error:", err)

    const saved = localStorage.getItem("user")

    if (saved) {
      try {
        user.value = JSON.parse(saved)
      } catch {
        user.value = null
      }
    }

  }

}

/* NAVIGATION */

const goHome = () => router.push("/")
const goLogin = () => router.push("/login")

const goProfile = () => {

  dropdownOpen.value = false

  const userId = localStorage.getItem("userId")

  if (userId) {
    router.push(`/profile/${userId}`)
  } else {
    router.push("/login")
  }

}

const changeLocation = () => {

  router.push(`/?location=${selectedLocation.value}`)

}

/* MENU */

const toggleDropdown = () => {

  dropdownOpen.value = !dropdownOpen.value

}

/* LOGOUT */

const logout = () => {

  localStorage.removeItem("token")
  localStorage.removeItem("user")
  localStorage.removeItem("userId")

  user.value = null

  router.push("/")

}

/* INIT */

onMounted(() => {

  loadUser()

})

</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-wrap: nowrap;
  /* รวมเป็นแถวเดียว */
}

.navbar-left,
.navbar-center,
.navbar-right {
  display: flex;
  align-items: center;
}

.logo {
  height: 40px;
  cursor: pointer;
}

.location select {
  padding: 5px 10px;
  border-radius: 6px;
}

/* Search Bar */
.search-bar {
  display: flex;
  gap: 5px;
  position: relative;
  /* สำหรับ dropdown position:absolute */
}

.search-bar input {
  padding: 5px 10px;
  width: 250px;
  /* ปรับตามต้องการ */
  border-radius: 6px;
  border: 1px solid #ccc;
}

/* Dropdown */
.search-dropdown {
  position: fixed;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow-y: auto;
  max-height: 300px;
  opacity: 0;
  transform: translateY(-5px);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.search-dropdown[style] {
  opacity: 1;
  transform: translateY(0);
}

/* Dropdown Item */
.dropdown-item {
  padding: 10px 15px;
  cursor: pointer;
}

.dropdown-item:hover {
  background-color: #f0f0f0;
}

.dropdown-item small {
  display: block;
  font-size: 12px;
  color: gray;
}

.dropdown-item.no-result {
  cursor: default;
  color: gray;
  font-style: italic;
}

/* Transition Animation */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

.dropdown-fade-enter-to,
.dropdown-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* Profile / Dropdown */
.profile-button {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  margin-right: 12px;
  padding: 2px;
  padding-left: 2px;
  padding-right: 12px;
  border-radius: 24px;
  border: 1px solid #ccc;
}

.profile-button:hover {
  opacity: 0.8;
}

.profile-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.username {
  font-size: 14px;
  font-weight: 500;
}

.dropdown-button {
  position: relative;
  cursor: pointer;
  font-size: 20px;
  color: #333;
  padding: 3px 7px;
  border-radius: 24px;
  border: 1px solid #ccc;
}

.dropdown-panel {
  position: absolute;
  top: 100%;
  right: 0;
  left: auto;
  min-width: 220px;
  max-width: 95vw;
  /* ไม่เกิน 95% ของหน้าจอ */
  width: max-content;
  /* ปรับตาม content */
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 100;
  overflow: hidden;
  animation: fadeIn 0.2s ease;
}

.dropdown-header {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.dropdown-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
  object-position: center;
}

.user-info strong {
  font-size: 15px;
}

.user-info .email {
  margin: 0;
  font-size: 13px;
  color: gray;
}

.view-profile {
  background: #d6eaff;
  width: 100%;
  border: none;
  padding: 10px;
  text-align: center;
  font-weight: 500;
  color: #0099ff;
  cursor: pointer;
}

.dropdown-section {
  display: flex;
  flex-direction: column;
  padding: 5px 0;
}

.dropdown-section button {
  background: none;
  border: none;
  text-align: left;
  padding: 10px 15px;
  cursor: pointer;
  font-size: 14px;
}

.dropdown-section button:hover {
  background: #f0f0f0;
}

.dropdown-footer {
  border-top: 1px solid #eee;
  background-color: #d9534f;
  padding: 10px 10px;
}

.logout {
  background: none;
  border: none;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  text-align: left;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .hide-on-mobile {
    display: none !important;
  }

  .show-on-mobile {
    display: flex !important;
  }

  .location select {
    padding: 5px;
    font-size: 14px;
  }

  .search-dropdown,
  .dropdown-panel {
    left: 0%;
    /* ขยายจากกึ่งกลาง */
    transform: translateX(-50%);
    /* กึ่งกลางหน้าจอ */
    width: 90vw;
    /* กว้างเต็มมือถือ */
  }

  .view-profile {
    padding: 10px 16px;
    text-align: left;
  }
}

@media (min-width: 769px) {
  .show-on-mobile {
    display: none !important;
  }
}
</style>
