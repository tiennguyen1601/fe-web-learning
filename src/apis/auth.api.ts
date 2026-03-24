import axiosClient from './axios-client'
import type { UserDto } from '@/ts/types/api'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  role: 'Student' | 'Teacher'
}

export interface AuthResponse {
  accessToken: string
  user: UserDto
}

const roleToNum: Record<string, number> = { Student: 0, Teacher: 1 }
const numToRole: Record<number, string> = { 0: 'Student', 1: 'Teacher', 2: 'Admin' }

const normalizeAuth = (res: any): AuthResponse => ({
  accessToken: res.accessToken,
  user: { ...res.user, role: numToRole[res.user.role] ?? res.user.role },
})

const authApi = {
  login: (data: LoginRequest): Promise<AuthResponse> =>
    axiosClient.post('/auth/login', data).then(normalizeAuth),

  register: (data: RegisterRequest): Promise<{ message: string }> =>
    axiosClient.post('/auth/register', { ...data, role: roleToNum[data.role] }),

  googleLogin: (idToken: string, role: 'Student' | 'Teacher'): Promise<AuthResponse> =>
    axiosClient.post('/auth/google', { idToken, role: roleToNum[role] }).then(normalizeAuth),

  logout: (): Promise<void> =>
    axiosClient.post('/auth/logout'),

  refresh: (): Promise<AuthResponse> =>
    axiosClient.post('/auth/refresh').then(normalizeAuth),

  forgotPassword: (email: string): Promise<{ message: string }> =>
    axiosClient.post('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; email: string; newPassword: string }): Promise<{ message: string }> =>
    axiosClient.post('/auth/reset-password', data),

  confirmEmail: (token: string, email: string): Promise<{ message: string }> =>
    axiosClient.get('/auth/confirm-email', { params: { token, email } }),

  resendConfirmation: (email: string): Promise<{ message: string }> =>
    axiosClient.post('/auth/resend-confirmation', { email }),
}

export default authApi
