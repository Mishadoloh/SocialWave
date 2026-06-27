import axios from 'axios'

// Use dynamic hostname so the app works from phone/tablet on the same network
// e.g. localhost -> localhost:8000, 192.168.1.34 -> 192.168.1.34:8000
const API_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Dynamically use current hostname — works for localhost AND 192.168.x.x
    config.baseURL = `http://${window.location.hostname}:8000/api`
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const res = await axios.post(`${API_URL}/auth/token/refresh`, { refresh })
          localStorage.setItem('access_token', res.data.access)
          original.headers.Authorization = `Bearer ${res.data.access}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
