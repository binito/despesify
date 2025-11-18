import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const client = axios.create({
  baseURL: API_BASE_URL,
})

// Add token to requests
client.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
}

export const expenseAPI = {
  create: (data) => client.post('/expenses', data),
  list: (params) => client.get('/expenses', { params }),
  get: (id) => client.get(`/expenses/${id}`),
  update: (id, data) => client.put(`/expenses/${id}`, data),
  delete: (id) => client.delete(`/expenses/${id}`),
  stats: (params) => client.get('/expenses/stats', { params }),
}

export default client
