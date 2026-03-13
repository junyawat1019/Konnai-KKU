<template>
  <DefaultLayout>
    <div class="profile-page">
      <!-- Header Profile + Action -->
      <div class="profile-card-header">
        <div class="profile-photo-wrapper" @click="goToProfile">
          <img :src="photoURL || defaultAvatarImage" alt="Profile" />
        </div>
        <div class="profile-header-main">
          <h2 class="display-name" @click="goToProfile">{{ displayName }}</h2>
          <p class="email">{{ email }}</p>
          <div class="follow-info">
            <div class="follow-item">
              <strong>{{ followersCount }}</strong> Followers
            </div>
            <div class="follow-item">
              <strong>{{ followingCount }}</strong> Following
            </div>
          </div>
        </div>
        <div class="profile-header-actions">
          <button
            v-if="!isOwnProfile"
            @click="toggleFollow"
            class="btn-follow"
            :disabled="followLoading"
          >
            {{
              followLoading ? "กำลัง..." : isFollowing ? "เลิกติดตาม" : "ติดตาม"
            }}
          </button>
          <button v-else @click="goToEditProfile" class="btn-edit">
            แก้ไขโปรไฟล์
          </button>
          <button class="btn-message" @click="sendMessage">
            {{ isOwnProfile ? "ข้อความ" : "ส่งข้อความ" }}
          </button>
          <button class="btn-share" @click="shareProfile">แชร์</button>
        </div>
      </div>

      <!-- 3-column Layout -->
      <div class="profile-layout">
        <!-- Sidebar -->
        <aside class="sidebar">
          <h3>ข้อมูลส่วนตัว</h3>
          <div class="info-item">
            <strong>เพศ:</strong> {{ gender || "ไม่มีข้อมูล" }}
          </div>
          <div class="info-item">
            <strong>วันเกิด:</strong>
            {{ formatDate(birthday) || "ไม่มีข้อมูล" }}
          </div>
          <div class="info-item">
            <strong>เกี่ยวกับฉัน:</strong> {{ aboutMe || "ไม่มีข้อมูล" }}
          </div>
          <div class="info-item">
            <strong>เบอร์โทร:</strong> {{ phoneNumber || "ไม่มีข้อมูล" }}
          </div>
          <div class="info-item">
            <strong>สร้างบัญชีเมื่อ:</strong> {{ formatDate(createdAt) }}
          </div>
          <div class="info-item">
            <strong>รายการโปรด:</strong> {{ favorites?.length || 0 }}
          </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
          <div class="profile-tabs-wrapper">
            <div class="profile-tabs">
              <div
                class="tab-item"
                :class="{ active: activeTab === 'activity' }"
                @click="activeTab = 'activity'"
              >
                กิจกรรมล่าสุด
              </div>
              <div
                class="tab-item"
                :class="{ active: activeTab === 'myPlaces' }"
                @click="activeTab = 'myPlaces'"
              >
                สถานที่ที่ฉันเพิ่ม
              </div>
              <div
                class="tab-item"
                :class="{ active: activeTab === 'reviews' }"
                @click="activeTab = 'reviews'"
              >
                รีวิวของฉัน
              </div>
              <div
                class="tab-item"
                :class="{ active: activeTab === 'photos' }"
                @click="activeTab = 'photos'"
              >
                รูปภาพของฉัน
              </div>
            </div>

            <!-- Tab content -->
            <div class="tab-content">
              <!-- Activity Tab -->
              <div v-if="activeTab === 'activity'" class="activity-list">
                <div
                  v-for="(act, i) in recentActivity"
                  :key="i"
                  class="activity-item"
                >
                  <span class="activity-text">
                    {{
                      act.type === "add_place"
                        ? "เพิ่มสถานที่ใหม่: " + act.placeName
                        : "รีวิวสถานที่: " + act.placeName
                    }}
                  </span>
                  <span class="activity-date">{{
                    formatDate(act.createdAt)
                  }}</span>
                </div>
                <div v-if="recentActivity.length === 0">ยังไม่มีกิจกรรม</div>
              </div>

              <!-- My Places Tab -->
              <div v-if="activeTab === 'myPlaces'" class="place-list-grid">
                <PlaceCard
                  v-for="place in myPlaces"
                  :key="place.id"
                  :place="place"
                />
                <div v-if="myPlaces.length === 0">ยังไม่มีสถานที่ที่เพิ่ม</div>
              </div>

              <!-- Reviews Tab -->
              <div v-if="activeTab === 'reviews'" class="review-list-grid">
                <ReviewCard
                  v-for="review in userReviews"
                  :key="review.id"
                  :review="review"
                  :placeId="review.placeId"
                  @click.native="goToPlaceDetail(review.placeId, review.id)"
                />
                <div v-if="userReviews.length === 0">ยังไม่มีรีวิว</div>
              </div>

              <!-- Photos Tab -->
              <div v-if="activeTab === 'photos'" class="photo-grid">
                <img
                  v-for="p in userPhotos"
                  :key="p.id"
                  :src="p.url"
                  @click="goToPlaceDetail(p.place_id)"
                />
                <div v-if="userPhotos.length === 0">ยังไม่มีรูปภาพ</div>
              </div>
            </div>
          </div>
        </main>

        <!-- Summary -->
        <aside class="summary">
          <h3>รายการที่บันทึก</h3>
          <ul>
            <li v-for="fav in favorites" :key="fav.id" class="favorite-item">
              <router-link :to="`/place/${fav.placeId}`" class="fav-link">
                <img v-if="fav.imageUrl" :src="fav.imageUrl" class="fav-img" />
                {{ fav.name || fav.placeName }}
              </router-link>
            </li>
            <li v-if="!favorites || !favorites.length">ยังไม่มีรายการโปรด</li>
          </ul>
        </aside>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue"
