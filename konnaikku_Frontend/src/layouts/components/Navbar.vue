<template>
  <nav class="navbar">
    <!-- Logo -->
    <div class="navbar-left">
      <img
        src="@/assets/images/logos/konnai_logo.png"
        alt="Logo"
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
      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="ค้นหาร้านอาหาร, โรงแรม, ที่เที่ยว..."
          @input="searchPlaces"
        />
        <button @click="search" class="search-btn">ค้นหา</button>
      </div>

    </div>

    <!-- Right -->
    <div class="navbar-right">

      <template v-if="user">
        <div class="profile-button" @click="goProfile">
          <img :src="user.photoURL || defaultAvatar" class="profile-icon"/>
          <span>{{ user.displayName }}</span>
        </div>

        <button @click="logout" class="logut">ออกจากระบบ</button>
      </template>

      <template v-else>
        <button @click="goLogin" class="login-btn">เข้าสู่ระบบ</button>
      </template>

    </div>
  </nav>

  <!-- Search Dropdown -->
  <div v-if="searchResults.length" class="search-dropdown">
    <div
      v-for="item in searchResults"
      :key="item.id"
      class="dropdown-item"
      @click="goToPlace(item.id)"
    >
      {{ item.name }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import axios from "axios"

const router = useRouter()

const API = "http://localhost:8080/api"

// user
const user = ref(null)
const defaultAvatar = "/default-avatar.png"

// search
const searchQuery = ref("")
const searchResults = ref([])

// location
const selectedLocation = ref("ทั้งหมด")

// load user profile
const fetchUser = async () => {
  const token = localStorage.getItem("token")
  if (!token) return

  try {
    const res = await axios.get(`${API}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    user.value = res.data
  } catch {
    localStorage.removeItem("token")
  }
}

// search place
const searchPlaces = async () => {
  if (!searchQuery.value) {
    searchResults.value = []
    return
  }

  const res = await axios.get(`${API}/places/search?q=${searchQuery.value}`)
  searchResults.value = res.data
}

// go to place
const goToPlace = (id) => {
  searchResults.value = []
  router.push(`/place/${id}`)
}

// search button
const search = () => {
  if (searchResults.value.length)
    router.push(`/place/${searchResults.value[0].id}`)
}

// logout
const logout = () => {
  localStorage.removeItem("token")
  user.value = null
  router.push("/")
}

const goHome = () => router.push("/")
const goLogin = () => router.push("/login")
const goProfile = () => router.push("/me")

const changeLocation = () => {
  router.push(`/?location=${selectedLocation.value}`)
}

onMounted(fetchUser)
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
