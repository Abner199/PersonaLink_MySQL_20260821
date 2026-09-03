<template>
  <div class="home">
    <!-- 用户侧边栏 -->
    <div id="users-sidebar" class="users-sidebar" :class="{ 'is-visible': isSidebarVisible }" @mouseenter="showSidebar" @mouseleave="hideSidebar">
      <div class="sidebar-content">
        <h3>其他用户</h3>
        <div v-if="isLoading" class="loading">
          <p>用户列表加载中...</p>
        </div>
        <div v-else>
          <div v-if="otherUsers.length === 0" class="no-users">
            <p>暂无其他用户</p>
          </div>
          <div v-else class="users-list">
            <div 
              v-for="user in otherUsers" 
              :key="user.id"
              class="user-item"
              @click="viewUserProfile(user.email)"
            >
              <div class="user-avatar">
                <img
                  :src="resolveAvatarUrl(user, user.avatar || user.profile?.avatar)"
                  alt="头像" 
                  class="avatar-image"
                  @error="applyAvatarFallback($event, user)"
                />
              </div>
              <div class="user-info">
                <h4>{{ user.name || '匿名用户' }}</h4>
                <p class="user-email">{{ user.email }}</p>
                <p class="role" v-if="user.role === 'admin'">👑 管理员</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 鼠标悬停触发区域 -->
    <div class="sidebar-trigger" @mouseenter="showSidebar"></div>
    <button
      class="mobile-sidebar-button"
      type="button"
      :aria-expanded="isSidebarVisible"
      aria-controls="users-sidebar"
      @click="toggleSidebar"
    >
      {{ isSidebarVisible ? '收起同学' : '查看同学' }}
    </button>
    
    <div class="left">
      <Message />
      <SocialLinks />
    </div>
    <div class="right">
      <div class="glass-card">
        <div class="header">
          <h1>个人介绍</h1>
          <div class="actions">
            <router-link v-if="!viewingUserId" to="/profile" class="glass-button">编辑信息</router-link>
            <button @click="handleLogout" class="glass-button">退出登录</button>
          </div>
        </div>
      
        <div v-if="isLoading" class="loading">
          <p>用户信息加载中...</p>
        </div>
        <div v-else-if="displayedUser?.profile" class="profile-content">
          <!-- 查看他人资料时显示提示 -->
          <div v-if="viewingUserId" class="viewing-notice">
            <p>您正在查看其他用户的资料，无法进行编辑</p>
            <button @click="returnToOwnProfile" class="glass-button small secondary">
              返回自己的资料
            </button>
          </div>
          
          <div class="avatar-section">
            <img
              :src="resolveAvatarUrl(displayedUser, displayedUser.avatar || displayedUser.profile?.avatar)"
              alt="头像" 
              class="avatar"
              @error="applyAvatarFallback($event, displayedUser)"
            />
          </div>
          
          <div class="info-section">
            <h2 class="name">{{ displayedUser.profile.name }}</h2>
            
            <div class="info-item" v-if="displayedUser.profile.hometown">
              <span class="label">家乡：</span>
              <span class="value">{{ displayedUser.profile.hometown }}</span>
            </div>
            
            <div class="info-item" v-if="displayedUser.profile.phone">
              <span class="label">手机：</span>
              <span class="value">{{ displayedUser.profile.phone }}</span>
            </div>
            
            <div class="info-item" v-if="displayedUser.profile.birthday">
              <span class="label">生日：</span>
              <span class="value">{{ formatDate(displayedUser.profile.birthday) }}</span>
            </div>
            
            <div class="info-item" v-if="displayedUser.profile.hobbies && displayedUser.profile.hobbies.length > 0">
              <span class="label">爱好：</span>
              <span class="value">
                <span 
                  v-for="(hobby, index) in displayedUser.profile.hobbies" 
                  :key="index" 
                  class="hobby-tag"
                >
                  {{ hobby }}
                </span>
              </span>
            </div>
            
            <div class="info-item" v-if="displayedUser.profile.bio">
              <span class="label">简介：</span>
              <span class="value bio">{{ displayedUser.profile.bio }}</span>
            </div>
          </div>
        </div>
      
        <div v-else class="empty-state">
          <p>无法加载用户信息</p>
          <router-link v-if="!viewingUserId" to="/profile" class="glass-button">立即设置</router-link>
        </div>
      </div>
      
      <!-- 功能入口 -->
      <div class="glass-card">
        <h3>功能导航</h3>
        <div class="function-links">
          <router-link to="/photo-wall" class="function-link">
            <span class="link-icon">🖼️</span>
            <span class="link-text">照片墙</span>
          </router-link>
          <router-link to="/search" class="function-link">
            <span class="link-icon">🔍</span>
            <span class="link-text">用户搜索</span>
          </router-link>
        </div>
      </div>
      
      <!-- 留言板 -->
      <MessageBoard />
      
      <!-- 管理员功能 -->
      <div v-if="userStore.user?.role === 'admin'" class="glass-card">
        <h3>管理员功能</h3>
        <div class="admin-links">
          <router-link to="/user-management" class="admin-link">
            <span class="link-icon">👥</span>
            <span class="link-text">用户管理</span>
          </router-link>
          <router-link to="/classes" class="admin-link">
            <span class="link-icon">📚</span>
            <span class="link-text">班级管理</span>
          </router-link>
          <router-link to="/synonym-management" class="admin-link">
            <span class="link-icon">📝</span>
            <span class="link-text">同义词管理</span>
          </router-link>
        </div>
      </div>
      

    </div>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import Message from '../components/Message.vue'
