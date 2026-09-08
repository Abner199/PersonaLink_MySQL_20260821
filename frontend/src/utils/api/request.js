// Axios 统一请求入口。
// 业务页面只调用 get/post/put/del，不需要重复处理 baseURL、响应数据和错误提示。

import axios from 'axios'
import { API_BASE_URL } from '../../config/api.js'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use(config => {
  const adminToken = sessionStorage.getItem('adminToken')
  if (adminToken) config.headers.Authorization = `Bearer ${adminToken}`
  return config
})

// 成功时只返回后端 data，页面无需再写 response.data。
apiClient.interceptors.response.use(
  response => response.data,
  async error => {
    console.error('API 请求错误:', error)

    const config = error.config
    const isGetRequest = config?.method?.toLowerCase() === 'get'
    const isTransientNetworkError = !error.response && Boolean(error.request)
    if (isGetRequest && isTransientNetworkError && !config.__personalinkRetried) {
      config.__personalinkRetried = true
      await new Promise(resolve => setTimeout(resolve, 800))
      return apiClient(config)
    }

    let message = '请求失败'
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      message = '网络响应较慢，请稍后重试'
    } else if (error.response) {
      message = error.response.data?.message || `服务器错误 (${error.response.status})`
      if (error.response.status === 401 && sessionStorage.getItem('adminToken')) {
        sessionStorage.removeItem('adminToken')
      }
    } else if (error.request) {
      message = navigator.onLine
        ? '暂时无法连接服务器，请稍后重试'
        : '当前设备未连接网络，请检查网络设置'
    } else {
      message = error.message || '请求配置错误'
    }

    return Promise.reject({
      success: false,
      message,
      originalError: error
    })
  }
)

export const get = (url, params = {}) => apiClient.get(url, { params })
export const post = (url, data = {}) => apiClient.post(url, data)
export const put = (url, data = {}) => apiClient.put(url, data)
export const del = (url, data = {}) => apiClient.delete(url, { data })

export default { get, post, put, del }
