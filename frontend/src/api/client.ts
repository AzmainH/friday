import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const { token, currentUserId } = useAuthStore.getState()

  if (token) {
    // JWT mode: send Bearer token
    config.headers['Authorization'] = `Bearer ${token}`
  } else if (currentUserId) {
    // Local dev mode: send X-User-ID header
    config.headers['X-User-ID'] = currentUserId
  }

  config.headers['X-Request-ID'] = crypto.randomUUID()
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response) {
      const data = error.response.data as { detail?: string; request_id?: string }
      const requestId = data?.request_id ?? error.response.headers['x-request-id']
      console.error(
        `[API Error] ${error.response.status} — ${data?.detail ?? error.message}`,
        requestId ? `(request_id: ${requestId})` : '',
      )
    }
    return Promise.reject(error)
  },
)

export default client
