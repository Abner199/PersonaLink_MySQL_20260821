<template>
  <div class="classes-container">
    <div class="main-content">
      <div class="glass-card">
        <div class="header-section">
          <button @click="goBack" class="back-button">
            <span class="back-icon">←</span>
            <span>返回</span>
          </button>
          <h2>班级管理</h2>
        </div>
        
        <!-- 创建班级表单 -->
        <div class="create-class-section">
          <h3>创建新班级</h3>
          <form @submit.prevent="handleCreateClass" class="class-form">
            <div class="form-group">
              <input
                v-model="newClass.name"
                type="text"
                placeholder="班级名称"
                required
                class="glass-input"
              />
            </div>
            <div class="form-group">
              <input
                v-model="newClass.description"
                type="text"
                placeholder="班级描述"
                class="glass-input"
              />
            </div>
            <div class="form-group">
              <input
                v-model="newClass.teacher"
                type="text"
                placeholder="班主任"
                class="glass-input"
              />
            </div>
            <button type="submit" class="glass-button primary" :disabled="isCreating">
              {{ isCreating ? '创建中...' : '创建班级' }}
            </button>
          </form>
        </div>
        
        <!-- 班级列表 -->
        <div class="classes-list-section">
          <h3>班级列表</h3>
          <div v-if="isLoading" class="loading">加载中...</div>
          <div v-else-if="classes.length === 0" class="empty-state">暂无班级</div>
          <div v-else class="classes-grid">
            <div v-for="banji in classes" :key="banji.id" class="class-card">
              <div class="class-header">
                <h4>{{ banji.name }}</h4>
                <div class="class-actions">
                  <button @click="editClass(banji)" class="glass-button small">编辑</button>
                  <button @click="deleteClass(banji.id)" class="glass-button small danger">删除</button>
                </div>
              </div>
              <p v-if="banji.description" class="class-description">{{ banji.description }}</p>
              <p v-if="banji.teacher" class="class-teacher">班主任: {{ banji.teacher }}</p>
              <p class="class-students">学生人数: {{ banji.studentCount || 0 }}</p>
              <button @click="viewStudents(banji.id)" class="glass-button small">查看学生</button>
            </div>
          </div>
        </div>
        
        <!-- 编辑班级模态框 -->
        <div v-if="editingClass" class="modal-overlay" @click="closeEditModal">
          <div class="modal-content" @click.stop>
            <h3>编辑班级</h3>
            <form @submit.prevent="handleUpdateClass" class="class-form">
              <div class="form-group">
                <input
                  v-model="editingClass.name"
                  type="text"
                  placeholder="班级名称"
                  required
                  class="glass-input"
                />
              </div>
              <div class="form-group">
                <input
                  v-model="editingClass.description"
                  type="text"
                  placeholder="班级描述"
                  class="glass-input"
                />
              </div>
              <div class="form-group">
                <input
                  v-model="editingClass.teacher"
                  type="text"
                  placeholder="班主任"
                  class="glass-input"
                />
              </div>
              <div class="form-actions">
                <button type="submit" class="glass-button primary" :disabled="isUpdating">
                  {{ isUpdating ? '更新中...' : '更新班级' }}
                </button>
                <button type="button" @click="closeEditModal" class="glass-button secondary">取消</button>
              </div>
            </form>
          </div>
        </div>
        
        <!-- 学生列表模态框 -->
        <div v-if="viewingStudents" class="modal-overlay" @click="closeStudentsModal">
          <div class="modal-content large" @click.stop>
            <h3>{{ viewingClassName }}注册学员名单</h3>
            <div v-if="isLoadingStudents" class="loading">加载中...</div>
            <div v-else-if="students.length === 0" class="empty-state">该班级暂无学生</div>
            <template v-else>
              <div class="roster-actions">
                <button @click="copyStudentNames" class="glass-button small">复制全部姓名</button>
                <button @click="exportStudentsCsv" class="glass-button small primary">导出 CSV</button>
              </div>
              <div class="students-list">
                <div v-for="student in students" :key="student.id" class="student-card">
                  <div class="student-avatar">
                    <img
                      :src="resolveAvatarUrl(student, student.avatar || student.profile?.avatar)"
                      alt="头像"
                      @error="applyAvatarFallback($event, student)"
                    />
                  </div>
                  <div class="student-info">
                    <h4>{{ student.name || student.username }}</h4>
                    <p>{{ student.email }}</p>
                    <p>注册时间: {{ formatDate(student.createdAt) }}</p>
                  </div>
                </div>
              </div>
            </template>
            <div class="modal-actions">
              <button @click="closeStudentsModal" class="glass-button secondary">关闭</button>
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
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useClassStore } from '../stores/class'
import { applyAvatarFallback, resolveAvatarUrl } from '../utils/avatar'

const router = useRouter()
const classStore = useClassStore()

const classes = computed(() => classStore.classes)
const students = ref([])
const isLoading = ref(false)
const isLoadingStudents = ref(false)
const isCreating = ref(false)
const isUpdating = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const newClass = ref({
  name: '',
  description: '',
  teacher: ''
})

const editingClass = ref(null)
const viewingStudents = ref(null)
const viewingClassName = ref('')

onMounted(async () => {
  await fetchClasses()
})

