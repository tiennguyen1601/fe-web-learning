import axiosClient from './axios-client'
import type { MyEnrollmentDto, ProgressDto, PagedResult } from '@/ts/types/api'

const enrollmentsApi = {
  enroll: (courseId: string): Promise<{ id: string }> =>
    axiosClient.post('/enrollments', { courseId }),

  getMyEnrollments: (params?: { page?: number; pageSize?: number }): Promise<PagedResult<MyEnrollmentDto>> =>
    axiosClient.get('/enrollments/my', { params }),

  getProgress: (enrollmentId: string): Promise<ProgressDto> =>
    axiosClient.get(`/enrollments/${enrollmentId}/progress`),

  markLessonComplete: (lessonId: string): Promise<{ message: string }> =>
    axiosClient.post(`/progress/lessons/${lessonId}/complete`),
}

export default enrollmentsApi
