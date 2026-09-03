<template>
  <div class="search-container">
    <div class="header">
      <h1 class="title">用户搜索</h1>
      <div class="back-button" @click="goBack">
        <span class="back-icon">←</span> 返回
      </div>
    </div>

    <div class="search-form">
      <div class="search-input-group">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="输入关键词搜索..." 
          class="search-input glass-input"
          @keyup.enter="performSearch"
        >
        <button @click="performSearch" class="search-button glass-button">
          <span class="search-icon">🔍</span> 搜索
        </button>
      </div>

      <div class="search-options">
        <div class="option-group">
          <label>搜索类型：</label>
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" v-model="searchType" value="all" class="radio-input">
              <span>全部</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="searchType" value="hobby" class="radio-input">
              <span>爱好</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="searchType" value="hometown" class="radio-input">
              <span>家乡</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="searchType" value="name" class="radio-input">
              <span>姓名</span>
            </label>
          </div>
        </div>

        <div class="option-group">
          <label>搜索范围：</label>
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" v-model="searchScope" value="all" class="radio-input">
              <span>全站用户</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="searchScope" value="class" class="radio-input">
              <span>班级内</span>
            </label>
          </div>
          <select v-if="searchScope === 'class'" v-model="selectedClass" class="class-select glass-input">
            <option value="">选择班级</option>
            <option v-for="cls in classes" :key="cls.id" :value="cls.id">
              {{ cls.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading-indicator">
      <div class="loading-spinner"></div>
      <p>搜索中...</p>
    </div>

    <div v-else-if="searchResults.length > 0" class="search-results">
      <h2>搜索结果 ({{ searchResults.length }})</h2>
      <div class="results-grid">
        <div 
          v-for="user in searchResults" 
          :key="user.id" 
          class="user-result-card"
          @click="viewUserDetail(user.email)"
        >
          <div class="user-avatar">
            <img
              :src="resolveAvatarUrl(user)"
              :alt="user.name"
              @error="applyAvatarFallback($event, user)"
            >
          </div>
          <div class="user-info">
            <h3>{{ user.name }}</h3>
            <p v-if="user.hometown" class="user-detail">🏠 {{ user.hometown }}</p>
            <p v-if="user.hobby" class="user-detail">🎯 {{ user.hobby }}</p>
            <p v-if="user.className" class="user-detail">📚 {{ user.className }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="hasSearched" class="no-results">
      <p>未找到匹配的用户</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useClassStore } from '../stores/class'
import { applyAvatarFallback, resolveAvatarUrl } from '../utils/avatar'

const router = useRouter()
const userStore = useUserStore()
const classStore = useClassStore()

// 响应式数据
const searchQuery = ref('')
const searchType = ref('all')
const searchScope = ref('all')
const selectedClass = ref('')
const searchResults = ref([])
const isLoading = ref(false)
const hasSearched = ref(false)

// 计算属性
const classes = computed(() => classStore.classes)

// 方法
const goBack = () => {
  router.push('/home')
}

const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    return
  }

  isLoading.value = true
  hasSearched.value = true

  try {
    // 构建搜索参数
    const searchParams = {
      query: searchQuery.value,
      type: searchType.value,
      scope: searchScope.value,
      classId: selectedClass.value,
      includeSynonyms: true // 启用同义词搜索
    }

    // 调用搜索API
    const response = await userStore.searchUsers(searchParams)
    searchResults.value = response.data || []
  } catch (error) {
    console.error('搜索失败:', error)
    searchResults.value = []
  } finally {
    isLoading.value = false
  }
}

const viewUserDetail = (email) => {
  router.push(`/user/${email}`)
}

// 生命周期钩子
onMounted(() => {
  classStore.fetchClasses()
})
</script>

<style scoped>
.search-container {
  padding: 20px;
  padding-top: 60px; /* 增加顶部内边距，确保返回按钮可见 */
  max-width: 1200px;
  margin: 0 auto;
  color: white;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.title {
  font-size: 2.5rem;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.back-icon {
  font-size: 1.2rem;
}

.search-form {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 30px;
}

.search-input-group {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
}

.search-input {
  flex: 1;
  padding: 15px;
  font-size: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.search-button {
  padding: 15px 25px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.search-icon {
  font-size: 1.2rem;
}

.search-options {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
}

.option-group {
  flex: 1;
  min-width: 200px;
}

.option-group label {
  display: block;
  margin-bottom: 10px;
  font-weight: bold;
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.radio-input {
  margin: 0;
}

.class-select {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.class-select option {
  background: #333;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.search-results h2 {
  margin-bottom: 20px;
  font-size: 1.5rem;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.user-result-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.user-result-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.2);
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info h3 {
  margin: 0 0 10px 0;
  font-size: 1.2rem;
}

.user-detail {
  margin: 5px 0;
  font-size: 0.9rem;
  opacity: 0.8;
}

.no-results {
  text-align: center;
  padding: 40px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
}

/* 玻璃效果样式 */
.glass-input, .glass-button {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
}

.glass-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.glass-button {
  cursor: pointer;
  transition: all 0.3s ease;
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