import { useRouter, useRoute } from "vue-router"
import axios from "axios"

import DefaultLayout from "@/layouts/DefaultLayout.vue"
import defaultAvatarImage from "@/assets/images/default-avatar.png"
import PlaceCard from "@/components/PlaceCard.vue"
import ReviewCard from "@/components/ReviewCard.vue"

const router = useRouter()
const route = useRoute()

const API = "http://localhost:8080/api"

/* USER ID */

const currentUserId = ref(null)
const profileUserId = ref(null)

const isOwnProfile = computed(() => {
  return profileUserId.value === currentUserId.value
})

/* USER DATA */

const displayName = ref("")
const gender = ref("")
const birthday = ref("")
const aboutMe = ref("")
const phoneNumber = ref("")
const email = ref("")
const photoURL = ref(defaultAvatarImage)
const createdAt = ref(null)

/* FOLLOW */

const followersCount = ref(0)
const followingCount = ref(0)
const isFollowing = ref(false)
const followLoading = ref(false)

/* TABS */

const activeTab = ref("activity")

const recentActivity = ref([])
const userReviews = ref([])
const userPhotos = ref([])
const myPlaces = ref([])
const favorites = ref([])

/* FORMAT DATE */

const formatDate = (date) => {
  if (!date) return "ไม่มีข้อมูล"

  return new Date(date).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })
}

/* LOAD PROFILE */

const loadProfile = async () => {
  try {

    const res = await axios.get(`${API}/users/${profileUserId.value}`)

    const u = res.data || {}

    displayName.value = u.display_name ?? ""
    email.value = u.email ?? ""
    gender.value = u.gender ?? ""
    birthday.value = u.birthday ?? ""
    aboutMe.value = u.about_me ?? ""
    phoneNumber.value = u.phone_number ?? ""
    photoURL.value = u.photo_url || defaultAvatarImage
    createdAt.value = u.created_at ?? null

  } catch (err) {

    console.error("profile error", err)

  }
}

/* FOLLOWERS */

const loadFollowers = async () => {
  try {

    const res = await axios.get(
      `${API}/users/${profileUserId.value}/followers`
    )

    const data = res.data || {}

    followersCount.value = data.followersCount ?? 0
    followingCount.value = data.followingCount ?? 0
    isFollowing.value = data.isFollowing ?? false

  } catch (err) {

    console.error("followers error", err)

  }
}

/* REVIEWS */

const loadReviews = async () => {
  try {

    const res = await axios.get(
      `${API}/users/${profileUserId.value}/reviews`
    )

    userReviews.value = res.data || []

  } catch (err) {

    console.error("reviews error", err)

  }
}

/* PHOTOS */

const loadPhotos = async () => {
  try {

    const res = await axios.get(
      `${API}/users/${profileUserId.value}/photos`
    )

    userPhotos.value = res.data || []

  } catch (err) {

    console.error("photos error", err)

  }
}

