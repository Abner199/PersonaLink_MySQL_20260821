<template>
  <div id="app" class="app">
    <Background 
      :imgList="backgroundImages" 
      :currentIndex="currentBgIndex"
      :randomBackground="randomBackground"
      :customBackgroundUrl="customBackgroundUrl"
    />
    <div class="container">
      <div class="main-content">
        <router-view />
      </div>
    </div>
    <PerformanceMonitor />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import PerformanceMonitor from './components/PerformanceMonitor.vue'
import Background from './components/Background.vue'

// 背景图片列表
const backgroundImages = ref([
  {
    url: "/images/background1.jpg",
  },
  {
    url: "/images/background2.jpg",
  },
  {
    url: "/images/background3.jpg",
  },
  {
    url: "/images/background4.jpg",
  },
  {
    url: "/images/background5.jpg",
  },
  {
    url: "/images/background6.jpg",
  },
  {
    url: "/images/background7.jpg",
  },
  {
    url: "/images/background8.jpg",
  },
  {
    url: "/images/background9.jpg",
  },
  {
    url: "/images/background10.jpg",
  }
])

// 当前背景图片索引
const currentBgIndex = ref(0)

// 是否随机更换背景
const randomBackground = ref(false)

// 自定义背景图片URL
const customBackgroundUrl = ref('')

onMounted(() => {
  // 从本地存储加载背景设置
  loadBackgroundSettings()
})

// 从本地存储加载背景设置
const loadBackgroundSettings = () => {
  const savedBgSettings = localStorage.getItem('personaLink-backgroundSettings')
  if (savedBgSettings) {
    try {
      const settings = JSON.parse(savedBgSettings)
      currentBgIndex.value = settings.currentBgIndex || 0
      randomBackground.value = settings.randomBackground || false
      customBackgroundUrl.value = settings.customBackgroundUrl || ''
      
      // 如果是随机模式，生成一个随机索引
      if (randomBackground.value && !customBackgroundUrl.value) {
        currentBgIndex.value = Math.floor(Math.random() * backgroundImages.value.length)
      }
    } catch (e) {
      console.error('Failed to parse saved background settings:', e)
    }
  }
}

// 保存背景设置到本地存储
const saveBackgroundSettings = () => {
  const settings = {
    currentBgIndex: currentBgIndex.value,
    randomBackground: randomBackground.value,
    customBackgroundUrl: customBackgroundUrl.value
  }
  localStorage.setItem('personaLink-backgroundSettings', JSON.stringify(settings))
}

// 暴露方法给子组件调用
window.changeBackground = (index) => {
  currentBgIndex.value = index
  saveBackgroundSettings()
}

window.toggleRandomBackground = (value) => {
  randomBackground.value = value
  // 如果开启随机背景，立即生成一个随机索引
  if (value) {
    currentBgIndex.value = Math.floor(Math.random() * backgroundImages.value.length)
  }
  saveBackgroundSettings()
}

window.setCustomBackground = (url) => {
  customBackgroundUrl.value = url
  saveBackgroundSettings()
}
</script>

<style scoped>
.app {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  isolation: isolate;
}

.container {
  position: relative;
  z-index: 1;
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-top: 0;
}

.main-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  z-index: 1;
  flex: 1;
}
</style>
