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
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import defaultAvatarImg from "@/assets/images/default-avatar.png";
import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "@/firebase";

const props = defineProps({
  review: Object,
  placeId: String,
});

const defaultAvatar = defaultAvatarImg;
const router = useRouter();

// States
const likesCount = ref(props.review.likesCount || 0);
const commentsCount = ref(props.review.commentsCount || 0);
const isLiked = ref(false);
const showCommentBox = ref(false);
const newComment = ref("");
const comments = ref([]);
const loading = ref(false);

// User info for review
const reviewUser = ref({
  displayName: "",
  photoURL: defaultAvatar,
});

// Realtime unsubscribers
let likesUnsub = null;
let commentsUnsub = null;

// Fetch review user info
const fetchReviewUser = async () => {
  if (!props.review.userId) return;
  try {
    const userDoc = await getDoc(doc(db, "users", props.review.userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      reviewUser.value.displayName = data.displayName || "";
      reviewUser.value.photoURL = data.photoURL || defaultAvatar;
    }
  } catch (err) {
    console.error("fetchReviewUser error:", err);
  }
};

// Check like status
const checkLikeStatus = async () => {
  if (!auth.currentUser) return;
  const likeDoc = doc(
    db,
    "places",
    props.placeId,
    "reviews",
    props.review.id,
    "likes",
    auth.currentUser.uid
  );
  const snap = await getDoc(likeDoc);
  isLiked.value = snap.exists();
};

// Fetch likes realtime
const fetchLikesRealtime = () => {
  const likesRef = collection(
    db,
    "places",
    props.placeId,
    "reviews",
    props.review.id,
    "likes"
  );
  likesUnsub = onSnapshot(likesRef, (snapshot) => {
    likesCount.value = snapshot.size;
    isLiked.value = snapshot.docs.some((d) => d.id === auth.currentUser?.uid);
  });
};

// Fetch comments realtime with fallback to user collection
const fetchCommentsRealtime = () => {
  const commentsRef = collection(
    db,
    "places",
    props.placeId,
    "reviews",
    props.review.id,
    "comments"
  );
  const q = query(commentsRef, orderBy("createdAt", "desc"));
  commentsUnsub = onSnapshot(q, async (snapshot) => {
    const loadedComments = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        if (!data.username || !data.userPhotoURL) {
          // fetch user info from 'users' collection
          try {
            const userDoc = await getDoc(doc(db, "users", data.userId));
            if (userDoc.exists()) {
              const uData = userDoc.data();
              data.userFetchedName = uData.displayName || "";
              data.userFetchedPhoto = uData.photoURL || defaultAvatar;
            }
          } catch {}
        }
        return { id: docSnap.id, ...data };
      })
    );
    comments.value = loadedComments;
    commentsCount.value = loadedComments.length;
  });
};

// Toggle like
const toggleLike = async () => {
  if (!auth.currentUser) return alert("กรุณาล็อกอินก่อนกดไลค์");
  const likeDoc = doc(
    db,
    "places",
    props.placeId,
    "reviews",
    props.review.id,
    "likes",
    auth.currentUser.uid
  );
  const snap = await getDoc(likeDoc);
  try {
    if (snap.exists()) {
      await deleteDoc(likeDoc);
      isLiked.value = false;
      likesCount.value = Math.max(likesCount.value - 1, 0);
    } else {
      await setDoc(likeDoc, { likedAt: serverTimestamp() });
      isLiked.value = true;
      likesCount.value += 1;
    }
  } catch (err) {
    console.error(err);
  }
};

// Toggle comment box
const toggleCommentBox = () => {
  showCommentBox.value = !showCommentBox.value;
};

// Submit comment
const submitComment = async () => {
  if (!auth.currentUser) return alert("กรุณาล็อกอินก่อนคอมเมนต์");
  if (!newComment.value.trim()) return;
  loading.value = true;
  try {
    await addDoc(
      collection(
        db,
        "places",
        props.placeId,
        "reviews",
        props.review.id,
        "comments"
      ),
      {
        comment: newComment.value,
        userId: auth.currentUser.uid,
        username: auth.currentUser.displayName || auth.currentUser.email,
        userPhotoURL: auth.currentUser.photoURL || defaultAvatar,
        createdAt: serverTimestamp(),
      }
    );
    newComment.value = "";
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// Format dates
const formattedDate = computed(() => {
  if (!props.review.createdAt) return "";
  const date = props.review.createdAt.toDate
    ? props.review.createdAt.toDate()
    : new Date(props.review.createdAt);
  return date.toLocaleDateString();
});

const formatDate = (timestamp) => {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString();
};

// Go to profile
const goToProfile = (userId = props.review.userId) => {
  router.push(`/profile/${userId}`);
};

onMounted(() => {
  fetchReviewUser();
  checkLikeStatus();
  fetchLikesRealtime();
  fetchCommentsRealtime();
});

onUnmounted(() => {
  if (likesUnsub) likesUnsub();
  if (commentsUnsub) commentsUnsub();
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
