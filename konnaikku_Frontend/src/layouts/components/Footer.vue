<template>
  <footer class="footer-wrapper">
    <div class="footer-container max-w-7xl mx-auto py-12 px-6">

      <!-- Top Section -->
      <div class="flex flex-col md:flex-row md:justify-between gap-10">

        <!-- Logo -->
        <div class="flex flex-col items-center md:items-start gap-5">
          <img
            src="@/assets/images/logos/konnai_logo_2.png"
            alt="Konnai KKU Logo"
            class="w-32"
          />
        </div>

        <!-- Link Columns -->
        <div class="footer-grid text-center md:text-left flex-1">

          <div>
            <h4>สำหรับผู้ใช้</h4>
            <ul>
              <li>
                <router-link to="/about">เกี่ยวกับ Konnai</router-link>
              </li>
            </ul>
          </div>

          <div>
            <h4>สำหรับร้านค้า</h4>
            <ul>
              <li><router-link to="/claim-business">แจ้งเป็นเจ้าของร้าน</router-link></li>
              <li><router-link to="/advertise">ลงโฆษณากับเรา</router-link></li>
              <li><router-link to="/marketing">บทความการตลาด</router-link></li>
            </ul>
          </div>

          <div>
            <h4>สำหรับสื่อ</h4>
            <ul>
              <li><router-link to="/news">ข่าวสาร</router-link></li>
              <li><router-link to="/events">กิจกรรม & Event</router-link></li>
            </ul>
          </div>

          <div>
            <h4>เกี่ยวกับเรา</h4>
            <ul>
              <li><router-link to="/history">ประวัติโครงการ</router-link></li>
              <li><router-link to="/contact">ติดต่อเรา</router-link></li>
              <li><router-link to="/careers">ร่วมงานกับเรา</router-link></li>
              <li><router-link to="/help">ศูนย์ช่วยเหลือ</router-link></li>
            </ul>
          </div>

        </div>
      </div>

      <!-- Bottom -->
      <div class="bottom flex flex-col md:flex-row justify-between items-center gap-4 mt-10">

        <p>
          © {{ year }} Konnai KKU. All rights reserved.
          <router-link to="/terms">Terms & Conditions</router-link> |
          <router-link to="/privacy">Privacy Policy</router-link>
        </p>

        <div class="social-icons flex gap-5">
          <a
            v-for="social in socials"
            :key="social.icon"
            :href="social.link"
            target="_blank"
          >
            <i :class="social.icon"></i>
          </a>
        </div>

      </div>

    </div>
  </footer>
</template>

<script setup>
import { computed } from "vue"

const year = computed(() => new Date().getFullYear())

const socials = [
  { icon: "fab fa-facebook-f", link: "#" },
  { icon: "fab fa-twitter", link: "#" },
  { icon: "fab fa-instagram", link: "#" },
  { icon: "fab fa-youtube", link: "#" },
  { icon: "fab fa-line", link: "#" }
]
</script>

<style scoped>
footer {
  background-color: #f7f9fa;
  color: #374151;
  font-family: "Inter", "Prompt", sans-serif;
  font-size: 0.875rem;
  line-height: 1.6;
}

footer h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.75rem;
}

footer ul li {
  font-size: 0.75rem;
  color: #4b5563;
  margin-bottom: 0.5rem;
}

footer a {
  color: inherit;
  text-decoration: none;
  transition: color 0.2s ease, text-decoration 0.2s ease;
}

footer a:hover {
  color: #2563eb;
  text-decoration: underline;
}

footer img {
  display: block;
  width: 140px;          
  height: auto;
  object-fit: contain;
  transition: transform 0.2s ease;
}

footer img:hover {
  transform: scale(1.05);
}

footer .social-icons a {
  font-size: 1.125rem;
  color: #6b7280;
  transition: transform 0.2s ease, color 0.2s ease;
}

footer .social-icons a:hover {
  transform: scale(1.1);
}

footer .bottom {
  border-top: 1px solid #e5e7eb;
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  font-size: 0.75rem;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

footer .bottom a {
  margin-left: 0.5rem;
}

footer .footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 2rem;
}

footer .footer-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}
.footer-wrapper {
  width: 100%;
  background-color: #f7f9fa; /* สีพื้นหลังเทาอ่อนเต็มจอ */
  border-top: 1px solid #e5e7eb;
  color: #374151;
  font-family: "Inter", "Prompt", sans-serif;
  font-size: 0.875rem;
  line-height: 1.6;
}

.footer-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
}

@media (min-width: 768px) {
  footer .bottom {
    flex-direction: row;
    justify-content: space-between;
    text-align: left;
  }
}
</style>