/* PLACES */

const loadPlaces = async () => {
  try {

    const res = await axios.get(
      `${API}/users/${profileUserId.value}/places`
    )

    myPlaces.value = res.data || []

  } catch (err) {

    console.error("places error", err)

  }
}

/* FAVORITES */

const loadFavorites = async () => {
  try {

    const res = await axios.get(
      `${API}/users/${profileUserId.value}/favorites`
    )

    favorites.value = res.data || []

  } catch (err) {

    console.error("favorites error", err)

  }
}

/* ACTIVITY */

const loadActivity = () => {

  const activity = []

  myPlaces.value.forEach((p) => {
    activity.push({
      type: "add_place",
      placeName: p.name,
      createdAt: p.created_at
    })
  })

  userReviews.value.forEach((r) => {
    activity.push({
      type: "review",
      placeName: r.place_name,
      createdAt: r.created_at
    })
  })

  activity.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )

  recentActivity.value = activity.slice(0, 20)
}

/* FOLLOW ACTION */

const toggleFollow = async () => {

  if (followLoading.value || isOwnProfile.value) return

  followLoading.value = true

  try {

    if (isFollowing.value) {

      await axios.delete(
        `${API}/users/${profileUserId.value}/follow/${currentUserId.value}`
      )

      isFollowing.value = false
      followersCount.value--

    } else {

      await axios.post(
        `${API}/users/${profileUserId.value}/follow`,
        { followerId: currentUserId.value }
      )

      isFollowing.value = true
      followersCount.value++

    }

  } catch (err) {

    console.error("follow error", err)

  } finally {

    followLoading.value = false

  }
}

/* NAVIGATION */

const goToEditProfile = () => {
  router.push("/profile/settings")
}

const goToPlaceDetail = (placeId) => {
  router.push(`/place/${placeId}`)
}

const shareProfile = async () => {

  const link =
    `${window.location.origin}/profile/${profileUserId.value}`

  await navigator.clipboard.writeText(link)

  alert("คัดลอกลิงก์โปรไฟล์แล้ว")
}

/* LOAD ALL */

const loadAll = async () => {

  try {

    await Promise.all([
      loadProfile(),
      loadFollowers(),
      loadReviews(),
      loadPlaces(),
      loadFavorites(),
      loadPhotos()
    ])

    loadActivity()

  } catch (err) {

    console.error("loadAll error", err)

  }

}

/* LIFECYCLE */

onMounted(() => {

  currentUserId.value = localStorage.getItem("userId")

  profileUserId.value =
    route.params.userId || currentUserId.value

  loadAll()

})

watch(
  () => route.params.userId,
  (newId) => {

    profileUserId.value =
      newId || currentUserId.value

    loadAll()

  }
)
</script>

<style scoped>
/* Page Container */
.profile-page {
  padding: 20px;
  background: #f5f7fa;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* Header Profile + Actions */
.profile-card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  background: #fff;
  padding: 20px;
  border-radius: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  box-sizing: border-box;
}

.profile-photo-wrapper {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #00aeef;
  cursor: pointer;
}
.profile-photo-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-header-main {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
}

