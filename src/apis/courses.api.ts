import axiosClient from './axios-client'
import type { CourseListDto, CourseDetailDto, PagedResult, CreateCourseRequest } from '@/ts/types/api'

export type { PagedResult } from '@/ts/types/api'  // re-export for enrollments.api.ts backward compat

const levelToNum: Record<string, number> = { Beginner: 0, Intermediate: 1, Advanced: 2 }
const numToLevel: Record<number, string> = { 0: 'Beginner', 1: 'Intermediate', 2: 'Advanced' }
const numToStatus: Record<number, string> = { 0: 'Draft', 1: 'PendingReview', 2: 'Published', 3: 'Archived' }
const serializeCourse = (data: CreateCourseRequest) => ({ ...data, level: levelToNum[data.level] ?? data.level })
const normalizeCourse = (item: any) => {
  if (!item) return item
  return {
    ...item,
    level: typeof item.level === 'number' ? (numToLevel[item.level] ?? item.level) : item.level,
    status: typeof item.status === 'number' ? (numToStatus[item.status] ?? item.status) : item.status,
  }
}

export interface GetCoursesParams {
  search?: string
  categoryId?: string
  level?: string
  minPrice?: number
  maxPrice?: number
  page?: number
  pageSize?: number
}

const coursesApi = {
  getAll: (params?: GetCoursesParams): Promise<PagedResult<CourseListDto>> =>
    axiosClient.get('/courses', { params }).then((res: any) => ({ ...res, items: res.items?.map(normalizeCourse) })),

  getById: (id: string): Promise<CourseDetailDto> =>
    axiosClient.get(`/courses/${id}`).then(normalizeCourse),

  create: (data: CreateCourseRequest): Promise<{ id: string }> =>
    axiosClient.post('/courses', serializeCourse(data)),

  update: (id: string, data: CreateCourseRequest): Promise<void> =>
    axiosClient.put(`/courses/${id}`, serializeCourse(data)),

  delete: (id: string): Promise<void> =>
    axiosClient.delete(`/courses/${id}`),

  getMyCourses: (params?: { page?: number; pageSize?: number }): Promise<PagedResult<CourseListDto>> =>
    axiosClient.get('/courses/my', { params }).then((res: any) => ({ ...res, items: res.items?.map(normalizeCourse) })),

  publish: (id: string): Promise<{ message: string }> =>
    axiosClient.patch(`/courses/${id}/publish`),
}

export default coursesApi
