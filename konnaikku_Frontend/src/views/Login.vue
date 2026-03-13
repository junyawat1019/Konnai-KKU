<template>
  <DefaultLayout>
    <div class="auth-container">
      <h2>เข้าสู่ระบบ</h2>

      <form @submit.prevent="loginUser">
        <input v-model.trim="email" type="email" placeholder="อีเมล" required />

        <input
          v-model.trim="password"
          type="password"
          placeholder="รหัสผ่าน"
          required
        />

        <button type="submit" :disabled="loading">
          {{ loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ" }}
        </button>
      </form>

      <p v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </p>

      <p class="switch-auth">
        ยังไม่มีบัญชีใช่ไหม?
        <router-link to="/register">สมัครสมาชิก</router-link>
      </p>

      <p class="switch-auth">
        ลืมรหัสผ่าน?
        <router-link to="/reset-password">รีเซ็ตรหัสผ่าน</router-link>
      </p>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import api from "@/services/api";
import DefaultLayout from "@/layouts/DefaultLayout.vue";

const router = useRouter();

const email = ref("");
const password = ref("");

const loading = ref(false);
const errorMessage = ref("");

watch([email, password], () => {
  errorMessage.value = "";
});

const loginUser = async () => {
  if (loading.value) return;

  if (!email.value) {
    errorMessage.value = "กรุณากรอกอีเมล";
    return;
  }

  if (!password.value) {
    errorMessage.value = "กรุณากรอกรหัสผ่าน";
    return;
  }

  loading.value = true;

  try {

    const res = await api.post("/auth/login", {
      email: email.value,
      password: password.value,
    });

    const { token, user } = res.data;

    localStorage.setItem("token", token);

    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userId", user.id);
    }

    window.location.href = "/";

  } catch (error) {

    errorMessage.value =
      error.response?.data?.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง";

    password.value = "";

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

.error-message {
  margin-top: 10px;
  color: red;
  font-size: 14px;
  text-align: center;
}

.switch-auth {
  margin-top: 12px;
  text-align: center;
  font-size: 14px;
}
</style>
