<template>
  <DefaultLayout>
    <div class="auth-container">
      <h2>รีเซ็ตรหัสผ่าน</h2>

      <form @submit.prevent="resetPassword">
        <input
          v-model.trim="email"
          type="email"
          placeholder="กรอกอีเมลของคุณ"
          required
        />
        <button type="submit" :disabled="loading">
          {{ loading ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน" }}
        </button>
      </form>

      <p class="switch-auth">
        กลับไปที่
        <router-link to="/login">เข้าสู่ระบบ</router-link>
      </p>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref } from "vue";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase";
import DefaultLayout from "@/layouts/DefaultLayout.vue";

const email = ref("");
const loading = ref(false);

const resetPassword = async () => {
  loading.value = true;
  try {
    await sendPasswordResetEmail(auth, email.value);
    alert("ส่งลิงก์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว โปรดตรวจสอบอีเมลของคุณ");
    email.value = "";
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
.switch-auth {
  margin-top: 12px;
  text-align: center;
  font-size: 14px;
}
</style>
