<template>
  <div class="add-review">
    <h3>เขียนรีวิว</h3>
    <form @submit.prevent="submitReview">
      <textarea v-model="comment" placeholder="รีวิวของคุณ" required></textarea>

      <div class="review-actions">
        <select v-model.number="rating" required>
          <option disabled value="">ให้คะแนน</option>
          <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
        </select>

        <div class="image-upload">
          <button type="button" @click="triggerFileInput">เพิ่มรูปภาพ</button>
          <span v-if="imageFiles.length">{{ imageFiles.length }} รูป</span>
          <input
            type="file"
            ref="fileInput"
            @change="onFileChange"
            multiple
            accept="image/*"
            style="display:none"
          />
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? "กำลังส่งรีวิว..." : "ส่งรีวิว" }}
        </button>
      </div>

      <!-- พรีวิวรูปภาพ -->
      <div class="image-preview" v-if="imagePreviews.length">
        <div
          v-for="(img, index) in imagePreviews"
          :key="index"
          class="preview-item"
        >
          <img :src="img" alt="Preview" />
          <button type="button" @click="removeImage(index)">✕</button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { db, auth, storage } from "@/firebase";
import {
  collection,
  addDoc,
  doc,
  runTransaction,
  serverTimestamp,
  getDoc
} from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const props = defineProps({ placeId: String });
const emit = defineEmits(["reviewAdded"]);

const comment = ref("");
const rating = ref(5);
const imageFiles = ref([]);
const imagePreviews = ref([]);
const loading = ref(false);
const fileInput = ref(null);

const triggerFileInput = () => fileInput.value.click();

const onFileChange = (e) => {
  const files = Array.from(e.target.files);
  const validFiles = [];

  for (let file of files) {
    if (!file.type.startsWith("image/")) {
      alert(`${file.name} ไม่ใช่ไฟล์ภาพ`);
      continue;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert(`${file.name} มีขนาดใหญ่เกินไป (ต้องไม่เกิน 5MB)`);
      continue;
    }
    validFiles.push(file);
  }

  imageFiles.value = validFiles;
  imagePreviews.value = validFiles.map((file) => URL.createObjectURL(file));
};

const removeImage = (index) => {
  imageFiles.value.splice(index, 1);
  imagePreviews.value.splice(index, 1);
};

const submitReview = async () => {
  if (!auth.currentUser) {
    alert("กรุณาล็อกอินก่อนเขียนรีวิว");
    return;
  }

  if (!comment.value.trim()) {
    alert("กรุณาใส่เนื้อหารีวิว");
    return;
  }

  loading.value = true;

  try {
    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};

    const imageUrls = [];
    for (const file of imageFiles.value) {
      const imgRef = storageRef(
        storage,
        `reviews/${Date.now()}_${file.name}`
      );
      await uploadBytes(imgRef, file);
      const downloadURL = await getDownloadURL(imgRef);
      imageUrls.push(downloadURL);
    }

    await addDoc(collection(db, "places", props.placeId, "reviews"), {
      placeId: props.placeId,
      userId: auth.currentUser.uid,
      userDisplayName:
        userData.displayName || auth.currentUser.email.split("@")[0],
      userPhotoURL: userData.photoURL || "",
      rating: rating.value,
      comment: comment.value,
      imageUrls: imageUrls,
      createdAt: serverTimestamp(),
      likesCount: 0,
      commentsCount: 0
    });

    const placeRef = doc(db, "places", props.placeId);
    await runTransaction(db, async (transaction) => {
      const placeDoc = await transaction.get(placeRef);
      if (!placeDoc.exists()) throw new Error("ไม่พบสถานที่");

      const prevCount = placeDoc.data().reviewCount || 0;
      const prevRating = placeDoc.data().averageRating || 0;

      const newCount = prevCount + 1;
      const newAvg = (prevRating * prevCount + rating.value) / newCount;

      transaction.update(placeRef, {
        reviewCount: newCount,
        averageRating: newAvg
      });
    });

    comment.value = "";
    rating.value = 5;
    imageFiles.value = [];
    imagePreviews.value = [];
    emit("reviewAdded");
  } catch (error) {
    console.error(error);
    alert("เกิดข้อผิดพลาด: " + error.message);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.add-review {
  background: #fff;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  font-family: "Inter", sans-serif;
}

.add-review h3 {
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 16px;
}

textarea {
  width: 97%;
  height: 100px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #ddd;
  resize: none;
  font-size: 14px;
}

textarea:focus {
  border-color: #007BFF;
  outline: none;
}

.review-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #ccc;
}

.image-upload {
  display: flex;
  align-items: center;
  gap: 8px;
}

.image-upload button {
  background: #007BFF;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
}

button[type="submit"] {
  background: #007BFF;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
}

button:disabled {
  background: #ccc;
}

.image-preview {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.preview-item {
  position: relative;
}

.preview-item img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
}

.preview-item button {
  position: absolute;
  top: -6px;
  right: -6px;
  background: red;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
}
@media screen and (max-width: 768px) {
  textarea {
    width: 90%;
  }
}
</style>
