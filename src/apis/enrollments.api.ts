import axiosClient from './axios-client'
import type { MyEnrollmentDto, ProgressDto, PagedResult, PendingEnrollmentDto } from '@/ts/types/api'

export interface CertificateDto {
  studentName: string
  courseTitle: string
  teacherName: string
  categoryName: string
  completedAt: string
  enrollmentId: string
}

const enrollmentsApi = {
  enroll: (courseId: string): Promise<{ id: string }> =>
    axiosClient.post('/enrollments', { courseId }),

  getMyEnrollments: (params?: { page?: number; pageSize?: number }): Promise<PagedResult<MyEnrollmentDto>> =>
    axiosClient.get('/enrollments/my', { params }),

  getProgress: (enrollmentId: string): Promise<ProgressDto> =>
    axiosClient.get(`/enrollments/${enrollmentId}/progress`),

  markLessonComplete: (lessonId: string): Promise<{ message: string }> =>
    axiosClient.post(`/progress/lessons/${lessonId}/complete`),

  approve: (enrollmentId: string): Promise<void> =>
    axiosClient.patch(`/enrollments/${enrollmentId}/approve`),

  reject: (enrollmentId: string, reason: string): Promise<void> =>
    axiosClient.patch(`/enrollments/${enrollmentId}/reject`, { reason }),

  getPending: (courseId: string): Promise<PendingEnrollmentDto[]> =>
    axiosClient.get(`/courses/${courseId}/enrollments/pending`),

  getCertificate: (enrollmentId: string): Promise<CertificateDto> =>
    axiosClient.get(`/enrollments/${enrollmentId}/certificate`),
}

export default enrollmentsApi
