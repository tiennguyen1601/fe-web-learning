import axiosClient from './axios-client'
import type { AdminUserDto, PagedResult, PendingCourseDto, UserRole } from '@/ts/types/api'

const numToLevel: Record<number, string> = { 0: 'Beginner', 1: 'Intermediate', 2: 'Advanced' }
const numToRole: Record<number, string> = { 0: 'Student', 1: 'Teacher', 2: 'Admin' }
const normalizePendingCourse = (item: any) => !item ? item : {
  ...item,
  level: typeof item.level === 'number' ? (numToLevel[item.level] ?? item.level) : item.level,
}
const normalizeUser = (item: any) => !item ? item : {
  ...item,
  role: typeof item.role === 'number' ? (numToRole[item.role] ?? item.role) : item.role,
}

const adminApi = {
  getUsers: (params?: { role?: UserRole; page?: number; pageSize?: number }): Promise<PagedResult<AdminUserDto>> =>
    axiosClient.get('/admin/users', { params }).then((res: any) => ({ ...res, items: res.items?.map(normalizeUser) })),

  getPendingCourses: (params?: { page?: number; pageSize?: number }): Promise<PagedResult<PendingCourseDto>> =>
    axiosClient.get('/admin/courses/pending', { params }).then((res: any) => ({ ...res, items: res.items?.map(normalizePendingCourse) })),

  approveCourse: (id: string): Promise<{ message: string }> =>
    axiosClient.patch(`/admin/courses/${id}/approve`),

  rejectCourse: (id: string, reason?: string): Promise<{ message: string }> =>
    axiosClient.patch(`/admin/courses/${id}/reject`, { reason }),
}

export default adminApi
