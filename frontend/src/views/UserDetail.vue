<template>
  <div class="user-detail-container">
    <div class="glass-card">
      <!-- 返回按钮 -->
      <div class="header-section">
        <button @click="goBack" class="back-button">
          <span class="button-icon">←</span>
          <span class="button-text">返回</span>
        </button>
      </div>

      <!-- 用户详情内容 -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>正在加载用户信息...</p>
      </div>

      <div v-else-if="error" class="error-container">
        <p>{{ error }}</p>
        <button @click="loadUserDetail" class="glass-button small">重试</button>
      </div>

      <div v-else-if="user" class="user-detail-content">
        <!-- 用户头像和基本信息 -->
        <div class="user-profile-section">
          <div class="avatar-container">
            <img 
              :src="resolveAvatarUrl(user)"
              :alt="user.name || user.username || '用户'" 
              class="user-avatar-large"
              @error="applyAvatarFallback($event, user)"
            />
          </div>
          
          <div class="user-basic-info">
            <h1 class="user-name-large">{{ user.name || user.username || '未知用户' }}</h1>
            <p v-if="user.email" class="user-email">{{ user.email }}</p>
            <p v-if="user.className" class="user-class">{{ user.className }}</p>
            <p v-if="user.role === 'admin'" class="user-role">👑 管理员</p>
          </div>
        </div>

        <!-- 详细信息 -->
        <div class="user-details-section">
          <div v-if="user.profile?.hometown" class="detail-item">
            <span class="detail-icon">🏠</span>
            <div class="detail-content">
              <label>家乡</label>
              <p>{{ user.profile.hometown }}</p>
            </div>
          </div>

          <div v-if="user.profile?.phone" class="detail-item">
            <span class="detail-icon">📱</span>
            <div class="detail-content">
              <label>手机号码</label>
              <p>{{ user.profile.phone }}</p>
            </div>
          </div>

          <div v-if="user.profile?.hobbies && user.profile.hobbies.length > 0" class="detail-item">
            <span class="detail-icon">🎯</span>
            <div class="detail-content">
              <label>爱好</label>
              <div class="hobbies-list">
                <span 
                  v-for="(hobby, index) in user.profile.hobbies" 
                  :key="index" 
                  class="hobby-tag-large"
                >
                  {{ hobby }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="user.profile?.bio" class="detail-item">
            <span class="detail-icon">📝</span>
            <div class="detail-content">
              <label>个人简介</label>
              <p class="user-bio-large">{{ user.profile.bio }}</p>
            </div>
          </div>

          <div v-if="!user.profile?.hometown && !user.profile?.phone && !user.profile?.hobbies && !user.profile?.bio" class="no-info">
            <p>该用户暂无详细信息</p>
          </div>
        </div>
      </div>

      <div v-else class="no-user">
        <p>用户不存在</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { applyAvatarFallback, resolveAvatarUrl } from '../utils/avatar'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const user = ref(null)
const isLoading = ref(false)
const error = ref('')

// 加载用户详情
const loadUserDetail = async () => {
  const userId = route.params.id
  if (!userId) {
    error.value = '用户ID不存在'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    user.value = await userStore.fetchUserById(userId)
  } catch (err) {
    console.error('获取用户详情失败:', err)
    error.value = '获取用户信息失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 组件挂载时加载数据
onMounted(() => {
  loadUserDetail()
})
</script>

<style scoped>
.user-detail-container {
  min-height: 100vh;
  padding: 20px;
  padding-top: 60px; /* 增加顶部内边距，确保返回按钮可见 */
}

.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  margin: 0 auto;
}

.header-section {
  margin-bottom: 30px;
}

.back-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 10px 20px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}

.user-profile-section {
  display: flex;
  align-items: center;
  gap: 30px;
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.avatar-container {
  flex-shrink: 0;
}

.user-avatar-large {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.user-basic-info {
  flex: 1;
}

.user-name-large {
  margin: 0 0 8px 0;
  font-size: 32px;
  font-weight: 600;
  color: white;
}

.user-email {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
}

.user-class {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  font-style: italic;
}

.user-role {
  margin: 0;
  font-size: 16px;
  color: #ffd700;
  font-weight: 500;
}

.user-details-section {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.detail-icon {
  font-size: 24px;
  margin-top: 2px;
}

.detail-content {
  flex: 1;
}

.detail-content label {
  display: block;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 5px;
  font-weight: 500;
}

.detail-content p {
  margin: 0;
  font-size: 16px;
  color: white;
  line-height: 1.5;
}

.hobbies-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hobby-tag-large {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  padding: 6px 12px;
  font-size: 14px;
  color: white;
}

.user-bio-large {
  line-height: 1.6;
  white-space: pre-wrap;
}

.loading-container,
.error-container,
.no-user,
.no-info {
  text-align: center;
  padding: 50px 0;
  color: white;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.glass-button.small {
  padding: 8px 16px;
  font-size: 14px;
}

@media (max-width: 768px) {
  .user-profile-section {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .user-name-large {
    font-size: 24px;
  }
  
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
