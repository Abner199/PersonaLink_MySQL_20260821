<template>
  <div class="register-container">
    <div class="glass-card">
      <h2>注册</h2>
      <form @submit.prevent="handleRegister" class="register-form">
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
            v-model="form.email"
            type="email"
            placeholder="邮箱"
            required
            class="glass-input"
          />
        </div>
        <div class="form-group">
          <input
            v-model="form.password"
            type="password"
            placeholder="密码"
            required
            class="glass-input"
          />
        </div>
        <div class="form-group">
          <input
            v-model="form.confirmPassword"
            type="password"
            placeholder="确认密码"
            required
            class="glass-input"
          />
        </div>
        <div class="form-group">
          <select
            v-model="form.classId"
            class="glass-input"
            required
          >
            <option value="" disabled>请选择班级</option>
            <option
              v-for="classInfo in classes"
              :key="classInfo.id"
              :value="classInfo.id"
            >
              {{ classInfo.name }}
            </option>
          </select>
        </div>
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <button type="submit" class="glass-button" :disabled="isLoading">
          {{ isLoading ? '注册中...' : '注册' }}
        </button>
      </form>
      <p class="switch-auth">
        已有账号？<router-link to="/login" class="auth-link">立即登录</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useClassStore } from '../stores/class'

const router = useRouter()
const userStore = useUserStore()
const classStore = useClassStore()

const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  classId: ''
})

const classes = ref([])
const errorMessage = ref('')
const isLoading = ref(false)

// 获取班级列表
const fetchClasses = async () => {
  try {
    const classesData = await classStore.fetchClasses()
    classes.value = classesData
  } catch (error) {
    console.error('获取班级列表失败:', error)
  }
}

onMounted(() => {
  fetchClasses()
})

const handleRegister = async () => {
  errorMessage.value = ''
  isLoading.value = true
  
  try {
    // 验证输入
    if (form.value.password !== form.value.confirmPassword) {
      errorMessage.value = '密码确认不一致'
      return
    }
    
    // 验证密码长度
    if (form.value.password.length < 6) {
      errorMessage.value = '密码长度至少为6位'
      return
    }

    if (!form.value.classId) {
      errorMessage.value = '请选择班级'
      return
    }
    
    // 调用后端API注册
    await userStore.register(form.value)
    
    // 注册成功后跳转到个人资料页
    router.push('/profile')
  } catch (error) {
    // 处理错误
    if (error.response?.status === 400) {
      errorMessage.value = error.response.data.message || '用户已存在'
    } else {
      errorMessage.value = '注册失败，请稍后重试'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
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
  max-width: 400px;
}

h2 {
  text-align: center;
  color: white;
  margin-bottom: 30px;
  font-size: 28px;
  font-weight: 600;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.glass-input {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 15px;
  color: white;
  font-size: 16px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* 为下拉列表选项添加深色背景 */
.glass-input option {
  background: #333;
  color: white;
}

.glass-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.glass-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.15);
}

.glass-button {
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
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.switch-auth {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 20px;
}

.auth-link {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-weight: 600;
}

.auth-link:hover {
  text-decoration: underline;
}
</style>