const fetchClasses = async () => {
  isLoading.value = true
  try {
    await classStore.fetchClasses()
  } catch (error) {
    errorMessage.value = '获取班级列表失败'
    console.error('获取班级列表失败:', error)
  } finally {
    isLoading.value = false
  }
}

const handleCreateClass = async () => {
  isCreating.value = true
  successMessage.value = ''
  errorMessage.value = ''
  
  try {
    await classStore.createClass(newClass.value)
    successMessage.value = '班级创建成功！'
    newClass.value = { name: '', description: '', teacher: '' }
  } catch (error) {
    errorMessage.value = error.message || '创建班级失败'
    console.error('创建班级失败:', error)
  } finally {
    isCreating.value = false
  }
}

const editClass = (banji) => {
  editingClass.value = { ...banji }
}

const closeEditModal = () => {
  editingClass.value = null
}

const handleUpdateClass = async () => {
  isUpdating.value = true
  successMessage.value = ''
  errorMessage.value = ''
  
  try {
    await classStore.updateClass(editingClass.value.id, editingClass.value)
    successMessage.value = '班级更新成功！'
    editingClass.value = null
  } catch (error) {
    errorMessage.value = error.message || '更新班级失败'
    console.error('更新班级失败:', error)
  } finally {
    isUpdating.value = false
  }
}

const deleteClass = async (classId) => {
  if (!confirm('确定要删除这个班级吗？')) return
  
  try {
    await classStore.deleteClass(classId)
    successMessage.value = '班级删除成功！'
  } catch (error) {
    errorMessage.value = error.message || '删除班级失败'
    console.error('删除班级失败:', error)
  }
}

const viewStudents = async (classId) => {
  viewingStudents.value = classId
  viewingClassName.value = classes.value.find(item => item.id === classId)?.name || '班级'
  isLoadingStudents.value = true
  
  try {
    const studentsData = await classStore.fetchClassStudents(classId)
    students.value = studentsData
  } catch (error) {
    errorMessage.value = '获取学生列表失败'
    console.error('获取学生列表失败:', error)
  } finally {
    isLoadingStudents.value = false
  }
}

const closeStudentsModal = () => {
  viewingStudents.value = null
  viewingClassName.value = ''
  students.value = []
}

const formatDate = (value) => value ? new Date(value).toLocaleString('zh-CN') : '-'

const copyStudentNames = async () => {
  const names = students.value.map(student => student.name || student.username).join('\n')
  try {
    await navigator.clipboard.writeText(names)
    successMessage.value = `已复制 ${students.value.length} 名学员的姓名`
  } catch (_error) {
    errorMessage.value = '浏览器未允许自动复制，请使用导出 CSV'
  }
}

const csvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`

const exportStudentsCsv = () => {
  const rows = [['序号', '班级', '姓名', '邮箱', '注册时间']]
  students.value.forEach((student, index) => rows.push([
    index + 1,
    viewingClassName.value,
    student.name || student.username,
    student.email,
    formatDate(student.createdAt)
  ]))
  const csv = `\uFEFF${rows.map(row => row.map(csvCell).join(',')).join('\r\n')}`
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${viewingClassName.value}-注册学员.csv`
  link.click()
  URL.revokeObjectURL(url)
  successMessage.value = `已导出 ${students.value.length} 名学员`
}

const goBack = () => {
  router.push('/home')
}
</script>

<style scoped>
.classes-container {
  min-height: 100vh;
  padding: 20px;
  padding-top: 60px; /* 增加顶部内边距，确保返回按钮可见 */
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
}

.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

h2, h3 {
  color: white;
  margin-bottom: 20px;
}

h2 {
  font-size: 32px;
  font-weight: 600;
  margin: 0;
}

h3 {
  font-size: 20px;
  font-weight: 500;
}

.header-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.back-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 8px 16px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
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

.create-class-section {
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.class-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
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
  background: rgba(33, 150, 243, 0.3);
  border-color: rgba(33, 150, 243, 0.5);
}

.glass-button.primary:hover {
  background: rgba(33, 150, 243, 0.5);
  border-color: rgba(33, 150, 243, 0.7);
}

.glass-button.secondary {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.glass-button.secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.class-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  min-height: 180px; /* 设置最小高度，确保卡片一致性 */
}

.class-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}

.class-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
  gap: 10px;
}

.class-header h4 {
  margin: 0;
  color: white;
  flex: 1;
  word-wrap: break-word;
  word-break: break-word;
  min-width: 0; /* 允许文本收缩 */
  line-height: 1.3;
}

.class-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0; /* 防止按钮被压缩 */
}

.class-description, .class-teacher, .class-students {
  color: rgba(255, 255, 255, 0.8);
  margin: 5px 0;
  font-size: 14px;
}

.class-card .glass-button.small {
  margin-top: auto; /* 将按钮推到底部 */
  align-self: flex-start; /* 按钮左对齐 */
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

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.modal-actions {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.students-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

.roster-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
}

.student-card {
  display: flex;
  gap: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.student-avatar {
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.student-avatar img {
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

.student-info h4 {
  margin: 0 0 5px 0;
  color: white;
}

.student-info p {
  margin: 3px 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

@media (max-width: 768px) {
  .classes-container {
    padding: 10px;
  }
  
  .glass-card {
    padding: 20px;
  }
  
  .classes-grid {
    grid-template-columns: 1fr;
  }
  
  .students-list {
    grid-template-columns: 1fr;
  }
}
</style>
