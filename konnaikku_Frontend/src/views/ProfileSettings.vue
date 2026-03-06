<template>
  <DefaultLayout>
    <div class="profile-settings">
      <h2 class="title">ตั้งค่าโปรไฟล์</h2>

      <!-- รูปโปรไฟล์ -->
      <div class="profile-photo-section">
        <div class="photo-wrapper">
          <img :src="photoURL" alt="Profile Photo" class="profile-photo" />
        </div>
        <label class="upload-btn">
          เปลี่ยนรูปโปรไฟล์
          <input type="file" @change="uploadProfilePhoto" accept="image/*" />
        </label>
      </div>

      <!-- ฟอร์มแก้ไขโปรไฟล์ -->
      <form @submit.prevent="updateProfileData" class="profile-form">
        <div class="form-group">
          <label>ชื่อผู้ใช้</label>
          <input
            v-model.trim="displayName"
            type="text"
            placeholder="กรอกชื่อผู้ใช้"
            required
          />
        </div>

        <div class="form-group">
          <label>เพศ</label>
          <select v-model="gender">
            <option value="">เลือกเพศ</option>
            <option value="ชาย">ชาย</option>
            <option value="หญิง">หญิง</option>
            <option value="อื่นๆ">อื่นๆ</option>
          </select>
        </div>

        <div class="form-group">
          <label>วันเกิด</label>
          <input v-model="birthday" type="date" />
        </div>

        <div class="form-group">
          <label>เกี่ยวกับฉัน</label>
          <textarea
            v-model.trim="aboutMe"
            placeholder="เขียนเกี่ยวกับตัวคุณ..."
            rows="3"
          ></textarea>
        </div>

        <div class="form-group">
          <label>เบอร์โทรศัพท์</label>
          <input
            v-model.trim="phoneNumber"
            type="tel"
            placeholder="กรอกเบอร์โทรศัพท์"
          />
        </div>

        <button type="submit" class="btn-save" :disabled="loading">
          {{ loading ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง" }}
        </button>
      </form>

      <!-- เปลี่ยนรหัสผ่าน -->
      <div class="change-password-section">
        <h3>เปลี่ยนรหัสผ่าน</h3>
        <form @submit.prevent="changePassword" class="password-form">
          <div class="form-group password-input">
            <label>รหัสผ่านใหม่</label>
            <div class="input-wrapper">
              <input
                :type="showNewPassword ? 'text' : 'password'"
                v-model.trim="newPassword"
                placeholder="อย่างน้อย 6 ตัวอักษร"
                minlength="6"
                required
              />
              <span
                class="toggle-visibility"
                @click="showNewPassword = !showNewPassword"
              >
                <i
                  :class="showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"
                ></i>
              </span>
            </div>
          </div>

          <div class="form-group password-input">
            <label>ยืนยันรหัสผ่านใหม่</label>
            <div class="input-wrapper">
              <input
                :type="showConfirmPassword ? 'text' : 'password'"
                v-model.trim="confirmPassword"
                placeholder="ยืนยันรหัสผ่าน"
                required
              />
              <span
                class="toggle-visibility"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <i
                  :class="
                    showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'
                  "
                ></i>
              </span>
            </div>
          </div>

          <button type="submit" class="btn-change-password" :disabled="loading">
            {{ loading ? "กำลังเปลี่ยน..." : "เปลี่ยนรหัสผ่าน" }}
          </button>
        </form>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { auth, db, storage } from "@/firebase";
import {
  onAuthStateChanged,
  updateProfile,
  updatePassword,
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import defaultAvatarImage from "@/assets/images/default-avatar.png";

const displayName = ref("");
const gender = ref("");
const birthday = ref("");
const aboutMe = ref("");
const phoneNumber = ref("");
const photoURL = ref(defaultAvatarImage);

const newPassword = ref("");
const confirmPassword = ref("");
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const loading = ref(false);
const userId = ref("");

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    userId.value = user.uid;

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      displayName.value = data.displayName || user.displayName || "";
      gender.value = data.gender || "";
      if (data.birthday?.toDate) {
        birthday.value = data.birthday.toDate().toISOString().split("T")[0];
      } else {
        birthday.value = data.birthday || "";
      }
      aboutMe.value = data.aboutMe || "";
      phoneNumber.value = data.phoneNumber || "";
      photoURL.value = data.photoURL || defaultAvatarImage;
    }
  });
});

const uploadProfilePhoto = async (event) => {
  const file = event.target.files[0];
  if (!file || !userId.value) return;

  loading.value = true;
  try {
    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    const fileName = `${userId.value}_${timestamp}.${extension}`;
    const storageReference = storageRef(storage, `profile_photos/${fileName}`);

    await uploadBytes(storageReference, file);
    const url = await getDownloadURL(storageReference);

    await updateProfile(auth.currentUser, { photoURL: url });
    await updateDoc(doc(db, "users", userId.value), { photoURL: url });
    photoURL.value = url;
    alert(" อัปโหลดรูปโปรไฟล์เรียบร้อยแล้ว");
  } catch (error) {
    alert("เกิดข้อผิดพลาดในการอัปโหลด: " + error.message);
  } finally {
    loading.value = false;
  }
};

