<template>
  <DefaultLayout>
    <div class="comment-page">
      <h2>คอมเมนต์</h2>

      <div class="add-comment">
        <textarea
          v-model="commentText"
          placeholder="เขียนคอมเมนต์..."
          rows="3"
        ></textarea>
        <button @click="submitComment" :disabled="loading">
          {{ loading ? "กำลังส่ง..." : "ส่งคอมเมนต์" }}
        </button>
      </div>

      <div v-if="comments.length">
        <div v-for="c in comments" :key="c.id" class="comment-card">
          <p>
            <strong>{{ c.display_name || c.username }}</strong>
            · {{ formatDate(c.created_at) }}
          </p>
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
import axios from "axios";
import DefaultLayout from "@/layouts/DefaultLayout.vue";

const route = useRoute();

const API_URL = import.meta.env.VITE_API_URL

const reviewId = route.params.reviewId;

const commentText = ref("");
const comments = ref([]);
const loading = ref(false);

const fetchComments = async () => {
  try {
    const res = await axios.get(`${API_URL}/reviews/${reviewId}/comments`);

    comments.value = res.data;
  } catch (error) {
    console.error("โหลดคอมเมนต์ไม่สำเร็จ", error);
  }
};

const submitComment = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("กรุณาล็อกอินก่อนคอมเมนต์");
    return;
  }

  if (!commentText.value.trim()) return;

  loading.value = true;

  try {
    await axios.post(
      `${API_URL}/reviews/${reviewId}/comments`,
      {
        comment: commentText.value,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    commentText.value = "";

    await fetchComments();
  } catch (error) {
    console.error("เพิ่มคอมเมนต์ไม่สำเร็จ", error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);

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
