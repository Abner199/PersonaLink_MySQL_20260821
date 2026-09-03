<template>
  <div 
    ref="cardElement" 
    class="user-card" 
    role="button"
    tabindex="0"
    @click="handleCardClick"
    @keydown.enter="handleCardClick"
    @keydown.space.prevent="handleCardClick"
    @focus="handlePointerEnter"
    @blur="showDetails = false"
    @mouseenter="handlePointerEnter"
    @pointermove="handlePointerMove"
    @pointerleave="handlePointerLeave"
  >
    <div class="user-avatar-container">
      <img
        v-if="avatarPresentation.type === 'image'"
        :src="avatarPresentation.src"
        :alt="user.name || user.username"
        class="user-avatar"
        loading="lazy"
        decoding="async"
        @error="applyAvatarFallback($event, user)"
      />
      <div
        v-else
        class="user-avatar user-avatar--sprite"
        :style="avatarPresentation.style"
        role="img"
        :aria-label="user.name || user.username"
      ></div>
      <div class="user-name-overlay">
        <h3 class="user-name">{{ user.name || user.username || '未知用户' }}</h3>
      </div>
      <div class="user-details-overlay" :class="{ active: showDetails }">
        <h3 class="user-name">{{ user.name || user.username || '未知用户' }}</h3>
        <p v-if="user.className" class="user-class">{{ user.className }}</p>
        <p v-if="user.profile?.hometown" class="user-hometown">
          <span class="icon">🏠</span> {{ user.profile.hometown }}
        </p>
        <div v-if="user.profile?.hobbies && user.profile.hobbies.length > 0" class="user-hobbies">
          <span 
            v-for="(hobby, index) in displayHobbies" 
            :key="index" 
            class="hobby-tag"
          >
            {{ hobby }}
          </span>
          <span v-if="user.profile.hobbies.length > 3" class="more-hobbies">
            +{{ user.profile.hobbies.length - 3 }}
          </span>
        </div>
        <p v-if="user.profile?.bio" class="user-bio">{{ truncateText(user.profile.bio, 80) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useOptimizedAnimations } from '../composables/useOptimizedAnimations'
import { applyAvatarFallback, resolveAvatarPresentation } from '../utils/avatar'

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const cardElement = ref(null)
const showDetails = ref(false)
let pointerFrame = null

const avatarPresentation = computed(() => resolveAvatarPresentation(props.user))

// 使用优化的动画
const { animateOnScroll } = useOptimizedAnimations()

// 显示的爱好（最多3个）
const displayHobbies = computed(() => {
  if (!props.user.profile?.hobbies) return []
  return props.user.profile.hobbies.slice(0, 3)
})

// 截断文本
const truncateText = (text, maxLength) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

// 处理卡片点击
const handleCardClick = () => {
  router.push(`/user/${props.user.email}`)
}

const handlePointerEnter = () => {
  showDetails.value = true
}

const handlePointerMove = (event) => {
  if (event.pointerType && event.pointerType !== 'mouse') return

  const element = event.currentTarget
  const pointerX = event.clientX
  const pointerY = event.clientY
  if (pointerFrame) cancelAnimationFrame(pointerFrame)

  pointerFrame = requestAnimationFrame(() => {
    const rect = element.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (pointerX - rect.left) / rect.width))
    const y = Math.min(1, Math.max(0, (pointerY - rect.top) / rect.height))
    element.style.setProperty('--tilt-x', `${(0.5 - y) * 4}deg`)
    element.style.setProperty('--tilt-y', `${(x - 0.5) * 4}deg`)
    element.style.setProperty('--pointer-x', `${x * 100}%`)
    element.style.setProperty('--pointer-y', `${y * 100}%`)
  })
}

const handlePointerLeave = (event) => {
  showDetails.value = false
  if (pointerFrame) cancelAnimationFrame(pointerFrame)
  pointerFrame = null
  event.currentTarget.style.setProperty('--tilt-x', '0deg')
  event.currentTarget.style.setProperty('--tilt-y', '0deg')
  event.currentTarget.style.setProperty('--pointer-x', '50%')
  event.currentTarget.style.setProperty('--pointer-y', '50%')
}

// 组件挂载后添加滚动动画
onMounted(() => {
  nextTick(() => {
    if (cardElement.value) {
      animateOnScroll(cardElement.value)
    }
  })
})

onUnmounted(() => {
  if (pointerFrame) cancelAnimationFrame(pointerFrame)
})
</script>

