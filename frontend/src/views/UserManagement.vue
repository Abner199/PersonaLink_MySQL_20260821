<template>
  <div class="user-management-container">
    <div class="main-content">
      <div class="glass-card">
        <div class="header-section">
          <button @click="goBack" class="back-button">
            <span class="back-icon">←</span>
            <span>返回</span>
          </button>
          <h2>用户管理</h2>
        </div>

        <section class="create-user-section">
          <div>
            <h3>添加用户</h3>
            <p>新建用户的初始密码为 <strong>123456</strong>。</p>
          </div>
          <form class="create-user-form" @submit.prevent="createUser">
            <input v-model.trim="newUser.name" required class="glass-input" placeholder="姓名" />
            <input v-model.trim="newUser.email" required type="email" class="glass-input" placeholder="邮箱" />
            <select v-model="newUser.classId" required class="glass-input">
              <option value="" disabled>选择班级</option>
              <option v-for="banji in classes" :key="banji.id" :value="banji.id">{{ banji.name }}</option>
            </select>
            <button class="glass-button primary" :disabled="isCreating" type="submit">
              {{ isCreating ? '添加中...' : '添加用户' }}
            </button>
          </form>
        </section>

        <section class="password-section">
          <div>
            <h3>修改管理员密码</h3>
            <p>修改后会立即生效，请妥善保存新密码。</p>
          </div>
          <form class="password-form" @submit.prevent="changePassword">
            <input v-model="passwordForm.currentPassword" required type="password" class="glass-input" placeholder="当前密码" autocomplete="current-password" />
            <input v-model="passwordForm.newPassword" required minlength="8" type="password" class="glass-input" placeholder="新密码（至少 8 位）" autocomplete="new-password" />
            <input v-model="passwordForm.confirmPassword" required minlength="8" type="password" class="glass-input" placeholder="再输入一次新密码" autocomplete="new-password" />
            <button class="glass-button secondary" :disabled="isChangingPassword" type="submit">
              {{ isChangingPassword ? '修改中...' : '修改密码' }}
            </button>
          </form>
        </section>
        
        <!-- 班级筛选和搜索区域 -->
        <div class="filter-section">
          <h3>筛选和搜索</h3>
          <div class="filter-controls">
            <div class="form-group">
              <select v-model="selectedClassId" class="glass-input">
                <option value="">所有班级</option>
                <option 
                  v-for="banji in classes" 
                  :key="banji.id" 
                  :value="banji.id"
                >
                  {{ banji.name }}
                </option>
              </select>
            </div>
            <div class="form-group search-group">
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="搜索用户名或邮箱..." 
                class="glass-input search-input"
              />
              <button 
                v-if="searchQuery" 
                @click="clearSearch" 
                class="clear-search-btn"
                title="清除搜索"
              >
                ✕
              </button>
            </div>
            <button @click="resetFilters" class="glass-button secondary">
              重置筛选
            </button>
          </div>
        </div>
        
        <!-- 用户列表 -->
        <div class="users-list-section">
          <h3>用户列表</h3>
          <div v-if="isLoading" class="loading">加载中...</div>
          <div v-else-if="filteredUsers.length === 0" class="empty-state">暂无用户</div>
          <div v-else class="users-grid">
            <div v-for="user in filteredUsers" :key="user.email" class="user-card">
              <div class="user-header">
                <div class="user-avatar">
                  <img
                    :src="resolveAvatarUrl(user)"
                    alt="头像"
                    @error="applyAvatarFallback($event, user)"
                  />
                </div>
                <div class="user-info">
                  <h4>{{ user.name || '匿名用户' }}</h4>
                  <p class="user-email">{{ user.email }}</p>
                  <p v-if="user.className" class="user-class">班级: {{ user.className }}</p>
                  <p v-if="user.role === 'admin'" class="user-role">👑 管理员</p>
                </div>
              </div>
              <div class="user-actions">
                <button @click="viewUserDetail(user.email)" class="glass-button small">查看详情</button>
                <button @click="resetPassword(user)" class="glass-button small warning" :disabled="user.role === 'admin'">重置密码</button>
                <button 
                  @click="confirmDeleteUser(user)" 
                  class="glass-button small danger"
                  :disabled="user.role === 'admin'"
                >
                  删除用户
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 删除确认模态框 -->
        <div v-if="deletingUser" class="modal-overlay" @click="closeDeleteModal">
          <div class="modal-content" @click.stop>
            <h3>确认删除</h3>
            <p>确定要删除用户 <strong>{{ deletingUser.name || deletingUser.email }}</strong> 吗？</p>
            <p class="warning-text">此操作不可恢复！</p>
            <div class="modal-actions">
              <button @click="deleteUser" class="glass-button danger" :disabled="isDeleting">
                {{ isDeleting ? '删除中...' : '确认删除' }}
              </button>
              <button @click="closeDeleteModal" class="glass-button secondary">取消</button>
            </div>
          </div>
        </div>
        
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </div>
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

