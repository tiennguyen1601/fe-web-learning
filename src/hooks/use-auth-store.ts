import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserDto } from '@/ts/types/api'

type AuthState = {
  user: UserDto | null
  accessToken: string | null
  setAuth: (user: UserDto, accessToken: string) => void
  clearAuth: () => void
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => {
        localStorage.setItem('accessToken', accessToken)
        set({ user, accessToken })
      },
      clearAuth: () => {
        localStorage.removeItem('accessToken')
        set({ user: null, accessToken: null })
      },
    }),
    { name: 'auth-store' },
  ),
)

export default useAuthStore
