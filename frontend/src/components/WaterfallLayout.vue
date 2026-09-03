<template>
  <div class="adaptive-grid-scroller">
    <div class="adaptive-grid" :style="gridStyle">
      <div
        v-for="(item, index) in items"
        :key="item.id || item.email || index"
        class="adaptive-grid-item"
      >
        <slot name="item" :item="item" :index="index"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  gap: {
    type: Number,
    default: 16
  }
})

const gridStyle = computed(() => ({
  '--grid-gap': `${props.gap}px`
}))
</script>

<style scoped>
.adaptive-grid-scroller {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.adaptive-grid-scroller::-webkit-scrollbar {
  width: 9px;
}

.adaptive-grid-scroller::-webkit-scrollbar-track {
  background: transparent;
}

.adaptive-grid-scroller::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(56, 189, 248, 0.42), rgba(45, 212, 191, 0.28));
  border: 2px solid transparent;
  border-radius: 999px;
  background-clip: padding-box;
}

.adaptive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(270px, 340px));
  justify-content: center;
  align-content: start;
  gap: var(--grid-gap);
  width: 100%;
  min-height: 100%;
  padding: 8px 8px 28px;
}

.adaptive-grid-item {
  min-width: 0;
  aspect-ratio: 1;
  contain: layout style;
}

@media (max-width: 720px) {
  .adaptive-grid {
    grid-template-columns: repeat(auto-fit, minmax(164px, 1fr));
    gap: 10px;
    padding: 4px 3px 20px;
  }
}

@media (max-width: 420px) {
  .adaptive-grid-scroller {
    scrollbar-gutter: auto;
  }

  .adaptive-grid {
    grid-template-columns: repeat(auto-fit, minmax(138px, 1fr));
    gap: 8px;
    padding-inline: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .adaptive-grid-scroller {
    scroll-behavior: auto;
  }
}
</style>