const isLoading = ref(false)
const isDeleting = ref(false)
const isCreating = ref(false)
const isChangingPassword = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const selectedClassId = ref('')
const searchQuery = ref('')
const deletingUser = ref(null)
const newUser = ref({ name: '', email: '', classId: '' })
const passwordForm = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })

// 计算属性
const classes = computed(() => classStore.classes)
const users = computed(() => userStore.otherUsers)
const filteredUsers = computed(() => {
  let result = users.value
  
  // 班级筛选
  if (selectedClassId.value) {
    result = result.filter(user => user.classId === selectedClassId.value)
  }
  
  // 搜索筛选
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(user => {
      return (
        (user.name && user.name.toLowerCase().includes(query)) ||
        (user.email && user.email.toLowerCase().includes(query))
      )
    })
  }
  
  return result
})

onMounted(async () => {
  await Promise.all([
    classStore.fetchClasses(),
    userStore.fetchOtherUsers()
  ])
})

const resetFilter = () => {
  selectedClassId.value = ''
}

const clearSearch = () => {
  searchQuery.value = ''
}

const resetFilters = () => {
  selectedClassId.value = ''
  searchQuery.value = ''
}

const goBack = () => {
  router.push('/home')
}

const createUser = async () => {
  isCreating.value = true
  successMessage.value = ''
  errorMessage.value = ''
  try {
    await userStore.createUserByAdmin(newUser.value)
    newUser.value = { name: '', email: '', classId: '' }
    successMessage.value = '用户已添加，初始密码为 123456'
  } catch (error) {
    errorMessage.value = error.message || '添加用户失败'
  } finally {
    isCreating.value = false
  }
}

const resetPassword = async (user) => {
  if (!confirm(`确认将 ${user.name || user.email} 的密码重置为 123456 吗？`)) return
  successMessage.value = ''
  errorMessage.value = ''
  try {
    await userStore.resetUserPassword(user.email)
    successMessage.value = `${user.name || user.email} 的密码已重置为 123456`
  } catch (error) {
    errorMessage.value = error.message || '重置密码失败'
  }
}

const changePassword = async () => {
  successMessage.value = ''
  errorMessage.value = ''
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    errorMessage.value = '两次输入的新密码不一致'
    return
  }
  isChangingPassword.value = true
  try {
    await userStore.changeAdminPassword(passwordForm.value)
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    successMessage.value = '管理员密码已修改，当前页面可继续使用'
  } catch (error) {
    errorMessage.value = error.message || '修改密码失败'
  } finally {
    isChangingPassword.value = false
  }
}

const viewUserDetail = async (email) => {
  // 跳转到用户详情页面
  router.push(`/user/${email}`)
}

const confirmDeleteUser = (user) => {
  if (user.role === 'admin') {
    errorMessage.value = '不能删除管理员用户'
    return
  }
  deletingUser.value = user
}

const closeDeleteModal = () => {
  deletingUser.value = null
}

const deleteUser = async () => {
  if (!deletingUser.value) return
  
  isDeleting.value = true
  try {
    await userStore.deleteUser(deletingUser.value.email)
    successMessage.value = '用户删除成功'
    deletingUser.value = null
  } catch (error) {
    errorMessage.value = '删除用户失败'
    console.error('删除用户失败:', error)
  } finally {
    isDeleting.value = false
  }
}


</script>

<style scoped>
.user-management-container {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20px;
  padding-top: 60px; /* 增加顶部内边距，确保返回按钮可见 */
}

.main-content {
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 1200px;
  width: 100%;
}

.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 40px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 100%;
}

h2, h3 {
  color: white;
  margin-bottom: 20px;
}

h2 {
  text-align: center;
  font-size: 28px;
  font-weight: 600;
  margin: 0;
}

h3 {
  font-size: 22px;
  font-weight: 500;
}

.header-section {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 30px;
}

