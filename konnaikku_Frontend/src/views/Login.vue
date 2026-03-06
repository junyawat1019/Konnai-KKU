<template>
  <DefaultLayout>
    <div class="auth-container">
      <h2>เข้าสู่ระบบ</h2>

      <form @submit.prevent="loginUser">
        <input v-model.trim="email" type="email" placeholder="อีเมล" required />
        <input v-model.trim="password" type="password" placeholder="รหัสผ่าน" required />
        <button type="submit" :disabled="loading">
          {{ loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ" }}
        </button>
      </form>

      <div class="divider">หรือ</div>

      <button class="google-btn" @click="loginWithGoogle" :disabled="loading">
        เข้าสู่ระบบด้วย Google
      </button>

      <p class="switch-auth">
        ยังไม่มีบัญชีใช่ไหม?
        <router-link to="/register">สมัครสมาชิก</router-link>
      </p>
      <p class="switch-auth">
        ลืมรหัสผ่าน?
        <router-link to="/reset-password">รีเซ็ทรหัสผ่าน</router-link>
      </p>

    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/firebase";

const email = ref("");
const password = ref("");
const loading = ref(false);
const router = useRouter();

const loginUser = async () => {
  loading.value = true;
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    alert("เข้าสู่ระบบสำเร็จ!");
    router.push("/");
  } catch (error) {
    alert("เกิดข้อผิดพลาด: " + error.message);
  } finally {
    loading.value = false;
  }
};

const loginWithGoogle = async () => {
  loading.value = true;
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    alert("เข้าสู่ระบบด้วย Google สำเร็จ!");
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
