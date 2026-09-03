<template>
  <div class="performance-monitor" v-if="visible && isDevelopment">
    <div class="monitor-header">
      <h3>动画性能监控</h3>
      <button @click="toggleExpanded" class="toggle-btn">
        {{ expanded ? '收起' : '展开' }}
      </button>
      <button @click="refreshReport" class="refresh-btn">
        刷新
      </button>
      <button @click="closeMonitor" class="close-btn">
        ×
      </button>
    </div>
    
    <div v-if="expanded" class="monitor-content">
      <div class="metrics-section">
        <h4>性能指标</h4>
        <div class="metric">
          <span class="metric-label">平均帧率:</span>
          <span class="metric-value">{{ report.averageFPS.toFixed(1) }} FPS</span>
        </div>
        <div class="metric">
          <span class="metric-label">最低帧率:</span>
          <span class="metric-value">{{ report.minFPS.toFixed(1) }} FPS</span>
        </div>
        <div class="metric">
          <span class="metric-label">内存使用:</span>
          <span class="metric-value">{{ formatMemorySize(report.memoryUsage.usedJSHeapSize) }}</span>
        </div>
        <div class="metric">
          <span class="metric-label">动画总数:</span>
          <span class="metric-value">{{ report.animationCount }}</span>
        </div>
      </div>
      
      <div class="animations-section">
        <h4>动画性能</h4>
        <div v-if="Object.keys(report.animationDurations).length === 0" class="no-data">
          暂无动画数据
        </div>
        <div v-else>
          <div 
            v-for="(duration, name) in report.animationDurations" 
            :key="name"
            class="animation-item"
          >
            <span class="animation-name">{{ name }}</span>
            <span class="animation-duration">{{ duration.toFixed(2) }}ms</span>
          </div>
        </div>
      </div>
      
      <div class="issues-section" v-if="issues.length > 0">
        <h4>性能问题</h4>
        <div 
          v-for="(issue, index) in issues" 
          :key="index"
          class="issue-item"
          :class="issue.severity"
        >
          <span class="issue-type">{{ issue.type }}</span>
          <span class="issue-message">{{ issue.message }}</span>
        </div>
      </div>
      
      <div class="actions-section">
        <button @click="exportReport" class="export-btn">
          导出报告
        </button>
        <button @click="clearData" class="clear-btn">
          清除数据
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useOptimizedAnimations } from '../composables/useOptimizedAnimations'
import animationPerformanceMonitor from '../utils/performanceMonitor'

const { getPerformanceReport, detectPerformanceIssues } = useOptimizedAnimations()

// 状态
const visible = ref(false)
const expanded = ref(false)
const report = ref({
  averageFPS: 0,
  minFPS: 0,
  memoryUsage: { usedJSHeapSize: 0 },
  animationCount: 0,
  animationDurations: {}
})
const issues = ref([])

// 计算属性
const isDevelopment = computed(() => import.meta.env.DEV)

// 方法
const toggleExpanded = () => {
  expanded.value = !expanded.value
  if (expanded.value) {
    refreshReport()
  }
}

const refreshReport = () => {
  if (isDevelopment.value) {
    const newReport = getPerformanceReport()
    if (newReport) {
      report.value = newReport
    }
    
    const newIssues = detectPerformanceIssues()
    if (newIssues) {
      issues.value = newIssues
    }
  }
}

const closeMonitor = () => {
  visible.value = false
}

const formatMemorySize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

const exportReport = () => {
  const reportData = {
    timestamp: new Date().toISOString(),
    report: report.value,
    issues: issues.value
  }
  
  const dataStr = JSON.stringify(reportData, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
  
  const exportFileDefaultName = `animation-performance-${Date.now()}.json`
  
  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
}

const clearData = () => {
  report.value = {
    averageFPS: 0,
    minFPS: 0,
    memoryUsage: { usedJSHeapSize: 0 },
    animationCount: 0,
    animationDurations: {}
  }
  issues.value = []
}

// 键盘快捷键
const handleKeyDown = (event) => {
  // Ctrl/Cmd + Shift + P 切换性能监控面板
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'P') {
    visible.value = !visible.value
    if (visible.value && !expanded.value) {
      expanded.value = true
      refreshReport()
    }
  }
}

// 生命周期
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  
  // 初始加载一次数据
  if (isDevelopment.value) {
    animationPerformanceMonitor.startMonitoring()
    refreshReport()
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  animationPerformanceMonitor.stopMonitoring()
})
</script>

<style scoped>
.performance-monitor {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 320px;
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  border-radius: 8px;
  font-family: monospace;
  font-size: 12px;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  transform: translateZ(0);
  will-change: transform;
}

.monitor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.monitor-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.toggle-btn, .refresh-btn, .close-btn {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  transition: background-color 0.2s;
}

.toggle-btn:hover, .refresh-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.close-btn {
  font-size: 16px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.close-btn:hover {
  background: rgba(255, 67, 54, 0.7);
}

.monitor-content {
  padding: 15px;
  max-height: 400px;
  overflow-y: auto;
}

.metrics-section, .animations-section, .issues-section {
  margin-bottom: 15px;
}

.metrics-section h4, .animations-section h4, .issues-section h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #4fc3f7;
}

.metric {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.metric-label {
  color: rgba(255, 255, 255, 0.7);
}

.metric-value {
  font-weight: 600;
}

.animation-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  padding: 3px 0;
}

.animation-name {
  color: rgba(255, 255, 255, 0.7);
}

.animation-duration {
  font-weight: 600;
}

.no-data {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

.issue-item {
  margin-bottom: 5px;
  padding: 5px;
  border-radius: 4px;
}

.issue-item.warning {
  background: rgba(255, 193, 7, 0.2);
}

.issue-item.error {
  background: rgba(255, 67, 54, 0.2);
}

.issue-type {
  font-weight: 600;
  margin-right: 5px;
}

.issue-message {
  color: rgba(255, 255, 255, 0.8);
}

.actions-section {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.export-btn, .clear-btn {
  flex: 1;
  padding: 6px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.export-btn:hover, .clear-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 滚动条样式 */
.monitor-content::-webkit-scrollbar {
  width: 6px;
}

.monitor-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.monitor-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.monitor-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
