<template>
  <footer class="footer-wrapper">
    <div class="footer-container max-w-7xl mx-auto py-12 px-6">
      <!-- Top Section -->
      <div class="flex flex-col md:flex-row md:justify-between gap-10">
        <!-- Left: Logo -->
        <div class="flex flex-col items-center md:items-start gap-5">
          <img src="@/assets/images/logos/konnai_logo_2.png" alt="Konnai KKU Logo" class="w-32" />
        </div>

        <!-- Right: Link Columns -->
        <div class="footer-grid text-center md:text-left flex-1">
          <!-- สำหรับผู้ใช้ -->
          <div>
            <h4>สำหรับผู้ใช้</h4>
            <ul>
              <li><a href="#">เกี่ยวกับ Konnai</a></li>
            </ul>
          </div>

          <!-- สำหรับร้านค้า -->
          <div>
            <h4>สำหรับร้านค้า</h4>
            <ul>
              <li><a href="#">แจ้งเป็นเจ้าของร้าน</a></li>
              <li><a href="#">ลงโฆษณากับเรา</a></li>
              <li><a href="#">บทความการตลาด</a></li>
            </ul>
          </div>

          <!-- สำหรับสื่อ -->
          <div>
            <h4>สำหรับสื่อ</h4>
            <ul>
              <li><a href="#">ข่าวสาร</a></li>
              <li><a href="#">กิจกรรม & Event</a></li>
            </ul>
          </div>

          <!-- เกี่ยวกับเรา -->
          <div>
            <h4>เกี่ยวกับเรา</h4>
            <ul>
              <li><a href="#">ประวัติโครงการ</a></li>
              <li><a href="#">ติดต่อเรา</a></li>
              <li><a href="#">ร่วมงานกับเรา</a></li>
              <li><a href="#">ศูนย์ช่วยเหลือ</a></li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Bottom Section -->
      <div class="bottom">
        <p>
          © {{ year }} Konnai KKU. All rights reserved.
          <a href="#">Terms & Conditions</a> |
          <a href="#">Privacy Policy</a>
        </p>

        <div class="social-icons flex gap-5 mt-3 md:mt-0">
          <a href="#"><i class="fab fa-facebook-f"></i></a>
          <a href="#"><i class="fab fa-twitter"></i></a>
          <a href="#"><i class="fab fa-instagram"></i></a>
          <a href="#"><i class="fab fa-youtube"></i></a>
          <a href="#"><i class="fab fa-line"></i></a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref } from "vue";
const year = ref(new Date().getFullYear());
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
