<template>
  <div class="review-card">
    <!-- Header -->
    <div class="review-header" @click="goToProfile(review.user_id)">
      <img
        :src="review.photo_url || defaultAvatar"
        class="avatar"
      />

      <div class="review-info">
        <p class="username">
          <strong>{{ review.display_name || "ผู้ใช้ไม่ระบุชื่อ" }}</strong>
        </p>

        <p class="rating">
          <i class="fa fa-star"></i>
          {{ review.rating }}
        </p>

        <span class="date">{{ formattedDate }}</span>
      </div>
    </div>

    <!-- Comment -->
    <p v-if="review.comment" class="comment">
      {{ review.comment }}
    </p>

    <!-- Images -->
    <div v-if="review.images?.length" class="review-images">
      <img
        v-for="(img, i) in review.images"
        :key="i"
        :src="img"
        class="review-img"
      />
    </div>

    <!-- Actions -->
    <div class="review-actions">
      <button
        @click.stop="toggleLike"
        :class="{ liked: isLiked }"
      >
        <i class="fa fa-thumbs-up"></i>
        {{ likesCount }}
      </button>

      <button @click.stop="toggleCommentBox">
        <i class="fa fa-comment"></i>
        {{ commentsCount }}
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
        <div
          class="comment-user"
          @click="goToProfile(c.user_id)"
        >
          <img
            :src="c.photo_url || defaultAvatar"
            class="comment-avatar"
          />

          <strong class="comment-username">
            {{ c.display_name }}
          </strong>

          <span class="comment-date">
            {{ formatDate(c.created_at) }}
          </span>
        </div>

        <p class="comment-text">{{ c.comment }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import defaultAvatarImg from "@/assets/images/default-avatar.png";

const props = defineProps({
  review: Object,
});

const router = useRouter();

const API = "http://localhost:8080";

const defaultAvatar = defaultAvatarImg;

const likesCount = ref(props.review.likes_count || 0);
const commentsCount = ref(props.review.comments_count || 0);

const isLiked = ref(false);

const showCommentBox = ref(false);
const newComment = ref("");
const comments = ref([]);
const loading = ref(false);

/*
-----------------------
Auth Header
-----------------------
*/

const getAuth = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

/*
-----------------------
Fetch comments
-----------------------
*/

const fetchComments = async () => {
  try {
    const res = await axios.get(
      `${API}/api/reviews/${props.review.id}/comments`,
    );

    comments.value = res.data;
    commentsCount.value = res.data.length;
  } catch (err) {
    console.error(err);
  }
};

/*
-----------------------
Check liked
-----------------------
*/

const checkLiked = async () => {
  try {
    const res = await axios.get(
      `${API}/api/reviews/${props.review.id}/liked`,
      getAuth(),
    );

    isLiked.value = res.data.liked;
  } catch (err) {
    console.error(err);
  }
};

/*
-----------------------
Like
-----------------------
*/

const toggleLike = async () => {
  try {
    if (isLiked.value) {
      await axios.delete(
        `${API}/api/reviews/${props.review.id}/like`,
        getAuth(),
      );

      likesCount.value--;
      isLiked.value = false;
    } else {
      await axios.post(
        `${API}/api/reviews/${props.review.id}/like`,
        {},
        getAuth(),
      );

      likesCount.value++;
      isLiked.value = true;
    }
  } catch (err) {
    console.error(err);
  }
};

/*
-----------------------
Comment
-----------------------
*/

const toggleCommentBox = () => {
  showCommentBox.value = !showCommentBox.value;
};

const submitComment = async () => {
  if (!newComment.value.trim()) return;

  loading.value = true;

  try {
    const res = await axios.post(
      `${API}/api/reviews/${props.review.id}/comments`,
      {
        comment: newComment.value,
      },
      getAuth(),
    );

    comments.value.unshift(res.data);

    commentsCount.value++;

    newComment.value = "";
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

/*
-----------------------
Date
-----------------------
*/

const formattedDate = computed(() => {
  if (!props.review.created_at) return "";
  return new Date(props.review.created_at).toLocaleDateString("th-TH");
});

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleString("th-TH");
};

/*
-----------------------
Navigation
-----------------------
*/

const goToProfile = (userId) => {
  if (!userId) return;
  router.push(`/profile/${userId}`);
};

/*
-----------------------
Lifecycle
-----------------------
*/

onMounted(() => {
  fetchComments();
  checkLiked();
});
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
  gap: 4px;
}

.username {
  font-weight: 500;
  font-size: 15px;
  color: #222;
}

.rating {
  font-size: 13px;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  gap: 4px;
}

.comment {
  margin: 12px 0;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

.date {
  margin-top: 18px;
  font-size: 12px;
  color: #777;
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
