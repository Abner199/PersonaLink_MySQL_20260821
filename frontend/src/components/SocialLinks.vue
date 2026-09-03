<template>
  <div class="social-links">
    <!-- 社交链接已移除 -->
  </div>
</template>

<script setup>
import { ref } from 'vue';

// 社交链接已移除
const socialLinks = ref([]);
</script>

<style scoped>
.social-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}

.social-link {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transition: all 0.3s ease;
}

.social-link:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-3px);
}

.social-link i {
  font-size: 18px;
  color: #fff;
}
</style>