import axiosClient from './axios-client'
import type { LessonDto, CreateLessonRequest, UpdateLessonRequest } from '@/ts/types/api'

const lessonsApi = {
  getByCourse: (courseId: string): Promise<LessonDto[]> =>
    axiosClient.get(`/courses/${courseId}/lessons`),

  create: (courseId: string, data: CreateLessonRequest): Promise<{ id: string }> =>
    axiosClient.post(`/courses/${courseId}/lessons`, data),

  update: (courseId: string, lessonId: string, data: UpdateLessonRequest): Promise<void> =>
    axiosClient.put(`/courses/${courseId}/lessons/${lessonId}`, data),

  delete: (courseId: string, lessonId: string): Promise<void> =>
    axiosClient.delete(`/courses/${courseId}/lessons/${lessonId}`),
}

export default lessonsApi
