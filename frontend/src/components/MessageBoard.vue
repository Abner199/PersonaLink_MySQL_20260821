<template>
  <div class="message-board cards" @click="openEditor">
    <div class="content">
      <Icon size="16">
        <QuoteLeft />
      </Icon>
      <Transition name="fade" mode="out-in">
        <div :key="messageText.hello + messageText.text" class="text">
          <p>{{ messageText.hello }}</p>
          <p>{{ messageText.text }}</p>
        </div>
      </Transition>
      <Icon size="16">
        <QuoteRight />
      </Icon>
    </div>
  </div>
  
  <!-- 留言编辑弹窗 -->
  <div v-if="isEditorOpen" class="message-editor-overlay" @click.self="closeEditor">
    <div class="message-editor cards">
      <div class="editor-header">
        <h3>编辑留言板</h3>
        <div class="editor-actions">
          <button class="glass-button small" @click="resetMessage">重置</button>
          <button class="glass-button small" @click="closeEditor">关闭</button>
        </div>
      </div>
      <div class="editor-content">
        <div class="input-group">
          <label>标题文字</label>
          <input 
            v-model="tempMessage.hello" 
            type="text" 
            placeholder="输入标题文字"
            class="glass-input"
          />
        </div>
        <div class="input-group">
          <label>内容文字</label>
          <textarea 
            v-model="tempMessage.text" 
            placeholder="输入内容文字"
            class="glass-input"
            rows="3"
          ></textarea>
        </div>
        <button class="glass-button" @click="saveMessage">保存留言</button>
      </div>
      
      <!-- 背景设置 -->
      <div class="background-settings">
        <h4>背景设置</h4>
        
        <div class="setting-group">
          <label>选择背景图片</label>
          <div class="background-grid">
            <div 
              v-for="(bg, index) in backgroundList" 
              :key="index"
              class="background-item"
              :class="{ active: currentBgIndex === index && !customBackgroundUrl }"
              @click="selectBackground(index)"
            >
              <img :src="bg.url" :alt="`背景${index + 1}`" />
              <span>背景{{ index + 1 }}</span>
            </div>
          </div>
        </div>
        
        <div class="setting-group">
          <label>自定义背景</label>
          <div class="custom-bg-input">
            <input 
              v-model="customBgUrl" 
              type="text" 
              placeholder="输入图片URL"
              class="glass-input"
            />
            <button class="glass-button small" @click="applyCustomBackground">应用</button>
          </div>
          <div class="file-upload">
            <input 
              type="file" 
              id="bg-upload" 
              accept="image/*" 
              @change="handleFileUpload"
              style="display: none"
            />
            <label for="bg-upload" class="glass-button small">上传图片</label>
          </div>
        </div>
        
        <div class="setting-group">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="randomBg" 
              @change="toggleRandomBackground"
            />
            <span>每次载入页面时随机更换背景</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Icon } from '@vicons/utils'
import { QuoteLeft, QuoteRight } from '@vicons/fa'

// 编辑器状态
const isEditorOpen = ref(false)

// 留言文本
const messageText = reactive({
  hello: '欢迎来到PersonaLink',
  text: '一个连接人与人之间的社交平台'
})

// 临时编辑数据
const tempMessage = reactive({
  hello: '',
  text: ''
})

// 背景设置相关
const backgroundList = ref([
  { url: "/images/background1.jpg" },
  { url: "/images/background2.jpg" },
  { url: "/images/background3.jpg" },
  { url: "/images/background4.jpg" },
  { url: "/images/background5.jpg" },
  { url: "/images/background6.jpg" },
  { url: "/images/background7.jpg" },
  { url: "/images/background8.jpg" },
  { url: "/images/background9.jpg" },
  { url: "/images/background10.jpg" }
])

const currentBgIndex = ref(0)
const customBgUrl = ref('')
const customBackgroundUrl = ref('')
const randomBg = ref(false)

// 打开编辑器
const openEditor = () => {
  tempMessage.hello = messageText.hello
  tempMessage.text = messageText.text
  isEditorOpen.value = true
  // 加载背景设置
  loadBackgroundSettings()
}

// 关闭编辑器
const closeEditor = () => {
  isEditorOpen.value = false
}

// 保存留言
const saveMessage = () => {
  messageText.hello = tempMessage.hello
  messageText.text = tempMessage.text
  // 保存到本地存储
  localStorage.setItem('personaLink-message', JSON.stringify(messageText))
  closeEditor()
}

// 重置留言
const resetMessage = () => {
  tempMessage.hello = '欢迎来到PersonaLink'
  tempMessage.text = '一个连接人与人之间的社交平台'
}

// 加载背景设置
const loadBackgroundSettings = () => {
  const savedBgSettings = localStorage.getItem('personaLink-backgroundSettings')
  if (savedBgSettings) {
    try {
      const settings = JSON.parse(savedBgSettings)
      currentBgIndex.value = settings.currentBgIndex || 0
      randomBg.value = settings.randomBackground || false
      customBackgroundUrl.value = settings.customBackgroundUrl || ''
      customBgUrl.value = customBackgroundUrl.value
    } catch (e) {
      console.error('Failed to parse saved background settings:', e)
    }
  }
}

