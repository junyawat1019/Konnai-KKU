<template>
  <div class="review-card">
    <!-- Review Header -->
    <div class="review-header" @click="goToProfile()">
      <img
        :src="reviewUser.photoURL || defaultAvatar"
        alt="avatar"
        class="avatar"
      />
      <div class="review-info">
        <p class="username">
          <strong>{{ reviewUser.displayName || "ผู้ใช้ไม่ระบุชื่อ" }}</strong>
        </p>
        <p class="rating"><i class="fa fa-star"></i> {{ review.rating }}</p>
        <p>
          <span class="date">{{ formattedDate }}</span>
        </p>
      </div>
    </div>

    <!-- Review Comment -->
    <p class="comment">{{ review.comment }}</p>

    <!-- Review Images -->
    <div v-if="review.imageUrls?.length" class="review-images">
      <img
        v-for="(url, i) in review.imageUrls"
        :key="i"
        :src="url"
        class="review-img"
      />
    </div>

    <!-- Actions -->
    <div class="review-actions">
      <button @click.stop="toggleLike" :class="{ liked: isLiked }">
        <i class="fa" :class="isLiked ? 'fa-thumbs-up' : 'fa-thumbs-up'"></i>
        {{ likesCount }}
      </button>
      <button @click.stop="toggleCommentBox">
        <i class="fa fa-comment"></i> {{ commentsCount }}
      </button>
    </div>

    <!-- Comment Box -->
    <div v-if="showCommentBox" class="comment-box">
      <textarea
        v-model="newComment"
        placeholder="เขียนคอมเมนต์..."
        rows="2"
      ></textarea>
      <button @click="submitComment" :disabled="loading">
        {{ loading ? "กำลังส่ง..." : "ส่ง" }}
      </button>
    </div>

    <!-- Comment List -->
    <div v-if="comments.length" class="comment-list">
      <div v-for="c in comments" :key="c.id" class="comment-item">
        <div class="comment-user" @click="goToProfile(c.userId)">
          <img
            :src="c.userPhotoURL || c.userFetchedPhoto || defaultAvatar"
            alt="avatar"
            class="comment-avatar"
          />
          <strong class="comment-username">{{
            c.username || c.userFetchedName || "ผู้ใช้ไม่ระบุชื่อ"
          }}</strong>
          <span class="comment-date">{{ formatDate(c.createdAt) }}</span>
        </div>
        <p class="comment-text">{{ c.comment }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import axios from "axios"
import defaultAvatarImg from "@/assets/images/default-avatar.png"

const props = defineProps({
  review: Object,
  placeId: String
})

const router = useRouter()
const defaultAvatar = defaultAvatarImg

const likesCount = ref(props.review.likesCount || 0)
const commentsCount = ref(props.review.commentsCount || 0)
const isLiked = ref(false)

const showCommentBox = ref(false)
const newComment = ref("")
const comments = ref([])
const loading = ref(false)

const reviewUser = ref({
  displayName: "",
  photoURL: defaultAvatar
})

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

const API = "http://localhost:8080/api"

/*
|--------------------------------------------------------------------------
| Fetch review user
|--------------------------------------------------------------------------
*/

const fetchReviewUser = async () => {
  try {
    const res = await axios.get(`${API}/users/${props.review.userId}`)
    reviewUser.value = {
      displayName: res.data.displayName,
      photoURL: res.data.photoURL || defaultAvatar
    }
  } catch (err) {
    console.error(err)
  }
}

/*
|--------------------------------------------------------------------------
| Fetch likes
|--------------------------------------------------------------------------
*/

const fetchLikes = async () => {
  try {
    const res = await axios.get(`${API}/reviews/${props.review.id}/likes`)
    likesCount.value = res.data.count
    isLiked.value = res.data.isLiked
  } catch (err) {
    console.error(err)
  }
}

/*
|--------------------------------------------------------------------------
| Fetch comments
|--------------------------------------------------------------------------
*/

const fetchComments = async () => {
  try {
    const res = await axios.get(`${API}/reviews/${props.review.id}/comments`)
    comments.value = res.data
    commentsCount.value = res.data.length
  } catch (err) {
    console.error(err)
  }
}

/*
|--------------------------------------------------------------------------
| Like / Unlike
|--------------------------------------------------------------------------
*/

const toggleLike = async () => {

  try {

    if (isLiked.value) {

      await axios.delete(`${API}/reviews/${props.review.id}/like`)

      likesCount.value--
      isLiked.value = false

    } else {

      await axios.post(`${API}/reviews/${props.review.id}/like`)

      likesCount.value++
      isLiked.value = true

    }

  } catch (err) {
    console.error(err)
  }

}

/*
|--------------------------------------------------------------------------
| Comment
|--------------------------------------------------------------------------
*/

const toggleCommentBox = () => {
  showCommentBox.value = !showCommentBox.value
}

const submitComment = async () => {

  if (!newComment.value.trim()) return

  loading.value = true

  try {

    await axios.post(`${API}/reviews/${props.review.id}/comments`, {
      comment: newComment.value
    })

    newComment.value = ""

    fetchComments()

  } catch (err) {

    console.error(err)

  } finally {

    loading.value = false

  }

}

/*
|--------------------------------------------------------------------------
| Date format
|--------------------------------------------------------------------------
*/

const formattedDate = computed(() => {
  if (!props.review.createdAt) return ""
  return new Date(props.review.createdAt).toLocaleDateString()
})

const formatDate = (date) => {
  if (!date) return ""
  return new Date(date).toLocaleString()
}

/*
|--------------------------------------------------------------------------
| Navigation
|--------------------------------------------------------------------------
*/

const goToProfile = (userId = props.review.userId) => {
  router.push(`/profile/${userId}`)
}

/*
|--------------------------------------------------------------------------
| Lifecycle
|--------------------------------------------------------------------------
*/

onMounted(() => {
  fetchReviewUser()
  fetchLikes()
  fetchComments()
})
</script>

<style scoped>
.review-card {
  background: #ffffff;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
  font-family: "Inter", sans-serif;
  color: #333;
}

.review-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  cursor: pointer;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 14px;
}

.review-info {
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.username {
  font-weight: 600;
  font-size: 15px;
}

.comment {
  margin: 12px 0;
  font-size: 14px;
  line-height: 1.6;
}

.review-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.review-img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 12px;
  transition: transform 0.3s ease;
}

.review-img:hover {
  transform: scale(1.05);
}

.review-actions {
  display: flex;
  gap: 12px;
  margin-top: 14px;
}

.review-actions button {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.review-actions button:hover {
  color: #0056b3;
}

.comment-box {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-box textarea {
  width: 97%;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #ddd;
  resize: none;
}

.comment-box button {
  align-self: flex-end;
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.comment-box button:hover {
  background: #0056b3;
}

.comment-list {
  margin-top: 14px;
}

.comment-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.comment-item strong {
  color: #111;
}

.comment-date {
  display: block;
  font-size: 0.8rem;
  color: #888;
}

button.liked {
  color: #d32f2f;
  transition: transform 0.2s ease;
}

button.liked:active {
  transform: scale(1.2);
}

.comment-user {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.comment-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-username {
  font-weight: 600;
  font-size: 14px;
}

.comment-text {
  margin: 4px 0;
  font-size: 14px;
}

.comment-date {
  display: block;
  font-size: 0.8rem;
  color: #888;
}
</style>
