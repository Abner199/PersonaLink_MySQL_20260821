// Axios 统一请求入口。
// 业务页面只调用 get/post/put/del，不需要重复处理 baseURL、响应数据和错误提示。

import axios from 'axios'
import { API_BASE_URL } from '../../config/api.js'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
  error => {
    console.error('API 请求错误:', error)

    let message = '请求失败'
    if (error.response) {
      message = error.response.data?.message || `服务器错误 (${error.response.status})`
      if (error.response.status === 401 && sessionStorage.getItem('adminToken')) {
        sessionStorage.removeItem('adminToken')
      }
    } else if (error.request) {
      message = '网络错误，请检查后端服务是否启动'
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
