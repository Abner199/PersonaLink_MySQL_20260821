/**
 * 动画性能监控工具
 * 用于监控和优化动画性能
 */

class AnimationPerformanceMonitor {
  constructor() {
    this.metrics = {
      fps: [],
      frameTime: [],
      memoryUsage: [],
      animationDurations: {}
    }
    this.isMonitoring = false
    this.startTime = 0
    this.frameCount = 0
    this.lastFrameTime = 0
    this.rafId = null
    this.observers = new Map()
  }

  /**
   * 开始性能监控
   */
  startMonitoring() {
    if (this.isMonitoring) return
    
    this.isMonitoring = true
    this.startTime = performance.now()
    this.lastFrameTime = this.startTime
    this.frameCount = 0
    
    // 监控帧率
    this.monitorFrameRate()
    
    // 监控内存使用情况
    this.monitorMemoryUsage()
    
    console.log('动画性能监控已启动')
  }

  /**
   * 停止性能监控
   */
  stopMonitoring() {
    if (!this.isMonitoring) return
    
    this.isMonitoring = false
    
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    
    // 计算平均FPS
    const totalTime = performance.now() - this.startTime
    const avgFps = (this.frameCount / totalTime) * 1000
    
    console.log('动画性能监控已停止')
    console.log(`平均FPS: ${avgFps.toFixed(2)}`)
    console.log(`总帧数: ${this.frameCount}`)
    console.log(`总时间: ${totalTime.toFixed(2)}ms`)
    
    return this.getPerformanceReport()
  }

  /**
   * 监控帧率
   */
  monitorFrameRate() {
    const measureFrame = () => {
      if (!this.isMonitoring) return
      
      const currentTime = performance.now()
      const deltaTime = currentTime - this.lastFrameTime
      
      // 记录帧时间
      this.metrics.frameTime.push(deltaTime)
      
      // 计算FPS
      const fps = 1000 / deltaTime
      this.metrics.fps.push(fps)
      if (this.metrics.fps.length > 600) this.metrics.fps.shift()
      if (this.metrics.frameTime.length > 600) this.metrics.frameTime.shift()
      
      // 更新计数器
      this.frameCount++
      this.lastFrameTime = currentTime
      
      // 继续下一帧
      this.rafId = requestAnimationFrame(measureFrame)
    }
    
    this.rafId = requestAnimationFrame(measureFrame)
  }

  /**
   * 监控内存使用情况
   */
  monitorMemoryUsage() {
    if (!performance.memory) {
      console.warn('浏览器不支持内存监控')
      return
    }
    
    const checkMemory = () => {
      if (!this.isMonitoring) return
      
      const memoryInfo = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      }
      
      this.metrics.memoryUsage.push(memoryInfo)
      if (this.metrics.memoryUsage.length > 120) this.metrics.memoryUsage.shift()
      
      // 每5秒检查一次内存
      setTimeout(checkMemory, 5000)
    }
    
    checkMemory()
  }

  /**
   * 记录动画持续时间
   */
  recordAnimationDuration(name, duration) {
    if (!this.metrics.animationDurations[name]) {
      this.metrics.animationDurations[name] = []
    }
    
    this.metrics.animationDurations[name].push(duration)
  }

  /**
   * 监控元素动画性能
   */
  observeElementAnimation(element, animationName) {
    if (!element || !animationName) return
    
    // 使用PerformanceObserver监控动画
    if (window.PerformanceObserver) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (entry.name.includes(animationName)) {
            this.recordAnimationDuration(animationName, entry.duration)
          }
        })
      })
      
      observer.observe({ entryTypes: ['animation', 'measure'] })
      this.observers.set(element, observer)
    }
    
    // 记录动画开始时间
    const startTime = performance.now()
    
    // 监听动画结束事件
    const handleAnimationEnd = () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      this.recordAnimationDuration(animationName, duration)
      
      element.removeEventListener('animationend', handleAnimationEnd)
    }
    
    element.addEventListener('animationend', handleAnimationEnd)
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport() {
    const animationDurations = Object.fromEntries(
      Object.entries(this.metrics.animationDurations)
        .map(([name, durations]) => [name, this.calculateAverage(durations)])
    )
    const latestMemory = this.metrics.memoryUsage.at(-1)
    return {
      averageFPS: this.calculateAverage(this.metrics.fps),
      minFPS: this.metrics.fps.length ? Math.min(...this.metrics.fps) : 0,
      memoryUsage: { usedJSHeapSize: latestMemory?.used || 0 },
      animationCount: Object.values(this.metrics.animationDurations).reduce((total, values) => total + values.length, 0),
      animationDurations
    }
  }

  /**
   * 计算数组的平均值
   */
  calculateAverage(arr) {
    if (arr.length === 0) return 0
    return arr.reduce((sum, val) => sum + val, 0) / arr.length
  }

  /**
   * 重置指标
   */
  resetMetrics() {
    this.metrics = {
      fps: [],
      frameTime: [],
      memoryUsage: [],
      animationDurations: {}
    }
    this.frameCount = 0
  }

  /**
   * 检测性能问题
   */
  detectPerformanceIssues() {
    const issues = []
    
    // 检查低FPS
    const avgFps = this.calculateAverage(this.metrics.fps)
    if (avgFps < 30) {
      issues.push({
        type: 'low_fps',
        severity: 'high',
        message: `平均FPS过低: ${avgFps.toFixed(2)}`,
        suggestion: '考虑减少动画复杂度或使用更简单的动画'
      })
    } else if (avgFps < 45) {
      issues.push({
        type: 'medium_fps',
        severity: 'medium',
        message: `FPS偏低: ${avgFps.toFixed(2)}`,
        suggestion: '优化动画性能，减少不必要的重绘'
      })
    }
    
    // 检查高帧时间
    const avgFrameTime = this.calculateAverage(this.metrics.frameTime)
    if (avgFrameTime > 33.33) { // 30FPS对应的帧时间
      issues.push({
        type: 'high_frame_time',
        severity: 'high',
        message: `平均帧时间过高: ${avgFrameTime.toFixed(2)}ms`,
        suggestion: '优化动画逻辑，减少计算量'
      })
    }
    
    // 检查内存使用
    if (this.metrics.memoryUsage.length > 0) {
      const latestMemory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1]
      const memoryUsagePercent = (latestMemory.used / latestMemory.limit) * 100
      
      if (memoryUsagePercent > 80) {
        issues.push({
          type: 'high_memory',
          severity: 'high',
          message: `内存使用率过高: ${memoryUsagePercent.toFixed(2)}%`,
          suggestion: '检查内存泄漏，优化资源使用'
        })
      } else if (memoryUsagePercent > 60) {
        issues.push({
          type: 'medium_memory',
          severity: 'medium',
          message: `内存使用率较高: ${memoryUsagePercent.toFixed(2)}%`,
          suggestion: '考虑优化内存使用'
        })
      }
    }
    
    // 检查动画持续时间
    Object.keys(this.metrics.animationDurations).forEach(name => {
      const durations = this.metrics.animationDurations[name]
      const avgDuration = this.calculateAverage(durations)
      
      if (avgDuration > 1000) {
        issues.push({
          type: 'long_animation',
          severity: 'medium',
          message: `动画 ${name} 持续时间过长: ${avgDuration.toFixed(2)}ms`,
          suggestion: '考虑缩短动画时间或简化动画效果'
        })
      }
    })
    
    return issues
  }
}

// 创建全局实例
const animationPerformanceMonitor = new AnimationPerformanceMonitor()

// 导出工具
export default animationPerformanceMonitor

// 导出类
export { AnimationPerformanceMonitor }
