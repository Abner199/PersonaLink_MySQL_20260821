<template>
  <div class="famous-quote">
    <div class="quote-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
        <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
      </svg>
    </div>
    <div class="quote-content">
      <p class="quote-text">{{ currentQuote.text }}</p>
      <p class="quote-author">—— {{ currentQuote.author }}</p>
    </div>
    <button class="refresh-btn" @click="refreshQuote" title="换一句">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="23 4 23 10 17 10"></polyline>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const quotes = [
  { text: "\"生活就像骑自行车，要保持平衡就得不断前进。\"", author: "阿尔伯特·爱因斯坦" },
  { text: "\"成功的秘诀在于对目标的执着追求。\"", author: "本杰明·迪斯雷利" },
  { text: "\"不要等待机会，而要创造机会。\"", author: "乔治·萧伯纳" },
  { text: "\"人生最大的快乐不在于占有什么，而在于追求什么的过程。\"", author: "本杰明·富兰克林" },
  { text: "\"你的时间有限，不要浪费于重复别人的生活。\"", author: "史蒂夫·乔布斯" },
  { text: "\"成功不是终点，失败也不是终结，唯有勇气才是永恒。\"", author: "温斯顿·丘吉尔" },
  { text: "\"人生如逆旅，我亦是行人。\"", author: "苏轼" },
  { text: "\"路漫漫其修远兮，吾将上下而求索。\"", author: "屈原" },
  { text: "\"千里之行，始于足下。\"", author: "老子" },
  { text: "\"不积跬步，无以至千里；不积小流，无以成江海。\"", author: "荀子" }
];

const currentQuote = ref({});

const getRandomQuote = () => {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
};

const refreshQuote = () => {
  currentQuote.value = getRandomQuote();
};

onMounted(() => {
  refreshQuote();
});
</script>

<style scoped>
.famous-quote {
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.famous-quote:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.quote-icon {
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 10px;
}

.quote-content {
  text-align: center;
}

.quote-text {
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 10px;
  font-style: italic;
}

.quote-author {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  text-align: right;
}

.refresh-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
  transform: rotate(180deg);
}

@media (max-width: 768px) {
  .famous-quote {
    padding: 15px;
  }
  
  .quote-text {
    font-size: 0.9rem;
  }
  
  .quote-author {
    font-size: 0.8rem;
  }
}
</style>