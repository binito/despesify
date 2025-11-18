import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'

const client = axios.create({
  baseURL: API_BASE_URL,
})

// Add token to requests
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

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