<style scoped>
.user-card {
  --tilt-x: 0deg;
  --tilt-y: 0deg;
  --pointer-x: 50%;
  --pointer-y: 50%;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(14px) saturate(115%);
  -webkit-backdrop-filter: blur(14px) saturate(115%);
  border-radius: clamp(12px, 1.2vw, 18px);
  border: 1px solid rgba(148, 163, 184, 0.18);
  overflow: hidden;
  transition:
    transform 0.48s cubic-bezier(0.16, 1, 0.3, 1),
    border-color 0.38s ease,
    box-shadow 0.48s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
  box-shadow: 0 12px 30px rgba(2, 6, 23, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  will-change: transform, box-shadow;
  position: relative;
  z-index: 1;
  transform-origin: center center;
  width: 100%;
  height: 100%;
  margin: 0;
  isolation: isolate;
  transform-style: preserve-3d;
}

.user-card::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(125deg, rgba(255, 255, 255, 0.72), rgba(125, 211, 252, 0.16) 32%, transparent 55%, rgba(45, 212, 191, 0.42));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.22;
  transition: opacity 0.42s ease;
}

.user-card::after {
  content: none;
}

.user-card:hover {
  transform: perspective(1050px) translateY(-12px) rotateX(var(--tilt-x)) rotateY(var(--tilt-y)) scale(1.115) !important;
  box-shadow:
    0 34px 70px rgba(2, 6, 23, 0.58),
    0 10px 26px rgba(14, 165, 233, 0.16),
    0 0 0 1px rgba(186, 230, 253, 0.24),
    0 0 44px rgba(45, 212, 191, 0.1);
  border-color: rgba(186, 230, 253, 0.68);
  z-index: 20 !important;
}

.user-card:hover::before {
  opacity: 0.82;
}

.user-card:focus-visible {
  outline: none;
  border-color: rgba(186, 230, 253, 0.76);
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.18), 0 22px 48px rgba(2, 6, 23, 0.46);
}

.user-avatar-container {
  position: relative;
  width: 100%;
  padding-top: 100%; /* 1:1 比例 */
  overflow: hidden;
  border-radius: inherit;
}

.user-avatar-container::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(2, 6, 23, 0.02) 48%, rgba(2, 6, 23, 0.28));
  transition: opacity 0.4s ease;
}

.user-avatar {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.58s cubic-bezier(0.16, 1, 0.3, 1), filter 0.45s ease;
  will-change: transform;
}

.user-avatar--sprite {
  background-repeat: no-repeat;
  transform: scale(1.012);
}

.user-card:hover .user-avatar {
  transform: scale(1.22);
  filter: saturate(1.08) contrast(1.06) brightness(1.03);
}

.user-name-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 42px 14px 14px;
  text-align: center;
  z-index: 2;
  transition: opacity 0.32s ease, transform 0.42s cubic-bezier(0.16, 1, 0.3, 1);
  background: linear-gradient(180deg, transparent, rgba(2, 6, 23, 0.82));
}

/* 当鼠标悬停时，隐藏原本显示的名字 */
.user-card:hover .user-name-overlay {
  opacity: 0;
  transform: translateY(8px);
}

.user-details-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, rgba(2, 6, 23, 0.1) 12%, rgba(2, 6, 23, 0.94) 100%);
  border-radius: inherit;
  padding: clamp(12px, 1.4vw, 20px);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  opacity: 0;
  z-index: 2;
  transform: translateY(8px);
  transition:
    opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.48s cubic-bezier(0.16, 1, 0.3, 1),
    backdrop-filter 0.4s ease;
  overflow-y: auto;
}

.user-details-overlay.active {
  opacity: 1;
  transform: translateY(0);
  backdrop-filter: blur(1.5px);
}

.user-name {
  margin: 0 0 5px 0; /* 增加下边距，与班级信息隔开更多距离 */
  font-size: 18px;
  font-weight: 650;
  color: white;
  opacity: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.72);
}

.user-class {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-style: italic;
}

.user-hometown {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
}

.icon {
  margin-right: 5px;
}

.user-hobbies {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 10px;
}

.hobby-tag {
  background: rgba(14, 165, 233, 0.18);
  border: 1px solid rgba(125, 211, 252, 0.16);
  border-radius: 12px;
  padding: 3px 8px;
  font-size: 12px;
  color: white;
}

.more-hobbies {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 3px 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.user-bio {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8); /* 修改透明度为80% */
  line-height: 1.4;
}

@media (max-width: 420px) {
  .user-name-overlay {
    padding: 32px 8px 9px;
  }

  .user-name {
    font-size: 14px;
  }

  .user-details-overlay {
    padding: 10px;
  }

  .user-class,
  .user-hometown,
  .user-bio {
    font-size: 11px;
  }

  .hobby-tag,
  .more-hobbies {
    font-size: 10px;
    padding: 2px 6px;
  }
}

@media (hover: none) {
  .user-card:hover {
    transform: none !important;
  }

  .user-card::after {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .user-card,
  .user-avatar,
  .user-name-overlay,
  .user-details-overlay {
    transition-duration: 0.01ms !important;
  }

  .user-card:hover {
    transform: none !important;
  }
}
</style>
