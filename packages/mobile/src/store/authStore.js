import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const useAuthStore = create((set) => ({
  token: null,
  user: null,
  setToken: async (token) => {
    await AsyncStorage.setItem('token', token)
    set({ token })
  },
  setUser: async (user) => {
    await AsyncStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },
  logout: async () => {
    await AsyncStorage.removeItem('token')
    await AsyncStorage.removeItem('user')
    set({ token: null, user: null })
  },
  restoreToken: async () => {
    try {
      const token = await AsyncStorage.getItem('token')
      const user = await AsyncStorage.getItem('user')
      if (token && user) {
        set({ token, user: JSON.parse(user) })
      }
    } catch (err) {
      console.error('Erro ao restaurar token:', err)
    }
  },
}))
