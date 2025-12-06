// API URL configuration
// In development, use localhost. In production (Docker), nginx proxies /api to backend
const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000' : '')

export default API_URL
