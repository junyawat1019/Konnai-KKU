<template>
  <DefaultLayout>
    <div class="auth-container">
      <h2>สมัครสมาชิก</h2>

      <form @submit.prevent="registerUser">
        <input v-model.trim="displayName" type="text" placeholder="ชื่อผู้ใช้" required />

        <select v-model="gender" required>
          <option disabled value="">เลือกเพศ</option>
          <option value="ชาย">ชาย</option>
          <option value="หญิง">หญิง</option>
          <option value="อื่นๆ">อื่นๆ</option>
        </select>

        <label>วันเกิด</label>
        <input v-model="birthday" type="date" required />

        <input v-model.trim="email" type="email" placeholder="อีเมล" required />
        <input v-model.trim="password" type="password" placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)" required />

        <button type="submit" :disabled="loading">
          {{ loading ? "กำลังสมัคร..." : "สมัคร" }}
        </button>
      </form>

      <div class="divider">หรือ</div>

      <button class="google-btn" @click="registerWithGoogle" :disabled="loading">
        สมัครด้วย Google
      </button>

      <p class="switch-auth">
        มีบัญชีอยู่แล้ว?
        <router-link to="/login">เข้าสู่ระบบ</router-link>
      </p>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";

const email = ref("");
const password = ref("");
const displayName = ref("");
const gender = ref("");
const birthday = ref("");
const loading = ref(false);
const router = useRouter();

const registerUser = async () => {
  if (password.value.length < 6) {
    alert("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
    return;
  }

  loading.value = true;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);

    await updateProfile(userCredential.user, {
      displayName: displayName.value,
    });

    await setDoc(doc(db, "users", userCredential.user.uid), {
      displayName: displayName.value,
      email: email.value,
      gender: gender.value,
      birthday: birthday.value ? new Date(birthday.value) : null,
      createdAt: new Date(),
      photoURL: "",
      aboutMe: "",
      phoneNumber: "",
      favorites: [],
      reviewsCount: 0,
      followersCount: 0,
      followingCount: 0,
    });

    alert("สมัครสมาชิกสำเร็จ!");
    router.push("/");
  } catch (error) {
    alert("เกิดข้อผิดพลาด: " + error.message);
  } finally {
    loading.value = false;
  }
};

const registerWithGoogle = async () => {
  loading.value = true;
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    if (result._tokenResponse.isNewUser) {
      await setDoc(doc(db, "users", result.user.uid), {
        displayName: result.user.displayName || result.user.email.split("@")[0],
        email: result.user.email,
        gender: "",
        birthday: null,
        createdAt: new Date(),
        photoURL: result.user.photoURL || "",
        aboutMe: "",
        phoneNumber: "",
        favorites: [],
        reviewsCount: 0,
        followersCount: 0,
        followingCount: 0,
      });
    }

    router.push("/");
  } catch (error) {
    alert("เกิดข้อผิดพลาด: " + error.message);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

input {
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 14px;
}

button {
  padding: 12px;
  border: none;
  border-radius: 6px;
  background: #00aeef;
  color: white;
  cursor: pointer;
  font-weight: bold;
}

button:disabled {
  background: #99d6f2;
  cursor: not-allowed;
}

.divider {
  text-align: center;
  margin: 16px 0;
  font-size: 14px;
  color: #888;
}

.google-btn {
  display: block;
  margin: 0 auto;
  padding: 12px;
  border: none;
  border-radius: 6px;
  background: #00aeef;
  color: white;
  cursor: pointer;
  font-weight: bold;
}

.switch-auth {
  margin-top: 12px;
  text-align: center;
  font-size: 14px;
}
</style>
