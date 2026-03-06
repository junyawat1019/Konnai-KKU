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

      <!-- Search Bar -->
      <div class="search-bar hide-on-mobile">
        <input
          type="text"
          placeholder="ค้นหาร้านอาหาร, โรงแรม, ที่เที่ยว..."
          v-model="searchQuery"
          @input="onSearchInput"
          @focus="showDropdown"
          @blur="hideDropdown"
        />
        <button @click="search" class="search-btn">ค้นหา</button>
      </div>
    </div>

    <!-- Right -->
    <div class="navbar-right">
      <template v-if="user">
        <!-- Profile Button -->
        <div class="profile-button hide-on-mobile" @click="goProfile">
          <img
            :src="photoURL || defaultAvatar"
            alt="Profile"
            class="profile-icon"
          />
          <span class="username">{{ user.displayName || "ผู้ใช้" }}</span>
        </div>

        <!-- Hamburger Menu -->
        <div class="dropdown-button" @click.stop="toggleDropdown">
          <i class="fas fa-bars"></i>
          <div v-if="dropdownOpen" class="dropdown-panel">
            <div class="dropdown-header">
              <img
                :src="photoURL || defaultAvatar"
                class="dropdown-avatar"
                alt="User"
              />
              <div class="user-info">
                <strong>{{ user.displayName || "ผู้ใช้" }}</strong>
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
              <button class="logout" @click="logout">ออกจากระบบ</button>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <button class="login-btn" @click="goLogin">เข้าสู่ระบบ</button>
      </template>
    </div>
  </nav>

  <transition name="dropdown-fade">
    <div
      v-if="searchQuery.trim() && showResults"
      class="search-dropdown"
      :style="{
        top: dropdownPosition.top + 'px',
        left: dropdownPosition.left + 'px',
        width: dropdownPosition.width + 'px',
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
          <small v-if="item.locationTags">({{ item.locationTags }})</small>
        </div>
      </div>
      <div v-else class="dropdown-item no-result">ไม่พบสถานที่</div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, defineEmits } from "vue";
import { auth, db } from "@/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { useRouter } from "vue-router";
import defaultAvatarImage from "@/assets/images/default-avatar.png";

const router = useRouter();

// ----- User / Profile -----
const user = ref(null);
const photoURL = ref(defaultAvatarImage);
const defaultAvatar = defaultAvatarImage;

// ----- Navbar State -----
const selectedLocation = ref("ทั้งหมด");
const searchQuery = ref("");
const menuOpen = ref(false);
const dropdownOpen = ref(false);
const searchResults = ref([]);
const showResults = ref(false);

const emit = defineEmits(["updateLocation"]);

// ----- Search Dropdown Position -----
const dropdownPosition = ref({ top: 0, left: 0, width: 0 });

const updateDropdownPosition = async () => {
  await nextTick();
  const inputEl = document.querySelector(".search-bar input");
  if (inputEl) {
    const rect = inputEl.getBoundingClientRect();
    dropdownPosition.value = {
      top: rect.bottom, // fixed อิง viewport โดยตรง
      left: rect.left,
      width: rect.width,
    };
  }
};

const handleScroll = () => {
  if (showResults.value) updateDropdownPosition();
};

// ----- Show / Hide Dropdown -----
const showDropdown = async () => {
  if (searchQuery.value.trim()) {
    await updateDropdownPosition();
    showResults.value = true;
  }
};

const hideDropdown = () => {
  // หน่วงนิดเพื่อให้คลิกเลือกได้ก่อน blur
  setTimeout(() => (showResults.value = false), 200);
};

// ----- ค้นหาใน Firestore -----
const onSearchInput = async () => {
  const queryText = searchQuery.value.trim().toLowerCase();
  try {
    const snapshot = await getDocs(collection(db, "places"));
    searchResults.value = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((item) => item.name.toLowerCase().includes(queryText));

    showResults.value = queryText.length > 0;
    if (showResults.value) await updateDropdownPosition();
  } catch (err) {
    console.error("Error fetching search results:", err);
  }
};

const selectItem = (item) => {
  searchQuery.value = item.name;
  showResults.value = false;
  router.push(`/place/${item.id}`);
};

const search = () => {
  if (searchResults.value.length > 0) {
    router.push(`/place/${searchResults.value[0].id}`);
  } else {
    alert("ไม่พบผลลัพธ์");
  }
};

// ----- Navbar / Profile -----
const toggleMenu = () => (menuOpen.value = !menuOpen.value);
const toggleDropdown = () => (dropdownOpen.value = !dropdownOpen.value);
const closeDropdown = () => (dropdownOpen.value = false);

const goHome = () => router.push("/");
const goLogin = () => router.push("/login");
const goProfile = () => {
  dropdownOpen.value = false;
  router.push("/me");
};

// ----- Location Change -----
const changeLocation = () => {
  emit("updateLocation", selectedLocation.value);
};

// ----- Logout -----
const logout = async () => {
  try {
    await signOut(auth);
    user.value = null;
    dropdownOpen.value = false;
    router.push("/");
  } catch (err) {
    console.error("Error signing out:", err);
  }
};

// ----- Auth Listener -----
onMounted(() => {
  onAuthStateChanged(auth, async (u) => {
    user.value = u;
    if (u) {
      const userDoc = await getDoc(doc(db, "users", u.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        photoURL.value = data.photoURL || u.photoURL || defaultAvatar;
      } else {
        photoURL.value = u.photoURL || defaultAvatar;
      }
    }
  });

  window.addEventListener("click", closeDropdown);
  window.addEventListener("scroll", handleScroll);
  window.addEventListener("resize", handleScroll);
});

onBeforeUnmount(() => {
  window.removeEventListener("click", closeDropdown);
  window.removeEventListener("scroll", handleScroll);
  window.removeEventListener("resize", handleScroll);
});
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
