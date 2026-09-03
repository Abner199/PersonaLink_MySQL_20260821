<template>
  <div ref="photoWallElement" class="photo-wall-container">
    <div class="glass-card">
      <div class="header-section">
        <div class="header-left">
          <button @click="goBack" class="back-button">
            <span class="back-icon">←</span>
            返回
          </button>
          <h2>班级照片墙</h2>
        </div>
        <div class="filter-controls">
          <select v-if="isAdmin" v-model="selectedClassId" class="glass-input" @change="loadPhotoWall">
            <option 
              v-for="option in classOptions" 
              :key="option.value" 
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          <div v-else class="class-chip">{{ currentClassName }}</div>
          <button @click="refreshData" class="refresh-button" :disabled="isLoading">
            <span class="refresh-icon" :class="{ rotating: isLoading }">🔄</span>
            {{ isLoading ? '加载中...' : '刷新' }}
          </button>
        </div>
      </div>
      
      <div v-if="isLoading && (!filteredUsers || filteredUsers.length === 0)" class="loading-container">
        <div class="loading-spinner"></div>
        <p>正在加载用户数据...</p>
      </div>
      
      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button @click="refreshData" class="glass-button small">重试</button>
      </div>
      
      <div v-else-if="!filteredUsers || filteredUsers.length === 0" class="empty-state">
        <p>暂无用户数据</p>
      </div>
      
      <WaterfallLayout v-else :items="filteredUsers" class="photo-wall">
        <template #item="{ item }">
          <UserCard :user="item" />
        </template>
      </WaterfallLayout>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useClassStore } from '../stores/class'
import { photoWallService } from '../utils/api'
import { useOptimizedAnimations } from '../composables/useOptimizedAnimations'
import WaterfallLayout from '../components/WaterfallLayout.vue'
import UserCard from '../components/UserCard.vue'

const userStore = useUserStore()
const classStore = useClassStore()
const router = useRouter()
const photoWallElement = ref(null)
const photoWallUsers = ref([])
const selectedClassId = ref('')
const isLoadingWall = ref(false)
const wallError = ref('')

// 使用优化的动画
const { animateOnScroll } = useOptimizedAnimations()

// 初始化数据
onMounted(async () => {
  await classStore.fetchClasses()
  selectedClassId.value = userStore.user?.classId || ''
  await loadPhotoWall()
  
  // 初始化动画
  nextTick(() => {
    if (photoWallElement.value) {
      animateOnScroll(photoWallElement.value)
    }
  })
})

// 计算属性
const isLoading = computed(() => isLoadingWall.value)
const error = computed(() => wallError.value)
const isAdmin = computed(() => userStore.user?.role === 'admin' || userStore.user?.isAdmin)
const filteredUsers = computed(() => photoWallUsers.value)
const currentClassName = computed(() => classStore.classes.find(item => item.id === userStore.user?.classId)?.name || '未分配班级')
const classOptions = computed(() => {
  const options = [{ value: '', label: '全部班级' }]
  classStore.classes.forEach(cls => {
    options.push({ value: cls.id, label: cls.name })
  })
  return options
})
const loadPhotoWall = async () => {
  const classId = isAdmin.value ? selectedClassId.value : userStore.user?.classId
  if (!classId && !isAdmin.value) {
    photoWallUsers.value = []
    wallError.value = '当前用户尚未分配班级'
    return
  }
  isLoadingWall.value = true
  wallError.value = ''
  try {
    const response = classId
      ? await photoWallService.getClassPhotoWall(classId)
      : await photoWallService.getAllPhotoWall()
    photoWallUsers.value = response.data || []
  } catch (error) {
    photoWallUsers.value = []
    wallError.value = error.message || '加载照片墙失败'
  } finally {
    isLoadingWall.value = false
  }
}

const refreshData = async () => {
  await classStore.fetchClasses()
  await loadPhotoWall()
}

// 回退功能
const goBack = () => {
  router.push('/home')
}
</script>