import SocialLinks from '../components/SocialLinks.vue'
import MessageBoard from '../components/MessageBoard.vue'
import { applyAvatarFallback, resolveAvatarUrl } from '../utils/avatar'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 侧边栏显示状态
const isSidebarVisible = ref(false)
let sidebarTimeout = null

// 获取查看中的用户ID（如果有）
const viewingUserId = computed(() => route.query.userId)

// 显示的用户信息
const displayedUser = ref(null)

// 是否正在加载数据
const isLoading = ref(false)

// 获取其他用户信息
const otherUsers = computed(() => userStore.otherUsers)

// 加载用户数据
const loadUserData = async () => {
  if (!userStore.isAuthenticated) return
  
  isLoading.value = true
  
  try {
    if (viewingUserId.value) {
      // 加载指定用户的信息
      displayedUser.value = await userStore.fetchUserById(viewingUserId.value)
    } else {
      // 加载当前用户的信息
      displayedUser.value = userStore.user
    }
    
    // 加载其他用户列表
    await userStore.fetchOtherUsers()
  } catch (error) {
    console.error('加载用户数据失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 查看其他用户的个人资料
const viewUserProfile = (email) => {
  router.push({ path: '/home', query: { userId: email } })
}

// 返回查看自己的资料
const returnToOwnProfile = () => {
  router.push('/home')
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

// 监听路由变化，重新加载数据
watch(viewingUserId, () => {
  loadUserData()
})

// 组件挂载时加载数据
onMounted(async () => {
  await loadUserData()
})

// 显示侧边栏
const showSidebar = () => {
  if (sidebarTimeout) {
    clearTimeout(sidebarTimeout)
  }
  isSidebarVisible.value = true
}

// 隐藏侧边栏
const hideSidebar = () => {
  sidebarTimeout = setTimeout(() => {
    isSidebarVisible.value = false
  }, 300)
}

// 手机没有 hover，用显式按钮开关侧栏。
const toggleSidebar = () => {
  if (sidebarTimeout) {
    clearTimeout(sidebarTimeout)
  }
  isSidebarVisible.value = !isSidebarVisible.value
}

// 监听用户登录状态变化
watch(() => userStore.isAuthenticated, () => {
  loadUserData()
})
</script>

<style scoped>
.home {
  display: flex;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.left {
  width: 35%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.right {
  width: 65%;
  height: 100%;
  overflow-y: auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.glass-card {
  border-radius: 6px;
  background-color: #00000040;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  color: #fff;
  transition: transform 0.3s;
}

.glass-card:hover {
  transform: scale(1.01);
}

.glass-card h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  font-weight: 600;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.glass-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 0.5rem 1rem;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
  display: inline-block;
  font-size: 0.9rem;
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.glass-button.small {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

.glass-button.secondary {
  background: rgba(255, 255, 255, 0.05);
}

.loading {
  text-align: center;
  padding: 1rem;
}

.viewing-notice {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
  text-align: center;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.avatar-section {
  display: flex;
  justify-content: center;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: bold;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.name {
  font-size: 1.8rem;
  font-weight: bold;
  text-align: center;
  margin: 0;
}

.info-item {
  display: flex;
  gap: 0.5rem;
}

.label {
  font-weight: bold;
  min-width: 60px;
}

.value {
  flex: 1;
}

.hobby-tag {
  display: inline-block;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
}

.function-links, .admin-links {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.function-link, .admin-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 0.75rem 1rem;
  color: #fff;
  text-decoration: none;
  transition: all 0.3s;
  flex: 1;
  min-width: 150px;
}

.function-link:hover, .admin-link:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.link-icon {
  font-size: 1.2rem;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.user-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(5px);
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-avatar .avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.1);
}

.user-info {
  flex: 1;
}

.user-info h4 {
  margin: 0 0 0.25rem 0;
}

.user-email {
  margin: 0 0 0.25rem 0;
  font-size: 0.8rem;
  opacity: 0.7;
}

.role {
  margin: 0;
  font-size: 0.8rem;
}

.no-users {
  text-align: center;
  padding: 1rem;
  opacity: 0.7;
}

/* 侧边栏样式 */
.users-sidebar {
  position: fixed;
  left: -280px;
  top: 60px;
  width: 280px;
  height: calc(100vh - 60px);
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 2px 0 15px rgba(0, 0, 0, 0.3);
  transition: left 0.3s ease;
  z-index: 1000;
  overflow-y: auto;
}

.users-sidebar.is-visible {
  left: 0;
}

.sidebar-content {
  padding: 1.5rem;
  color: #fff;
}

.sidebar-content h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;
}

.sidebar-trigger {
  position: fixed;
  left: 0;
  top: 60px;
  width: 15px;
  height: calc(100vh - 60px);
  z-index: 999;
  cursor: pointer;
  background: transparent;
}

.sidebar-trigger:hover {
  background: rgba(255, 255, 255, 0.05);
}

.mobile-sidebar-button {
  display: none;
}

/* 侧边栏中的用户列表样式调整 */
.users-sidebar .users-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  width: 100%;
  overflow: hidden;
}

.users-sidebar .user-item {
  display: flex;
  gap: 1rem;
  padding: 0.8rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  box-sizing: border-box;
}

.users-sidebar .user-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(5px);
}

.users-sidebar .user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.users-sidebar .avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.users-sidebar .user-avatar .avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.1);
}

.users-sidebar .user-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.users-sidebar .user-info h4 {
  margin: 0 0 0.2rem 0;
  font-size: 0.9rem;
}

.users-sidebar .user-email {
  margin: 0 0 0.2rem 0;
  font-size: 0.7rem;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.users-sidebar .role {
  margin: 0;
  font-size: 0.7rem;
}

.users-sidebar .loading {
  text-align: center;
  padding: 1rem;
}

.users-sidebar .no-users {
  text-align: center;
  padding: 1rem;
  opacity: 0.7;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .home {
    display: block;
    height: auto;
    min-height: 100vh;
    min-height: 100dvh;
    overflow: visible;
    padding-bottom: calc(1rem + env(safe-area-inset-bottom));
  }
  
  .left, .right {
    width: 100%;
    height: auto;
  }
  
  .right {
    height: auto;
    overflow-y: visible;
  }
}

@media (max-width: 768px) {
  .left {
    min-height: 0;
    justify-content: flex-start;
  }

  .left, .right {
    padding: 1rem;
  }
  
  .function-links, .admin-links {
    flex-direction: column;
  }
  
  .function-link, .admin-link {
    min-width: auto;
    min-height: 56px;
    justify-content: center;
    touch-action: manipulation;
  }

  .function-link:active, .admin-link:active {
    background: rgba(255, 255, 255, 0.24);
    transform: scale(0.98);
  }

  .glass-card:hover {
    transform: none;
  }

  .mobile-sidebar-button {
    position: fixed;
    top: calc(12px + env(safe-area-inset-top));
    left: 12px;
    z-index: 1001;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid rgba(186, 230, 253, 0.36);
    border-radius: 999px;
    color: #fff;
    background: rgba(8, 47, 73, 0.82);
    box-shadow: 0 8px 20px rgba(2, 6, 23, 0.34);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    font: inherit;
    font-size: 14px;
    touch-action: manipulation;
  }

  .sidebar-trigger {
    display: none;
  }

  .users-sidebar {
    top: 0;
    width: min(86vw, 320px);
    height: 100dvh;
    left: 0;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    padding-top: calc(52px + env(safe-area-inset-top));
  }

  .users-sidebar.is-visible {
    left: 0;
    transform: translateX(0);
  }
}
</style>