.back-button {
  position: absolute;
  left: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 10px 16px;
  color: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.back-icon {
  font-size: 18px;
  font-weight: bold;
}

.filter-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.create-user-section {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 18px;
  margin-bottom: 28px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.055);
}

.password-section {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 18px;
  margin-bottom: 28px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.055);
}

.password-section h3 { margin: 0 0 6px; }
.password-section p { margin: 0; color: rgba(255, 255, 255, 0.72); font-size: 14px; }
.password-form { display: grid; grid-template-columns: repeat(3, minmax(130px, 1fr)) auto; gap: 10px; flex: 1; max-width: 820px; }
.password-form .glass-input { padding: 11px 12px; }

.create-user-section h3 { margin: 0 0 6px; }
.create-user-section p { margin: 0; color: rgba(255, 255, 255, 0.72); font-size: 14px; }
.create-user-form { display: grid; grid-template-columns: repeat(3, minmax(130px, 1fr)) auto; gap: 10px; flex: 1; max-width: 720px; }
.create-user-form .glass-input { padding: 11px 12px; }
.glass-button.warning { background: rgba(245, 158, 11, 0.24); border-color: rgba(251, 191, 36, 0.45); }

@media (max-width: 900px) {
  .create-user-section, .password-section { align-items: stretch; flex-direction: column; }
  .create-user-form, .password-form { max-width: none; grid-template-columns: 1fr 1fr; }
}

@media (max-width: 560px) {
  .create-user-form, .password-form { grid-template-columns: 1fr; }
}

.filter-controls {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.form-group {
  flex: 1;
  max-width: 300px;
}

.search-group {
  position: relative;
  flex: 2;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding-right: 40px;
}

.clear-search-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  cursor: pointer;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.glass-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 15px;
  color: white;
  font-size: 16px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  font-family: inherit;
}

.glass-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.glass-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.15);
}

/* 确保select选项可见 */
.glass-input option {
  background: #333;
  color: white;
  padding: 10px;
}

.glass-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  padding: 12px 20px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  text-align: center;
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.glass-button.small {
  padding: 8px 15px;
  font-size: 14px;
}

.glass-button.danger {
  background: rgba(244, 67, 54, 0.3);
  border-color: rgba(244, 67, 54, 0.5);
}

.glass-button.primary {
  background: rgba(76, 175, 80, 0.3);
  border-color: rgba(76, 175, 80, 0.5);
}

.glass-button.secondary {
  background: rgba(156, 39, 176, 0.3);
  border-color: rgba(156, 39, 176, 0.5);
}

.glass-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.user-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.user-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}

.user-header {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.user-avatar {
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: bold;
}

.user-info {
  flex: 1;
}

.user-info h4 {
  margin: 0 0 5px 0;
  color: white;
}

.user-email, .user-class {
  margin: 3px 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.user-role {
  margin: 3px 0;
  color: #ffd700;
  font-size: 14px;
  font-weight: 500;
}

.user-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.loading, .empty-state {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  padding: 20px;
}

.success-message, .error-message {
  padding: 15px;
  border-radius: 10px;
  margin-top: 20px;
  text-align: center;
}

.success-message {
  background: rgba(76, 175, 80, 0.2);
  border: 1px solid rgba(76, 175, 80, 0.5);
  color: white;
}

.error-message {
  background: rgba(244, 67, 54, 0.2);
  border: 1px solid rgba(244, 67, 54, 0.5);
  color: white;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: rgba(30, 30, 50, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content.large {
  max-width: 800px;
}

.modal-content h3 {
  margin-top: 0;
  text-align: center;
}

.warning-text {
  color: rgba(244, 67, 54, 0.9);
  font-weight: 500;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 20px;
}

.user-detail {
  margin-top: 20px;
}

.user-detail-header {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.user-avatar-large {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.user-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-detail-info {
  flex: 1;
}

.user-detail-info h4 {
  margin: 0 0 5px 0;
  color: white;
  font-size: 20px;
}

.user-detail-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.detail-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 500;
}

.detail-value {
  color: white;
  font-size: 16px;
}

.detail-value.bio {
  white-space: pre-wrap;
  line-height: 1.5;
}

.hobbies-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hobby-tag {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  padding: 6px 12px;
  font-size: 14px;
  color: white;
}

@media (max-width: 768px) {
  .user-management-container {
    padding: 10px;
  }
  
  .glass-card {
    padding: 20px;
  }
  
  .users-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .form-group {
    max-width: none;
  }
  
  .user-detail-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}
</style>