// 选择背景
const selectBackground = (index) => {
  currentBgIndex.value = index
  customBackgroundUrl.value = ''
  customBgUrl.value = ''
  randomBg.value = false // 关闭随机背景
  
  // 调用全局方法
  if (window.changeBackground) {
    window.changeBackground(index)
  }
  if (window.setCustomBackground) {
    window.setCustomBackground('')
  }
  if (window.toggleRandomBackground) {
    window.toggleRandomBackground(false)
  }
  
  // 保存背景设置
  const settings = {
    currentBgIndex: index,
    randomBackground: false,
    customBackgroundUrl: ''
  }
  localStorage.setItem('personaLink-backgroundSettings', JSON.stringify(settings))
}

// 应用自定义背景
const applyCustomBackground = () => {
  if (!customBgUrl.value) return
  
  customBackgroundUrl.value = customBgUrl.value
  randomBg.value = false // 关闭随机背景
  
  // 调用全局方法
  if (window.setCustomBackground) {
    window.setCustomBackground(customBgUrl.value)
  }
  if (window.toggleRandomBackground) {
    window.toggleRandomBackground(false)
  }
  
  // 保存背景设置
  const settings = {
    currentBgIndex: currentBgIndex.value,
    randomBackground: false,
    customBackgroundUrl: customBgUrl.value
  }
  localStorage.setItem('personaLink-backgroundSettings', JSON.stringify(settings))
}

// 处理文件上传
const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件')
    return
  }
  
  // 检查文件大小 (限制为5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('图片大小不能超过5MB')
    return
  }
  
  // 创建文件读取器
  const reader = new FileReader()
  reader.onload = (e) => {
    customBgUrl.value = e.target.result
    customBackgroundUrl.value = e.target.result
    randomBg.value = false // 关闭随机背景
    
    // 调用全局方法
    if (window.setCustomBackground) {
      window.setCustomBackground(e.target.result)
    }
    if (window.toggleRandomBackground) {
      window.toggleRandomBackground(false)
    }
    
    // 保存背景设置
    const settings = {
      currentBgIndex: currentBgIndex.value,
      randomBackground: false,
      customBackgroundUrl: e.target.result
    }
    localStorage.setItem('personaLink-backgroundSettings', JSON.stringify(settings))
  }
  reader.readAsDataURL(file)
}

// 切换随机背景
const toggleRandomBackground = () => {
  // 调用全局方法
  if (window.toggleRandomBackground) {
    window.toggleRandomBackground(randomBg.value)
  }
  
  // 如果开启随机背景，清空自定义背景
  if (randomBg.value) {
    customBackgroundUrl.value = ''
    customBgUrl.value = ''
    if (window.setCustomBackground) {
      window.setCustomBackground('')
    }
  }
  
  // 保存背景设置
  const settings = {
    currentBgIndex: currentBgIndex.value,
    randomBackground: randomBg.value,
    customBackgroundUrl: customBackgroundUrl.value
  }
  localStorage.setItem('personaLink-backgroundSettings', JSON.stringify(settings))
}

// 组件挂载时从本地存储加载留言
onMounted(() => {
  const savedMessage = localStorage.getItem('personaLink-message')
  if (savedMessage) {
    try {
      const parsed = JSON.parse(savedMessage)
      messageText.hello = parsed.hello || '欢迎来到PersonaLink'
      messageText.text = parsed.text || '一个连接人与人之间的社交平台'
    } catch (e) {
      console.error('Failed to parse saved message:', e)
    }
  }
})
</script>

<style scoped>
.message-board {
  padding: 1rem;
  margin-top: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.message-board:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.15);
}

.content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text {
  margin: 0.75rem 1rem;
  line-height: 1.5;
  flex: 1;
}

.text p {
  margin: 0;
}

.text p:first-child {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

/* 编辑器样式 */
.message-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.message-editor {
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 1.5rem;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.editor-header h3 {
  margin: 0;
  color: #fff;
}

.editor-actions {
  display: flex;
  gap: 0.5rem;
}

.editor-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  color: #fff;
  font-weight: 500;
}

.glass-input {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 0.75rem;
  color: #fff;
  font-size: 1rem;
  transition: all 0.3s;
}

.glass-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.glass-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.glass-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 0.5rem 1rem;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
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

/* 背景设置样式 */
.background-settings {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.background-settings h4 {
  color: #fff;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.setting-group {
  margin-bottom: 1.5rem;
}

.setting-group label {
  color: #fff;
  font-weight: 500;
  margin-bottom: 0.5rem;
  display: block;
}

.background-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 0.75rem;
}

.background-item {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.background-item:hover {
  transform: scale(1.05);
  border-color: rgba(255, 255, 255, 0.3);
}

.background-item.active {
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
}

.background-item img {
  width: 100%;
  height: 60px;
  object-fit: cover;
  display: block;
}

.background-item span {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 0.7rem;
  padding: 2px;
  text-align: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.background-item:hover span {
  opacity: 1;
}

.custom-bg-input {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.custom-bg-input .glass-input {
  flex: 1;
}

.file-upload {
  margin-top: 0.5rem;
}

.file-upload label {
  display: inline-block;
  cursor: pointer;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: #fff;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: rgba(255, 255, 255, 0.8);
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>