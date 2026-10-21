import axios from 'axios'
import { getToken, clearToken } from '../admin/auth'

// The Spring Boot API. In dev, Vite forwards /api to localhost:8080 (see vite.config.js).
// In production set VITE_API_URL (e.g. https://api.example.com/api).
export const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '/api' : 'http://localhost:8080/api')

// The free server sleeps when idle and needs up to a minute to wake, so allow 75 s per request.
const api = axios.create({ baseURL: API_URL, timeout: 75000 })

// Wake the server as soon as the site opens, while the visitor plays Levels 00–01 (which need no data).
export const wakeServer = () => api.get('/links').catch(() => {})

// Attach the admin token (if we have one) to every request.
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// If the API says the token is no longer valid, log the admin out everywhere.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status
    const isLogin = error.config?.url?.includes('/auth/login')
    if (status === 401 && !isLogin && getToken()) {
      clearToken()
      window.dispatchEvent(new Event('core:logout'))
    }
    return Promise.reject(error)
  },
)

/** Turns any axios error into { message, fields } for the UI. */
export function readError(error) {
  const res = error.response
  if (!res) return { message: 'Core unreachable. Is the backend running on port 8080?', fields: {} }
  const data = res.data ?? {}
  const message =
    res.status === 401 ? data.detail ?? 'Session expired. Please sign in again.'
      : res.status === 403 ? 'Access denied.'
        : data.detail ?? `Request failed (${res.status})`
  return { message, fields: data.errors ?? {} }
}

export default api
