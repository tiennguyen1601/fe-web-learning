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

export interface ScoreQuizAnswerDto {
  questionId: string
  questionText: string
  selectedOption: string
  correctOption: string
  isCorrect: boolean
}

export interface StudentScoreDto {
  assignmentId: string
  assignmentTitle: string
  assignmentType: string
  maxScore: number
  submissionId?: string
  score?: number
  status?: string
  submittedAt?: string
  quizAnswers: ScoreQuizAnswerDto[]
}

export interface TeacherStatsDto {
  totalCourses: number
  publishedCourses: number
  totalStudents: number
  totalAssignments: number
  pendingGrading: number
}

export interface CourseStudentDto {
  studentId: string
  fullName: string
  email: string
  enrolledAt: string
  completedAt?: string
  totalLessons: number
  completedLessons: number
  progressPercent: number
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

  getMyStats: (): Promise<TeacherStatsDto> =>
    axiosClient.get('/courses/my/stats'),

  getMyCourses: (params?: { page?: number; pageSize?: number }): Promise<PagedResult<CourseListDto>> =>
    axiosClient.get('/courses/my', { params }).then((res: any) => ({ ...res, items: res.items?.map(normalizeCourse) })),

  publish: (id: string): Promise<{ message: string }> =>
    axiosClient.patch(`/courses/${id}/publish`),

  getStudents: (courseId: string): Promise<CourseStudentDto[]> =>
    axiosClient.get(`/courses/${courseId}/students`),

  getStudentScores: (courseId: string, studentId: string): Promise<StudentScoreDto[]> =>
    axiosClient.get(`/courses/${courseId}/assignments/students/${studentId}/scores`)
      .then((res: any) => Array.isArray(res) ? res.map((s: any) => ({
        ...s,
        assignmentType: typeof s.assignmentType === 'number'
          ? ({ 0: 'Quiz', 1: 'Essay', 2: 'ImageDescription' }[s.assignmentType as number] ?? s.assignmentType)
          : s.assignmentType,
        status: typeof s.status === 'number'
          ? ({ 0: 'Submitted', 1: 'Graded' }[s.status as number] ?? s.status)
          : s.status,
        quizAnswers: (s.quizAnswers ?? []).map((a: any) => ({
          ...a,
          selectedOption: typeof a.selectedOption === 'number'
            ? ({ 0: 'A', 1: 'B', 2: 'C', 3: 'D' }[a.selectedOption as number] ?? a.selectedOption)
            : a.selectedOption,
          correctOption: typeof a.correctOption === 'number'
            ? ({ 0: 'A', 1: 'B', 2: 'C', 3: 'D' }[a.correctOption as number] ?? a.correctOption)
            : a.correctOption,
        })),
      })) : res),
}

export default coursesApi
