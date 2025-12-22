import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Auth } from 'aws-amplify'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      cognitoId: null,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true })
        try {
          const response = await axios.post('/api/auth/login/', credentials)
          const { user, tokens } = response.data
          
          set({
            user,
            token: tokens.access,
            cognitoId: user.cognito_id,
            isLoading: false
          })
          
          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`
          
          toast.success(`Welcome back, ${user.username}!`)
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          const message = error.response?.data?.error || 'Login failed'
          toast.error(message)
          return { success: false, error: message }
        }
      },

      signup: async (userData) => {
        set({ isLoading: true })
        try {
          const response = await axios.post('/api/auth/signup/', userData)
          const { user, tokens } = response.data
          
          set({
            user,
            token: tokens.access,
            cognitoId: user.cognito_id,
            isLoading: false
          })
          
          axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`
          
          toast.success('Account created successfully!')
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          const message = error.response?.data?.error || 'Signup failed'
          toast.error(message)
          return { success: false, error: message }
        }
      },

      logout: async () => {
        try {
          await axios.post('/api/auth/logout/')
          
          // Cognito sign out
          try {
            await Auth.signOut()
          } catch (e) {
            console.log('Cognito signout error:', e)
          }
          
          set({ user: null, token: null, cognitoId: null })
          delete axios.defaults.headers.common['Authorization']
          
          toast.success('Logged out successfully')
        } catch (error) {
          console.error('Logout error:', error)
          // Force logout on error
          set({ user: null, token: null, cognitoId: null })
          delete axios.defaults.headers.common['Authorization']
        }
      },

      checkAuth: () => {
        const { token } = get()
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          return true
        }
        return false
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        cognitoId: state.cognitoId
      })
    }
  )
)

export default useAuthStore