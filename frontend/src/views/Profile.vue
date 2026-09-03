<template>
  <div class="profile-container">
    <div class="main-content">
      <div ref="profileCardElement" class="glass-card">
        <h2>个人信息</h2>
        <form @submit.prevent="handleSave" class="profile-form">
          <div class="avatar-section">
            <div class="avatar-preview">
              <img v-if="form.avatar" :src="form.avatar" alt="头像" class="avatar-image" />
              <div v-else class="avatar-placeholder">
                <span>上传照片</span>
              </div>
            </div>
            <input
              type="file" 
              accept="image/*"
              @change="handleAvatarUpload"
              class="avatar-input"
              id="avatar-input"
            />
            <label for="avatar-input" class="avatar-label">选择照片</label>
          </div>
          
          <div class="form-group">
            <input
              v-model="form.name"
              type="text"
              placeholder="姓名"
              required
              class="glass-input"
            />
          </div>
          
          <div class="form-group">
            <input
              v-model="form.hometown"
              type="text"
              placeholder="家乡"
              class="glass-input"
            />
          </div>
          
          <div class="form-group">
            <input
              v-model="form.phone"
              type="tel"
              placeholder="手机号码"
              class="glass-input"
            />
          </div>
          
          <div class="form-group">
            <input
              v-model="form.birthday"
              type="date"
              placeholder="生日"
              class="glass-input"
            />
          </div>
          
          <div class="form-group">
            <input
              v-model="form.hobbies"
              type="text"
              placeholder="爱好（用逗号分隔）"
              class="glass-input"
            />
          </div>
          
          <div class="form-group">
            <textarea
              v-model="form.bio"
              placeholder="个人简介"
              rows="4"
              class="glass-textarea"
            ></textarea>
          </div>
          
          <div class="form-group">
            <select
              v-model="form.classId"
              class="glass-input"
            >
              <option value="">请选择班级（可选）</option>
              <option v-for="banji in classes" :key="banji.id" :value="banji.id">
                {{ banji.name }}
              </option>
            </select>
          </div>
          
          <div v-if="successMessage" class="success-message">
            {{ successMessage }}
          </div>
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
          
          <div class="form-actions">
            <button type="submit" class="glass-button primary" :disabled="isLoading">
              {{ isLoading ? '保存中...' : '保存信息' }}
            </button>
            <router-link to="/home" class="glass-button secondary" :disabled="isLoading">返回首页</router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useClassStore } from '../stores/class'
import { useOptimizedAnimations } from '../composables/useOptimizedAnimations'
import { isPlaceholderAvatar } from '../utils/avatar'

const router = useRouter()
const userStore = useUserStore()
const classStore = useClassStore()
const profileCardElement = ref(null)

// 使用优化的动画
const { animateOnScroll } = useOptimizedAnimations()

const form = ref({
  name: '',
  avatar: '',
  hometown: '',
  phone: '',
  birthday: '',
  hobbies: '',
  bio: '',
  classId: ''
})

const MAX_AVATAR_SOURCE_SIZE = 10 * 1024 * 1024
const AVATAR_OUTPUT_SIZE = 512
const AVATAR_JPEG_QUALITY = 0.86

const isLoading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const classes = ref([])

onMounted(async () => {
  // 获取班级列表
  try {
    const classesData = await classStore.fetchClasses()
    classes.value = classesData
  } catch (error) {
    console.error('获取班级列表失败:', error)
  }
  
  // 填充表单数据
  if (userStore.user?.profile) {
    form.value = { ...userStore.user.profile }
  }
  if (userStore.user?.name) {
    form.value.name = userStore.user.name
  }
  // 只有当用户有班级ID时才设置classId，否则保持为空字符串以显示默认提示
  if (userStore.user?.classId) {
    form.value.classId = userStore.user.classId
  } else {
    form.value.classId = '' // 确保为空字符串以显示默认提示
  }
  // 确保头像字段正确获取
  const savedAvatar = userStore.user?.avatar || form.value.avatar || ''
  // 旧示例数据使用外网随机图；离线环境不再把它当成有效头像。
  form.value.avatar = isPlaceholderAvatar(savedAvatar) ? '' : savedAvatar
  
  // 初始化动画
  nextTick(() => {
    if (profileCardElement.value) {
      animateOnScroll(profileCardElement.value)
    }
  })
})

const handleAvatarUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  errorMessage.value = ''
  if (!file.type.startsWith('image/')) {
    errorMessage.value = '请选择 JPG、PNG、WebP 等图片文件'
    event.target.value = ''
    return
  }

  if (file.size > MAX_AVATAR_SOURCE_SIZE) {
    errorMessage.value = '原始图片不能超过 10 MB，请先压缩后再上传'
    event.target.value = ''
    return
  }

  const objectUrl = URL.createObjectURL(file)
  const image = new Image()

  image.onload = () => {
    const sourceSize = Math.min(image.naturalWidth, image.naturalHeight)
    const sourceX = (image.naturalWidth - sourceSize) / 2
    const sourceY = (image.naturalHeight - sourceSize) / 2
    const canvas = document.createElement('canvas')
    canvas.width = AVATAR_OUTPUT_SIZE
    canvas.height = AVATAR_OUTPUT_SIZE

    const context = canvas.getContext('2d')
    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      AVATAR_OUTPUT_SIZE,
      AVATAR_OUTPUT_SIZE
    )
    form.value.avatar = canvas.toDataURL('image/jpeg', AVATAR_JPEG_QUALITY)
    URL.revokeObjectURL(objectUrl)
    event.target.value = ''
  }

  image.onerror = () => {
    URL.revokeObjectURL(objectUrl)
    errorMessage.value = '图片读取失败，请更换文件后重试'
    event.target.value = ''
  }

  image.src = objectUrl
}

const handleSave = async () => {
  isLoading.value = true
  successMessage.value = ''
  errorMessage.value = ''
  
  try {
    // 处理爱好数据
    let hobbiesArray = []
    if (Array.isArray(form.value.hobbies)) {
      hobbiesArray = form.value.hobbies
    } else if (typeof form.value.hobbies === 'string') {
      hobbiesArray = form.value.hobbies.split(',').map(hobby => hobby.trim()).filter(Boolean)
    } else {
      hobbiesArray = []
    }
    
    const profileData = {
      ...form.value,
      hobbies: hobbiesArray
    }
    
    // 提取班级ID和头像单独传递
    const { classId, avatar, ...profileOnly } = profileData
    
    // 调用后端API更新用户资料，包含头像
    await userStore.updateUserProfile(profileOnly, classId, avatar)
    
    // 显示成功消息
    successMessage.value = '个人资料保存成功！'
    
    // 延迟跳转到首页
    setTimeout(() => {
      router.push('/home')
    }, 1500)
  } catch (error) {
    // 显示错误消息
    errorMessage.value = error.message || '保存失败，请稍后重试'
    console.error('保存个人资料失败:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  display: flex;
  align-items: center;       /* 垂直居中 */
  justify-content: center;   /* 水平居中 */
  padding: 20px;            /* 留一点安全边距 */
}

.main-content {
  flex: 1;
  display: flex;
  justify-content: center;
}

.sidebar {
  width: 350px;
  flex-shrink: 0;
  position: sticky;
  top: 20px;
  align-self: flex-start;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
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
  max-width: 500px;
  will-change: transform;
  transform: translateZ(0);
}

h2 {
  text-align: center;
  color: white;
  margin-bottom: 30px;
  font-size: 28px;
  font-weight: 600;
}

.avatar-section {
  text-align: center;
  margin-bottom: 30px;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin: 0 auto 15px;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.avatar-image {
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
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.avatar-input {
  display: none;
}

.avatar-label {
  display: inline-block;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.avatar-label:hover {
  background: rgba(255, 255, 255, 0.3);
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.glass-input,
.glass-textarea {
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

.glass-textarea {
  resize: vertical;
  min-height: 100px;
}

.glass-input::placeholder,
.glass-textarea::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.glass-input:focus,
.glass-textarea:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.15);
}

/* 修复下拉框选项样式 */
.glass-input option {
  background: #333;
  color: white;
  padding: 10px;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.glass-button {
  flex: 1;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  padding: 15px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  text-decoration: none;
  text-align: center;
  will-change: transform;
  transform: translateZ(0);
}

.glass-button.primary {
  background: rgba(76, 175, 80, 0.3);
  border-color: rgba(76, 175, 80, 0.5);
}

.glass-button.secondary {
  background: rgba(156, 39, 176, 0.3);
  border-color: rgba(156, 39, 176, 0.5);
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translate3d(0, -2px, 0);
}

/* 其他用户展示区域样式 */
.users-list {
  max-height: 600px;
  overflow-y: auto;
}

.user-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 12px;
  align-items: flex-start;
  transition: all 0.3s ease;
  will-change: transform;
  transform: translateZ(0);
}

.user-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translate3d(0, -2px, 0);
}

.user-avatar {
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .profile-container {
    padding: 10px;
  }
  
  .glass-card {
    padding: 25px;
  }
}
</style>
