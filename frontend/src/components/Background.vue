<template>
  <div class="background">
    <img
      v-if="currentImage && !currentImage.isBase64"
      alt="background"
      :src="currentImage.url"
      :key="currentImage.url"
      @load="imgLoadComplete"
      @error="imgLoadError"
      v-show="imgShow"
      ref="bgImage"
    />
    <!-- 对于base64图片，使用div的background-image属性，避免HTTP请求头过大问题 -->
    <div
      v-if="currentImage && currentImage.isBase64"
      class="background-base64"
      :style="{ backgroundImage: `url(${currentImage.url})` }"
      v-show="imgShow"
      @load="imgLoadComplete"
    ></div>
    <div v-show="!imgShow" class="loading">
      <div class="loading-box">
        <span class="loading-text">加载中</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';

const props = defineProps({
  // 图片列表
  imgList: {
    type: Array,
    default: () => [],
  },
  // 当前背景图片索引
  currentIndex: {
    type: Number,
    default: 0,
  },
  // 是否随机更换背景
  randomBackground: {
    type: Boolean,
    default: false,
  },
  // 自定义背景图片URL
  customBackgroundUrl: {
    type: String,
    default: '',
  }
});

// 图片加载状态
const imgShow = ref(false);
const imgLoadTimeout = ref(null);
const bgImage = ref(null);
const isChanging = ref(false); // 添加状态标记，防止频繁切换

const clearImgLoadTimeout = () => {
  if (imgLoadTimeout.value) {
    clearTimeout(imgLoadTimeout.value);
    imgLoadTimeout.value = null;
  }
};

const isCurrentImageEvent = (event) => {
  if (!event?.target || event.target !== bgImage.value || !currentImage.value?.url) {
    return false;
  }

  try {
    const expectedUrl = new URL(currentImage.value.url, window.location.href).href;
    return event.target.currentSrc === expectedUrl || event.target.src === expectedUrl;
  } catch {
    return event.target.getAttribute('src') === currentImage.value.url;
  }
};

// 当前显示的图片
const currentImage = computed(() => {
  // 如果有自定义背景图片，优先使用
  if (props.customBackgroundUrl) {
    // 对于base64图片，进行特殊处理
    if (props.customBackgroundUrl.startsWith('data:')) {
      return { 
        url: props.customBackgroundUrl,
        isBase64: true
      };
    }
    return { url: props.customBackgroundUrl };
  }
  
  // 如果没有图片列表，返回null
  if (!props.imgList || props.imgList.length === 0) {
    return null;
  }
  
  // 如果是随机模式，返回指定索引的图片（避免每次计算都重新生成随机数）
  if (props.randomBackground) {
    return props.imgList[props.currentIndex] || props.imgList[0];
  }
  
  // 否则返回指定索引的图片
  return props.imgList[props.currentIndex] || props.imgList[0];
});

// 图片加载完成
const imgLoadComplete = (event) => {
  if (!isCurrentImageEvent(event)) return;

  console.log("背景图片加载成功:", currentImage.value?.url);
  clearImgLoadTimeout();
  imgShow.value = true;
  isChanging.value = false; // 重置状态
};

// 图片加载失败
const imgLoadError = (event) => {
  if (!isCurrentImageEvent(event)) return;

  console.warn('图片加载失败:', currentImage.value?.url);
  clearImgLoadTimeout();
  // 当前请求失败时直接显示深色兜底，不再创建第二个 Image 请求。
  // 原来的重试逻辑会与 Vue 的 img 生命周期竞争，产生“成功→失败→重试”的假错误。
  imgShow.value = true;
  isChanging.value = false;
};

// 清理资源
const cleanupResources = () => {
  // 不要清空正在加载的 img.src，也不要扫描并删除全局 canvas。
  // 前者会触发旧请求的 error 事件，后者无法找到 composable 创建的游离 canvas，
  // 还可能误伤页面中真正使用的 canvas。
  clearImgLoadTimeout();
};

// 初始化
onMounted(() => {
  // 如果没有图片，设置默认背景
  if (!props.imgList || props.imgList.length === 0) {
    document.body.style.backgroundColor = "#333";
    imgShow.value = true;
  } else {
    // 如果是base64图片，直接显示
    if (currentImage.value && currentImage.value.isBase64) {
      console.log("初始化加载base64背景图片");
      // 给浏览器一些时间渲染
      setTimeout(() => {
        imgShow.value = true;
        isChanging.value = false;
      }, 100);
      return;
    }
    
    // 设置超时，5秒后强制显示内容
    imgLoadTimeout.value = setTimeout(() => {
      console.warn("初始背景图片加载超时，强制显示内容");
      imgShow.value = true;
      imgLoadTimeout.value = null;
      isChanging.value = false;
    }, 5000);
    
    // 普通图片由模板中的 <img> 自然加载，避免初始化时重复清空/隐藏图片。
    console.log("组件初始化，等待背景图片加载");
  }
});

// 监听背景变化，重新加载图片
const handleBackgroundChange = () => {
  // 如果正在切换中，则忽略此次变化
  if (isChanging.value) return;
  
  isChanging.value = true;
  imgShow.value = false;
  
  // 清理之前的资源
  cleanupResources();
  
  // 清除之前的超时
  clearImgLoadTimeout();
  
  // 如果是base64图片，直接显示，不需要超时处理
  if (currentImage.value && currentImage.value.isBase64) {
    console.log("加载base64背景图片");
    // 给浏览器一些时间渲染
    setTimeout(() => {
      imgShow.value = true;
      isChanging.value = false;
    }, 100);
    return;
  }
  
  // 设置新的超时，5秒后强制显示内容
  imgLoadTimeout.value = setTimeout(() => {
    console.warn("背景图片加载超时，强制显示内容");
    imgShow.value = true;
    imgLoadTimeout.value = null;
    isChanging.value = false;
  }, 5000);
};

// 监听背景变化
watch(() => [props.imgList, props.currentIndex, props.randomBackground, props.customBackgroundUrl], handleBackgroundChange, { flush: 'sync' });

// 组件卸载时清理资源
onUnmounted(() => {
  cleanupResources();
});
</script>

<style scoped>
.background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background: #333;
}

.background img {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-size: cover;
  background-position: center;
  transition: opacity 1s ease-in-out;
  filter: blur(20px) brightness(0.3);
}

.background-base64 {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition: opacity 1s ease-in-out;
  filter: blur(20px) brightness(0.3);
}

.loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #333;
}

.loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loading-text {
  font-family: "UnidreamLED";
  font-size: 2rem;
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}
</style>
