import { nextTick, onUnmounted } from 'vue'
import animationPerformanceMonitor from '../utils/performanceMonitor'

// 页面实际只需要“进入视口时淡入”。
// 保留这一个公用实现，避免每个页面重复创建观察器。
export function useOptimizedAnimations() {
  const observers = []
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const lowEndDevice = navigator.hardwareConcurrency <= 2 || (navigator.deviceMemory && navigator.deviceMemory <= 2)
  const duration = lowEndDevice ? 0.2 : 0.3
  const easing = lowEndDevice ? 'ease-out' : 'cubic-bezier(0.4, 0, 0.2, 1)'

  const animateOnScroll = (elements) => {
    nextTick(() => {
      const validElements = (Array.isArray(elements) ? elements : [elements]).filter(Boolean)
      if (!validElements.length) return

      if (reducedMotion || !('IntersectionObserver' in window)) {
        validElements.forEach(element => {
          element.style.opacity = '1'
          element.style.transform = 'none'
        })
        return
      }

      validElements.forEach(element => {
        element.style.opacity = '0'
        element.style.transform = 'translate3d(0, 20px, 0)'
      })

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          entry.target.style.transition = `opacity ${duration}s ${easing}, transform ${duration}s ${easing}`
          entry.target.style.opacity = '1'
          entry.target.style.transform = 'translate3d(0, 0, 0)'
          observer.unobserve(entry.target)
        })
      }, { threshold: 0.1, rootMargin: '50px' })

      validElements.forEach(element => observer.observe(element))
      observers.push(observer)
    })
  }

  onUnmounted(() => observers.forEach(observer => observer.disconnect()))

  return {
    animateOnScroll,
    getPerformanceReport: () => import.meta.env.DEV ? animationPerformanceMonitor.getPerformanceReport() : null,
    detectPerformanceIssues: () => import.meta.env.DEV ? animationPerformanceMonitor.detectPerformanceIssues() : []
  }
}
