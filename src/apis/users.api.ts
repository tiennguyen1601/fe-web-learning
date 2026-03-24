import axiosClient from './axios-client'
import type { UserDto } from '@/ts/types/api'

const numToRole: Record<number, string> = { 0: 'Student', 1: 'Teacher', 2: 'Admin' }
const normalizeUser = (u: any): UserDto => ({ ...u, role: numToRole[u.role] ?? u.role })

const usersApi = {
  getMe: (): Promise<UserDto> =>
    axiosClient.get('/users/me').then(normalizeUser),

  updateMe: (data: { fullName: string; avatarUrl?: string }): Promise<UserDto> =>
    axiosClient.put('/users/me', data).then(normalizeUser),

  changePassword: (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> =>
    axiosClient.put('/users/me/password', data),
}

export default usersApi