const updateProfileData = async () => {
  if (!userId.value) return;
  if (!displayName.value.trim()) {
    alert("กรุณากรอกชื่อผู้ใช้");
    return;
  }

  loading.value = true;
  try {
    await updateProfile(auth.currentUser, { displayName: displayName.value });

    await updateDoc(doc(db, "users", userId.value), {
      displayName: displayName.value,
      gender: gender.value,
      birthday: birthday.value || "",
      aboutMe: aboutMe.value,
      phoneNumber: phoneNumber.value,
    });

    alert("อัปเดตโปรไฟล์เรียบร้อยแล้ว");
  } catch (error) {
    alert("เกิดข้อผิดพลาด: " + error.message);
  } finally {
    loading.value = false;
  }
};

const changePassword = async () => {
  if (newPassword.value.length < 6) {
    alert("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    alert("รหัสผ่านและการยืนยันไม่ตรงกัน");
    return;
  }

  loading.value = true;
  try {
    await updatePassword(auth.currentUser, newPassword.value);
    alert("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
    newPassword.value = "";
    confirmPassword.value = "";
  } catch (error) {
    alert("เกิดข้อผิดพลาด: " + error.message);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* ===== โครงหลัก ===== */
.profile-settings {
  max-width: 600px;
  margin: 20px auto;
  background: #ffffff;
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.title {
  text-align: center;
  font-size: 24px;
  margin-bottom: 25px;
  color: #333;
  font-weight: 600;
}

/* ===== รูปโปรไฟล์ ===== */
.profile-photo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 25px;
}

.photo-wrapper {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #00aeef;
  box-shadow: 0 2px 8px rgba(0, 174, 239, 0.3);
}

.profile-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.profile-photo:hover {
  transform: scale(1.05);
}

.upload-btn {
  margin-top: 10px;
  cursor: pointer;
  color: #00aeef;
  font-weight: bold;
  font-size: 14px;
  text-decoration: underline;
}

.upload-btn input[type="file"] {
  display: none;
}

/* ===== ฟอร์มโปรไฟล์และรหัสผ่าน ===== */
.profile-form .form-group {
  margin-bottom: 18px;
}

.profile-form label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.profile-form input,
.profile-form select,
.profile-form textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 14px;
  background: #fafafa;
  box-sizing: border-box;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.profile-form input:focus,
.profile-form select:focus,
.profile-form textarea:focus {
  border-color: #00aeef;
  box-shadow: 0 0 0 3px rgba(0, 174, 239, 0.15);
  outline: none;
  background: #fff;
}

.profile-form select {
  -webkit-appearance: none; /* ปิด style ของเบราว์เซอร์ */
  -moz-appearance: none;
  appearance: none;
  background: #fafafa url('data:image/svg+xml;utf8,<svg fill="%23666" height="12" viewBox="0 0 24 24" width="12" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>') no-repeat right 12px center;
  background-size: 12px;
  padding-right: 36px; /* เผื่อให้ arrow */
  cursor: pointer;
}

.profile-form textarea {
  resize: vertical;
  min-height: 80px;
}

.profile-form textarea {
  resize: vertical;
  min-height: 80px;
}


.btn-save {
  background: linear-gradient(135deg, #00aeef, #0095d5);
  color: #fff;
  padding: 12px 15px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  font-size: 16px;
  transition: background 0.3s ease, transform 0.1s ease;
  box-shadow: 0 3px 8px rgba(0, 174, 239, 0.25);
}

.btn-save:hover {
  background: linear-gradient(135deg, #00a1e0, #007bb5);
  transform: scale(1.01);
}

/* ===== ช่องรหัสผ่าน ===== */
.password-input {
  position: relative;
  width: 100%;
}

.password-input .input-wrapper {
  position: relative;
}

.password-input input {
  width: 100%;
  padding: 10px 45px 10px 12px; /* เผื่อพื้นที่ปุ่มด้านขวา */
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.2s;
  margin-top: 4px;
  margin-bottom: 12px;
}

.password-input input:focus {
  border-color: #00aeef;
  outline: none;
}

.toggle-visibility {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #00aeef;
  font-weight: 600;
  background: transparent;
  border: none;
  font-size: 14px;
  padding: 4px 6px;
  border-radius: 6px;
  transition: background 0.2s, color 0.2s;
}

.toggle-visibility:hover {
  background: rgba(0, 174, 239, 0.1);
  color: #007bbf;
}

.btn-change-password {
  background: #d32f2f;
  color: white;
  border: none;
  margin-top: 12px;
  padding: 12px 15px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  font-size: 16px;
  transition: background 0.3s ease, transform 0.1s;
  box-shadow: 0 3px 8px rgba(225, 29, 29, 0.25);
}

.btn-change-password:hover {
  background: #bd2222;
  transform: scale(1.01);
}

/* ===== Responsive ===== */
@media (max-width: 480px) {
  .profile-settings {
    padding: 18px;
    border-radius: 10px;
  }

  .title {
    font-size: 20px;
  }

  .btn-save,
  .btn-change-password {
    padding: 10px;
    font-size: 15px;
  }

  .toggle-visibility {
    right: 10px;
  }
}
</style>
