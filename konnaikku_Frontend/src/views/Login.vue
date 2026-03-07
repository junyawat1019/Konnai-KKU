<template>
  <DefaultLayout>
    <div class="auth-container">
      <h2>เข้าสู่ระบบ</h2>

      <form @submit.prevent="loginUser">
        <input
          v-model.trim="email"
          type="email"
          placeholder="อีเมล"
          required
        />

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
import { ref } from "vue"
import { useRouter } from "vue-router"
import axios from "axios"
import DefaultLayout from "@/layouts/DefaultLayout.vue"

const router = useRouter()

const email = ref("")
const password = ref("")

const loading = ref(false)
const errorMessage = ref("")

const API = "http://localhost:8080/api"

/* =========================
   Login
========================= */

const loginUser = async () => {

  if (loading.value) return

  loading.value = true
  errorMessage.value = ""

  try {

    const res = await axios.post(`${API}/auth/login`, {
      email: email.value,
      password: password.value
    })

    const { token, user } = res.data

    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user))

    router.push("/")

  } catch (error) {

    if (error.response) {
      errorMessage.value = error.response.data.message
    } else {
      errorMessage.value = "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้"
    }

    console.error(error)

  } finally {
    loading.value = false
  }
}
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
