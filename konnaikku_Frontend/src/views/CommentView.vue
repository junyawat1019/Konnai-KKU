<template>
  <DefaultLayout>
    <div class="comment-page">
      <h2>คอมเมนต์</h2>

      <div class="add-comment">
        <textarea v-model="commentText" placeholder="เขียนคอมเมนต์..." rows="3"></textarea>
        <button @click="submitComment" :disabled="loading">
          {{ loading ? "กำลังส่ง..." : "ส่งคอมเมนต์" }}
        </button>
      </div>

      <div v-if="comments.length">
        <div v-for="c in comments" :key="c.id" class="comment-card">
          <p><strong>{{ c.username }}</strong> · {{ formatDate(c.createdAt) }}</p>
          <p>{{ c.comment }}</p>
        </div>
      </div>
      <div v-else>
        <p>ยังไม่มีคอมเมนต์</p>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/firebase";

const route = useRoute();
const placeId = route.params.id;
const reviewId = route.params.reviewId;

const commentText = ref("");
const comments = ref([]);
const loading = ref(false);

const fetchComments = async () => {
  const commentsRef = collection(db, "places", placeId, "reviews", reviewId, "comments");
  const q = query(commentsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  comments.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const submitComment = async () => {
  if (!auth.currentUser) {
    alert("กรุณาล็อกอินก่อนคอมเมนต์");
    return;
  }
  if (!commentText.value.trim()) return;

  loading.value = true;
  try {
    await addDoc(collection(db, "places", placeId, "reviews", reviewId, "comments"), {
      comment: commentText.value,
      userId: auth.currentUser.uid,
      username: auth.currentUser.displayName || auth.currentUser.email,
      createdAt: serverTimestamp(),
    });
    commentText.value = "";
    fetchComments();
  } catch (error) {
    console.error("Error adding comment:", error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (timestamp) => {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString();
};

onMounted(fetchComments);
</script>

<style scoped>
.comment-page {
  max-width: 800px;
  margin: auto;
  padding: 20px;
}

.add-comment {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.add-comment textarea {
  resize: none;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #ccc;
  margin-bottom: 10px;
}

.add-comment button {
  align-self: flex-end;
  padding: 8px 16px;
  background: #00aeef;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.comment-card {
  background: #f9f9f9;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 10px;
}
</style>
