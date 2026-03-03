import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const userId = useAuthStore.getState().currentUserId
  if (userId) {
    config.headers['X-User-ID'] = userId
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
