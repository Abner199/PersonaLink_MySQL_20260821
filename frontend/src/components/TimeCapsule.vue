<template>
  <div class="time-capsule">
    <div class="capsule-header">
      <h3>时光沙漏</h3>
      <div class="hourglass-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v6m0 4v6m0 4v2"></path>
          <path d="M7 7l5-5 5 5"></path>
          <path d="M7 17l5 5 5-5"></path>
          <path d="M5 12h14"></path>
        </svg>
      </div>
    </div>
    <div class="time-display">
          <div class="time-item">
            <span class="time-value">{{ ageDisplay }}</span>
            <span class="time-label">时间已过</span>
          </div>
      <div class="time-item">
        <span class="time-value">{{ timeLeft }}</span>
        <span class="time-label">今日剩余</span>
      </div>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: dayProgress + '%' }"></div>
    </div>
    <p class="time-quote">{{ currentTimeQuote }}</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '../stores/user';

const userStore = useUserStore();
const now = ref(new Date());
let timer = null;

const timeQuotes = [
  "时间是一切财富中最宝贵的财富。",
  "时间就像海绵里的水，只要愿挤，总还是有的。",
  "盛年不重来，一日难再晨。",
  "少壮不努力，老大徒伤悲。",
  "一寸光阴一寸金，寸金难买寸光阴。"
];

// 获取用户生日
const userBirthday = computed(() => {
  return userStore.user?.profile?.birthday;
});

// 计算年龄和天数
const ageInfo = computed(() => {
  if (!userBirthday.value) return { years: 0, days: 0, formatted: '未设置生日' };
  
  const birthDate = new Date(userBirthday.value);
  const currentDate = new Date(now.value);
  
  // 计算年龄
  let age = currentDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = currentDate.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
    age--;
  }
  
  // 计算总天数
  const timeDiff = currentDate - birthDate;
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  
  // 格式化显示
  const formatted = `${daysDiff}天`;
  
  return {
    years: age,
    days: daysDiff,
    formatted: formatted
  };
});

const ageDisplay = computed(() => {
  return ageInfo.value.formatted;
});

const timeLeft = computed(() => {
  const endOfDay = new Date(now.value);
  endOfDay.setHours(23, 59, 59, 999);
  const diffMs = endOfDay - now.value;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}时${minutes}分`;
});

const dayProgress = computed(() => {
  const startOfDay = new Date(now.value);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now.value);
  endOfDay.setHours(23, 59, 59, 999);
  
  const totalMs = endOfDay - startOfDay;
  const elapsedMs = now.value - startOfDay;
  
  return Math.round((elapsedMs / totalMs) * 100);
});

const currentTimeQuote = computed(() => {
  const hour = now.value.getHours();
  let index = 0;
  
  if (hour >= 6 && hour < 12) {
    index = 0; // 早晨
  } else if (hour >= 12 && hour < 18) {
    index = 1; // 下午
  } else if (hour >= 18 && hour < 22) {
    index = 2; // 晚上
  } else {
    index = 3; // 深夜
  }
  
  return timeQuotes[index % timeQuotes.length];
});

const updateCurrentTime = () => {
  now.value = new Date();
};

onMounted(() => {
  updateCurrentTime();
  timer = setInterval(updateCurrentTime, 1000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<style scoped>
.time-capsule {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.time-capsule:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.capsule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.capsule-header h3 {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.2rem;
  margin: 0;
}

.hourglass-icon {
  color: rgba(255, 255, 255, 0.7);
}

.time-display {
  display: flex;
  justify-content: space-around;
  margin-bottom: 15px;
}

.time-item {
  text-align: center;
}

.time-value {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 5px;
}

.time-label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
}

.progress-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  margin-bottom: 15px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #a1c4fd 0%, #c2e9fb 100%);
  border-radius: 3px;
  transition: width 1s linear;
}

.time-quote {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  font-style: italic;
  margin: 0;
}

@media (max-width: 768px) {
  .time-capsule {
    padding: 15px;
  }
  
  .capsule-header h3 {
    font-size: 1.1rem;
  }
  
  .time-value {
    font-size: 1.2rem;
  }
  
  .time-label {
    font-size: 0.7rem;
  }
  
  .time-quote {
    font-size: 0.8rem;
  }
}
</style>