<style scoped>
.photo-wall-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  padding: 0;
  z-index: 1;
  overflow: hidden;
  background:
    radial-gradient(circle at 12% 0%, rgba(14, 116, 144, 0.2), transparent 38%),
    radial-gradient(circle at 88% 12%, rgba(59, 130, 246, 0.14), transparent 34%),
    linear-gradient(145deg, rgba(5, 12, 24, 0.9), rgba(15, 23, 42, 0.86) 52%, rgba(9, 35, 41, 0.86));
}

.glass-card {
  background: rgba(8, 15, 28, 0.38);
  backdrop-filter: blur(24px) saturate(120%);
  -webkit-backdrop-filter: blur(24px) saturate(120%);
  border-radius: 0;
  padding: clamp(12px, 2vw, 28px);
  border: none;
  box-shadow: none;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  margin: 0;
  will-change: transform;
  transform: translateZ(0);
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 确保glass-card本身不滚动 */
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-button {
  background: rgba(15, 23, 42, 0.66);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 12px;
  padding: 8px 16px;
  color: white;
  font-size: 14px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  will-change: transform;
  transform: translateZ(0);
}

.back-button:hover {
  background: rgba(30, 41, 59, 0.88);
  border-color: rgba(125, 211, 252, 0.5);
  transform: translate3d(0, -1px, 0);
}

.back-button:active {
  transform: translate3d(0, 0, 0);
}

.back-icon {
  font-size: 16px;
  font-weight: bold;
}

h2 {
  color: white;
  margin: 0;
  font-size: 28px;
  font-weight: 650;
  letter-spacing: 0.02em;
}

.filter-controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.glass-input {
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 12px;
  padding: 10px 15px;
  color: white;
  font-size: 14px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  min-width: 150px;
}

.class-chip {
  padding: 10px 15px;
  color: rgba(224, 242, 254, 0.95);
  border: 1px solid rgba(125, 211, 252, 0.25);
  border-radius: 12px;
  background: rgba(8, 47, 73, 0.42);
  font-size: 14px;
}

/* 修复下拉菜单选项的显示问题 */
.glass-input option {
  background: rgba(0, 0, 0, 0.8);
  color: white;
}

/* 确保下拉菜单在展开时文字可见 */
.glass-input:focus {
  color: white;
}

.glass-input:focus {
  outline: none;
  border-color: rgba(125, 211, 252, 0.64);
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
}

.refresh-button {
  background: linear-gradient(135deg, rgba(14, 116, 144, 0.78), rgba(30, 64, 175, 0.68));
  border: 1px solid rgba(125, 211, 252, 0.24);
  border-radius: 12px;
  padding: 8px 16px;
  color: white;
  font-size: 14px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 80px;
  justify-content: center;
  will-change: transform;
  transform: translateZ(0);
}

.refresh-button:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(8, 145, 178, 0.9), rgba(37, 99, 235, 0.82));
  border-color: rgba(186, 230, 253, 0.48);
  transform: translate3d(0, -1px, 0);
}

.refresh-button:active:not(:disabled) {
  transform: translate3d(0, 0, 0);
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.refresh-icon {
  font-size: 14px;
  transition: transform 0.3s ease;
  will-change: transform;
}

.refresh-icon.rotating {
  animation: rotate 1s linear infinite;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
  margin-bottom: 15px;
  will-change: transform;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 50px 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 18px;
}

.photo-wall {
  flex: 1;
  min-height: 0;
  margin: 0;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  height: 100%;
  padding: 0;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.16), rgba(2, 6, 23, 0.08));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);
}

@media (max-width: 768px) {
  .glass-card {
    padding: 10px;
  }

  .header-section {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    margin-bottom: 10px;
  }

  .header-left {
    justify-content: space-between;
    gap: 10px;
  }

  h2 {
    font-size: 21px;
  }
  
  .filter-controls {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
  }
  
  .glass-input {
    width: 100%;
    min-width: 0;
  }

  .photo-wall {
    border-radius: 14px;
  }
}

@media (max-width: 420px) {
  .back-button,
  .refresh-button {
    padding: 8px 12px;
  }

  h2 {
    font-size: 18px;
  }
}
</style>