.display-name {
  font-size: 22px;
  font-weight: bold;
  margin: 0;
  cursor: pointer;
}
.email {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.follow-info {
  display: flex;
  gap: 15px;
  font-size: 15px;
  margin-top: 5px;
}
.follow-item {
  cursor: pointer;
}

/* Buttons */
.profile-header-actions {
  display: flex;
  flex-direction: row;
  gap: 10px;
  flex-wrap: wrap;
}
.btn-edit,
.btn-follow,
.btn-message,
.btn-share {
  background: #00aeef;
  color: #fff;
  border: none;
  padding: 10px 15px;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-edit:hover,
.btn-follow:hover,
.btn-message:hover,
.btn-share:hover {
  background: #0096cf;
}

/* Layout */
.profile-layout {
  display: grid;
  grid-template-columns: 240px 1fr 280px;
  gap: 20px;
  box-sizing: border-box;
}

/* Sidebar */
.sidebar {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-sizing: border-box;
}
.sidebar h3 {
  margin-top: 0;
}
.info-item {
  padding: 6px 0;
  border-bottom: 1px solid #eee;
  font-size: 14px;
  color: #444;
}

/* Main Content */
.main-content {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-sizing: border-box;
  max-width: 100%;
  overflow-x: hidden;
}

/* Summary */
.summary {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-sizing: border-box;
}
.summary ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.summary li {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  font-size: 14px;
  color: #333;
}
.favorite-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.fav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: #333;
}
.fav-link:hover {
  color: #00aeef;
}
.fav-img {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 8px;
}

/* Tabs */
.profile-tabs {
  display: flex;
  justify-content: center;
  border-bottom: 1px solid #ddd;
  margin-bottom: 15px;
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 10px;
  box-sizing: border-box;
}
.profile-tabs::-webkit-scrollbar {
  height: 6px;
}
.tab-item {
  flex: 0 0 auto;
  padding: 10px 20px;
  cursor: pointer;
  font-weight: bold;
  color: #555;
  transition:
    color 0.2s,
    border-bottom 0.2s;
  white-space: nowrap;
}
.tab-item.active {
  color: #00aeef;
  border-bottom: 3px solid #00aeef;
}

/* Tab content */
.tab-content {
  text-align: left;
  padding: 0 10px;
  box-sizing: border-box;
}

/* Activity List */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 0 10px;
  box-sizing: border-box;
}
.activity-item {
  background: #fff;
  padding: 15px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.2s;
}
.activity-item:hover {
  transform: translateY(-2px);
}
.activity-text {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}
.activity-date {
  font-size: 12px;
  color: #888;
}

/* Review List */
.review-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 10px;
  box-sizing: border-box;
}
.review-item {
  background: #fff;
  padding: 15px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.2s;
}
.review-item:hover {
  transform: translateY(-2px);
}
.review-item strong {
  font-size: 15px;
  color: #00aeef;
}
.review-item .rating {
  font-size: 14px;
  color: #ff9900;
}
.review-item p {
  font-size: 14px;
  color: #444;
  margin: 0;
  line-height: 1.5;
}

/* Review Images */
.review-images {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.review-images img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.2s;
}
.review-images img:hover {
  transform: scale(1.05);
}

/* Photo Grid */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  padding: 0 10px;
  box-sizing: border-box;
}
.photo-grid img {
  width: 100%;
  aspect-ratio: 1/1;
  object-fit: cover;
  border-radius: 8px;
}

/* My Places Grid */
.place-list-grid {
  display: grid;
  gap: 15px;
  padding: 0 10px;
  box-sizing: border-box;
}

.place-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: transform 0.2s;
}
.place-card:hover {
  transform: translateY(-2px);
}
.place-card img {
  width: 100%;
  height: 140px;
  object-fit: cover;
}
.place-card h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 10px;
  color: #333;
}

/* Tablet */
@media (max-width: 1024px) {
  .profile-layout {
    grid-template-columns: 200px 1fr 200px;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .profile-layout {
    display: flex;
    flex-direction: column;
  }

  .sidebar {
    display: none;
  }

  .summary {
    margin-top: 20px;
    padding: 15px;
  }

  .profile-card-header {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 10px;
  }

  .profile-header-actions {
    flex-direction: column;
    width: 100%;
    gap: 10px;
  }

  .activity-item,
  .review-item {
    padding: 12px 15px;
    margin: 0 5px;
  }

  .review-images img {
    width: 70px;
    height: 70px;
  }

  .profile-tabs {
    margin-bottom: 10px;
  }

  .tab-item {
    padding: 10px 15px;
    font-size: 14px;
  }

  .place-list-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}

/* Small Mobile */
@media (max-width: 480px) {
  .profile-card-header {
    padding: 15px;
  }

  .display-name {
    font-size: 18px;
  }

  .email {
    font-size: 12px;
  }

  .btn-edit,
  .btn-follow,
  .btn-message,
  .btn-share {
    padding: 7px 10px;
    font-size: 12px;
  }

  .fav-img {
    width: 35px;
    height: 35px;
  }

  .photo-grid {
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: 6px;
  }

  .place-card img {
    height: 120px;
  }
}

/* Extra small mobile */
@media (max-width: 360px) {
  .display-name {
    font-size: 16px;
  }

  .profile-header-actions {
    gap: 6px;
  }

  .btn-edit,
  .btn-follow,
  .btn-message,
  .btn-share {
    padding: 6px 8px;
    font-size: 11px;
  }

  .fav-img {
    width: 30px;
    height: 30px;
  }
}
</style>
