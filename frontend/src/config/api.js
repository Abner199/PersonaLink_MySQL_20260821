// API 地址配置。
//
// 本地开发：默认请求本机的 Express 服务。
// 线上部署：推荐通过 VITE_API_BASE_URL 指定后端公网地址；如果没有指定，
// 则默认请求当前域名下的 /api，适用于 Nginx 反向代理场景。

const localHosts = ['localhost', '127.0.0.1']
const isLocal = localHosts.includes(window.location.hostname)
const configuredApi = import.meta.env.VITE_API_BASE_URL

export const API_BASE_URL = configuredApi || (
  isLocal
    ? 'http://localhost:3003/api'
    : `${window.location.origin}/api`
)
